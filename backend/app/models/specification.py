from sqlalchemy import Boolean, Column, Numeric, String, Text

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Thickness(Base, TimestampMixin):
    __tablename__ = "thicknesses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    value_mm = Column(Numeric(5, 2), unique=True, index=True, nullable=False)
    display_label = Column(String(30), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class Density(Base, TimestampMixin):
    __tablename__ = "densities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    value_g_cm3 = Column(Numeric(4, 3), unique=True, index=True, nullable=False)
    display_label = Column(String(30), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class ProductSize(Base, TimestampMixin):
    __tablename__ = "product_sizes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    length_mm = Column(Numeric(8, 2), nullable=False)
    width_mm = Column(Numeric(8, 2), nullable=False)
    display_label = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class ProductFinish(Base, TimestampMixin):
    __tablename__ = "product_finishes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class PackingType(Base, TimestampMixin):
    __tablename__ = "packing_types"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)  # STANDARD, RAFFIA, CARDBOARD
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
