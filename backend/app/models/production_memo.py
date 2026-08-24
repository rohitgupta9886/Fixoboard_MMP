from sqlalchemy import Column, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import AuditMixin, generate_uuid


class ProductionMemo(Base, AuditMixin):
    __tablename__ = "production_memos"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    memo_number = Column(String(50), unique=True, index=True, nullable=False)  # PM-2026-000001
    sales_order_id = Column(String(36), ForeignKey("sales_orders.id"), nullable=False, index=True)
    sales_order_item_id = Column(String(36), ForeignKey("sales_order_items.id"), nullable=False, index=True)
    planned_quantity = Column(Numeric(10, 2), nullable=False)
    priority = Column(String(20), default="NORMAL", nullable=False)
    required_date = Column(Date, nullable=False)
    target_machine_id = Column(String(36), ForeignKey("machines.id"), nullable=True, index=True)
    production_stage = Column(String(30), default="EXTRUSION_PHASE_1", nullable=False)
    status = Column(String(30), default="DRAFT", index=True, nullable=False)
    remarks = Column(Text, nullable=True)
    
    approved_by = Column(String(36), nullable=True)
    assigned_by = Column(String(36), nullable=True)

    # Relationships
    sales_order = relationship("SalesOrder", back_populates="production_memos", lazy="joined")
    sales_order_item = relationship("SalesOrderItem", back_populates="production_memos", lazy="joined")
    target_machine = relationship("Machine", back_populates="production_memos", lazy="joined")
    runs = relationship("ProductionRun", back_populates="production_memo", cascade="all, delete-orphan", lazy="selectin")
