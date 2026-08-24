from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.machine import MachineCreate, MachineResponse, MachineUpdate, MachineStatusUpdate
from app.services.machine_service import MachineService

router = APIRouter()


@router.get("/all", response_model=ApiResponse[List[MachineResponse]])
async def list_all_machines(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MachineService(db)
    machines, _ = await service.get_machines(skip=0, limit=100, is_active=True)
    return ApiResponse(data=[MachineResponse.model_validate(m) for m in machines])


@router.get("", response_model=PaginatedResponse[MachineResponse])
async def list_machines(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MachineService(db)
    skip = (page - 1) * page_size
    machines, total = await service.get_machines(skip=skip, limit=page_size, status=status, is_active=is_active)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        data=[MachineResponse.model_validate(m) for m in machines],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.get("/{machine_id}", response_model=ApiResponse[MachineResponse])
async def get_machine(
    machine_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MachineService(db)
    machine = await service.get_machine_by_id(machine_id)
    return ApiResponse(data=MachineResponse.model_validate(machine))


@router.post("", response_model=ApiResponse[MachineResponse])
async def create_machine(
    data: MachineCreate,
    current_user: User = Depends(require_permission("machines:manage")),
    db: AsyncSession = Depends(get_db),
):
    service = MachineService(db)
    machine = await service.create_machine(data, user_id=current_user.id)
    return ApiResponse(data=MachineResponse.model_validate(machine), message="Machine line registered successfully")


@router.put("/{machine_id}/status", response_model=ApiResponse[MachineResponse])
async def update_machine_status(
    machine_id: str,
    data: MachineStatusUpdate,
    current_user: User = Depends(require_permission("machines:manage")),
    db: AsyncSession = Depends(get_db),
):
    service = MachineService(db)
    machine = await service.update_machine_status(machine_id, data.status, user_id=current_user.id)
    return ApiResponse(data=MachineResponse.model_validate(machine), message="Machine status updated successfully")


@router.put("/{machine_id}", response_model=ApiResponse[MachineResponse])
async def update_machine(
    machine_id: str,
    data: MachineUpdate,
    current_user: User = Depends(require_permission("machines:manage")),
    db: AsyncSession = Depends(get_db),
):
    service = MachineService(db)
    machine = await service.update_machine(machine_id, data, user_id=current_user.id)
    return ApiResponse(data=MachineResponse.model_validate(machine), message="Machine line updated successfully")
