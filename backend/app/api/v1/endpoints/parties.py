from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.party import PartyCreate, PartyResponse, PartyUpdate
from app.services.party_service import PartyService

router = APIRouter()


@router.get("/all", response_model=ApiResponse[List[PartyResponse]])
async def list_all_parties(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PartyService(db)
    parties, _ = await service.get_parties(skip=0, limit=500, is_active=True)
    return ApiResponse(data=[PartyResponse.model_validate(p) for p in parties])


@router.get("", response_model=PaginatedResponse[PartyResponse])
async def list_parties(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PartyService(db)
    skip = (page - 1) * page_size
    parties, total = await service.get_parties(skip=skip, limit=page_size, search=search, is_active=is_active)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[PartyResponse.model_validate(p) for p in parties],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.get("/{party_id}", response_model=ApiResponse[PartyResponse])
async def get_party(
    party_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PartyService(db)
    party = await service.get_party_by_id(party_id)
    return ApiResponse(data=PartyResponse.model_validate(party))


@router.post("", response_model=ApiResponse[PartyResponse])
async def create_party(
    data: PartyCreate,
    current_user: User = Depends(require_permission("parties:create")),
    db: AsyncSession = Depends(get_db),
):
    service = PartyService(db)
    saved = await service.create_party(data, user_id=current_user.id)
    return ApiResponse(data=PartyResponse.model_validate(saved), message="Party created successfully")


@router.put("/{party_id}", response_model=ApiResponse[PartyResponse])
async def update_party(
    party_id: str,
    data: PartyUpdate,
    current_user: User = Depends(require_permission("parties:update")),
    db: AsyncSession = Depends(get_db),
):
    service = PartyService(db)
    updated = await service.update_party(party_id, data, user_id=current_user.id)
    return ApiResponse(data=PartyResponse.model_validate(updated), message="Party updated successfully")
