from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class DashboardKpis(BaseModel):
    total_orders: int
    open_orders: int
    pending_production_memos: int
    in_progress_runs: int
    pending_packing: int
    ready_for_dispatch: int
    dispatched_count: int
    delayed_orders: int
    today_produced_quantity: Decimal
    today_waste_kg: Decimal


class DemandByParty(BaseModel):
    party_id: str
    party_name: str
    party_code: str
    total_ordered_quantity: Decimal
    total_produced_quantity: Decimal
    total_packed_quantity: Decimal
    total_dispatched_quantity: Decimal
    pending_quantity: Decimal


class DemandByThickness(BaseModel):
    thickness_id: str
    thickness_value: Decimal
    display_label: str
    total_ordered_quantity: Decimal
    total_produced_quantity: Decimal
    pending_quantity: Decimal


class DemandByDensity(BaseModel):
    density_id: str
    density_value: Decimal
    display_label: str
    total_ordered_quantity: Decimal
    total_produced_quantity: Decimal
    pending_quantity: Decimal


class LineStatusItem(BaseModel):
    line_id: str
    name: str
    machine_code: str
    machine_type: str
    status: str
    order_no: Optional[str] = "—"
    party_name: Optional[str] = "—"
    product: Optional[str] = "Ready for Job"
    good_output: Decimal = Decimal("0.00")
    target: Decimal = Decimal("0.00")
    efficiency: int = 0
    speed: str = "—"
    operator: str = "—"
    targetTime: str = "—"


class PipelineStageItem(BaseModel):
    id: str
    label: str
    count: int
    description: str
    color: str


class DashboardSummary(BaseModel):
    kpis: DashboardKpis
    demand_by_party: List[DemandByParty]
    demand_by_thickness: List[DemandByThickness]
    demand_by_density: List[DemandByDensity]
    line_status: List[LineStatusItem] = []
    pipeline_stages: List[PipelineStageItem] = []
