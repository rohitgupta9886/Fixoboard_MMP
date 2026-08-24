from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.core.database import get_db
from app.models.user import User
from app.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditLogResponse
from app.schemas.common import PaginatedResponse, PaginationMeta

router = APIRouter()


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    entity_name: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("audit:view")),
    db: AsyncSession = Depends(get_db),
):
    repo = AuditRepository(db)
    skip = (page - 1) * page_size
    logs, total = await repo.get_paginated(
        skip=skip, limit=page_size, entity_name=entity_name, entity_id=entity_id, user_id=user_id
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[AuditLogResponse.model_validate(l) for l in logs],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )
