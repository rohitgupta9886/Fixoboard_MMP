from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import AuditMixin, generate_uuid, TimestampMixin


class Dispatch(Base, AuditMixin):
    __tablename__ = "dispatches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dispatch_number = Column(String(50), unique=True, index=True, nullable=False)  # DS-2026-000001
    party_id = Column(String(36), ForeignKey("parties.id"), nullable=False, index=True)
    sales_order_id = Column(String(36), ForeignKey("sales_orders.id"), nullable=False, index=True)
    
    vehicle_number = Column(String(50), nullable=False)
    driver_name = Column(String(100), nullable=False)
    driver_phone = Column(String(20), nullable=True)
    transporter = Column(String(100), nullable=True)
    lr_number = Column(String(50), nullable=True)
    dispatch_date = Column(Date, nullable=False)
    status = Column(String(30), default="DRAFT", index=True, nullable=False)  # DRAFT, READY, LOADING, DISPATCHED, CANCELLED
    remarks = Column(Text, nullable=True)
    
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    gate_out_time = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    party = relationship("Party", back_populates="dispatches", lazy="joined")
    sales_order = relationship("SalesOrder", back_populates="dispatches", lazy="joined")
    verifier = relationship("User", foreign_keys=[verified_by], lazy="joined")
    items = relationship("DispatchItem", back_populates="dispatch", cascade="all, delete-orphan", lazy="selectin")


class DispatchItem(Base, TimestampMixin):
    __tablename__ = "dispatch_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dispatch_id = Column(String(36), ForeignKey("dispatches.id", ondelete="CASCADE"), nullable=False, index=True)
    packing_id = Column(String(36), ForeignKey("packing_records.id"), nullable=False)
    sales_order_item_id = Column(String(36), ForeignKey("sales_order_items.id"), nullable=False)
    
    dispatched_quantity = Column(Numeric(10, 2), nullable=False)
    package_count = Column(Integer, default=1, nullable=False)

    # Relationships
    dispatch = relationship("Dispatch", back_populates="items")
    packing_record = relationship("PackingRecord", back_populates="dispatch_items", lazy="joined")
    sales_order_item = relationship("SalesOrderItem", lazy="joined")
