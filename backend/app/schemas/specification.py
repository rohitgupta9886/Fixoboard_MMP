from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class ThicknessCreate(BaseModel):
    value_mm: Decimal
    display_label: str


class ThicknessResponse(BaseModel):
    id: str
    value_mm: Decimal
    display_label: str
    is_active: bool

    class Config:
        from_attributes = True


class DensityCreate(BaseModel):
    value_g_cm3: Decimal
    display_label: str


class DensityResponse(BaseModel):
    id: str
    value_g_cm3: Decimal
    display_label: str
    is_active: bool

    class Config:
        from_attributes = True


class ProductSizeCreate(BaseModel):
    length_mm: Decimal
    width_mm: Decimal
    display_label: str


class ProductSizeResponse(BaseModel):
    id: str
    length_mm: Decimal
    width_mm: Decimal
    display_label: str
    is_active: bool

    class Config:
        from_attributes = True


class ProductFinishCreate(BaseModel):
    name: str


class ProductFinishResponse(BaseModel):
    id: str
    name: str
    is_active: bool

    class Config:
        from_attributes = True


class PackingTypeCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None


class PackingTypeResponse(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
