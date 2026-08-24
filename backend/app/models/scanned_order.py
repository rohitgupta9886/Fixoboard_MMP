import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now


class ScannedOrderStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    AI_EXTRACTED = "AI_EXTRACTED"
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    CORRECTED = "CORRECTED"
    APPROVED = "APPROVED"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"
    FAILED_PROCESSING = "FAILED_PROCESSING"


class ScannedOrder(Base, TimestampMixin):
    __tablename__ = "scanned_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scan_number = Column(String(50), unique=True, index=True, nullable=False)  # SCN-2026-000001
    
    image_url = Column(String(500), nullable=False)
    additional_pages = Column(JSON, nullable=True)  # List of supplementary image URLs
    
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    dealer_id = Column(String(36), ForeignKey("parties.id"), nullable=True, index=True)
    
    # AI Extraction Metadata
    status = Column(String(50), default=ScannedOrderStatus.DRAFT.value, nullable=False, index=True)
    overall_confidence = Column(Numeric(5, 2), default=0.0, nullable=False)  # e.g., 94.50%
    ai_model_version = Column(String(100), default="FixoBoard-Vision-Document-v2.5", nullable=True)
    raw_extracted_text = Column(Text, nullable=True)
    
    # Customer Details extracted
    extracted_customer_name = Column(String(150), nullable=True)
    extracted_customer_phone = Column(String(20), nullable=True)
    extracted_delivery_location = Column(String(255), nullable=True)
    extracted_required_date = Column(String(50), nullable=True)
    extracted_remarks = Column(Text, nullable=True)
    
    # Confidence breakdown
    field_confidence_scores = Column(JSON, nullable=True)  # {"customer_name": 92, "phone": 85, "items": 96}
    
    # Human Review & Verification
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    human_corrections_log = Column(JSON, nullable=True)  # [{"field": "quantity", "old": "20", "new": "25"}]
    
    # Converted Sales Order Reference
    converted_sales_order_id = Column(String(36), ForeignKey("sales_orders.id"), nullable=True)

    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by])
    dealer = relationship("Party", foreign_keys=[dealer_id], lazy="joined")
    reviewer = relationship("User", foreign_keys=[reviewed_by], lazy="joined")
    converted_sales_order = relationship("SalesOrder", foreign_keys=[converted_sales_order_id], lazy="joined")
    items = relationship("ScannedOrderItem", back_populates="scanned_order", cascade="all, delete-orphan")


class ScannedOrderItem(Base, TimestampMixin):
    __tablename__ = "scanned_order_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scanned_order_id = Column(String(36), ForeignKey("scanned_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Raw handwritten text
    raw_item_text = Column(String(255), nullable=True)
    
    # Matched official FixoBoard product references
    matched_product_id = Column(String(36), ForeignKey("products.id"), nullable=True)
    matched_thickness_id = Column(String(36), ForeignKey("thicknesses.id"), nullable=True)
    matched_density_id = Column(String(36), ForeignKey("densities.id"), nullable=True)
    
    product_name = Column(String(200), nullable=False)
    thickness_label = Column(String(50), nullable=True)
    density_label = Column(String(50), nullable=True)
    
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(20), default="Sheets", nullable=False)
    
    confidence_score = Column(Numeric(5, 2), default=90.0, nullable=False)  # 0 to 100
    is_ambiguous = Column(Boolean, default=False, nullable=False)
    ambiguity_options = Column(JSON, nullable=True)  # ["20 sheets", "30 sheets"]
    
    # Relationships
    scanned_order = relationship("ScannedOrder", back_populates="items")
    product = relationship("Product", lazy="joined")
    thickness = relationship("Thickness", lazy="joined")
    density = relationship("Density", lazy="joined")
