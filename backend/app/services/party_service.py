from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.models.party import Party
from app.repositories.party_repository import PartyRepository
from app.schemas.party import PartyCreate, PartyUpdate
from app.services.audit_service import AuditService


class PartyService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = PartyRepository(session)
        self.audit_service = AuditService(session)

    async def get_party_by_id(self, party_id: str) -> Party:
        party = await self.repo.get_by_id(party_id)
        if not party:
            raise NotFoundException(f"Party with ID {party_id} not found")
        return party

    async def get_parties(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[Party], int]:
        return await self.repo.get_paginated(skip=skip, limit=limit, search=search, is_active=is_active)

    async def create_party(self, data: PartyCreate, user_id: str) -> Party:
        existing = await self.repo.get_by_code(data.party_code)
        if existing:
            raise BusinessRuleException(f"Party code '{data.party_code}' is already in use")

        party = Party(
            party_code=data.party_code.strip().upper(),
            party_name=data.party_name.strip(),
            contact_person=data.contact_person,
            phone=data.phone.strip(),
            email=data.email,
            billing_address=data.billing_address,
            shipping_address=data.shipping_address,
            gst_number=data.gst_number,
            payment_terms=data.payment_terms,
            credit_limit=data.credit_limit,
            created_by=user_id,
            updated_by=user_id,
        )
        saved = await self.repo.create(party)
        await self.audit_service.log_action(
            user_id=user_id,
            action="CREATE_PARTY",
            entity_name="parties",
            entity_id=saved.id,
            new_values={"party_code": saved.party_code, "party_name": saved.party_name},
        )
        return saved

    async def update_party(self, party_id: str, data: PartyUpdate, user_id: str) -> Party:
        party = await self.get_party_by_id(party_id)
        old_values = {"party_name": party.party_name, "is_active": party.is_active}

        for field, val in data.model_dump(exclude_unset=True).items():
            setattr(party, field, val)

        party.updated_by = user_id
        party.version += 1
        updated = await self.repo.update(party)

        await self.audit_service.log_action(
            user_id=user_id,
            action="UPDATE_PARTY",
            entity_name="parties",
            entity_id=party.id,
            old_values=old_values,
            new_values=data.model_dump(exclude_unset=True),
        )
        return updated
