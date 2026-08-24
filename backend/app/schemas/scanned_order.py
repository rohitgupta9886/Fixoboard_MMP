from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from app.schemas.party import PartyResponse
from app.schemas.product import ProductResponse
from app.schemas.sales_order import SalesOrderResponse
from app.schemas.specification import DensityResponse, ThicknessResponse
from app.schemas.user import UserSummary


class ScannedOrderItemCreate(BaseModel):
    raw_item_text: Optional[str] = None
    matched_product_id: Optional[str] = None
    matched_thickness_id: Optional[str] = None
    matched_density_id: Optional[str] = None
    product_name: str
    thickness_label: Optional[str] = None
    density_label: Optional[str] = None
    quantity: Decimal = Field(..., gt=0)
    unit: str = "Sheets"
    confidence_score: Decimal = Decimal("90.00")
    is_ambiguous: bool = False
    ambiguity_options: Optional[List[str]] = None


class ScannedOrderItemResponse(BaseModel):
    id: str
    scanned_order_id: str
    raw_item_text: Optional[str] = None
    matched_product_id: Optional[str] = None
    matched_thickness_id: Optional[str] = None
    matched_density_id: Optional[str] = None
    product_name: str
    thickness_label: Optional[str] = None
    density_label: Optional[str] = None
    quantity: Decimal
    unit: str
    confidence_score: Decimal
    is_ambiguous: bool
    ambiguity_options: Optional[List[str]] = None
    product: Optional[ProductResponse] = None
    thickness: Optional[ThicknessResponse] = None
    density: Optional[DensityResponse] = None

    class Config:
        from_attributes = True


class ScannedOrderCreate(BaseModel):
    image_url: str
    additional_pages: Optional[List[str]] = None
    dealer_id: Optional[str] = None
    raw_extracted_text: Optional[str] = None
    extracted_customer_name: Optional[str] = None
    extracted_customer_phone: Optional[str] = None
    extracted_delivery_location: Optional[str] = None
    extracted_required_date: Optional[str] = None
    extracted_remarks: Optional[str] = None
    overall_confidence: Decimal = Decimal("85.00")
    field_confidence_scores: Optional[Any] = None
    items: List[ScannedOrderItemCreate] = []


class ScannedOrderUpdate(BaseModel):
    extracted_customer_name: Optional[str] = None
    extracted_customer_phone: Optional[str] = None
    extracted_delivery_location: Optional[str] = None
    extracted_required_date: Optional[str] = None
    extracted_remarks: Optional[str] = None
    dealer_id: Optional[str] = None
    status: Optional[str] = None
    human_corrections_log: Optional[Any] = None
    items: Optional[List[ScannedOrderItemCreate]] = None


class ScannedOrderApprove(BaseModel):
    party_id: str
    priority: str = "NORMAL"
    required_date: Optional[str] = None
    remarks: Optional[str] = None


class ScannedOrderResponse(BaseModel):
    id: str
    scan_number: str
    image_url: str
    additional_pages: Optional[List[str]] = None
    uploaded_by: Optional[str] = None
    dealer_id: Optional[str] = None
    status: str
    overall_confidence: Decimal
    ai_model_version: Optional[str] = None
    raw_extracted_text: Optional[str] = None
    extracted_customer_name: Optional[str] = None
    extracted_customer_phone: Optional[str] = None
    extracted_delivery_location: Optional[str] = None
    extracted_required_date: Optional[str] = None
    extracted_remarks: Optional[str] = None
    field_confidence_scores: Optional[Any] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    human_corrections_log: Optional[Any] = None
    converted_sales_order_id: Optional[str] = None
    uploader: Optional[UserSummary] = None
    dealer: Optional[PartyResponse] = None
    reviewer: Optional[UserSummary] = None
    converted_sales_order: Optional[SalesOrderResponse] = None
    items: List[ScannedOrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
