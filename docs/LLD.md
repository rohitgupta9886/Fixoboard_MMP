# Low-Level Design (LLD)
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard  
**Status:** Approved Architectural Specification  

---

### 1. Layered Backend Design & Execution Pipeline

The backend strictly separates concerns into 6 cohesive layers:

```
[ HTTP Request ]
      │
      ▼
1. [ API Router Layer ] (FastAPI Routers: Dependency Injection, Auth Guard, Request Unpacking)
      │
      ▼
2. [ Request Schema Validation ] (Pydantic v2: Type Safety, Field Coercion, Structural Constraints)
      │
      ▼
3. [ Service Layer ] (Business Transactions, Workflow Orchestration, Cross-Domain Logic)
      │
      ▼
4. [ Domain Layer ] (State Machines, Business Rule Validation, Invariant Checks)
      │
      ▼
5. [ Repository Layer ] (SQLAlchemy ORM 2.0 / Async Queries, Session Management, Filters)
      │
      ▼
6. [ Database Engine ] (PostgreSQL 16: Constraints, Indexes, Foreign Keys, JSONB Stores)
```

---

### 2. Concrete Code Pattern: Separation of Concerns

#### Rule 1: No Business Logic in API Routes
Routers only validate input, inject current authenticated user context, invoke the service, and return standardized envelopes:

```python
# app/api/v1/endpoints/sales_orders.py
@router.post("/{order_id}/approve", response_model=ApiResponse[SalesOrderResponse])
async def approve_sales_order(
    order_id: UUID,
    service: SalesOrderService = Depends(get_sales_order_service),
    current_user: User = Depends(require_permission("sales_order:approve")),
    db: AsyncSession = Depends(get_db_session),
):
    updated_order = await service.approve_order(
        order_id=order_id, user_id=current_user.id
    )
    return ApiResponse(
        data=updated_order, message="Sales order approved successfully"
    )
```

#### Rule 2: Service Layer Orchestrates Business Transactions & State Machines
```python
# app/services/sales_order_service.py
class SalesOrderService:

  def __init__(
      self,
      so_repo: SalesOrderRepository,
      audit_service: AuditService,
      state_engine: OrderStateMachine,
  ):
    self.so_repo = so_repo
    self.audit_service = audit_service
    self.state_engine = state_engine

  async def approve_order(self, order_id: UUID, user_id: UUID) -> SalesOrder:
    order = await self.so_repo.get_by_id(order_id)
    if not order:
      raise NotFoundException(
          detail=f"Sales Order with ID {order_id} not found"
      )

    # 1. State Machine Validation
    self.state_engine.validate_transition(
        current_state=order.status, target_state=SalesOrderStatus.APPROVED
    )

    # 2. Domain Invariant Checks (must have at least one line item)
    if not order.items or len(order.items) == 0:
      raise BusinessRuleException("Cannot approve an order with zero items")

    old_status = order.status
    order.status = SalesOrderStatus.APPROVED
    order.approved_by = user_id
    order.approved_at = datetime.utcnow()

    # 3. Persist via repository
    saved_order = await self.so_repo.save(order)

    # 4. Audit Log Registration
    await self.audit_service.log_action(
        user_id=user_id,
        action="APPROVE_SALES_ORDER",
        entity_name="sales_orders",
        entity_id=str(order_id),
        old_values={"status": old_status.value},
        new_values={
            "status": SalesOrderStatus.APPROVED.value,
            "approved_by": str(user_id),
        },
    )
    return saved_order
```

#### Rule 3: Repository Layer Isolates Query Execution
```python
# app/repositories/sales_order_repository.py
class SalesOrderRepository:

  def __init__(self, session: AsyncSession):
    self.session = session

  async def get_by_id(self, order_id: UUID) -> Optional[SalesOrder]:
    stmt = (
        select(SalesOrder)
        .options(
            selectinload(SalesOrder.items).joinedload(
                SalesOrderItem.product
            ),
            selectinload(SalesOrder.items).joinedload(
                SalesOrderItem.thickness
            ),
            selectinload(SalesOrder.items).joinedload(SalesOrderItem.density),
            joinedload(SalesOrder.party),
        )
        .where(SalesOrder.id == order_id)
    )
    result = await self.session.execute(stmt)
    return result.scalar_one_or_none()
```

---

### 3. State Machine Architecture

Every stateful domain model has a dedicated state machine enforcing valid transitions:

```python
# app/domain/state_machines.py
class SalesOrderStateMachine:
  VALID_TRANSITIONS = {
      SalesOrderStatus.DRAFT: [
          SalesOrderStatus.SUBMITTED,
          SalesOrderStatus.CANCELLED,
      ],
      SalesOrderStatus.SUBMITTED: [
          SalesOrderStatus.APPROVED,
          SalesOrderStatus.REJECTED,
          SalesOrderStatus.CANCELLED,
      ],
      SalesOrderStatus.REJECTED: [
          SalesOrderStatus.DRAFT,
          SalesOrderStatus.CANCELLED,
      ],
      SalesOrderStatus.APPROVED: [
          SalesOrderStatus.PARTIALLY_PRODUCTION,
          SalesOrderStatus.IN_PRODUCTION,
          SalesOrderStatus.CANCELLED,
      ],
      SalesOrderStatus.PARTIALLY_PRODUCTION: [
          SalesOrderStatus.IN_PRODUCTION,
          SalesOrderStatus.PARTIALLY_DISPATCHED,
      ],
      SalesOrderStatus.IN_PRODUCTION: [
          SalesOrderStatus.PARTIALLY_DISPATCHED,
          SalesOrderStatus.COMPLETED,
      ],
      SalesOrderStatus.PARTIALLY_DISPATCHED: [SalesOrderStatus.COMPLETED],
      SalesOrderStatus.COMPLETED: [],
      SalesOrderStatus.CANCELLED: [],
  }

  @classmethod
  def validate_transition(
      cls, current_state: SalesOrderStatus, target_state: SalesOrderStatus
  ):
    allowed = cls.VALID_TRANSITIONS.get(current_state, [])
    if target_state not in allowed:
      raise InvalidStatusTransitionException(
          current_state=current_state.value,
          target_state=target_state.value,
          allowed_transitions=[s.value for s in allowed],
      )
```

---

### 4. Human-Readable Number Generation Engine

Business numbers (`SO-2026-000001`, `PM-2026-000001`, `DS-2026-000001`, `PKG-2026-000001`) are generated through a thread-safe sequence generator using atomic database sequences or Redis counters with year prefixing:

```python
# app/utils/sequence_generator.py
async def generate_document_number(
    session: AsyncSession, prefix: str, table_name: str
) -> str:
  year = datetime.utcnow().year
  # Execute atomic sequence retrieval: SELECT nextval('seq_so_2026')
  seq_name = f"seq_{prefix.lower()}_{year}"
  await session.execute(text(f"CREATE SEQUENCE IF NOT EXISTS {seq_name}"))
  res = await session.execute(text(f"SELECT nextval('{seq_name}')"))
  seq_val = res.scalar_one()
  return f"{prefix}-{year}-{seq_val:06d}"
```
