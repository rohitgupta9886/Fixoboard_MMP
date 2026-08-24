from typing import List, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.sales_order import SalesOrder, SalesOrderItem
from app.repositories.base import BaseRepository


class SalesOrderRepository(BaseRepository[SalesOrder]):
    def __init__(self, session: AsyncSession):
        super().__init__(SalesOrder, session)

    async def get_by_id_detailed(self, order_id: str) -> Optional[SalesOrder]:
        stmt = (
            select(SalesOrder)
            .options(
                selectinload(SalesOrder.party),
                selectinload(SalesOrder.items).selectinload(SalesOrderItem.product),
                selectinload(SalesOrder.items).selectinload(SalesOrderItem.thickness),
                selectinload(SalesOrder.items).selectinload(SalesOrderItem.density),
                selectinload(SalesOrder.items).selectinload(SalesOrderItem.size),
                selectinload(SalesOrder.items).selectinload(SalesOrderItem.finish),
            )
            .where(SalesOrder.id == order_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_order_number(self, order_number: str) -> Optional[SalesOrder]:
        stmt = select(SalesOrder).where(SalesOrder.order_number == order_number)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        party_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
    ) -> tuple[List[SalesOrder], int]:
        stmt = (
            select(SalesOrder)
            .options(
                selectinload(SalesOrder.party),
                selectinload(SalesOrder.items).selectinload(SalesOrderItem.product),
                selectinload(SalesOrder.items).selectinload(SalesOrderItem.thickness),
                selectinload(SalesOrder.items).selectinload(SalesOrderItem.density),
            )
        )
        count_stmt = select(func.count()).select_from(SalesOrder)

        if party_id:
            stmt = stmt.where(SalesOrder.party_id == party_id)
            count_stmt = count_stmt.where(SalesOrder.party_id == party_id)

        if status:
            stmt = stmt.where(SalesOrder.status == status)
            count_stmt = count_stmt.where(SalesOrder.status == status)

        if priority:
            stmt = stmt.where(SalesOrder.priority == priority)
            count_stmt = count_stmt.where(SalesOrder.priority == priority)

        if search:
            search_filter = or_(
                SalesOrder.order_number.ilike(f"%{search}%"),
                SalesOrder.customer_po_number.ilike(f"%{search}%"),
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(SalesOrder.created_at.desc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total


class SalesOrderItemRepository(BaseRepository[SalesOrderItem]):
    def __init__(self, session: AsyncSession):
        super().__init__(SalesOrderItem, session)

    async def get_by_id_detailed(self, item_id: str) -> Optional[SalesOrderItem]:
        stmt = (
            select(SalesOrderItem)
            .options(
                selectinload(SalesOrderItem.product),
                selectinload(SalesOrderItem.thickness),
                selectinload(SalesOrderItem.density),
                selectinload(SalesOrderItem.size),
                selectinload(SalesOrderItem.finish),
                selectinload(SalesOrderItem.sales_order),
            )
            .where(SalesOrderItem.id == item_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()
