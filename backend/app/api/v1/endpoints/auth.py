from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse, UserSummary
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(
    req: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    client_ip = request.client.host if request.client else None
    token_resp = await service.authenticate(req, ip_address=client_ip)
    return ApiResponse(data=token_resp, message="Authentication successful")


@router.post("/refresh", response_model=ApiResponse[dict])
async def refresh_token(
    req: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    new_access_token = await service.refresh_access_token(req.refresh_token)
    return ApiResponse(data={"access_token": new_access_token, "token_type": "bearer"})


@router.get("/me", response_model=ApiResponse[UserSummary])
async def get_me(
    current_user: User = Depends(get_current_user),
):
    role_names = [r.name for r in current_user.roles]
    permissions = list({p.code for r in current_user.roles for p in r.permissions})

    summary = UserSummary(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        department=current_user.department,
        is_active=current_user.is_active,
        roles=role_names,
        permissions=permissions,
    )
    return ApiResponse(data=summary)
