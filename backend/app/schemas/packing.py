from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.sales_order import SalesOrderItemResponse
from app.schemas.specification import PackingTypeResponse
from app.schemas.user import UserSummary


class PackingRecordCreate(BaseModel):
    sales_order_item_id: str
    production_run_id: Optional[str] = None
    packing_type_id: str
    packed_quantity: Decimal = Field(..., gt=0)
    package_count: int = Field(default=1, gt=0)
    pieces_per_package: Optional[int] = None
    remarks: Optional[str] = None


class PackingRecordResponse(BaseModel):
    id: str
    packing_number: str
    sales_order_item_id: str
    production_run_id: Optional[str] = None
    packing_type_id: str
    packed_quantity: Decimal
    package_count: int
    pieces_per_package: Optional[int] = None
    packed_by: str
    packed_at: datetime
    status: str
    remarks: Optional[str] = None
    sales_order_item: Optional[SalesOrderItemResponse] = None
    packing_type: Optional[PackingTypeResponse] = None
    packer: Optional[UserSummary] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
