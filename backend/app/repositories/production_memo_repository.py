from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.production_memo import ProductionMemo
from app.models.sales_order import SalesOrderItem
from app.repositories.base import BaseRepository


class ProductionMemoRepository(BaseRepository[ProductionMemo]):
    def __init__(self, session: AsyncSession):
        super().__init__(ProductionMemo, session)

    async def get_by_id_detailed(self, memo_id: str) -> Optional[ProductionMemo]:
        stmt = (
            select(ProductionMemo)
            .options(
                selectinload(ProductionMemo.sales_order),
                selectinload(ProductionMemo.sales_order_item).selectinload(SalesOrderItem.product),
                selectinload(ProductionMemo.sales_order_item).selectinload(SalesOrderItem.thickness),
                selectinload(ProductionMemo.sales_order_item).selectinload(SalesOrderItem.density),
                selectinload(ProductionMemo.target_machine),
                selectinload(ProductionMemo.runs),
            )
            .where(ProductionMemo.id == memo_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        machine_id: Optional[str] = None,
        priority: Optional[str] = None,
    ) -> tuple[List[ProductionMemo], int]:
        stmt = (
            select(ProductionMemo)
            .options(
                selectinload(ProductionMemo.sales_order),
                selectinload(ProductionMemo.sales_order_item).selectinload(SalesOrderItem.product),
                selectinload(ProductionMemo.sales_order_item).selectinload(SalesOrderItem.thickness),
                selectinload(ProductionMemo.sales_order_item).selectinload(SalesOrderItem.density),
                selectinload(ProductionMemo.target_machine),
            )
        )
        count_stmt = select(func.count()).select_from(ProductionMemo)

        if status:
            stmt = stmt.where(ProductionMemo.status == status)
            count_stmt = count_stmt.where(ProductionMemo.status == status)

        if machine_id:
            stmt = stmt.where(ProductionMemo.target_machine_id == machine_id)
            count_stmt = count_stmt.where(ProductionMemo.target_machine_id == machine_id)

        if priority:
            stmt = stmt.where(ProductionMemo.priority == priority)
            count_stmt = count_stmt.where(ProductionMemo.priority == priority)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(ProductionMemo.created_at.desc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total
