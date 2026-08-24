from sqlalchemy import Boolean, Column, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Machine(Base, TimestampMixin):
    __tablename__ = "machines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    machine_code = Column(String(50), unique=True, index=True, nullable=False)
    machine_name = Column(String(100), nullable=False)
    line_name = Column(String(50), nullable=False)
    machine_type = Column(String(50), nullable=False)  # PVC_EXTRUDER, WPC_BOARD_LINE, DOOR_FRAME_LINE
    rated_capacity_hourly = Column(Numeric(8, 2), default=0.00, nullable=False)
    status = Column(String(30), default="AVAILABLE", nullable=False)  # AVAILABLE, RUNNING, IDLE, MAINTENANCE, OFFLINE
    location = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    production_memos = relationship("ProductionMemo", back_populates="target_machine")
    production_runs = relationship("ProductionRun", back_populates="machine")
