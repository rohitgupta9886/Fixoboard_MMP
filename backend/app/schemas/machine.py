from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from app.domain.enums import MachineStatus


class MachineCreate(BaseModel):
    machine_code: str
    machine_name: str
    line_name: str
    machine_type: str
    rated_capacity_hourly: Decimal = Decimal("0.00")
    location: Optional[str] = None
    description: Optional[str] = None


class MachineUpdate(BaseModel):
    machine_name: Optional[str] = None
    line_name: Optional[str] = None
    rated_capacity_hourly: Optional[Decimal] = None
    status: Optional[MachineStatus] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MachineStatusUpdate(BaseModel):
    status: MachineStatus


class MachineResponse(BaseModel):
    id: str
    machine_code: str
    machine_name: str
    line_name: str
    machine_type: str
    rated_capacity_hourly: Decimal
    status: str
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
