from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session, get_current_user
from app.core.exceptions import ForbiddenException
from app.models.user import User
from app.schemas.ai_advisor import AIAdvisorRequest, AIAdvisorResponse
from app.services.ai_advisor_service import AIAdvisorService

router = APIRouter()


@router.post("/chat", response_model=AIAdvisorResponse)
async def chat_with_advisor(
    req: AIAdvisorRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Enterprise Natural Language Database & Plant Intelligence Assistant.
    Accessible to Administrators, Management, Plant Heads, and authorized operations personnel.
    """
    if not current_user.is_superuser:
        user_role_names = {(r.name or "").upper() for r in (current_user.roles or [])}
        allowed_roles = {
            "ADMIN",
            "MAIN_HEAD",
            "MANAGEMENT",
            "PLANT_MANAGER",
            "SALES",
            "PRODUCTION",
            "OPERATOR",
        }
        if not user_role_names.intersection(allowed_roles) and current_user.username not in ["admin", "management"]:
            raise ForbiddenException("Access to AI Advisor is restricted to authorized plant personnel.")

    service = AIAdvisorService(session)
    response = await service.process_query(req, user=current_user)
    await session.commit()
    return response

