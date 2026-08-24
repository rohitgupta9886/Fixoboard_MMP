from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.production_memo import (
    ProductionMemoAssignMachine,
    ProductionMemoCreate,
    ProductionMemoResponse,
)
from app.services.production_memo_service import ProductionMemoService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ProductionMemoResponse])
async def list_production_memos(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    machine_id: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionMemoService(db)
    skip = (page - 1) * page_size
    memos, total = await service.get_memos(
        skip=skip, limit=page_size, status=status, machine_id=machine_id, priority=priority
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[ProductionMemoResponse.model_validate(m) for m in memos],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.get("/{memo_id}", response_model=ApiResponse[ProductionMemoResponse])
async def get_production_memo(
    memo_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionMemoService(db)
    memo = await service.get_memo_by_id(memo_id)
    return ApiResponse(data=ProductionMemoResponse.model_validate(memo))


@router.post("", response_model=ApiResponse[ProductionMemoResponse])
async def create_production_memo(
    data: ProductionMemoCreate,
    current_user: User = Depends(require_permission("production:plan")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionMemoService(db)
    memo = await service.create_memo(data, user_id=current_user.id)
    return ApiResponse(data=ProductionMemoResponse.model_validate(memo), message="Production Memo created successfully")


@router.post("/{memo_id}/assign-machine", response_model=ApiResponse[ProductionMemoResponse])
async def assign_machine(
    memo_id: str,
    data: ProductionMemoAssignMachine,
    current_user: User = Depends(require_permission("production:plan")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionMemoService(db)
    memo = await service.assign_machine(memo_id, machine_id=data.machine_id, user_id=current_user.id)
    return ApiResponse(data=ProductionMemoResponse.model_validate(memo), message="Machine assigned to Production Memo")


@router.post("/{memo_id}/release", response_model=ApiResponse[ProductionMemoResponse])
async def release_production_memo(
    memo_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionMemoService(db)
    memo = await service.release_memo(memo_id, user_id=current_user.id)
    return ApiResponse(data=ProductionMemoResponse.model_validate(memo), message="Production Memo released to shop floor")
