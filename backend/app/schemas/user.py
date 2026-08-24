from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, EmailStr, field_validator


class RoleSummary(BaseModel):
    id: str
    name: str
    display_name: str

    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    department: Optional[str] = None
    is_active: bool
    roles: List[str] = []
    permissions: List[str] = []

    @field_validator("roles", mode="before")
    @classmethod
    def validate_roles(cls, v: Any) -> List[str]:
        if not v:
            return []
        result = []
        for item in v:
            if hasattr(item, "name"):
                result.append(item.name)
            elif isinstance(item, dict) and "name" in item:
                result.append(item["name"])
            elif isinstance(item, str):
                result.append(item)
            else:
                result.append(str(item))
        return result

    @field_validator("permissions", mode="before")
    @classmethod
    def validate_permissions(cls, v: Any) -> List[str]:
        if not v:
            return []
        result = []
        for item in v:
            if hasattr(item, "name"):
                result.append(item.name)
            elif isinstance(item, dict) and "name" in item:
                result.append(item["name"])
            elif isinstance(item, str):
                result.append(item)
            else:
                result.append(str(item))
        return result

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    phone_number: Optional[str] = None
    department: Optional[str] = None
    role_ids: List[str] = []


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[str]] = None
    password: Optional[str] = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    roles: List[RoleSummary] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
