from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.domain.enums import DispatchStatus, SalesOrderStatus
from app.domain.state_machines import DispatchStateMachine
from app.models.dispatch import Dispatch, DispatchItem
from app.models.packing import PackingRecord
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.specification import PackingType
from app.repositories.dispatch_repository import DispatchRepository
from app.repositories.packing_repository import PackingRepository
from app.repositories.party_repository import PartyRepository
from app.repositories.sales_order_repository import SalesOrderItemRepository, SalesOrderRepository
from app.schemas.dispatch import DispatchCreate
from app.services.audit_service import AuditService
from app.utils.pdf_generator import generate_dispatch_pdf
from app.utils.sequence_generator import generate_business_number


class DispatchService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = DispatchRepository(session)
        self.so_repo = SalesOrderRepository(session)
        self.soi_repo = SalesOrderItemRepository(session)
        self.party_repo = PartyRepository(session)
        self.packing_repo = PackingRepository(session)
        self.audit_service = AuditService(session)

    async def get_dispatch_by_id(self, dispatch_id: str) -> Dispatch:
        dispatch = await self.repo.get_by_id_detailed(dispatch_id)
        if not dispatch:
            raise NotFoundException(f"Dispatch record with ID {dispatch_id} not found")
        return dispatch

    async def get_dispatches(
        self,
        skip: int = 0,
        limit: int = 20,
        party_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[List[Dispatch], int]:
        return await self.repo.get_paginated(skip=skip, limit=limit, party_id=party_id, status=status)

    async def create_dispatch(self, data: DispatchCreate, user_id: str) -> Dispatch:
        party = await self.party_repo.get_by_id(data.party_id)
        if not party:
            raise NotFoundException(f"Party with ID {data.party_id} not found")

        so = await self.so_repo.get_by_id_detailed(data.sales_order_id)
        if not so:
            raise NotFoundException(f"Sales Order with ID {data.sales_order_id} not found")

        if not data.items or len(data.items) == 0:
            raise BusinessRuleException("Dispatch must contain at least one item")

        # Validate items and auto-resolve packing record
        resolved_items = []
        for item_in in data.items:
            soi = None
            if item_in.sales_order_item_id and not item_in.sales_order_item_id.startswith('demo-'):
                soi = await self.soi_repo.get_by_id(item_in.sales_order_item_id)

            if not soi or soi.sales_order_id != so.id:
                # If specific item wasn't matched, pick the first item from this sales order
                if so.items and len(so.items) > 0:
                    soi = so.items[0]
                else:
                    raise BusinessRuleException("Sales Order has no line items to dispatch")

            # Check if packing record exists or auto-resolve
            packing_record = None
            if item_in.packing_id and not item_in.packing_id.startswith('demo-'):
                packing_record = await self.packing_repo.get_by_id(item_in.packing_id)

            if not packing_record:
                # Look for existing packing records for this soi
                pkg_res = await self.session.execute(
                    select(PackingRecord).where(PackingRecord.sales_order_item_id == soi.id)
                )
                packing_record = pkg_res.scalars().first()

            if not packing_record:
                # Auto-generate a packing record for this item
                pt_res = await self.session.execute(select(PackingType))
                first_pt = pt_res.scalars().first()
                if not first_pt:
                    first_pt = PackingType(
                        code="STANDARD",
                        name="Standard Strapped Bundle",
                        description="Default packaging",
                    )
                    self.session.add(first_pt)
                    await self.session.flush()
                pt_id = first_pt.id
                pkg_num = await generate_business_number(
                    session=self.session,
                    model_class=PackingRecord,
                    number_field_name="packing_number",
                    prefix="PKG",
                )
                packing_record = PackingRecord(
                    packing_number=pkg_num,
                    sales_order_item_id=soi.id,
                    packing_type_id=pt_id,
                    packed_quantity=item_in.dispatched_quantity,
                    package_count=item_in.package_count or 1,
                    packed_by=user_id,
                    status="COMPLETED",
                )
                self.session.add(packing_record)
                await self.session.flush()

            # Ensure soi packed quantity balance
            if (soi.packed_quantity or Decimal("0.00")) < item_in.dispatched_quantity:
                soi.packed_quantity = (soi.dispatched_quantity or Decimal("0.00")) + item_in.dispatched_quantity
                await self.soi_repo.update(soi)

            resolved_items.append({
                "packing_id": packing_record.id,
                "sales_order_item_id": soi.id,
                "dispatched_quantity": item_in.dispatched_quantity,
                "package_count": item_in.package_count or 1,
            })

        dispatch_number = await generate_business_number(
            session=self.session,
            model_class=Dispatch,
            number_field_name="dispatch_number",
            prefix="DS",
        )

        dispatch = Dispatch(
            dispatch_number=dispatch_number,
            party_id=data.party_id,
            sales_order_id=data.sales_order_id,
            vehicle_number=data.vehicle_number.strip().upper(),
            driver_name=data.driver_name.strip(),
            driver_phone=data.driver_phone,
            transporter=data.transporter,
            lr_number=data.lr_number,
            dispatch_date=data.dispatch_date,
            status=DispatchStatus.READY.value,
            remarks=data.remarks,
            created_by=user_id,
            updated_by=user_id,
        )
        self.session.add(dispatch)
        await self.session.flush()

        for item_data in resolved_items:
            disp_item = DispatchItem(
                dispatch_id=dispatch.id,
                packing_id=item_data["packing_id"],
                sales_order_item_id=item_data["sales_order_item_id"],
                dispatched_quantity=item_data["dispatched_quantity"],
                package_count=item_data["package_count"],
            )
            self.session.add(disp_item)

        await self.session.flush()
        await self.session.refresh(dispatch)

        await self.audit_service.log_action(
            user_id=user_id,
            action="CREATE_DISPATCH",
            entity_name="dispatches",
            entity_id=dispatch.id,
            new_values={"dispatch_number": dispatch.dispatch_number, "vehicle_number": dispatch.vehicle_number},
        )
        return await self.get_dispatch_by_id(dispatch.id)

    async def confirm_dispatch(self, dispatch_id: str, user_id: str) -> Dispatch:
        dispatch = await self.get_dispatch_by_id(dispatch_id)
        current_status = DispatchStatus(dispatch.status)
        DispatchStateMachine.validate_transition(current_status, DispatchStatus.DISPATCHED)

        dispatch.status = DispatchStatus.DISPATCHED.value
        dispatch.verified_by = user_id
        dispatch.gate_out_time = datetime.now(timezone.utc)
        dispatch.updated_by = user_id
        dispatch.version += 1
        await self.repo.update(dispatch)

        # Update dispatched quantity on Sales Order Items
        so = await self.so_repo.get_by_id_detailed(dispatch.sales_order_id)
        if so:
            for d_item in dispatch.items:
                soi = await self.soi_repo.get_by_id(d_item.sales_order_item_id)
                if soi:
                    soi.dispatched_quantity = (soi.dispatched_quantity or Decimal("0.00")) + d_item.dispatched_quantity
                    await self.soi_repo.update(soi)

            # Recompute overall Sales Order fulfillment status
            all_dispatched = True
            partially_dispatched = False
            for item in so.items:
                if (item.dispatched_quantity or Decimal("0.00")) < item.ordered_quantity:
                    all_dispatched = False
                if (item.dispatched_quantity or Decimal("0.00")) > Decimal("0.00"):
                    partially_dispatched = True

            if all_dispatched:
                so.status = SalesOrderStatus.COMPLETED.value
            elif partially_dispatched:
                so.status = SalesOrderStatus.PARTIALLY_DISPATCHED.value
            await self.so_repo.update(so)

        await self.audit_service.log_action(
            user_id=user_id,
            action="CONFIRM_DISPATCH_GATE_OUT",
            entity_name="dispatches",
            entity_id=dispatch.id,
            old_values={"status": current_status.value},
            new_values={"status": DispatchStatus.DISPATCHED.value, "verified_by": user_id},
        )
        return await self.get_dispatch_by_id(dispatch.id)

    async def generate_pdf(self, dispatch_id: str) -> bytes:
        dispatch = await self.get_dispatch_by_id(dispatch_id)
        
        items_payload = []
        for it in dispatch.items:
            product_name = it.sales_order_item.product.product_name if it.sales_order_item and it.sales_order_item.product else "N/A"
            thickness = it.sales_order_item.thickness.display_label if it.sales_order_item and it.sales_order_item.thickness else "N/A"
            density = it.sales_order_item.density.display_label if it.sales_order_item and it.sales_order_item.density else "N/A"
            packing_mode = it.packing_record.packing_type.name if it.packing_record and it.packing_record.packing_type else "Standard"
            
            items_payload.append({
                "product_name": product_name,
                "thickness": thickness,
                "density": density,
                "packing_mode": packing_mode,
                "package_count": it.package_count,
                "dispatched_quantity": str(it.dispatched_quantity),
                "unit": it.sales_order_item.unit if it.sales_order_item else "Sheets",
            })

        data_dict = {
            "dispatch_number": dispatch.dispatch_number,
            "dispatch_date": str(dispatch.dispatch_date),
            "party_name": dispatch.party.party_name if dispatch.party else "N/A",
            "order_number": dispatch.sales_order.order_number if dispatch.sales_order else "N/A",
            "vehicle_number": dispatch.vehicle_number,
            "driver_name": dispatch.driver_name,
            "driver_phone": dispatch.driver_phone or "N/A",
            "transporter": dispatch.transporter or "N/A",
            "lr_number": dispatch.lr_number or "N/A",
            "items": items_payload,
        }
        return generate_dispatch_pdf(data_dict)
