from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel
from app.schemas.user import UserSummary


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    entity_name: str
    entity_id: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    user: Optional[UserSummary] = None

    class Config:
        from_attributes = True
