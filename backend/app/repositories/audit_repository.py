from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditLog
from app.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(AuditLog, session)

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        entity_name: Optional[str] = None,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> tuple[List[AuditLog], int]:
        stmt = select(AuditLog).options(selectinload(AuditLog.user))
        count_stmt = select(func.count()).select_from(AuditLog)

        if entity_name:
            stmt = stmt.where(AuditLog.entity_name == entity_name)
            count_stmt = count_stmt.where(AuditLog.entity_name == entity_name)

        if entity_id:
            stmt = stmt.where(AuditLog.entity_id == entity_id)
            count_stmt = count_stmt.where(AuditLog.entity_id == entity_id)

        if user_id:
            stmt = stmt.where(AuditLog.user_id == user_id)
            count_stmt = count_stmt.where(AuditLog.user_id == user_id)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all()), total
