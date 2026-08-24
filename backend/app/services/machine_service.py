from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.models.machine import Machine
from app.repositories.machine_repository import MachineRepository
from app.schemas.machine import MachineCreate, MachineUpdate
from app.services.audit_service import AuditService


class MachineService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = MachineRepository(session)
        self.audit_service = AuditService(session)

    async def get_machine_by_id(self, machine_id: str) -> Machine:
        machine = await self.repo.get_by_id(machine_id)
        if not machine:
            raise NotFoundException(f"Machine with ID {machine_id} not found")
        return machine

    async def get_machines(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[Machine], int]:
        return await self.repo.get_paginated(skip=skip, limit=limit, status=status, is_active=is_active)

    async def create_machine(self, data: MachineCreate, user_id: str) -> Machine:
        existing = await self.repo.get_by_code(data.machine_code)
        if existing:
            raise BusinessRuleException(f"Machine code '{data.machine_code}' already exists")

        machine = Machine(
            machine_code=data.machine_code.strip().upper(),
            machine_name=data.machine_name.strip(),
            line_name=data.line_name.strip(),
            machine_type=data.machine_type.strip(),
            rated_capacity_hourly=data.rated_capacity_hourly,
            location=data.location,
            description=data.description,
        )
        saved = await self.repo.create(machine)
        await self.audit_service.log_action(
            user_id=user_id,
            action="CREATE_MACHINE",
            entity_name="machines",
            entity_id=f"{saved.machine_code} - {saved.line_name}",
            new_values={
                "machine_code": saved.machine_code,
                "machine_name": saved.machine_name,
                "line_name": saved.line_name,
                "rated_capacity": str(saved.rated_capacity_hourly),
            },
        )
        return saved

    async def update_machine(self, machine_id: str, data: MachineUpdate, user_id: str) -> Machine:
        machine = await self.get_machine_by_id(machine_id)
        old_values = {}
        new_values = {}
        for field, val in data.model_dump(exclude_unset=True).items():
            if val is not None:
                old_values[field] = getattr(machine, field, None)
                parsed_val = val.value if hasattr(val, "value") else val
                setattr(machine, field, parsed_val)
                new_values[field] = parsed_val
        updated = await self.repo.update(machine)
        await self.audit_service.log_action(
            user_id=user_id,
            action="UPDATE_MACHINE",
            entity_name="machines",
            entity_id=f"{machine.machine_code} - {machine.line_name}",
            old_values=old_values,
            new_values=new_values,
        )
        return updated

    async def update_machine_status(self, machine_id: str, status: str, user_id: str) -> Machine:
        machine = await self.get_machine_by_id(machine_id)
        status_value = status.value if hasattr(status, "value") else str(status).strip().upper()
        old_status = machine.status
        machine.status = status_value
        updated = await self.repo.update(machine)
        await self.audit_service.log_action(
            user_id=user_id,
            action="UPDATE_MACHINE_STATUS",
            entity_name="machines",
            entity_id=f"{machine.machine_code} - {machine.line_name}",
            old_values={"machine_name": machine.machine_name, "status": old_status},
            new_values={"machine_name": machine.machine_name, "status": status_value},
        )
        return updated
