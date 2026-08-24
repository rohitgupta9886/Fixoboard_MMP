from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.specification import (
    DensityCreate,
    DensityResponse,
    PackingTypeCreate,
    PackingTypeResponse,
    ProductFinishCreate,
    ProductFinishResponse,
    ProductSizeCreate,
    ProductSizeResponse,
    ThicknessCreate,
    ThicknessResponse,
)
from app.services.specification_service import SpecificationService

router = APIRouter()


# Thickness
@router.get("/thicknesses", response_model=ApiResponse[List[ThicknessResponse]])
async def list_thicknesses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SpecificationService(db)
    items = await service.get_thicknesses()
    return ApiResponse(data=[ThicknessResponse.model_validate(t) for t in items])


@router.post("/thicknesses", response_model=ApiResponse[ThicknessResponse])
async def create_thickness(
    data: ThicknessCreate,
    current_user: User = Depends(require_permission("products:create")),
    db: AsyncSession = Depends(get_db),
):
    service = SpecificationService(db)
    t = await service.create_thickness(data)
    return ApiResponse(data=ThicknessResponse.model_validate(t), message="Thickness master created")


# Density
@router.get("/densities", response_model=ApiResponse[List[DensityResponse]])
async def list_densities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SpecificationService(db)
    items = await service.get_densities()
    return ApiResponse(data=[DensityResponse.model_validate(d) for d in items])


@router.post("/densities", response_model=ApiResponse[DensityResponse])
async def create_density(
    data: DensityCreate,
    current_user: User = Depends(require_permission("products:create")),
    db: AsyncSession = Depends(get_db),
):
    service = SpecificationService(db)
    d = await service.create_density(data)
    return ApiResponse(data=DensityResponse.model_validate(d), message="Density master created")


# Sizes
@router.get("/sizes", response_model=ApiResponse[List[ProductSizeResponse]])
async def list_sizes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SpecificationService(db)
    items = await service.get_sizes()
    return ApiResponse(data=[ProductSizeResponse.model_validate(s) for s in items])


@router.post("/sizes", response_model=ApiResponse[ProductSizeResponse])
async def create_size(
    data: ProductSizeCreate,
    current_user: User = Depends(require_permission("products:create")),
    db: AsyncSession = Depends(get_db),
):
    service = SpecificationService(db)
    s = await service.create_size(data)
    return ApiResponse(data=ProductSizeResponse.model_validate(s), message="Size master created")


# Finishes
@router.get("/finishes", response_model=ApiResponse[List[ProductFinishResponse]])
async def list_finishes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SpecificationService(db)
    items = await service.get_finishes()
    return ApiResponse(data=[ProductFinishResponse.model_validate(f) for f in items])


# Packing Types
@router.get("/packing-types", response_model=ApiResponse[List[PackingTypeResponse]])
async def list_packing_types(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SpecificationService(db)
    items = await service.get_packing_types()
    return ApiResponse(data=[PackingTypeResponse.model_validate(pt) for pt in items])


@router.post("/packing-types", response_model=ApiResponse[PackingTypeResponse])
async def create_packing_type(
    data: PackingTypeCreate,
    current_user: User = Depends(require_permission("products:create")),
    db: AsyncSession = Depends(get_db),
):
    service = SpecificationService(db)
    pt = await service.create_packing_type(data)
    return ApiResponse(data=PackingTypeResponse.model_validate(pt), message="Packing type created")
