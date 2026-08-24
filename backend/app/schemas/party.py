from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr


class PartyCreate(BaseModel):
    party_code: str
    party_name: str
    contact_person: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    billing_address: str
    shipping_address: str
    gst_number: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Decimal = Decimal("0.00")


class PartyUpdate(BaseModel):
    party_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    gst_number: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    is_active: Optional[bool] = None


class PartyResponse(BaseModel):
    id: str
    party_code: str
    party_name: str
    contact_person: Optional[str] = None
    phone: str
    email: Optional[str] = None
    billing_address: str
    shipping_address: str
    gst_number: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
