from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Permission, Role
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_id(self, user_id: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(
                selectinload(User.roles).selectinload(Role.permissions)
            )
            .where(User.id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(
                selectinload(User.roles).selectinload(Role.permissions)
            )
            .where(User.username == username)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_users_list(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        role_id: Optional[str] = None,
    ) -> tuple[List[User], int]:
        filters = []
        if search:
            s = f"%{search.strip()}%"
            from sqlalchemy import or_
            filters.append(or_(User.full_name.ilike(s), User.username.ilike(s), User.email.ilike(s), User.department.ilike(s)))
        if is_active is not None:
            filters.append(User.is_active == is_active)
        if role_id:
            filters.append(User.roles.any(Role.id == role_id))

        count_stmt = select(func.count(func.distinct(User.id))).select_from(User)
        if role_id:
            count_stmt = count_stmt.join(User.roles)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = select(User).options(selectinload(User.roles).selectinload(Role.permissions)).order_by(User.created_at.desc())
        if filters:
            stmt = stmt.where(*filters)
        stmt = stmt.offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total


class RoleRepository(BaseRepository[Role]):
    def __init__(self, session: AsyncSession):
        super().__init__(Role, session)

    async def get_by_name(self, name: str) -> Optional[Role]:
        stmt = select(Role).options(selectinload(Role.permissions)).where(Role.name == name)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_all_roles(self) -> List[Role]:
        stmt = select(Role).options(selectinload(Role.permissions))
        res = await self.session.execute(stmt)
        return list(res.scalars().all())


class PermissionRepository(BaseRepository[Permission]):
    def __init__(self, session: AsyncSession):
        super().__init__(Permission, session)

    async def get_all_permissions(self) -> List[Permission]:
        stmt = select(Permission)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
