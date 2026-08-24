from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.core.exceptions import BusinessRuleException, NotFoundException
from app.core.security import get_password_hash
from app.models.role import Role
from app.models.user import User
from app.repositories.user_repository import RoleRepository, UserRepository
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.user import UserCreate, UserResponse, UserStatusUpdate, UserUpdate
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    role_id: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    skip = (page - 1) * page_size
    users, total = await repo.get_users_list(
        skip=skip, limit=page_size, search=search, is_active=is_active, role_id=role_id
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[UserResponse.model_validate(u) for u in users],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.get("/{user_id}", response_model=ApiResponse[UserResponse])
async def get_user(
    user_id: str,
    current_user: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise NotFoundException(f"User with ID '{user_id}' not found")
    return ApiResponse(data=UserResponse.model_validate(user))


@router.post("", response_model=ApiResponse[UserResponse])
async def create_user(
    data: UserCreate,
    current_user: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    existing_username = await repo.get_by_username(data.username)
    if existing_username:
        raise BusinessRuleException(f"Username '{data.username}' is already taken")

    existing_email = await repo.get_by_email(data.email)
    if existing_email:
        raise BusinessRuleException(f"Email '{data.email}' is already registered")

    user = User(
        username=data.username.strip(),
        email=data.email.strip().lower(),
        full_name=data.full_name.strip(),
        hashed_password=get_password_hash(data.password),
        phone_number=data.phone_number.strip() if data.phone_number else None,
        department=data.department.strip() if data.department else None,
    )
    if data.role_ids:
        role_stmt = select(Role).where(Role.id.in_(data.role_ids))
        roles_res = await db.execute(role_stmt)
        user.roles = list(roles_res.scalars().all())

    saved = await repo.create(user)

    audit_service = AuditService(db)
    await audit_service.log_action(
        user_id=current_user.id,
        action="USER_CREATED",
        entity_name="User",
        entity_id=saved.id,
        new_values={"username": saved.username, "email": saved.email, "full_name": saved.full_name},
    )

    # Re-fetch with loaded relationships
    refetched = await repo.get_by_id(saved.id)
    return ApiResponse(data=UserResponse.model_validate(refetched or saved), message="User created successfully")


@router.put("/{user_id}", response_model=ApiResponse[UserResponse])
async def update_user(
    user_id: str,
    data: UserUpdate,
    current_user: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise NotFoundException(f"User with ID '{user_id}' not found")

    old_values = {
        "email": user.email,
        "full_name": user.full_name,
        "department": user.department,
        "phone_number": user.phone_number,
        "is_active": user.is_active,
    }

    if data.email and data.email.strip().lower() != user.email.lower():
        existing_email = await repo.get_by_email(data.email.strip().lower())
        if existing_email and existing_email.id != user.id:
            raise BusinessRuleException(f"Email '{data.email}' is already in use by another user")
        user.email = data.email.strip().lower()

    if data.full_name is not None:
        user.full_name = data.full_name.strip()

    if data.phone_number is not None:
        user.phone_number = data.phone_number.strip() if data.phone_number else None

    if data.department is not None:
        user.department = data.department.strip() if data.department else None

    if data.is_active is not None:
        if user.id == current_user.id and not data.is_active:
            raise BusinessRuleException("You cannot deactivate your own account")
        user.is_active = data.is_active

    if data.password:
        user.hashed_password = get_password_hash(data.password)

    if data.role_ids is not None:
        if data.role_ids:
            role_stmt = select(Role).where(Role.id.in_(data.role_ids))
            roles_res = await db.execute(role_stmt)
            user.roles = list(roles_res.scalars().all())
        else:
            user.roles = []

    updated = await repo.update(user)

    audit_service = AuditService(db)
    await audit_service.log_action(
        user_id=current_user.id,
        action="USER_UPDATED",
        entity_name="User",
        entity_id=user.id,
        old_values=old_values,
        new_values={
            "email": user.email,
            "full_name": user.full_name,
            "department": user.department,
            "phone_number": user.phone_number,
            "is_active": user.is_active,
        },
    )

    refetched = await repo.get_by_id(user.id)
    return ApiResponse(data=UserResponse.model_validate(refetched or updated), message="User updated successfully")


@router.patch("/{user_id}/status", response_model=ApiResponse[UserResponse])
async def toggle_user_status(
    user_id: str,
    data: UserStatusUpdate,
    current_user: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise NotFoundException(f"User with ID '{user_id}' not found")

    if user.id == current_user.id and not data.is_active:
        raise BusinessRuleException("You cannot deactivate your own account")

    old_status = user.is_active
    user.is_active = data.is_active
    updated = await repo.update(user)

    audit_service = AuditService(db)
    await audit_service.log_action(
        user_id=current_user.id,
        action="USER_STATUS_TOGGLED",
        entity_name="User",
        entity_id=user.id,
        old_values={"is_active": old_status},
        new_values={"is_active": user.is_active},
    )

    refetched = await repo.get_by_id(user.id)
    return ApiResponse(
        data=UserResponse.model_validate(refetched or updated),
        message=f"User {'activated' if data.is_active else 'deactivated'} successfully",
    )


@router.delete("/{user_id}", response_model=ApiResponse[dict])
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise BusinessRuleException("You cannot delete your own account")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise NotFoundException(f"User with ID '{user_id}' not found")

    user_info = {"id": user.id, "username": user.username, "email": user.email, "full_name": user.full_name}

    await repo.delete(user)

    audit_service = AuditService(db)
    await audit_service.log_action(
        user_id=current_user.id,
        action="USER_DELETED",
        entity_name="User",
        entity_id=user_id,
        old_values=user_info,
    )

    return ApiResponse(data={"id": user_id}, message="User deleted successfully")
