from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.models.packing import PackingRecord
from app.models.sales_order import SalesOrderItem
from app.repositories.packing_repository import PackingRepository
from app.repositories.sales_order_repository import SalesOrderItemRepository
from app.repositories.specification_repository import PackingTypeRepository
from app.schemas.packing import PackingRecordCreate
from app.services.audit_service import AuditService
from app.utils.sequence_generator import generate_business_number


class PackingService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = PackingRepository(session)
        self.soi_repo = SalesOrderItemRepository(session)
        self.packing_type_repo = PackingTypeRepository(session)
        self.audit_service = AuditService(session)

    async def get_packing_by_id(self, packing_id: str) -> PackingRecord:
        record = await self.repo.get_by_id_detailed(packing_id)
        if not record:
            raise NotFoundException(f"Packing record with ID {packing_id} not found")
        return record

    async def get_packing_records(
        self,
        skip: int = 0,
        limit: int = 20,
        sales_order_item_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[List[PackingRecord], int]:
        return await self.repo.get_paginated(
            skip=skip, limit=limit, sales_order_item_id=sales_order_item_id, status=status
        )

    async def create_packing_record(self, data: PackingRecordCreate, user_id: str) -> PackingRecord:
        soi = await self.soi_repo.get_by_id(data.sales_order_item_id)
        if not soi:
            raise NotFoundException(f"Sales Order Item with ID {data.sales_order_item_id} not found")

        packing_type = await self.packing_type_repo.get_by_id(data.packing_type_id)
        if not packing_type or not packing_type.is_active:
            raise BusinessRuleException("Selected Packing Type is invalid or inactive")

        # Business Rule: Safely calculate available unpacked units
        produced_qty = soi.produced_quantity or Decimal("0.00")
        packed_qty = soi.packed_quantity or Decimal("0.00")
        ordered_qty = soi.ordered_quantity or Decimal("0.00")

        # Effective available units remaining to pack (never negative)
        available_from_production = max(Decimal("0.00"), produced_qty - packed_qty)
        available_from_order = max(Decimal("0.00"), ordered_qty - packed_qty)
        total_available = max(available_from_production, available_from_order)

        if total_available <= Decimal("0.00"):
            raise BusinessRuleException(
                f"This line item is already fully packed ({packed_qty} of {ordered_qty} sheets packed). Please select another order item with pending inventory."
            )

        if data.packed_quantity > total_available:
            raise BusinessRuleException(
                f"Cannot pack {data.packed_quantity} units. Only {total_available} unpacked units available for this order line item."
            )

        # Ensure produced_quantity is synchronized and never less than total packed
        if produced_qty < (packed_qty + data.packed_quantity):
            soi.produced_quantity = packed_qty + data.packed_quantity

        packing_number = await generate_business_number(
            session=self.session,
            model_class=PackingRecord,
            number_field_name="packing_number",
            prefix="PKG",
        )

        record = PackingRecord(
            packing_number=packing_number,
            sales_order_item_id=data.sales_order_item_id,
            production_run_id=data.production_run_id,
            packing_type_id=data.packing_type_id,
            packed_quantity=data.packed_quantity,
            package_count=data.package_count,
            pieces_per_package=data.pieces_per_package,
            packed_by=user_id,
            status="COMPLETED",
            remarks=data.remarks,
        )
        saved = await self.repo.create(record)

        # Update Sales Order Item packed_quantity accumulator
        soi.packed_quantity = (soi.packed_quantity or Decimal("0.00")) + data.packed_quantity
        await self.soi_repo.update(soi)

        await self.audit_service.log_action(
            user_id=user_id,
            action="CREATE_PACKING_RECORD",
            entity_name="packing_records",
            entity_id=saved.id,
            new_values={
                "packing_number": saved.packing_number,
                "packed_quantity": str(saved.packed_quantity),
                "package_count": saved.package_count,
            },
        )
        return await self.get_packing_by_id(saved.id)
