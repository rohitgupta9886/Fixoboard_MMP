import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now


class AIConversation(Base, TimestampMixin):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    visitor_name = Column(String(150), nullable=True)
    visitor_phone = Column(String(20), nullable=True)
    visitor_city = Column(String(100), nullable=True)
    
    intent = Column(String(50), default="GENERAL_INQUIRY", nullable=True)  # PRODUCT_ADVICE, QUOTE_REQUEST, DEALER_SEARCH, TECH_SPECS
    extracted_lead_id = Column(String(36), ForeignKey("leads.id"), nullable=True)
    
    # Relationships
    lead = relationship("Lead")
    user = relationship("User")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at.asc()")


class AIMessage(Base, TimestampMixin):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    sender = Column(String(20), nullable=False)  # "user" or "assistant" or "system"
    content = Column(Text, nullable=False)
    
    matched_products = Column(JSON, nullable=True)  # Suggested product payload
    action_type = Column(String(50), nullable=True)  # RECOMMENDATION, QUOTE_CTA, DEALER_CARD, HUMAN_ESCALATION
    confidence_score = Column(Numeric(5, 2), nullable=True)

    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")
