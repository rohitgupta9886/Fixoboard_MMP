from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.domain.enums import OrderPriority, ProductionMemoStatus
from app.schemas.machine import MachineResponse
from app.schemas.sales_order import SalesOrderItemResponse, SalesOrderResponse


class ProductionMemoCreate(BaseModel):
    sales_order_id: str
    sales_order_item_id: str
    planned_quantity: Decimal = Field(..., gt=0)
    priority: OrderPriority = OrderPriority.NORMAL
    required_date: date
    target_machine_id: Optional[str] = None
    remarks: Optional[str] = None


class ProductionMemoAssignMachine(BaseModel):
    machine_id: str


class ProductionMemoResponse(BaseModel):
    id: str
    memo_number: str
    sales_order_id: str
    sales_order_item_id: str
    planned_quantity: Decimal
    priority: str
    required_date: date
    target_machine_id: Optional[str] = None
    production_stage: str
    status: str
    remarks: Optional[str] = None
    approved_by: Optional[str] = None
    assigned_by: Optional[str] = None
    sales_order: Optional[SalesOrderResponse] = None
    sales_order_item: Optional[SalesOrderItemResponse] = None
    target_machine: Optional[MachineResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
