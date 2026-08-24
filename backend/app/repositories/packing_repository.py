from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.packing import PackingRecord
from app.models.sales_order import SalesOrderItem
from app.repositories.base import BaseRepository


class PackingRepository(BaseRepository[PackingRecord]):
    def __init__(self, session: AsyncSession):
        super().__init__(PackingRecord, session)

    async def get_by_id_detailed(self, packing_id: str) -> Optional[PackingRecord]:
        stmt = (
            select(PackingRecord)
            .options(
                selectinload(PackingRecord.packing_type),
                selectinload(PackingRecord.packer),
                selectinload(PackingRecord.sales_order_item).selectinload(SalesOrderItem.product),
                selectinload(PackingRecord.sales_order_item).selectinload(SalesOrderItem.thickness),
                selectinload(PackingRecord.sales_order_item).selectinload(SalesOrderItem.density),
            )
            .where(PackingRecord.id == packing_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        sales_order_item_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[List[PackingRecord], int]:
        stmt = (
            select(PackingRecord)
            .options(
                selectinload(PackingRecord.packing_type),
                selectinload(PackingRecord.packer),
                selectinload(PackingRecord.sales_order_item).selectinload(SalesOrderItem.product),
                selectinload(PackingRecord.sales_order_item).selectinload(SalesOrderItem.thickness),
                selectinload(PackingRecord.sales_order_item).selectinload(SalesOrderItem.density),
            )
        )
        count_stmt = select(func.count()).select_from(PackingRecord)

        if sales_order_item_id:
            stmt = stmt.where(PackingRecord.sales_order_item_id == sales_order_item_id)
            count_stmt = count_stmt.where(PackingRecord.sales_order_item_id == sales_order_item_id)

        if status:
            stmt = stmt.where(PackingRecord.status == status)
            count_stmt = count_stmt.where(PackingRecord.status == status)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(PackingRecord.created_at.desc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total
