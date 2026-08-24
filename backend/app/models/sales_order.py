from sqlalchemy import Column, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import AuditMixin, generate_uuid


class SalesOrder(Base, AuditMixin):
    __tablename__ = "sales_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(50), unique=True, index=True, nullable=False)  # SO-2026-000001
    party_id = Column(String(36), ForeignKey("parties.id"), nullable=False, index=True)
    order_source = Column(String(30), default="MANUAL", nullable=False)  # MANUAL, CAT, EMAIL, PHONE, EDI, OTHER
    customer_po_number = Column(String(100), nullable=True)
    order_date = Column(Date, nullable=False)
    required_date = Column(Date, nullable=False)
    priority = Column(String(20), default="NORMAL", nullable=False)  # LOW, NORMAL, HIGH, URGENT
    status = Column(String(30), default="DRAFT", index=True, nullable=False)
    remarks = Column(Text, nullable=True)
    attachment_id = Column(String(36), ForeignKey("uploaded_files.id"), nullable=True)
    total_quantity = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    approved_by = Column(String(36), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    party = relationship("Party", back_populates="sales_orders", lazy="joined")
    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan", lazy="selectin")
    production_memos = relationship("ProductionMemo", back_populates="sales_order")
    dispatches = relationship("Dispatch", back_populates="sales_order")
    attachment = relationship("UploadedFile", foreign_keys=[attachment_id], lazy="joined")


class SalesOrderItem(Base, AuditMixin):
    __tablename__ = "sales_order_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sales_order_id = Column(String(36), ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    thickness_id = Column(String(36), ForeignKey("thicknesses.id"), nullable=False)
    density_id = Column(String(36), ForeignKey("densities.id"), nullable=False)
    size_id = Column(String(36), ForeignKey("product_sizes.id"), nullable=True)
    finish_id = Column(String(36), ForeignKey("product_finishes.id"), nullable=True)
    
    ordered_quantity = Column(Numeric(10, 2), nullable=False)
    produced_quantity = Column(Numeric(10, 2), default=0.00, nullable=False)
    packed_quantity = Column(Numeric(10, 2), default=0.00, nullable=False)
    dispatched_quantity = Column(Numeric(10, 2), default=0.00, nullable=False)
    unit = Column(String(20), default="Sheets", nullable=False)
    unit_price = Column(Numeric(10, 2), default=0.00, nullable=False)
    remarks = Column(Text, nullable=True)

    # Relationships
    sales_order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product", back_populates="sales_order_items", lazy="joined")
    thickness = relationship("Thickness", lazy="joined")
    density = relationship("Density", lazy="joined")
    size = relationship("ProductSize", lazy="joined")
    finish = relationship("ProductFinish", lazy="joined")
    production_memos = relationship("ProductionMemo", back_populates="sales_order_item")
    packing_records = relationship("PackingRecord", back_populates="sales_order_item")
