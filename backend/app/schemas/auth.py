from typing import Any, List, Optional
from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


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


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserSummary


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
