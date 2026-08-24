from decimal import Decimal
from typing import List, Optional, Any
from pydantic import BaseModel, Field
import uuid


class ProductRecommendationItem(BaseModel):
    category_code: Optional[str] = None
    product_code: str
    product_name: str
    category_name: Optional[str] = None
    recommended_thickness: Optional[str] = None
    recommended_density: Optional[str] = None
    verified_rationale: List[str] = []
    suitable_applications: List[str] = []
    certifications: List[str] = []
    advantages_vs_plywood: List[str] = []
    estimated_price_range: Optional[str] = None
    match_score: Optional[float] = 100.0


class AIAdvisorRequest(BaseModel):
    session_id: Optional[str] = None
    message: Optional[str] = None
    query: Optional[str] = None
    context_conversation_id: Optional[str] = None
    visitor_name: Optional[str] = None
    user_name: Optional[str] = None
    visitor_phone: Optional[str] = None
    user_phone: Optional[str] = None
    visitor_city: Optional[str] = None
    application_type: Optional[str] = None
    context: Optional[Any] = None

    def get_query_text(self) -> str:
        return (self.message or self.query or "").strip()

    def get_session_id(self) -> str:
        return self.session_id or self.context_conversation_id or str(uuid.uuid4())


class AIAdvisorResponse(BaseModel):
    session_id: str
    conversation_id: Optional[str] = None
    response_text: str
    assistant_reply: Optional[str] = None
    intent: str = "DATABASE_INTELLIGENCE"
    matched_products: List[ProductRecommendationItem] = []
    recommended_products: List[ProductRecommendationItem] = []
    action_type: Optional[str] = None
    lead_created: bool = False
    lead_id: Optional[str] = None
    requires_human_followup: bool = False
    safety_disclaimer: Optional[str] = None
