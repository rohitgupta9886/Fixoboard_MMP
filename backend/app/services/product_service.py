from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.models.product import Product, ProductCategory
from app.repositories.product_repository import ProductCategoryRepository, ProductRepository
from app.schemas.product import ProductCategoryCreate, ProductCreate, ProductUpdate
from app.services.audit_service import AuditService


class ProductService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = ProductRepository(session)
        self.category_repo = ProductCategoryRepository(session)
        self.audit_service = AuditService(session)

    async def get_product_by_id(self, product_id: str) -> Product:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise NotFoundException(f"Product with ID {product_id} not found")
        return product

    async def get_products(
        self,
        skip: int = 0,
        limit: int = 20,
        category_id: Optional[str] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[Product], int]:
        return await self.repo.get_paginated(
            skip=skip, limit=limit, category_id=category_id, search=search, is_active=is_active
        )

    async def create_product(self, data: ProductCreate, user_id: str) -> Product:
        existing = await self.repo.get_by_code(data.product_code)
        if existing:
            raise BusinessRuleException(f"Product code '{data.product_code}' already exists")

        product = Product(
            category_id=data.category_id,
            product_code=data.product_code.strip().upper(),
            product_name=data.product_name.strip(),
            unit=data.unit,
            description=data.description,
        )
        saved = await self.repo.create(product)
        await self.audit_service.log_action(
            user_id=user_id,
            action="CREATE_PRODUCT",
            entity_name="products",
            entity_id=saved.id,
            new_values={"product_code": saved.product_code, "product_name": saved.product_name},
        )
        return saved

    async def update_product(self, product_id: str, data: ProductUpdate, user_id: str) -> Product:
        product = await self.get_product_by_id(product_id)
        for field, val in data.model_dump(exclude_unset=True).items():
            setattr(product, field, val)
        return await self.repo.update(product)

    async def get_categories(self) -> List[ProductCategory]:
        return await self.category_repo.get_all_active()

    async def create_category(self, data: ProductCategoryCreate, user_id: str) -> ProductCategory:
        cat = ProductCategory(name=data.name.strip(), code=data.code.strip().upper(), description=data.description)
        return await self.category_repo.create(cat)
