from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.domain.enums import SalesOrderStatus
from app.domain.state_machines import SalesOrderStateMachine
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.repositories.party_repository import PartyRepository
from app.repositories.sales_order_repository import SalesOrderItemRepository, SalesOrderRepository
from app.schemas.sales_order import SalesOrderCreate, SalesOrderUpdate
from app.services.audit_service import AuditService
from app.utils.sequence_generator import generate_business_number


class SalesOrderService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = SalesOrderRepository(session)
        self.item_repo = SalesOrderItemRepository(session)
        self.party_repo = PartyRepository(session)
        self.audit_service = AuditService(session)

    async def get_order_by_id(self, order_id: str) -> SalesOrder:
        order = await self.repo.get_by_id_detailed(order_id)
        if not order:
            raise NotFoundException(f"Sales Order with ID {order_id} not found")
        return order

    async def get_orders(
        self,
        skip: int = 0,
        limit: int = 20,
        party_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
    ) -> tuple[List[SalesOrder], int]:
        return await self.repo.get_paginated(
            skip=skip, limit=limit, party_id=party_id, status=status, priority=priority, search=search
        )

    async def create_order(self, data: SalesOrderCreate, user_id: str) -> SalesOrder:
        party = await self.party_repo.get_by_id(data.party_id)
        if not party or not party.is_active:
            raise BusinessRuleException("Specified Party is either invalid or inactive")

        if not data.items or len(data.items) == 0:
            raise BusinessRuleException("Sales Order must contain at least one line item")

        order_number = await generate_business_number(
            session=self.session,
            model_class=SalesOrder,
            number_field_name="order_number",
            prefix="SO",
        )

        total_qty = sum((item.ordered_quantity for item in data.items), Decimal("0.00"))

        order = SalesOrder(
            order_number=order_number,
            party_id=data.party_id,
            order_source=data.order_source.value if hasattr(data.order_source, "value") else data.order_source,
            customer_po_number=data.customer_po_number,
            order_date=data.order_date,
            required_date=data.required_date,
            priority=data.priority.value if hasattr(data.priority, "value") else data.priority,
            status=SalesOrderStatus.DRAFT.value,
            remarks=data.remarks,
            attachment_id=data.attachment_id,
            total_quantity=total_qty,
            created_by=user_id,
            updated_by=user_id,
        )
        self.session.add(order)
        await self.session.flush()

        for item_data in data.items:
            item = SalesOrderItem(
                sales_order_id=order.id,
                product_id=item_data.product_id,
                thickness_id=item_data.thickness_id,
                density_id=item_data.density_id,
                size_id=item_data.size_id,
                finish_id=item_data.finish_id,
                ordered_quantity=item_data.ordered_quantity,
                unit=item_data.unit,
                unit_price=item_data.unit_price,
                remarks=item_data.remarks,
                created_by=user_id,
                updated_by=user_id,
            )
            self.session.add(item)

        await self.session.flush()
        await self.session.refresh(order)

        await self.audit_service.log_action(
            user_id=user_id,
            action="CREATE_SALES_ORDER",
            entity_name="sales_orders",
            entity_id=order.id,
            new_values={"order_number": order.order_number, "total_quantity": str(total_qty)},
        )
        return await self.get_order_by_id(order.id)

    async def submit_order(self, order_id: str, user_id: str) -> SalesOrder:
        order = await self.get_order_by_id(order_id)
        current_status = SalesOrderStatus(order.status)
        SalesOrderStateMachine.validate_transition(current_status, SalesOrderStatus.SUBMITTED)

        order.status = SalesOrderStatus.SUBMITTED.value
        order.updated_by = user_id
        order.version += 1
        await self.repo.update(order)

        await self.audit_service.log_action(
            user_id=user_id,
            action="SUBMIT_SALES_ORDER",
            entity_name="sales_orders",
            entity_id=order.id,
            old_values={"status": current_status.value},
            new_values={"status": SalesOrderStatus.SUBMITTED.value},
        )
        return await self.get_order_by_id(order.id)

    async def approve_order(self, order_id: str, user_id: str) -> SalesOrder:
        order = await self.get_order_by_id(order_id)
        current_status = SalesOrderStatus(order.status)
        SalesOrderStateMachine.validate_transition(current_status, SalesOrderStatus.APPROVED)

        order.status = SalesOrderStatus.APPROVED.value
        order.approved_by = user_id
        order.approved_at = datetime.now(timezone.utc)
        order.updated_by = user_id
        order.version += 1
        await self.repo.update(order)

        await self.audit_service.log_action(
            user_id=user_id,
            action="APPROVE_SALES_ORDER",
            entity_name="sales_orders",
            entity_id=order.id,
            old_values={"status": current_status.value},
            new_values={"status": SalesOrderStatus.APPROVED.value, "approved_by": user_id},
        )
        return await self.get_order_by_id(order.id)

    async def reject_order(self, order_id: str, reason: str, user_id: str) -> SalesOrder:
        order = await self.get_order_by_id(order_id)
        current_status = SalesOrderStatus(order.status)
        SalesOrderStateMachine.validate_transition(current_status, SalesOrderStatus.REJECTED)

        order.status = SalesOrderStatus.REJECTED.value
        order.remarks = f"{order.remarks or ''} | Rejected: {reason}"
        order.updated_by = user_id
        order.version += 1
        await self.repo.update(order)

        await self.audit_service.log_action(
            user_id=user_id,
            action="REJECT_SALES_ORDER",
            entity_name="sales_orders",
            entity_id=order.id,
            old_values={"status": current_status.value},
            new_values={"status": SalesOrderStatus.REJECTED.value, "reason": reason},
        )
        return await self.get_order_by_id(order.id)

    async def cancel_order(self, order_id: str, reason: str, user_id: str) -> SalesOrder:
        order = await self.get_order_by_id(order_id)
        current_status = SalesOrderStatus(order.status)
        SalesOrderStateMachine.validate_transition(current_status, SalesOrderStatus.CANCELLED)

        order.status = SalesOrderStatus.CANCELLED.value
        order.remarks = f"{order.remarks or ''} | Cancelled: {reason}"
        order.updated_by = user_id
        order.version += 1
        await self.repo.update(order)

        await self.audit_service.log_action(
            user_id=user_id,
            action="CANCEL_SALES_ORDER",
            entity_name="sales_orders",
            entity_id=order.id,
            old_values={"status": current_status.value},
            new_values={"status": SalesOrderStatus.CANCELLED.value, "reason": reason},
        )
        return await self.get_order_by_id(order.id)
