from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from app.schemas.party import PartyResponse
from app.schemas.user import UserSummary


class LeadActivityCreate(BaseModel):
    activity_type: str
    title: str
    description: Optional[str] = None
    old_status: Optional[str] = None
    new_status: Optional[str] = None


class LeadActivityResponse(BaseModel):
    id: str
    lead_id: str
    user_id: Optional[str] = None
    activity_type: str
    title: str
    description: Optional[str] = None
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    created_at: datetime
    user: Optional[UserSummary] = None

    class Config:
        from_attributes = True


class LeadCreate(BaseModel):
    customer_name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=8)
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    address: Optional[str] = None
    source: str = "WEBSITE"
    user_type: Optional[str] = "HOMEOWNER"
    project_type: Optional[str] = None
    product_interest: Optional[str] = None
    estimated_quantity: Optional[Decimal] = None
    estimated_value: Optional[Decimal] = None
    requirements_summary: Optional[str] = None
    assigned_dealer_id: Optional[str] = None
    extra_metadata: Optional[Any] = None


class LeadUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    user_type: Optional[str] = None
    project_type: Optional[str] = None
    product_interest: Optional[str] = None
    estimated_quantity: Optional[Decimal] = None
    estimated_value: Optional[Decimal] = None
    requirements_summary: Optional[str] = None
    assigned_dealer_id: Optional[str] = None
    assigned_sales_rep_id: Optional[str] = None
    lost_reason: Optional[str] = None


class LeadResponse(BaseModel):
    id: str
    lead_number: str
    customer_name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    address: Optional[str] = None
    source: str
    status: str
    priority: str
    user_type: Optional[str] = None
    project_type: Optional[str] = None
    product_interest: Optional[str] = None
    estimated_quantity: Optional[Decimal] = None
    estimated_value: Optional[Decimal] = None
    required_date: Optional[datetime] = None
    requirements_summary: Optional[str] = None
    assigned_dealer_id: Optional[str] = None
    assigned_sales_rep_id: Optional[str] = None
    assigned_at: Optional[datetime] = None
    converted_to_party_id: Optional[str] = None
    converted_to_order_id: Optional[str] = None
    converted_at: Optional[datetime] = None
    lost_reason: Optional[str] = None
    assigned_dealer: Optional[PartyResponse] = None
    assigned_sales_rep: Optional[UserSummary] = None
    activities: List[LeadActivityResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CRMDashboardSummary(BaseModel):
    total_leads: int
    new_leads: int
    contacted_leads: int
    qualified_leads: int
    quoted_leads: int
    negotiation_leads: int
    won_leads: int
    lost_leads: int
    conversion_rate_percentage: float
    pipeline_value_inr: float
