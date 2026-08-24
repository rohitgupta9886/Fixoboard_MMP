from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.production_run import ProductionRun
from app.repositories.base import BaseRepository


class ProductionRunRepository(BaseRepository[ProductionRun]):
    def __init__(self, session: AsyncSession):
        super().__init__(ProductionRun, session)

    async def get_by_id_detailed(self, run_id: str) -> Optional[ProductionRun]:
        stmt = (
            select(ProductionRun)
            .options(
                selectinload(ProductionRun.machine),
                selectinload(ProductionRun.operator),
                selectinload(ProductionRun.production_memo),
            )
            .where(ProductionRun.id == run_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_active_runs_by_machine(self, machine_id: str) -> List[ProductionRun]:
        stmt = (
            select(ProductionRun)
            .options(selectinload(ProductionRun.machine), selectinload(ProductionRun.operator))
            .where(ProductionRun.machine_id == machine_id, ProductionRun.status == "IN_PROGRESS")
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        machine_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[List[ProductionRun], int]:
        stmt = select(ProductionRun).options(
            selectinload(ProductionRun.machine),
            selectinload(ProductionRun.operator),
        )
        count_stmt = select(func.count()).select_from(ProductionRun)

        if machine_id:
            stmt = stmt.where(ProductionRun.machine_id == machine_id)
            count_stmt = count_stmt.where(ProductionRun.machine_id == machine_id)

        if status:
            stmt = stmt.where(ProductionRun.status == status)
            count_stmt = count_stmt.where(ProductionRun.status == status)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(ProductionRun.created_at.desc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total
