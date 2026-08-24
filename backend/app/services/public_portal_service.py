from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.models.party import Party
from app.models.professional import ProfessionalProfile, ProfessionalType
from app.schemas.public_portal import (
    DealerLocatorQuery,
    DealerLocatorResponse,
    SmartQuoteRequest,
    SmartQuoteEstimateResponse,
    ProfessionalRegistrationRequest,
    ProfessionalResponse,
)
from app.services.crm_service import CRMService
from app.schemas.crm import LeadCreate


# Standard Board Area in Sq Ft: 8 ft x 4 ft = 32 sq ft per sheet
SQFT_PER_SHEET = 32.0

# Base pricing per sq. ft. across thicknesses
BASE_RATES_INR = {
    "5.0": 45.0,
    "6.0": 52.0,
    "8.0": 68.0,
    "12.0": 92.0,
    "17.0": 125.0,
    "18.0": 135.0,
    "25.0": 185.0,
    "28.0": 210.0,
    "30.0": 230.0,
}


class PublicPortalService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.crm_service = CRMService(session)

    async def search_dealers(self, query: DealerLocatorQuery) -> List[DealerLocatorResponse]:
        stmt = select(Party).where(Party.is_active == True)

        if query.pin_code:
            stmt = stmt.where(Party.shipping_address.ilike(f"%{query.pin_code}%"))
        elif query.city:
            stmt = stmt.where(
                or_(
                    Party.billing_address.ilike(f"%{query.city}%"),
                    Party.shipping_address.ilike(f"%{query.city}%"),
                    Party.party_name.ilike(f"%{query.city}%"),
                )
            )
        elif query.search:
            pattern = f"%{query.search}%"
            stmt = stmt.where(
                or_(
                    Party.party_name.ilike(pattern),
                    Party.party_code.ilike(pattern),
                    Party.billing_address.ilike(pattern),
                    Party.shipping_address.ilike(pattern),
                    Party.contact_person.ilike(pattern),
                )
            )

        stmt = stmt.order_by(Party.party_name.asc()).limit(50)
        res = await self.session.execute(stmt)
        parties = list(res.scalars().all())

        results = []
        for p in parties:
            results.append(
                DealerLocatorResponse(
                    id=p.id,
                    dealer_code=p.party_code,
                    dealer_name=p.party_name,
                    contact_person=p.contact_person,
                    phone=p.phone or "+91 9930349472",
                    email=p.email,
                    city=p.billing_address.split(",")[-2].strip() if "," in (p.billing_address or "") else (p.billing_address or "Silvassa / Mumbai"),
                    state="India",
                    pin_code=p.shipping_address or "400001",
                    address=p.billing_address or "Authorized Stockist Yard & Experience Center",
                    whatsapp_number=p.phone or "919930349472",
                    is_stockist=True,
                )
            )

        if not results:
            # Fallback flagship company dealer if none found
            results.append(
                DealerLocatorResponse(
                    id="flagship-silvassa",
                    dealer_code="DLR-HQ-001",
                    dealer_name="FixoBoard Central Depot & Experience Center",
                    contact_person="Sales Support",
                    phone="+91 9930349472",
                    email="info@fixoboard.com",
                    city=query.city or "Silvassa",
                    state="Dadra and Nagar Haveli",
                    pin_code=query.pin_code or "396230",
                    address="Atlantic Polymers Ltd, Plot No 14/A, GIDC Industrial Estate, Silvassa",
                    whatsapp_number="919930349472",
                    is_stockist=True,
                )
            )

        return results

    async def calculate_smart_quote(self, req: SmartQuoteRequest) -> SmartQuoteEstimateResponse:
        total_sheets = 0
        total_subtotal = Decimal("0.00")

        summary_lines = []
        for item in req.items:
            # Compute sheet requirement
            sheet_qty = item.sheet_count
            if item.approx_length_ft and item.approx_height_ft and item.approx_length_ft > 0 and item.approx_height_ft > 0:
                sqft = Decimal(str(item.approx_length_ft * item.approx_height_ft))
                # Add 10% cutting wastage allowance
                effective_sqft = sqft * Decimal("1.10")
                calc_sheets = int((effective_sqft / Decimal(str(SQFT_PER_SHEET))).to_integral_value(rounding="ROUND_UP"))
                sheet_qty = max(calc_sheets, 1)

            total_sheets += sheet_qty
            thick_key = f"{item.thickness_mm:.1f}" if f"{item.thickness_mm:.1f}" in BASE_RATES_INR else "18.0"
            rate_per_sqft = Decimal(str(BASE_RATES_INR.get(thick_key, 135.0)))
            # Multiply by density factor
            density_factor = Decimal(str(item.density_g_cm3 or 0.50)) / Decimal("0.50")
            adjusted_rate = rate_per_sqft * density_factor
            line_cost = Decimal(str(sheet_qty)) * Decimal(str(SQFT_PER_SHEET)) * adjusted_rate

            total_subtotal += line_cost
            summary_lines.append(f"{item.application_area}: {sheet_qty} sheets ({item.thickness_mm}mm @ {item.density_g_cm3} density)")

        # 18% GST standard for PVC/WPC building products
        tax_inr = total_subtotal * Decimal("0.18")
        total_inr = total_subtotal + tax_inr

        # Create CRM Lead & Route to Nearest Dealer
        nearest_dealer = await self.crm_service.find_nearest_dealer(city=req.city, pin_code=req.pin_code)

        lead = await self.crm_service.create_lead(
            LeadCreate(
                customer_name=req.customer_name,
                phone=req.phone,
                email=req.email,
                city=req.city,
                pin_code=req.pin_code,
                source="SMART_QUOTE",
                user_type=req.user_type,
                project_type="Smart Estimation Wizard",
                product_interest=" / ".join(summary_lines),
                estimated_quantity=Decimal(str(total_sheets)),
                estimated_value=total_inr,
                requirements_summary=" | ".join(summary_lines) + (f" | Remarks: {req.remarks}" if req.remarks else ""),
                assigned_dealer_id=nearest_dealer.id if nearest_dealer else None,
            )
        )

        return SmartQuoteEstimateResponse(
            lead_id=lead.id,
            lead_number=lead.lead_number,
            estimated_total_sheets=total_sheets,
            estimated_subtotal_inr=float(total_subtotal),
            estimated_tax_inr=float(tax_inr),
            estimated_total_inr=float(total_inr),
            assigned_dealer_name=nearest_dealer.party_name if nearest_dealer else "FixoBoard Authorized Network",
            assigned_dealer_phone=nearest_dealer.phone if nearest_dealer else "+91 9930349472",
            assigned_dealer_city=nearest_dealer.billing_address or req.city,
            summary_message=f"Estimated material requirement: {total_sheets} standard sheets (8x4 ft). Instant quote enquiry generated as {lead.lead_number}.",
        )

    async def register_professional(self, req: ProfessionalRegistrationRequest) -> ProfessionalResponse:
        profile = ProfessionalProfile(
            professional_type=req.professional_type,
            full_name=req.full_name.strip(),
            firm_name=req.firm_name.strip() if req.firm_name else None,
            phone=req.phone.strip(),
            email=req.email.strip() if req.email else None,
            city=req.city.strip(),
            state=req.state.strip() if req.state else None,
            experience_years=req.experience_years or 0,
            council_registration_number=req.council_registration_number,
            sample_kit_requested=req.request_sample_kit,
            sample_kit_status="REQUESTED" if req.request_sample_kit else "NOT_REQUESTED",
            notes=req.notes,
            reward_points=100,  # Welcome bonus points
            is_verified=False,
        )
        self.session.add(profile)
        await self.session.flush()

        # Also create CRM lead for the sales team to follow up
        await self.crm_service.create_lead(
            LeadCreate(
                customer_name=f"{req.full_name} ({req.professional_type})",
                phone=req.phone,
                email=req.email,
                city=req.city,
                state=req.state,
                source=req.professional_type,
                user_type=req.professional_type,
                project_type="Professional Onboarding & Sample Kit",
                requirements_summary=f"Firm: {req.firm_name or 'Independent'} | Exp: {req.experience_years} yrs | Sample Kit: {req.request_sample_kit}",
            )
        )

        return ProfessionalResponse.model_validate(profile)
