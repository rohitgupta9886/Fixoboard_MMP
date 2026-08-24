from typing import List, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.party import Party
from app.repositories.base import BaseRepository


class PartyRepository(BaseRepository[Party]):
    def __init__(self, session: AsyncSession):
        super().__init__(Party, session)

    async def get_by_code(self, code: str) -> Optional[Party]:
        stmt = select(Party).where(Party.party_code == code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[Party], int]:
        stmt = select(Party)
        count_stmt = select(func.count()).select_from(Party)

        if search:
            search_filter = or_(
                Party.party_name.ilike(f"%{search}%"),
                Party.party_code.ilike(f"%{search}%"),
                Party.contact_person.ilike(f"%{search}%"),
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        if is_active is not None:
            stmt = stmt.where(Party.is_active == is_active)
            count_stmt = count_stmt.where(Party.is_active == is_active)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(Party.party_name.asc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total
