from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.domain.enums import OrderPriority, OrderSource, SalesOrderStatus
from app.schemas.party import PartyResponse
from app.schemas.product import ProductResponse
from app.schemas.specification import DensityResponse, ProductFinishResponse, ProductSizeResponse, ThicknessResponse


class SalesOrderItemCreate(BaseModel):
    product_id: str
    thickness_id: str
    density_id: str
    size_id: Optional[str] = None
    finish_id: Optional[str] = None
    ordered_quantity: Decimal = Field(..., gt=0)
    unit: str = "Sheets"
    unit_price: Decimal = Decimal("0.00")
    remarks: Optional[str] = None


class SalesOrderItemResponse(BaseModel):
    id: str
    sales_order_id: str
    product_id: str
    thickness_id: str
    density_id: str
    size_id: Optional[str] = None
    finish_id: Optional[str] = None
    ordered_quantity: Decimal
    produced_quantity: Decimal
    packed_quantity: Decimal
    dispatched_quantity: Decimal
    unit: str
    unit_price: Decimal
    remarks: Optional[str] = None
    product: Optional[ProductResponse] = None
    thickness: Optional[ThicknessResponse] = None
    density: Optional[DensityResponse] = None
    size: Optional[ProductSizeResponse] = None
    finish: Optional[ProductFinishResponse] = None

    class Config:
        from_attributes = True


class SalesOrderCreate(BaseModel):
    party_id: str
    order_source: OrderSource = OrderSource.MANUAL
    customer_po_number: Optional[str] = None
    order_date: date = Field(default_factory=date.today)
    required_date: date
    priority: OrderPriority = OrderPriority.NORMAL
    remarks: Optional[str] = None
    attachment_id: Optional[str] = None
    items: List[SalesOrderItemCreate] = Field(..., min_length=1)


class SalesOrderUpdate(BaseModel):
    order_source: Optional[OrderSource] = None
    customer_po_number: Optional[str] = None
    required_date: Optional[date] = None
    priority: Optional[OrderPriority] = None
    remarks: Optional[str] = None
    attachment_id: Optional[str] = None
    items: Optional[List[SalesOrderItemCreate]] = None


class SalesOrderResponse(BaseModel):
    id: str
    order_number: str
    party_id: str
    order_source: str
    customer_po_number: Optional[str] = None
    order_date: date
    required_date: date
    priority: str
    status: str
    remarks: Optional[str] = None
    attachment_id: Optional[str] = None
    total_quantity: Decimal
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    party: Optional[PartyResponse] = None
    items: List[SalesOrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
