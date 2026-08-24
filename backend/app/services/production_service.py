from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.domain.enums import MachineStatus, ProductionMemoStatus, ProductionRunStatus
from app.domain.state_machines import ProductionMemoStateMachine
from app.models.machine import Machine
from app.models.production_memo import ProductionMemo
from app.models.production_run import ProductionRun
from app.models.sales_order import SalesOrderItem
from app.repositories.machine_repository import MachineRepository
from app.repositories.production_memo_repository import ProductionMemoRepository
from app.repositories.production_run_repository import ProductionRunRepository
from app.repositories.sales_order_repository import SalesOrderItemRepository
from app.schemas.production_run import ProductionRunComplete, ProductionRunOutputLog, ProductionRunPause, ProductionRunStart
from app.services.audit_service import AuditService


class ProductionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.run_repo = ProductionRunRepository(session)
        self.memo_repo = ProductionMemoRepository(session)
        self.soi_repo = SalesOrderItemRepository(session)
        self.machine_repo = MachineRepository(session)
        self.audit_service = AuditService(session)

    async def get_run_by_id(self, run_id: str) -> ProductionRun:
        run = await self.run_repo.get_by_id_detailed(run_id)
        if not run:
            raise NotFoundException(f"Production Run with ID {run_id} not found")
        return run

    async def get_runs(
        self,
        skip: int = 0,
        limit: int = 20,
        machine_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[List[ProductionRun], int]:
        return await self.run_repo.get_paginated(skip=skip, limit=limit, machine_id=machine_id, status=status)

    async def start_run(self, data: ProductionRunStart, user_id: str) -> ProductionRun:
        memo = await self.memo_repo.get_by_id(data.production_memo_id)
        if not memo:
            raise NotFoundException(f"Production Memo with ID {data.production_memo_id} not found")

        # Allow starting run directly if memo is in any open pre-production state
        valid_start_statuses = [
            ProductionMemoStatus.RELEASED.value,
            ProductionMemoStatus.MACHINE_ASSIGNED.value,
            ProductionMemoStatus.PLANNED.value,
            ProductionMemoStatus.APPROVED.value,
            ProductionMemoStatus.IN_PROGRESS.value,
            ProductionMemoStatus.PAUSED.value,
        ]
        if memo.status not in valid_start_statuses:
            raise BusinessRuleException(f"Cannot start execution on memo in '{memo.status}' status.")

        machine_id = data.machine_id or memo.target_machine_id
        if not machine_id:
            active_machines = await self.machine_repo.get_all_active()
            if active_machines:
                machine_id = active_machines[0].id
            else:
                raise BusinessRuleException("No active Extrusion Line machines available to assign")

        machine = await self.machine_repo.get_by_id(machine_id)
        if not machine or not machine.is_active:
            raise BusinessRuleException("Specified Machine is invalid or inactive")

        planned_qty = data.planned_quantity or memo.planned_quantity

        # Create new execution batch run
        run = ProductionRun(
            production_memo_id=memo.id,
            machine_id=machine.id,
            operator_id=user_id,
            shift=data.shift,
            start_time=datetime.now(timezone.utc),
            planned_quantity=planned_qty,
            good_quantity=Decimal("0.00"),
            rejected_quantity=Decimal("0.00"),
            waste_kg=Decimal("0.00"),
            status=ProductionRunStatus.IN_PROGRESS.value,
            remarks=data.remarks,
        )
        saved_run = await self.run_repo.create(run)

        # Update memo status to IN_PROGRESS
        memo.status = ProductionMemoStatus.IN_PROGRESS.value
        memo.target_machine_id = machine.id
        await self.memo_repo.update(memo)

        # Update machine status to RUNNING
        machine.status = MachineStatus.RUNNING.value
        await self.machine_repo.update(machine)

        await self.audit_service.log_action(
            user_id=user_id,
            action="START_PRODUCTION_RUN",
            entity_name="production_runs",
            entity_id=f"{memo.memo_number} ({machine.line_name or machine.machine_code})",
            new_values={
                "memo_number": memo.memo_number,
                "machine_name": machine.machine_name,
                "machine_code": machine.machine_code,
                "line_name": machine.line_name,
                "shift": data.shift,
                "planned_quantity": str(planned_qty),
            },
        )
        return await self.get_run_by_id(saved_run.id)

    async def log_output(self, run_id: str, data: ProductionRunOutputLog, user_id: str) -> ProductionRun:
        run = await self.get_run_by_id(run_id)
        if run.status not in [ProductionRunStatus.IN_PROGRESS.value, ProductionRunStatus.PAUSED.value]:
            raise BusinessRuleException(f"Cannot log output on run in '{run.status}' status")

        run.good_quantity = (run.good_quantity or Decimal("0.00")) + data.good_quantity
        run.rejected_quantity = (run.rejected_quantity or Decimal("0.00")) + data.rejected_quantity
        run.waste_kg = (run.waste_kg or Decimal("0.00")) + data.scrap_weight_kg
        if data.defect_reason:
            run.rejection_reason = data.defect_reason
        if data.remarks:
            run.remarks = f"{run.remarks or ''} | {data.remarks}"
        await self.run_repo.update(run)

        # Update Sales Order Item produced_quantity accumulator
        memo = await self.memo_repo.get_by_id(run.production_memo_id)
        memo_label = memo.memo_number if memo else run.production_memo_id
        machine_label = run.machine.line_name if getattr(run, "machine", None) else "Extruder"
        if memo:
            soi = await self.soi_repo.get_by_id(memo.sales_order_item_id)
            if soi:
                soi.produced_quantity = (soi.produced_quantity or Decimal("0.00")) + data.good_quantity
                await self.soi_repo.update(soi)

        await self.audit_service.log_action(
            user_id=user_id,
            action="LOG_PRODUCTION_OUTPUT",
            entity_name="production_runs",
            entity_id=f"{memo_label} ({machine_label})",
            new_values={
                "memo_number": memo_label,
                "machine": machine_label,
                "added_good_quantity": str(data.good_quantity),
                "added_scrap_kg": str(data.scrap_weight_kg),
                "total_good_quantity": str(run.good_quantity),
            },
        )
        return await self.get_run_by_id(run.id)

    async def pause_run(self, run_id: str, data: ProductionRunPause, user_id: str) -> ProductionRun:
        run = await self.get_run_by_id(run_id)
        if run.status != ProductionRunStatus.IN_PROGRESS.value:
            raise BusinessRuleException(f"Cannot pause run in '{run.status}' status")

        run.status = ProductionRunStatus.PAUSED.value
        run.rejection_reason = data.rejection_reason
        run.remarks = f"{run.remarks or ''} | Paused: {data.remarks or 'Operator paused'}"
        await self.run_repo.update(run)

        # Set machine to IDLE
        if run.machine:
            run.machine.status = MachineStatus.IDLE.value
            await self.machine_repo.update(run.machine)

        memo = await self.memo_repo.get_by_id(run.production_memo_id)
        memo_label = memo.memo_number if memo else run.production_memo_id

        await self.audit_service.log_action(
            user_id=user_id,
            action="PAUSE_PRODUCTION_RUN",
            entity_name="production_runs",
            entity_id=f"{memo_label} ({run.machine.line_name if run.machine else 'Line'})",
            new_values={"memo_number": memo_label, "status": run.status, "reason": data.rejection_reason},
        )
        return await self.get_run_by_id(run.id)

    async def resume_run(self, run_id: str, user_id: str) -> ProductionRun:
        run = await self.get_run_by_id(run_id)
        if run.status != ProductionRunStatus.PAUSED.value:
            raise BusinessRuleException(f"Cannot resume run in '{run.status}' status")

        run.status = ProductionRunStatus.IN_PROGRESS.value
        await self.run_repo.update(run)

        # Set machine to RUNNING
        if run.machine:
            run.machine.status = MachineStatus.RUNNING.value
            await self.machine_repo.update(run.machine)

        memo = await self.memo_repo.get_by_id(run.production_memo_id)
        memo_label = memo.memo_number if memo else run.production_memo_id

        await self.audit_service.log_action(
            user_id=user_id,
            action="RESUME_PRODUCTION_RUN",
            entity_name="production_runs",
            entity_id=f"{memo_label} ({run.machine.line_name if run.machine else 'Line'})",
            new_values={"memo_number": memo_label, "status": run.status},
        )
        return await self.get_run_by_id(run.id)

    async def complete_run(self, run_id: str, data: ProductionRunComplete, user_id: str) -> ProductionRun:
        run = await self.get_run_by_id(run_id)
        if run.status not in [ProductionRunStatus.IN_PROGRESS.value, ProductionRunStatus.PAUSED.value]:
            raise BusinessRuleException(f"Cannot complete run in '{run.status}' status")

        run.good_quantity = data.good_quantity
        run.rejected_quantity = data.rejected_quantity
        run.waste_kg = data.waste_kg
        run.rejection_reason = data.rejection_reason
        run.remarks = f"{run.remarks or ''} | {data.remarks or ''}"
        run.end_time = datetime.now(timezone.utc)
        run.status = ProductionRunStatus.COMPLETED.value
        await self.run_repo.update(run)

        # Update Sales Order Item produced_quantity accumulator
        memo = await self.memo_repo.get_by_id(run.production_memo_id)
        memo_label = memo.memo_number if memo else run.production_memo_id
        if memo:
            soi = await self.soi_repo.get_by_id(memo.sales_order_item_id)
            if soi:
                soi.produced_quantity = (soi.produced_quantity or Decimal("0.00")) + data.good_quantity
                await self.soi_repo.update(soi)

            # Check if total good output for this memo meets planned quantity
            all_runs_stmt = select(func.coalesce(func.sum(ProductionRun.good_quantity), Decimal("0.00"))).where(
                ProductionRun.production_memo_id == memo.id,
                ProductionRun.status == ProductionRunStatus.COMPLETED.value,
            )
            res = await self.session.execute(all_runs_stmt)
            total_good_produced = res.scalar() or Decimal("0.00")

            if total_good_produced >= memo.planned_quantity:
                memo.status = ProductionMemoStatus.COMPLETED.value
                await self.memo_repo.update(memo)

        # Update Machine to AVAILABLE
        if run.machine:
            run.machine.status = MachineStatus.AVAILABLE.value
            await self.machine_repo.update(run.machine)

        await self.audit_service.log_action(
            user_id=user_id,
            action="COMPLETE_PRODUCTION_RUN",
            entity_name="production_runs",
            entity_id=f"{memo_label} ({run.machine.line_name if run.machine else 'Line'})",
            new_values={
                "memo_number": memo_label,
                "good_quantity": str(data.good_quantity),
                "rejected_quantity": str(data.rejected_quantity),
                "waste_kg": str(data.waste_kg),
            },
        )
        return await self.get_run_by_id(run.id)
