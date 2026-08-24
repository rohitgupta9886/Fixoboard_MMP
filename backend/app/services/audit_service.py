from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.repositories.audit_repository import AuditRepository


class AuditService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AuditRepository(session)

    async def log_action(
        self,
        user_id: Optional[str],
        action: str,
        entity_name: str,
        entity_id: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_name=entity_name,
            entity_id=str(entity_id),
            old_values=old_values,
            new_values=new_values,
            extra_metadata=extra_metadata,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return await self.repo.create(audit_log)
