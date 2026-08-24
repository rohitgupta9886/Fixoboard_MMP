from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def generate_business_number(session: AsyncSession, model_class, number_field_name: str, prefix: str) -> str:
    """
    Generates thread-safe sequential human-readable business identifiers,
    e.g., SO-2026-000001, PM-2026-000001, PKG-2026-000001, DS-2026-000001
    """
    current_year = datetime.utcnow().year
    prefix_pattern = f"{prefix}-{current_year}-%"

    column = getattr(model_class, number_field_name)
    stmt = select(func.count()).select_from(model_class).where(column.like(prefix_pattern))
    result = await session.execute(stmt)
    count = result.scalar() or 0

    next_sequence = count + 1
    return f"{prefix}-{current_year}-{next_sequence:06d}"
