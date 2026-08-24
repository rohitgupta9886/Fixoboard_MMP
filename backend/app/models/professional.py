import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now


class ProfessionalType(str, enum.Enum):
    ARCHITECT = "ARCHITECT"
    INTERIOR_DESIGNER = "INTERIOR_DESIGNER"
    CARPENTER = "CARPENTER"
    CONTRACTOR = "CONTRACTOR"
    BUILDER = "BUILDER"


class ProfessionalProfile(Base, TimestampMixin):
    __tablename__ = "professional_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    professional_type = Column(String(50), nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    firm_name = Column(String(200), nullable=True)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True)
    experience_years = Column(Integer, default=0, nullable=True)
    
    # Architect / Carpenter Verification & Loyalty
    council_registration_number = Column(String(100), nullable=True)  # COA / Architect council
    portfolio_url = Column(String(300), nullable=True)
    reward_points = Column(Integer, default=0, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Preferences & Sample Requests
    sample_kit_requested = Column(Boolean, default=False, nullable=False)
    sample_kit_status = Column(String(50), default="NOT_REQUESTED", nullable=True)  # REQUESTED, DISPATCHED, DELIVERED
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User")
