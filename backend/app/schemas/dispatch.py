from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.packing import PackingRecordResponse
from app.schemas.party import PartyResponse
from app.schemas.sales_order import SalesOrderItemResponse, SalesOrderResponse
from app.schemas.user import UserSummary


class DispatchItemCreate(BaseModel):
    packing_id: Optional[str] = None
    sales_order_item_id: str
    dispatched_quantity: Decimal = Field(..., gt=0)
    package_count: int = Field(default=1, gt=0)


class DispatchItemResponse(BaseModel):
    id: str
    dispatch_id: str
    packing_id: str
    sales_order_item_id: str
    dispatched_quantity: Decimal
    package_count: int
    packing_record: Optional[PackingRecordResponse] = None
    sales_order_item: Optional[SalesOrderItemResponse] = None

    class Config:
        from_attributes = True


class DispatchCreate(BaseModel):
    party_id: str
    sales_order_id: str
    vehicle_number: str
    driver_name: str
    driver_phone: Optional[str] = None
    transporter: Optional[str] = None
    lr_number: Optional[str] = None
    dispatch_date: date = Field(default_factory=date.today)
    remarks: Optional[str] = None
    items: List[DispatchItemCreate] = Field(..., min_length=1)


class DispatchResponse(BaseModel):
    id: str
    dispatch_number: str
    party_id: str
    sales_order_id: str
    vehicle_number: str
    driver_name: str
    driver_phone: Optional[str] = None
    transporter: Optional[str] = None
    lr_number: Optional[str] = None
    dispatch_date: date
    status: str
    remarks: Optional[str] = None
    verified_by: Optional[str] = None
    gate_out_time: Optional[datetime] = None
    party: Optional[PartyResponse] = None
    sales_order: Optional[SalesOrderResponse] = None
    verifier: Optional[UserSummary] = None
    items: List[DispatchItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
