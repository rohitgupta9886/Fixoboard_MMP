from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now


class PackingRecord(Base, TimestampMixin):
    __tablename__ = "packing_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    packing_number = Column(String(50), unique=True, index=True, nullable=False)  # PKG-2026-000001
    sales_order_item_id = Column(String(36), ForeignKey("sales_order_items.id"), nullable=False, index=True)
    production_run_id = Column(String(36), ForeignKey("production_runs.id"), nullable=True)
    packing_type_id = Column(String(36), ForeignKey("packing_types.id"), nullable=False)
    
    packed_quantity = Column(Numeric(10, 2), nullable=False)
    package_count = Column(Integer, default=1, nullable=False)
    pieces_per_package = Column(Integer, nullable=True)
    packed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    packed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    status = Column(String(30), default="COMPLETED", nullable=False)  # PENDING, IN_PROGRESS, COMPLETED, REJECTED
    remarks = Column(Text, nullable=True)

    # Relationships
    sales_order_item = relationship("SalesOrderItem", back_populates="packing_records", lazy="joined")
    production_run = relationship("ProductionRun", back_populates="packing_records")
    packing_type = relationship("PackingType", lazy="joined")
    packer = relationship("User", lazy="joined")
    dispatch_items = relationship("DispatchItem", back_populates="packing_record")
