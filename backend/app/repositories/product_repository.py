from typing import List, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductCategory
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: AsyncSession):
        super().__init__(Product, session)

    async def get_by_code(self, code: str) -> Optional[Product]:
        stmt = select(Product).options(selectinload(Product.category)).where(Product.product_code == code)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        category_id: Optional[str] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[Product], int]:
        stmt = select(Product).options(selectinload(Product.category))
        count_stmt = select(func.count()).select_from(Product)

        if category_id:
            stmt = stmt.where(Product.category_id == category_id)
            count_stmt = count_stmt.where(Product.category_id == category_id)

        if search:
            search_filter = or_(
                Product.product_name.ilike(f"%{search}%"),
                Product.product_code.ilike(f"%{search}%"),
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        if is_active is not None:
            stmt = stmt.where(Product.is_active == is_active)
            count_stmt = count_stmt.where(Product.is_active == is_active)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Product.product_name.asc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total


class ProductCategoryRepository(BaseRepository[ProductCategory]):
    def __init__(self, session: AsyncSession):
        super().__init__(ProductCategory, session)

    async def get_all_active(self) -> List[ProductCategory]:
        stmt = select(ProductCategory).where(ProductCategory.is_active == True).order_by(ProductCategory.name.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
