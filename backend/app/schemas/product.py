from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProductCategoryResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class ProductCategoryCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class ProductCreate(BaseModel):
    category_id: str
    product_code: str
    product_name: str
    unit: str = "Sheets"
    description: Optional[str] = None


class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    product_name: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: str
    category_id: str
    product_code: str
    product_name: str
    unit: str
    description: Optional[str] = None
    is_active: bool
    category: Optional[ProductCategoryResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
