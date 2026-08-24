from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.party import PartyResponse
from app.schemas.product import ProductResponse
from app.schemas.specification import DensityResponse, ThicknessResponse
from app.schemas.user import UserSummary


class QuoteItemCreate(BaseModel):
    product_id: Optional[str] = None
    thickness_id: Optional[str] = None
    density_id: Optional[str] = None
    item_description: str
    quantity: Decimal = Field(..., gt=0)
    unit: str = "Sheets"
    unit_price: Decimal = Field(..., ge=0)
    remarks: Optional[str] = None


class QuoteItemResponse(BaseModel):
    id: str
    quote_id: str
    product_id: Optional[str] = None
    thickness_id: Optional[str] = None
    density_id: Optional[str] = None
    item_description: str
    quantity: Decimal
    unit: str
    unit_price: Decimal
    total_price: Decimal
    remarks: Optional[str] = None
    product: Optional[ProductResponse] = None
    thickness: Optional[ThicknessResponse] = None
    density: Optional[DensityResponse] = None

    class Config:
        from_attributes = True


class QuoteCreate(BaseModel):
    lead_id: Optional[str] = None
    party_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    project_location: Optional[str] = None
    discount_amount: Decimal = Decimal("0.00")
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    items: List[QuoteItemCreate] = Field(..., min_length=1)


class QuoteUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    project_location: Optional[str] = None
    discount_amount: Optional[Decimal] = None
    status: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[QuoteItemCreate]] = None


class QuoteResponse(BaseModel):
    id: str
    quote_number: str
    lead_id: Optional[str] = None
    party_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    project_location: Optional[str] = None
    subtotal_amount: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    valid_until: Optional[datetime] = None
    status: str
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    party: Optional[PartyResponse] = None
    creator: Optional[UserSummary] = None
    items: List[QuoteItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
