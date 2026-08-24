from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.models.lead import Lead, LeadActivity, LeadSource, LeadStatus, LeadPriority
from app.models.party import Party
from app.models.quote import Quote, QuoteItem, QuoteStatus
from app.schemas.crm import LeadCreate, LeadUpdate, CRMDashboardSummary
from app.schemas.quote import QuoteCreate
from app.utils.sequence_generator import generate_business_number


class CRMService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_leads(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        source: Optional[str] = None,
        dealer_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Lead], int]:
        stmt = (
            select(Lead)
            .options(
                selectinload(Lead.assigned_dealer),
                selectinload(Lead.assigned_sales_rep),
                selectinload(Lead.activities).selectinload(LeadActivity.user),
            )
        )
        count_stmt = select(func.count()).select_from(Lead)

        if status:
            stmt = stmt.where(Lead.status == status)
            count_stmt = count_stmt.where(Lead.status == status)

        if source:
            stmt = stmt.where(Lead.source == source)
            count_stmt = count_stmt.where(Lead.source == source)

        if dealer_id:
            stmt = stmt.where(Lead.assigned_dealer_id == dealer_id)
            count_stmt = count_stmt.where(Lead.assigned_dealer_id == dealer_id)

        if search:
            search_pattern = f"%{search}%"
            filter_expr = or_(
                Lead.lead_number.ilike(search_pattern),
                Lead.customer_name.ilike(search_pattern),
                Lead.phone.ilike(search_pattern),
                Lead.city.ilike(search_pattern),
            )
            stmt = stmt.where(filter_expr)
            count_stmt = count_stmt.where(filter_expr)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total

    async def get_lead_by_id(self, lead_id: str) -> Lead:
        stmt = (
            select(Lead)
            .options(
                selectinload(Lead.assigned_dealer),
                selectinload(Lead.assigned_sales_rep),
                selectinload(Lead.activities).selectinload(LeadActivity.user),
            )
            .where(Lead.id == lead_id)
        )
        res = await self.session.execute(stmt)
        lead = res.scalar_one_or_none()
        if not lead:
            raise NotFoundException(f"Lead with ID {lead_id} not found")
        return lead

    async def find_nearest_dealer(self, city: Optional[str], pin_code: Optional[str]) -> Optional[Party]:
        # Search active parties/dealers matching city or pin
        if pin_code:
            pin_res = await self.session.execute(
                select(Party).where(Party.is_active == True).where(Party.shipping_address.ilike(f"%{pin_code}%"))
            )
            dealer = pin_res.scalars().first()
            if dealer:
                return dealer

        if city:
            city_res = await self.session.execute(
                select(Party).where(Party.is_active == True).where(
                    or_(Party.billing_address.ilike(f"%{city}%"), Party.shipping_address.ilike(f"%{city}%"))
                )
            )
            dealer = city_res.scalars().first()
            if dealer:
                return dealer

        # Fallback to first active party/dealer
        fallback_res = await self.session.execute(
            select(Party).where(Party.is_active == True).order_by(Party.created_at.asc())
        )
        return fallback_res.scalars().first()

    async def create_lead(self, data: LeadCreate, user_id: Optional[str] = None) -> Lead:
        lead_num = await generate_business_number(
            session=self.session,
            model_class=Lead,
            number_field_name="lead_number",
            prefix="LEAD",
        )

        assigned_dealer_id = data.assigned_dealer_id
        if not assigned_dealer_id:
            nearest_dealer = await self.find_nearest_dealer(city=data.city, pin_code=data.pin_code)
            if nearest_dealer:
                assigned_dealer_id = nearest_dealer.id

        lead = Lead(
            lead_number=lead_num,
            customer_name=data.customer_name.strip(),
            phone=data.phone.strip(),
            email=data.email.strip() if data.email else None,
            city=data.city.strip() if data.city else None,
            state=data.state.strip() if data.state else None,
            pin_code=data.pin_code.strip() if data.pin_code else None,
            address=data.address,
            source=data.source,
            status=LeadStatus.NEW.value,
            priority=LeadPriority.NORMAL.value,
            user_type=data.user_type or "HOMEOWNER",
            project_type=data.project_type,
            product_interest=data.product_interest,
            estimated_quantity=data.estimated_quantity,
            estimated_value=data.estimated_value,
            requirements_summary=data.requirements_summary,
            assigned_dealer_id=assigned_dealer_id,
            assigned_at=datetime.now(timezone.utc) if assigned_dealer_id else None,
            extra_metadata=data.extra_metadata,
        )
        self.session.add(lead)
        await self.session.flush()

        # Initial Activity Log
        activity = LeadActivity(
            lead_id=lead.id,
            user_id=user_id,
            activity_type="LEAD_CREATED",
            title=f"New enquiry received via {data.source}",
            description=f"Initial contact captured for {lead.customer_name} ({lead.phone}) in {lead.city or 'Unspecified City'}",
            new_status=LeadStatus.NEW.value,
        )
        self.session.add(activity)

        if assigned_dealer_id:
            assign_act = LeadActivity(
                lead_id=lead.id,
                user_id=user_id,
                activity_type="DEALER_ASSIGNMENT",
                title="Automatically assigned to nearest authorized dealer",
                description=f"Location routing matched dealer account ID: {assigned_dealer_id}",
            )
            self.session.add(assign_act)

        await self.session.flush()
        return await self.get_lead_by_id(lead.id)

    async def update_lead(self, lead_id: str, data: LeadUpdate, user_id: Optional[str] = None) -> Lead:
        lead = await self.get_lead_by_id(lead_id)
        old_status = lead.status

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(lead, key, val)

        if data.status and data.status != old_status:
            activity = LeadActivity(
                lead_id=lead.id,
                user_id=user_id,
                activity_type="STATUS_CHANGE",
                title=f"Status transitioned from {old_status} to {data.status}",
                old_status=old_status,
                new_status=data.status,
            )
            self.session.add(activity)

        await self.session.flush()
        return await self.get_lead_by_id(lead.id)

    async def add_activity(
        self,
        lead_id: str,
        activity_type: str,
        title: str,
        description: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> LeadActivity:
        lead = await self.get_lead_by_id(lead_id)
        activity = LeadActivity(
            lead_id=lead.id,
            user_id=user_id,
            activity_type=activity_type,
            title=title,
            description=description,
        )
        self.session.add(activity)
        await self.session.flush()
        return activity

    async def get_crm_stats(self) -> CRMDashboardSummary:
        status_counts = {}
        for st in LeadStatus:
            res = await self.session.execute(select(func.count()).select_from(Lead).where(Lead.status == st.value))
            status_counts[st.value] = res.scalar() or 0

        total_leads = sum(status_counts.values())
        won_leads = status_counts.get(LeadStatus.WON.value, 0)
        conversion_rate = (won_leads / total_leads * 100.0) if total_leads > 0 else 0.0

        val_res = await self.session.execute(
            select(func.sum(Lead.estimated_value)).where(Lead.status.in_([LeadStatus.QUALIFIED.value, LeadStatus.QUOTED.value, LeadStatus.NEGOTIATION.value]))
        )
        pipeline_val = float(val_res.scalar() or 0.0)

        return CRMDashboardSummary(
            total_leads=total_leads,
            new_leads=status_counts.get(LeadStatus.NEW.value, 0),
            contacted_leads=status_counts.get(LeadStatus.CONTACTED.value, 0),
            qualified_leads=status_counts.get(LeadStatus.QUALIFIED.value, 0),
            quoted_leads=status_counts.get(LeadStatus.QUOTED.value, 0),
            negotiation_leads=status_counts.get(LeadStatus.NEGOTIATION.value, 0),
            won_leads=won_leads,
            lost_leads=status_counts.get(LeadStatus.LOST.value, 0),
            conversion_rate_percentage=round(conversion_rate, 2),
            pipeline_value_inr=pipeline_val,
        )
