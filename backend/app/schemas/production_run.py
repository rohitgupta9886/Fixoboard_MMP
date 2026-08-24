from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.machine import MachineResponse
from app.schemas.user import UserSummary


class ProductionRunStart(BaseModel):
    production_memo_id: str
    machine_id: Optional[str] = None
    shift: str = "Shift A (08:00 - 16:00)"
    planned_quantity: Optional[Decimal] = None
    remarks: Optional[str] = None


class ProductionRunPause(BaseModel):
    rejection_reason: Optional[str] = None
    remarks: Optional[str] = None


class ProductionRunComplete(BaseModel):
    good_quantity: Decimal = Field(..., ge=0)
    rejected_quantity: Decimal = Field(default=Decimal("0.00"), ge=0)
    waste_kg: Decimal = Field(default=Decimal("0.00"), ge=0)
    rejection_reason: Optional[str] = None
    remarks: Optional[str] = None


class ProductionRunOutputLog(BaseModel):
    good_quantity: Decimal = Field(default=Decimal("0.00"), ge=0)
    rejected_quantity: Decimal = Field(default=Decimal("0.00"), ge=0)
    scrap_weight_kg: Decimal = Field(default=Decimal("0.00"), ge=0)
    defect_reason: Optional[str] = None
    remarks: Optional[str] = None


class ProductionRunResponse(BaseModel):
    id: str
    production_memo_id: str
    machine_id: str
    operator_id: str
    shift: str
    start_time: datetime
    end_time: Optional[datetime] = None
    planned_quantity: Decimal
    good_quantity: Decimal
    rejected_quantity: Decimal
    waste_kg: Decimal
    status: str
    rejection_reason: Optional[str] = None
    remarks: Optional[str] = None
    machine: Optional[MachineResponse] = None
    operator: Optional[UserSummary] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
