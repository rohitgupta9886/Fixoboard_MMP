from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.machine import Machine
from app.repositories.base import BaseRepository


class MachineRepository(BaseRepository[Machine]):
    def __init__(self, session: AsyncSession):
        super().__init__(Machine, session)

    async def get_by_code(self, code: str) -> Optional[Machine]:
        stmt = select(Machine).where(Machine.machine_code == code)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[Machine], int]:
        stmt = select(Machine)
        count_stmt = select(func.count()).select_from(Machine)

        if status:
            stmt = stmt.where(Machine.status == status)
            count_stmt = count_stmt.where(Machine.status == status)

        if is_active is not None:
            stmt = stmt.where(Machine.is_active == is_active)
            count_stmt = count_stmt.where(Machine.is_active == is_active)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Machine.machine_code.asc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total

    async def get_all_active(self) -> List[Machine]:
        stmt = select(Machine).where(Machine.is_active == True).order_by(Machine.machine_code.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_all_available(self) -> List[Machine]:
        stmt = select(Machine).where(
            Machine.is_active == True,
            Machine.status.notin_(["MAINTENANCE", "OFFLINE"])
        ).order_by(Machine.machine_code.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
