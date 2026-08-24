from sqlalchemy import Column, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import generate_uuid, utc_now


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), index=True, nullable=False)  # e.g., CREATE_SALES_ORDER, APPROVE_SALES_ORDER
    entity_name = Column(String(100), index=True, nullable=False)
    entity_id = Column(String(100), index=True, nullable=False)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    extra_metadata = Column("metadata", JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    user = relationship("User", lazy="joined")
