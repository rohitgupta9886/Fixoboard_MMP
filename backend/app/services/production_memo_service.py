from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.domain.enums import ProductionMemoStatus, SalesOrderStatus
from app.domain.state_machines import ProductionMemoStateMachine
from app.models.production_memo import ProductionMemo
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.repositories.machine_repository import MachineRepository
from app.repositories.production_memo_repository import ProductionMemoRepository
from app.repositories.sales_order_repository import SalesOrderItemRepository, SalesOrderRepository
from app.schemas.production_memo import ProductionMemoCreate
from app.services.audit_service import AuditService
from app.utils.sequence_generator import generate_business_number


class ProductionMemoService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = ProductionMemoRepository(session)
        self.so_repo = SalesOrderRepository(session)
        self.soi_repo = SalesOrderItemRepository(session)
        self.machine_repo = MachineRepository(session)
        self.audit_service = AuditService(session)

    async def get_memo_by_id(self, memo_id: str) -> ProductionMemo:
        memo = await self.repo.get_by_id_detailed(memo_id)
        if not memo:
            raise NotFoundException(f"Production Memo with ID {memo_id} not found")
        return memo

    async def get_memos(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        machine_id: Optional[str] = None,
        priority: Optional[str] = None,
    ) -> tuple[List[ProductionMemo], int]:
        return await self.repo.get_paginated(
            skip=skip, limit=limit, status=status, machine_id=machine_id, priority=priority
        )

    async def create_memo(self, data: ProductionMemoCreate, user_id: str) -> ProductionMemo:
        so = await self.so_repo.get_by_id(data.sales_order_id)
        if not so:
            raise NotFoundException(f"Sales Order with ID {data.sales_order_id} not found")

        if so.status not in [SalesOrderStatus.APPROVED.value, SalesOrderStatus.PARTIALLY_PRODUCTION.value, SalesOrderStatus.IN_PRODUCTION.value]:
            raise BusinessRuleException(f"Cannot generate Production Memo from an order in '{so.status}' status. Must be APPROVED.")

        soi = await self.soi_repo.get_by_id(data.sales_order_item_id)
        if not soi or soi.sales_order_id != so.id:
            raise BusinessRuleException("Specified Sales Order Item does not belong to this Sales Order")

        if data.target_machine_id:
            machine = await self.machine_repo.get_by_id(data.target_machine_id)
            if not machine:
                raise NotFoundException(f"Machine with ID {data.target_machine_id} not found")
            if not machine.is_active:
                raise BusinessRuleException("Target Machine is inactive")
            if machine.status in ["MAINTENANCE", "OFFLINE"]:
                raise BusinessRuleException(f"Cannot assign Machine '{machine.line_name}' because its status is {machine.status}")

        memo_number = await generate_business_number(
            session=self.session,
            model_class=ProductionMemo,
            number_field_name="memo_number",
            prefix="PM",
        )

        initial_status = ProductionMemoStatus.PLANNED.value if data.target_machine_id else ProductionMemoStatus.APPROVED.value

        memo = ProductionMemo(
            memo_number=memo_number,
            sales_order_id=data.sales_order_id,
            sales_order_item_id=data.sales_order_item_id,
            planned_quantity=data.planned_quantity,
            priority=data.priority.value if hasattr(data.priority, "value") else data.priority,
            required_date=data.required_date,
            target_machine_id=data.target_machine_id,
            status=initial_status,
            remarks=data.remarks,
            created_by=user_id,
            approved_by=user_id,
            assigned_by=user_id if data.target_machine_id else None,
        )

        saved = await self.repo.create(memo)

        # Update Sales Order status to IN_PRODUCTION if needed
        if so.status == SalesOrderStatus.APPROVED.value:
            so.status = SalesOrderStatus.IN_PRODUCTION.value
            await self.so_repo.update(so)

        await self.audit_service.log_action(
            user_id=user_id,
            action="CREATE_PRODUCTION_MEMO",
            entity_name="production_memos",
            entity_id=saved.memo_number,
            new_values={
                "memo_number": saved.memo_number,
                "sales_order": so.order_number if so else saved.sales_order_id,
                "planned_quantity": str(saved.planned_quantity),
                "priority": saved.priority,
            },
        )
        return await self.get_memo_by_id(saved.id)

    async def assign_machine(self, memo_id: str, machine_id: str, user_id: str) -> ProductionMemo:
        memo = await self.get_memo_by_id(memo_id)
        machine = await self.machine_repo.get_by_id(machine_id)
        if not machine or not machine.is_active:
            raise BusinessRuleException("Target Machine is invalid or inactive")
        if machine.status in ["MAINTENANCE", "OFFLINE"]:
            raise BusinessRuleException(f"Cannot assign Machine '{machine.line_name}' because its status is {machine.status}")

        old_machine_name = memo.target_machine.machine_name if getattr(memo, "target_machine", None) else (memo.target_machine_id or "Unassigned")
        old_status = memo.status

        memo.target_machine_id = machine.id
        memo.assigned_by = user_id
        if memo.status in [ProductionMemoStatus.DRAFT.value, ProductionMemoStatus.APPROVED.value, ProductionMemoStatus.PLANNED.value]:
            memo.status = ProductionMemoStatus.MACHINE_ASSIGNED.value

        memo.version += 1
        await self.repo.update(memo)

        await self.audit_service.log_action(
            user_id=user_id,
            action="ASSIGN_MACHINE_TO_MEMO",
            entity_name="production_memos",
            entity_id=memo.memo_number,
            old_values={"memo_number": memo.memo_number, "target_machine": old_machine_name, "status": old_status},
            new_values={"memo_number": memo.memo_number, "target_machine": f"{machine.machine_name} ({machine.machine_code})", "status": memo.status},
        )
        return await self.get_memo_by_id(memo.id)

    async def release_memo(self, memo_id: str, user_id: str) -> ProductionMemo:
        memo = await self.get_memo_by_id(memo_id)
        if not memo.target_machine_id:
            available_machines = await self.machine_repo.get_all_available()
            if available_machines:
                memo.target_machine_id = available_machines[0].id
                memo.assigned_by = user_id
            else:
                raise BusinessRuleException("No active, operational Extrusion Line machines available to assign")
        else:
            machine = await self.machine_repo.get_by_id(memo.target_machine_id)
            if machine and (not machine.is_active or machine.status in ["MAINTENANCE", "OFFLINE"]):
                raise BusinessRuleException(f"Target machine '{machine.line_name}' is currently {machine.status}. Please reassign to an operational line before releasing.")

        current_status = ProductionMemoStatus(memo.status)
        ProductionMemoStateMachine.validate_transition(current_status, ProductionMemoStatus.RELEASED)

        memo.status = ProductionMemoStatus.RELEASED.value
        memo.version += 1
        await self.repo.update(memo)

        await self.audit_service.log_action(
            user_id=user_id,
            action="RELEASE_PRODUCTION_MEMO",
            entity_name="production_memos",
            entity_id=memo.memo_number,
            old_values={"memo_number": memo.memo_number, "status": current_status.value},
            new_values={"memo_number": memo.memo_number, "status": ProductionMemoStatus.RELEASED.value},
        )
        return await self.get_memo_by_id(memo.id)
