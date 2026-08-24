from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.product import ProductCategoryCreate, ProductCategoryResponse, ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter()


@router.get("/categories", response_model=ApiResponse[List[ProductCategoryResponse]])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    categories = await service.get_categories()
    return ApiResponse(data=[ProductCategoryResponse.model_validate(c) for c in categories])


@router.post("/categories", response_model=ApiResponse[ProductCategoryResponse])
async def create_category(
    data: ProductCategoryCreate,
    current_user: User = Depends(require_permission("products:create")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    cat = await service.create_category(data, user_id=current_user.id)
    return ApiResponse(data=ProductCategoryResponse.model_validate(cat), message="Category created successfully")


@router.get("/all", response_model=ApiResponse[List[ProductResponse]])
async def list_all_products(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    products, _ = await service.get_products(skip=0, limit=500, is_active=True)
    return ApiResponse(data=[ProductResponse.model_validate(p) for p in products])


@router.get("", response_model=PaginatedResponse[ProductResponse])
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    skip = (page - 1) * page_size
    products, total = await service.get_products(
        skip=skip, limit=page_size, category_id=category_id, search=search, is_active=is_active
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[ProductResponse.model_validate(p) for p in products],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.post("", response_model=ApiResponse[ProductResponse])
async def create_product(
    data: ProductCreate,
    current_user: User = Depends(require_permission("products:create")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    product = await service.create_product(data, user_id=current_user.id)
    return ApiResponse(data=ProductResponse.model_validate(product), message="Product created successfully")


@router.put("/{product_id}", response_model=ApiResponse[ProductResponse])
async def update_product(
    product_id: str,
    data: ProductUpdate,
    current_user: User = Depends(require_permission("products:update")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    product = await service.update_product(product_id, data, user_id=current_user.id)
    return ApiResponse(data=ProductResponse.model_validate(product), message="Product updated successfully")
