from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class PermissionResponse(BaseModel):
    id: str
    code: str
    resource: str
    action: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    permission_ids: List[str] = []


class RoleResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str] = None
    is_system_role: bool
    permissions: List[PermissionResponse]
    created_at: datetime

    class Config:
        from_attributes = True
