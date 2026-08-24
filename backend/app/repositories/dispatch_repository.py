from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.dispatch import Dispatch, DispatchItem
from app.models.packing import PackingRecord
from app.models.sales_order import SalesOrderItem
from app.repositories.base import BaseRepository


class DispatchRepository(BaseRepository[Dispatch]):
    def __init__(self, session: AsyncSession):
        super().__init__(Dispatch, session)

    async def get_by_id_detailed(self, dispatch_id: str) -> Optional[Dispatch]:
        stmt = (
            select(Dispatch)
            .options(
                selectinload(Dispatch.party),
                selectinload(Dispatch.sales_order),
                selectinload(Dispatch.verifier),
                selectinload(Dispatch.items)
                .selectinload(DispatchItem.packing_record)
                .selectinload(PackingRecord.packing_type),
                selectinload(Dispatch.items)
                .selectinload(DispatchItem.sales_order_item)
                .selectinload(SalesOrderItem.product),
                selectinload(Dispatch.items)
                .selectinload(DispatchItem.sales_order_item)
                .selectinload(SalesOrderItem.thickness),
                selectinload(Dispatch.items)
                .selectinload(DispatchItem.sales_order_item)
                .selectinload(SalesOrderItem.density),
            )
            .where(Dispatch.id == dispatch_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        party_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[List[Dispatch], int]:
        stmt = (
            select(Dispatch)
            .options(
                selectinload(Dispatch.party),
                selectinload(Dispatch.sales_order),
                selectinload(Dispatch.items)
                .selectinload(DispatchItem.sales_order_item)
                .selectinload(SalesOrderItem.product),
            )
        )
        count_stmt = select(func.count()).select_from(Dispatch)

        if party_id:
            stmt = stmt.where(Dispatch.party_id == party_id)
            count_stmt = count_stmt.where(Dispatch.party_id == party_id)

        if status:
            stmt = stmt.where(Dispatch.status == status)
            count_stmt = count_stmt.where(Dispatch.status == status)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Dispatch.created_at.desc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total
