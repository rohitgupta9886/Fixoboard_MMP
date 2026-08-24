from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.core.database import get_db
from app.models.user import User
from app.repositories.user_repository import PermissionRepository, RoleRepository
from app.schemas.common import ApiResponse
from app.schemas.role import PermissionResponse, RoleResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[List[RoleResponse]])
async def list_roles(
    current_user: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
):
    repo = RoleRepository(db)
    roles = await repo.get_all_roles()
    return ApiResponse(data=[RoleResponse.model_validate(r) for r in roles])


@router.get("/permissions", response_model=ApiResponse[List[PermissionResponse]])
async def list_permissions(
    current_user: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
):
    repo = PermissionRepository(db)
    perms = await repo.get_all_permissions()
    return ApiResponse(data=[PermissionResponse.model_validate(p) for p in perms])
