from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.common import ApiResponse
from app.schemas.dashboard import DashboardSummary

router = APIRouter()


@router.get("", response_model=ApiResponse[DashboardSummary])
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DashboardRepository(db)
    summary = await repo.get_dashboard_summary()
    return ApiResponse(data=summary)


@router.get("/public", response_model=ApiResponse[DashboardSummary])
async def get_public_dashboard_data(
    db: AsyncSession = Depends(get_db),
):
    repo = DashboardRepository(db)
    summary = await repo.get_dashboard_summary()
    return ApiResponse(data=summary)
