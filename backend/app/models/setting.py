from sqlalchemy import Column, ForeignKey, JSON, String, Text

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class SystemSetting(Base, TimestampMixin):
    __tablename__ = "system_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    updated_by = Column(String(36), ForeignKey("users.id"), nullable=True)
