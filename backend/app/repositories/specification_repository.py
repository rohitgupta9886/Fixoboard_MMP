from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.specification import Density, PackingType, ProductFinish, ProductSize, Thickness
from app.repositories.base import BaseRepository


class ThicknessRepository(BaseRepository[Thickness]):
    def __init__(self, session: AsyncSession):
        super().__init__(Thickness, session)

    async def get_all_active(self) -> List[Thickness]:
        stmt = select(Thickness).where(Thickness.is_active == True).order_by(Thickness.value_mm.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())


class DensityRepository(BaseRepository[Density]):
    def __init__(self, session: AsyncSession):
        super().__init__(Density, session)

    async def get_all_active(self) -> List[Density]:
        stmt = select(Density).where(Density.is_active == True).order_by(Density.value_g_cm3.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())


class ProductSizeRepository(BaseRepository[ProductSize]):
    def __init__(self, session: AsyncSession):
        super().__init__(ProductSize, session)

    async def get_all_active(self) -> List[ProductSize]:
        stmt = select(ProductSize).where(ProductSize.is_active == True).order_by(ProductSize.length_mm.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())


class ProductFinishRepository(BaseRepository[ProductFinish]):
    def __init__(self, session: AsyncSession):
        super().__init__(ProductFinish, session)

    async def get_all_active(self) -> List[ProductFinish]:
        stmt = select(ProductFinish).where(ProductFinish.is_active == True).order_by(ProductFinish.name.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())


class PackingTypeRepository(BaseRepository[PackingType]):
    def __init__(self, session: AsyncSession):
        super().__init__(PackingType, session)

    async def get_all_active(self) -> List[PackingType]:
        stmt = select(PackingType).where(PackingType.is_active == True).order_by(PackingType.name.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
