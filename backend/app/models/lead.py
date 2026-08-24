import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now


class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    QUOTED = "QUOTED"
    NEGOTIATION = "NEGOTIATION"
    WON = "WON"
    LOST = "LOST"


class LeadSource(str, enum.Enum):
    WEBSITE = "WEBSITE"
    AI_ADVISOR = "AI_ADVISOR"
    SMART_QUOTE = "SMART_QUOTE"
    SCAN_ORDER = "SCAN_ORDER"
    ARCHITECT = "ARCHITECT"
    CARPENTER = "CARPENTER"
    DEALER_PORTAL = "DEALER_PORTAL"
    PHONE = "PHONE"
    MANUAL = "MANUAL"


class LeadPriority(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lead_number = Column(String(50), unique=True, index=True, nullable=False)  # LEAD-2026-000001
    
    # Customer Details
    customer_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True)
    pin_code = Column(String(20), nullable=True, index=True)
    address = Column(Text, nullable=True)
    
    # Lead Classification
    source = Column(String(50), default=LeadSource.WEBSITE.value, nullable=False)
    status = Column(String(50), default=LeadStatus.NEW.value, nullable=False, index=True)
    priority = Column(String(50), default=LeadPriority.NORMAL.value, nullable=False)
    user_type = Column(String(50), default="HOMEOWNER", nullable=True)  # HOMEOWNER, ARCHITECT, CARPENTER, CONTRACTOR, DEALER
    
    # Project & Product Interests
    project_type = Column(String(100), nullable=True)  # Residential Kitchen, Wardrobe, Commercial, Office, Construction
    product_interest = Column(String(200), nullable=True)  # PVC Ply, WPC Door, Prelam Ply, Door Frames, PVC Marble
    estimated_quantity = Column(Numeric(10, 2), nullable=True)
    estimated_value = Column(Numeric(12, 2), nullable=True)
    required_date = Column(DateTime(timezone=True), nullable=True)
    requirements_summary = Column(Text, nullable=True)
    
    # Routing & Assignment
    assigned_dealer_id = Column(String(36), ForeignKey("parties.id"), nullable=True, index=True)
    assigned_sales_rep_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Conversion tracking
    converted_to_party_id = Column(String(36), ForeignKey("parties.id"), nullable=True)
    converted_to_order_id = Column(String(36), ForeignKey("sales_orders.id"), nullable=True)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    lost_reason = Column(String(255), nullable=True)
    
    # Extra payload
    extra_metadata = Column(JSON, nullable=True)

    # Relationships
    assigned_dealer = relationship("Party", foreign_keys=[assigned_dealer_id], lazy="joined")
    assigned_sales_rep = relationship("User", foreign_keys=[assigned_sales_rep_id], lazy="joined")
    converted_party = relationship("Party", foreign_keys=[converted_to_party_id])
    converted_order = relationship("SalesOrder", foreign_keys=[converted_to_order_id])
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan", order_by="LeadActivity.created_at.desc()")


class LeadActivity(Base, TimestampMixin):
    __tablename__ = "lead_activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    activity_type = Column(String(50), nullable=False)  # NOTE, CALL, WHATSAPP, STATUS_CHANGE, DEALER_ASSIGNMENT, QUOTE_GENERATED
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)

    # Relationships
    lead = relationship("Lead", back_populates="activities")
    user = relationship("User", lazy="joined")
