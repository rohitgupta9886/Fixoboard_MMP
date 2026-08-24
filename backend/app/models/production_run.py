from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now


class ProductionRun(Base, TimestampMixin):
    __tablename__ = "production_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    production_memo_id = Column(String(36), ForeignKey("production_memos.id"), nullable=False, index=True)
    machine_id = Column(String(36), ForeignKey("machines.id"), nullable=False, index=True)
    operator_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    shift = Column(String(20), default="DAY", nullable=False)  # DAY, NIGHT, GENERAL
    start_time = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    planned_quantity = Column(Numeric(10, 2), nullable=False)
    good_quantity = Column(Numeric(10, 2), default=0.00, nullable=False)
    rejected_quantity = Column(Numeric(10, 2), default=0.00, nullable=False)
    waste_kg = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    status = Column(String(30), default="IN_PROGRESS", index=True, nullable=False)
    rejection_reason = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)

    # Relationships
    production_memo = relationship("ProductionMemo", back_populates="runs")
    machine = relationship("Machine", back_populates="production_runs", lazy="joined")
    operator = relationship("User", lazy="joined")
    packing_records = relationship("PackingRecord", back_populates="production_run")
