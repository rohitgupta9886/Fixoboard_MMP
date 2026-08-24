from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.dispatch import DispatchCreate, DispatchResponse
from app.services.dispatch_service import DispatchService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[DispatchResponse])
async def list_dispatches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    party_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DispatchService(db)
    skip = (page - 1) * page_size
    dispatches, total = await service.get_dispatches(skip=skip, limit=page_size, party_id=party_id, status=status)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[DispatchResponse.model_validate(d) for d in dispatches],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.get("/{dispatch_id}", response_model=ApiResponse[DispatchResponse])
async def get_dispatch(
    dispatch_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DispatchService(db)
    dispatch = await service.get_dispatch_by_id(dispatch_id)
    return ApiResponse(data=DispatchResponse.model_validate(dispatch))


@router.post("", response_model=ApiResponse[DispatchResponse])
async def create_dispatch(
    data: DispatchCreate,
    current_user: User = Depends(require_permission("dispatch:create")),
    db: AsyncSession = Depends(get_db),
):
    service = DispatchService(db)
    dispatch = await service.create_dispatch(data, user_id=current_user.id)
    return ApiResponse(data=DispatchResponse.model_validate(dispatch), message="Dispatch record created successfully")


@router.post("/{dispatch_id}/confirm", response_model=ApiResponse[DispatchResponse])
@router.post("/{dispatch_id}/gate-out", response_model=ApiResponse[DispatchResponse])
async def confirm_dispatch(
    dispatch_id: str,
    current_user: User = Depends(require_permission("dispatch:confirm")),
    db: AsyncSession = Depends(get_db),
):
    service = DispatchService(db)
    dispatch = await service.confirm_dispatch(dispatch_id, user_id=current_user.id)
    return ApiResponse(data=DispatchResponse.model_validate(dispatch), message="Dispatch gate-out confirmed successfully")


@router.get("/{dispatch_id}/pdf")
async def download_dispatch_pdf(
    dispatch_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DispatchService(db)
    pdf_bytes = await service.generate_pdf(dispatch_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=dispatch_{dispatch_id}.pdf"},
    )
