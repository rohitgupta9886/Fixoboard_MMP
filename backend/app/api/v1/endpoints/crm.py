from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models.user import User
from app.schemas.crm import (
    LeadActivityCreate,
    LeadActivityResponse,
    LeadCreate,
    LeadResponse,
    LeadUpdate,
    CRMDashboardSummary,
)
from app.services.crm_service import CRMService

router = APIRouter()


@router.get("/summary", response_model=CRMDashboardSummary)
async def get_crm_summary(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = CRMService(session)
    return await service.get_crm_stats()


@router.get("/leads", response_model=List[LeadResponse])
async def list_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    source: Optional[str] = None,
    dealer_id: Optional[str] = None,
    search: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = CRMService(session)
    leads, _ = await service.get_leads(
        skip=skip,
        limit=limit,
        status=status,
        source=source,
        dealer_id=dealer_id,
        search=search,
    )
    return leads


@router.post("/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    data: LeadCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = CRMService(session)
    lead = await service.create_lead(data, user_id=current_user.id)
    await session.commit()
    return lead


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = CRMService(session)
    return await service.get_lead_by_id(lead_id)


@router.put("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    data: LeadUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = CRMService(session)
    lead = await service.update_lead(lead_id, data, user_id=current_user.id)
    await session.commit()
    return lead


@router.post("/leads/{lead_id}/activities", response_model=LeadActivityResponse)
async def add_lead_activity(
    lead_id: str,
    data: LeadActivityCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = CRMService(session)
    activity = await service.add_activity(
        lead_id=lead_id,
        activity_type=data.activity_type,
        title=data.title,
        description=data.description,
        user_id=current_user.id,
    )
    await session.commit()
    return activity
