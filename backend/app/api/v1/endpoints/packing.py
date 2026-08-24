from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.packing import PackingRecordCreate, PackingRecordResponse
from app.services.packing_service import PackingService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PackingRecordResponse])
async def list_packing_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sales_order_item_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PackingService(db)
    skip = (page - 1) * page_size
    records, total = await service.get_packing_records(
        skip=skip, limit=page_size, sales_order_item_id=sales_order_item_id, status=status
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[PackingRecordResponse.model_validate(p) for p in records],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.get("/{packing_id}", response_model=ApiResponse[PackingRecordResponse])
async def get_packing_record(
    packing_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PackingService(db)
    record = await service.get_packing_by_id(packing_id)
    return ApiResponse(data=PackingRecordResponse.model_validate(record))


@router.post("", response_model=ApiResponse[PackingRecordResponse])
async def create_packing_record(
    data: PackingRecordCreate,
    current_user: User = Depends(require_permission("packing:execute")),
    db: AsyncSession = Depends(get_db),
):
    service = PackingService(db)
    record = await service.create_packing_record(data, user_id=current_user.id)
    return ApiResponse(data=PackingRecordResponse.model_validate(record), message="Packing recorded successfully")
