from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.public_portal import (
    DealerLocatorQuery,
    DealerLocatorResponse,
    SmartQuoteEstimateResponse,
    SmartQuoteRequest,
    ProfessionalRegistrationRequest,
    ProfessionalResponse,
)
from app.services.public_portal_service import PublicPortalService

router = APIRouter()


@router.get("/dealers", response_model=List[DealerLocatorResponse])
async def search_dealers_public(
    city: Optional[str] = None,
    state: Optional[str] = None,
    pin_code: Optional[str] = None,
    search: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    service = PublicPortalService(session)
    return await service.search_dealers(
        DealerLocatorQuery(city=city, state=state, pin_code=pin_code, search=search)
    )


@router.post("/smart-quote", response_model=SmartQuoteEstimateResponse, status_code=status.HTTP_201_CREATED)
async def calculate_and_submit_smart_quote(
    data: SmartQuoteRequest,
    session: AsyncSession = Depends(get_session),
):
    service = PublicPortalService(session)
    response = await service.calculate_smart_quote(data)
    await session.commit()
    return response


@router.post("/professionals/register", response_model=ProfessionalResponse, status_code=status.HTTP_201_CREATED)
async def register_professional_hub(
    data: ProfessionalRegistrationRequest,
    session: AsyncSession = Depends(get_session),
):
    service = PublicPortalService(session)
    response = await service.register_professional(data)
    await session.commit()
    return response
