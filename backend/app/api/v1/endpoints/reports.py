from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.common import ApiResponse
from app.schemas.dashboard import DemandByDensity, DemandByParty, DemandByThickness

router = APIRouter()


@router.get("/demand/party", response_model=ApiResponse[List[DemandByParty]])
async def get_party_demand(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DashboardRepository(db)
    summary = await repo.get_dashboard_summary()
    return ApiResponse(data=summary.demand_by_party)


@router.get("/demand/thickness", response_model=ApiResponse[List[DemandByThickness]])
async def get_thickness_demand(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DashboardRepository(db)
    summary = await repo.get_dashboard_summary()
    return ApiResponse(data=summary.demand_by_thickness)


@router.get("/demand/density", response_model=ApiResponse[List[DemandByDensity]])
async def get_density_demand(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DashboardRepository(db)
    summary = await repo.get_dashboard_summary()
    return ApiResponse(data=summary.demand_by_density)
