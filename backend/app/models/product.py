from sqlalchemy import Boolean, Column, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class ProductCategory(Base, TimestampMixin):
    __tablename__ = "product_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(30), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    products = relationship("Product", back_populates="category")


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(36), ForeignKey("product_categories.id"), nullable=False)
    product_code = Column(String(50), unique=True, index=True, nullable=False)
    product_name = Column(String(150), index=True, nullable=False)
    unit = Column(String(20), default="Sheets", nullable=False)  # Sheets, Pieces, Rft, SqM
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    category = relationship("ProductCategory", back_populates="products", lazy="joined")
    sales_order_items = relationship("SalesOrderItem", back_populates="product")
