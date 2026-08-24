from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class SmartQuoteItemRequest(BaseModel):
    application_area: str  # Kitchen Carcass, Kitchen Shutters, Bathroom Vanities, Wardrobes, Wall Paneling, Doors, Shuttering
    product_category: str  # PVC_WPC_PLY, WPC_DOORS, PRELAM_PLY, DOOR_FRAMES, PVC_MARBLE
    thickness_mm: float
    density_g_cm3: Optional[float] = 0.50
    approx_length_ft: Optional[float] = None
    approx_height_ft: Optional[float] = None
    sheet_count: int = Field(default=1, gt=0)


class SmartQuoteRequest(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    city: str
    pin_code: Optional[str] = None
    user_type: str = "HOMEOWNER"  # HOMEOWNER, ARCHITECT, CARPENTER, CONTRACTOR, DEALER
    project_timeline: str = "IMMEDIATE"  # IMMEDIATE, 1_MONTH, 3_MONTHS, PLANNING
    remarks: Optional[str] = None
    items: List[SmartQuoteItemRequest] = Field(..., min_length=1)


class SmartQuoteEstimateResponse(BaseModel):
    lead_id: str
    lead_number: str
    estimated_total_sheets: int
    estimated_subtotal_inr: float
    estimated_tax_inr: float
    estimated_total_inr: float
    assigned_dealer_name: Optional[str] = None
    assigned_dealer_phone: Optional[str] = None
    assigned_dealer_city: Optional[str] = None
    summary_message: str


class DealerLocatorQuery(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    search: Optional[str] = None


class DealerLocatorResponse(BaseModel):
    id: str
    dealer_code: str
    dealer_name: str
    contact_person: Optional[str] = None
    phone: str
    email: Optional[str] = None
    city: str
    state: str
    pin_code: Optional[str] = None
    address: str
    whatsapp_number: Optional[str] = None
    is_stockist: bool = True
    available_categories: List[str] = ["PVC/WPC Ply", "WPC Doors", "Prelam Ply", "Door Frames", "PVC Marble"]


class ProfessionalRegistrationRequest(BaseModel):
    professional_type: str  # ARCHITECT, INTERIOR_DESIGNER, CARPENTER, CONTRACTOR
    full_name: str
    firm_name: Optional[str] = None
    phone: str
    email: Optional[str] = None
    city: str
    state: Optional[str] = None
    experience_years: Optional[int] = 0
    council_registration_number: Optional[str] = None
    request_sample_kit: bool = False
    notes: Optional[str] = None


class ProfessionalResponse(BaseModel):
    id: str
    professional_type: str
    full_name: str
    firm_name: Optional[str] = None
    phone: str
    email: Optional[str] = None
    city: str
    state: Optional[str] = None
    is_verified: bool
    sample_kit_requested: bool
    sample_kit_status: str
    reward_points: int
    created_at: datetime

    class Config:
        from_attributes = True
