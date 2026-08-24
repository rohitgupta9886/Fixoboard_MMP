from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.sales_order import SalesOrderCreate, SalesOrderResponse
from app.services.sales_order_service import SalesOrderService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[SalesOrderResponse])
async def list_sales_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    party_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SalesOrderService(db)
    skip = (page - 1) * page_size
    orders, total = await service.get_orders(
        skip=skip, limit=page_size, party_id=party_id, status=status, priority=priority, search=search
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[SalesOrderResponse.model_validate(o) for o in orders],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.get("/{order_id}", response_model=ApiResponse[SalesOrderResponse])
async def get_sales_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SalesOrderService(db)
    order = await service.get_order_by_id(order_id)
    return ApiResponse(data=SalesOrderResponse.model_validate(order))


@router.post("", response_model=ApiResponse[SalesOrderResponse])
async def create_sales_order(
    data: SalesOrderCreate,
    current_user: User = Depends(require_permission("sales_orders:create")),
    db: AsyncSession = Depends(get_db),
):
    service = SalesOrderService(db)
    order = await service.create_order(data, user_id=current_user.id)
    return ApiResponse(data=SalesOrderResponse.model_validate(order), message="Sales Order created in DRAFT state")


@router.post("/{order_id}/submit", response_model=ApiResponse[SalesOrderResponse])
async def submit_sales_order(
    order_id: str,
    current_user: User = Depends(require_permission("sales_orders:submit")),
    db: AsyncSession = Depends(get_db),
):
    service = SalesOrderService(db)
    order = await service.submit_order(order_id, user_id=current_user.id)
    return ApiResponse(data=SalesOrderResponse.model_validate(order), message="Sales Order submitted for approval")


@router.post("/{order_id}/approve", response_model=ApiResponse[SalesOrderResponse])
async def approve_sales_order(
    order_id: str,
    current_user: User = Depends(require_permission("sales_orders:approve")),
    db: AsyncSession = Depends(get_db),
):
    service = SalesOrderService(db)
    order = await service.approve_order(order_id, user_id=current_user.id)
    return ApiResponse(data=SalesOrderResponse.model_validate(order), message="Sales Order approved successfully")


@router.post("/{order_id}/reject", response_model=ApiResponse[SalesOrderResponse])
async def reject_sales_order(
    order_id: str,
    reason: str = Query(..., min_length=2),
    current_user: User = Depends(require_permission("sales_orders:approve")),
    db: AsyncSession = Depends(get_db),
):
    service = SalesOrderService(db)
    order = await service.reject_order(order_id, reason=reason, user_id=current_user.id)
    return ApiResponse(data=SalesOrderResponse.model_validate(order), message="Sales Order rejected")


@router.post("/{order_id}/cancel", response_model=ApiResponse[SalesOrderResponse])
async def cancel_sales_order(
    order_id: str,
    reason: str = Query(..., min_length=2),
    current_user: User = Depends(require_permission("sales_orders:cancel")),
    db: AsyncSession = Depends(get_db),
):
    service = SalesOrderService(db)
    order = await service.cancel_order(order_id, reason=reason, user_id=current_user.id)
    return ApiResponse(data=SalesOrderResponse.model_validate(order), message="Sales Order cancelled")
