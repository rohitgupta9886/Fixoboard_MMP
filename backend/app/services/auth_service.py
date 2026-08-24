from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, UnauthorizedException
from app.core.security import create_access_token, create_refresh_token, decode_token, get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse, UserSummary
from app.services.audit_service import AuditService


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.audit_service = AuditService(session)

    async def authenticate(self, req: LoginRequest, ip_address: Optional[str] = None) -> TokenResponse:
        user = await self.user_repo.get_by_username(req.username)
        if not user or not verify_password(req.password, user.hashed_password):
            raise UnauthorizedException("Invalid username or password")

        if not user.is_active:
            raise UnauthorizedException("User account is inactive. Please contact administrator.")

        role_names = [r.name for r in user.roles]
        permissions = list({p.code for r in user.roles for p in r.permissions})

        access_token = create_access_token(
            subject=user.id,
            roles=role_names,
            permissions=permissions,
        )
        refresh_token = create_refresh_token(subject=user.id)

        user_summary = UserSummary(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            department=user.department,
            is_active=user.is_active,
            roles=role_names,
            permissions=permissions,
        )

        await self.audit_service.log_action(
            user_id=user.id,
            action="USER_LOGIN",
            entity_name="users",
            entity_id=user.id,
            ip_address=ip_address,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_summary,
        )

    async def refresh_access_token(self, refresh_token: str) -> str:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise UnauthorizedException("Invalid token type")
            user_id = payload.get("sub")
        except Exception:
            raise UnauthorizedException("Invalid or expired refresh token")

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        role_names = [r.name for r in user.roles]
        permissions = list({p.code for r in user.roles for p in r.permissions})

        return create_access_token(
            subject=user.id,
            roles=role_names,
            permissions=permissions,
        )
