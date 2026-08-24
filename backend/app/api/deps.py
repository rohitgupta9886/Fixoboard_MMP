from typing import Callable, Generator
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

get_session = get_db
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.models.user import User
from app.repositories.user_repository import UserRepository

security = HTTPBearer(auto_error=False)


async def get_current_user(
    auth_header: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not auth_header:
        raise UnauthorizedException("Authentication header missing")

    token = auth_header.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise UnauthorizedException("Invalid token type")
        user_id: str = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload")
    except Exception:
        raise UnauthorizedException("Invalid or expired access token")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("User account is inactive")

    return user


def require_permission(permission_code: str) -> Callable:
    async def permission_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.is_superuser:
            return current_user

        user_permissions = {p.code for r in current_user.roles for p in r.permissions}
        if permission_code not in user_permissions:
            raise ForbiddenException(f"Missing required permission: '{permission_code}'")
        return current_user

    return permission_checker
