from sqlalchemy import Boolean, Column, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import AuditMixin, generate_uuid


class Party(Base, AuditMixin):
    __tablename__ = "parties"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    party_code = Column(String(30), unique=True, index=True, nullable=False)
    party_name = Column(String(150), index=True, nullable=False)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    billing_address = Column(Text, nullable=False)
    shipping_address = Column(Text, nullable=False)
    gst_number = Column(String(20), nullable=True)
    payment_terms = Column(String(100), nullable=True)
    credit_limit = Column(Numeric(12, 2), default=0.00, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    sales_orders = relationship("SalesOrder", back_populates="party")
    dispatches = relationship("Dispatch", back_populates="party")
