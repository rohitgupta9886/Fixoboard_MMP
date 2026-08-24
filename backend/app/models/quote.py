import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now


class QuoteStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    REVISED = "REVISED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class Quote(Base, TimestampMixin):
    __tablename__ = "quotes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quote_number = Column(String(50), unique=True, index=True, nullable=False)  # QUOTE-2026-000001
    
    lead_id = Column(String(36), ForeignKey("leads.id"), nullable=True, index=True)
    party_id = Column(String(36), ForeignKey("parties.id"), nullable=True, index=True)  # Dealer or Direct Client
    
    customer_name = Column(String(150), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    customer_email = Column(String(100), nullable=True)
    project_location = Column(String(200), nullable=True)
    
    subtotal_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0.0, nullable=False)
    
    valid_until = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default=QuoteStatus.DRAFT.value, nullable=False, index=True)
    terms_and_conditions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    # Relationships
    lead = relationship("Lead")
    party = relationship("Party")
    creator = relationship("User", lazy="joined")
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")


class QuoteItem(Base, TimestampMixin):
    __tablename__ = "quote_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quote_id = Column(String(36), ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=True)
    thickness_id = Column(String(36), ForeignKey("thicknesses.id"), nullable=True)
    density_id = Column(String(36), ForeignKey("densities.id"), nullable=True)
    
    item_description = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(20), default="Sheets", nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    remarks = Column(String(255), nullable=True)

    # Relationships
    quote = relationship("Quote", back_populates="items")
    product = relationship("Product", lazy="joined")
    thickness = relationship("Thickness", lazy="joined")
    density = relationship("Density", lazy="joined")
