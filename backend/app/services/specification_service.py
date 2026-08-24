from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.specification import Density, PackingType, ProductFinish, ProductSize, Thickness
from app.repositories.specification_repository import (
    DensityRepository,
    PackingTypeRepository,
    ProductFinishRepository,
    ProductSizeRepository,
    ThicknessRepository,
)
from app.schemas.specification import (
    DensityCreate,
    PackingTypeCreate,
    ProductFinishCreate,
    ProductSizeCreate,
    ThicknessCreate,
)


class SpecificationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.thickness_repo = ThicknessRepository(session)
        self.density_repo = DensityRepository(session)
        self.size_repo = ProductSizeRepository(session)
        self.finish_repo = ProductFinishRepository(session)
        self.packing_repo = PackingTypeRepository(session)

    # Thickness
    async def get_thicknesses(self) -> List[Thickness]:
        return await self.thickness_repo.get_all_active()

    async def create_thickness(self, data: ThicknessCreate) -> Thickness:
        t = Thickness(value_mm=data.value_mm, display_label=data.display_label)
        return await self.thickness_repo.create(t)

    # Density
    async def get_densities(self) -> List[Density]:
        return await self.density_repo.get_all_active()

    async def create_density(self, data: DensityCreate) -> Density:
        d = Density(value_g_cm3=data.value_g_cm3, display_label=data.display_label)
        return await self.density_repo.create(d)

    # Sizes
    async def get_sizes(self) -> List[ProductSize]:
        return await self.size_repo.get_all_active()

    async def create_size(self, data: ProductSizeCreate) -> ProductSize:
        s = ProductSize(length_mm=data.length_mm, width_mm=data.width_mm, display_label=data.display_label)
        return await self.size_repo.create(s)

    # Finishes
    async def get_finishes(self) -> List[ProductFinish]:
        return await self.finish_repo.get_all_active()

    async def create_finish(self, data: ProductFinishCreate) -> ProductFinish:
        f = ProductFinish(name=data.name.strip())
        return await self.finish_repo.create(f)

    # Packing Types
    async def get_packing_types(self) -> List[PackingType]:
        return await self.packing_repo.get_all_active()

    async def create_packing_type(self, data: PackingTypeCreate) -> PackingType:
        pt = PackingType(code=data.code.strip().upper(), name=data.name.strip(), description=data.description)
        return await self.packing_repo.create(pt)
