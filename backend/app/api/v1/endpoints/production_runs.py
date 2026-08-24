from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.production_run import (
    ProductionRunComplete,
    ProductionRunOutputLog,
    ProductionRunPause,
    ProductionRunResponse,
    ProductionRunStart,
)
from app.services.production_service import ProductionService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ProductionRunResponse])
async def list_production_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    machine_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionService(db)
    skip = (page - 1) * page_size
    runs, total = await service.get_runs(skip=skip, limit=page_size, machine_id=machine_id, status=status)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[ProductionRunResponse.model_validate(r) for r in runs],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.get("/{run_id}", response_model=ApiResponse[ProductionRunResponse])
async def get_production_run(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionService(db)
    run = await service.get_run_by_id(run_id)
    return ApiResponse(data=ProductionRunResponse.model_validate(run))


@router.post("/start", response_model=ApiResponse[ProductionRunResponse])
async def start_run(
    data: ProductionRunStart,
    current_user: User = Depends(require_permission("production:execute")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionService(db)
    run = await service.start_run(data, user_id=current_user.id)
    return ApiResponse(data=ProductionRunResponse.model_validate(run), message="Production run started on line")


@router.post("/{run_id}/output", response_model=ApiResponse[ProductionRunResponse])
async def log_run_output(
    run_id: str,
    data: ProductionRunOutputLog,
    current_user: User = Depends(require_permission("production:execute")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionService(db)
    run = await service.log_output(run_id, data, user_id=current_user.id)
    return ApiResponse(data=ProductionRunResponse.model_validate(run), message="Production output logged successfully")


@router.post("/{run_id}/pause", response_model=ApiResponse[ProductionRunResponse])
async def pause_run(
    run_id: str,
    data: ProductionRunPause,
    current_user: User = Depends(require_permission("production:execute")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionService(db)
    run = await service.pause_run(run_id, data, user_id=current_user.id)
    return ApiResponse(data=ProductionRunResponse.model_validate(run), message="Production run paused")


@router.post("/{run_id}/resume", response_model=ApiResponse[ProductionRunResponse])
async def resume_run(
    run_id: str,
    current_user: User = Depends(require_permission("production:execute")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionService(db)
    run = await service.resume_run(run_id, user_id=current_user.id)
    return ApiResponse(data=ProductionRunResponse.model_validate(run), message="Production run resumed")


@router.post("/{run_id}/complete", response_model=ApiResponse[ProductionRunResponse])
async def complete_run(
    run_id: str,
    data: ProductionRunComplete,
    current_user: User = Depends(require_permission("production:execute")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductionService(db)
    run = await service.complete_run(run_id, data, user_id=current_user.id)
    return ApiResponse(data=ProductionRunResponse.model_validate(run), message="Production run completed and output logged")
