from typing import Dict, List
from app.core.exceptions import InvalidStatusTransitionException
from app.domain.enums import SalesOrderStatus, ProductionMemoStatus, DispatchStatus, ProductionRunStatus


class SalesOrderStateMachine:
    TRANSITIONS: Dict[SalesOrderStatus, List[SalesOrderStatus]] = {
        SalesOrderStatus.DRAFT: [
            SalesOrderStatus.SUBMITTED,
            SalesOrderStatus.CANCELLED,
        ],
        SalesOrderStatus.SUBMITTED: [
            SalesOrderStatus.APPROVED,
            SalesOrderStatus.UNDER_REVIEW,
            SalesOrderStatus.REJECTED,
            SalesOrderStatus.CANCELLED,
        ],
        SalesOrderStatus.UNDER_REVIEW: [
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
            SalesOrderStatus.COMPLETED,
        ],
        SalesOrderStatus.IN_PRODUCTION: [
            SalesOrderStatus.PARTIALLY_DISPATCHED,
            SalesOrderStatus.COMPLETED,
        ],
        SalesOrderStatus.PARTIALLY_DISPATCHED: [
            SalesOrderStatus.COMPLETED,
        ],
        SalesOrderStatus.COMPLETED: [],
        SalesOrderStatus.CANCELLED: [],
    }

    @classmethod
    def validate_transition(cls, current: SalesOrderStatus, target: SalesOrderStatus):
        allowed = cls.TRANSITIONS.get(current, [])
        if target not in allowed:
            raise InvalidStatusTransitionException(
                current_state=current.value,
                target_state=target.value,
                allowed_transitions=[s.value for s in allowed],
            )


class ProductionMemoStateMachine:
    TRANSITIONS: Dict[ProductionMemoStatus, List[ProductionMemoStatus]] = {
        ProductionMemoStatus.DRAFT: [
            ProductionMemoStatus.APPROVED,
            ProductionMemoStatus.PLANNED,
            ProductionMemoStatus.MACHINE_ASSIGNED,
            ProductionMemoStatus.RELEASED,
            ProductionMemoStatus.CANCELLED,
        ],
        ProductionMemoStatus.APPROVED: [
            ProductionMemoStatus.PLANNED,
            ProductionMemoStatus.MACHINE_ASSIGNED,
            ProductionMemoStatus.RELEASED,
            ProductionMemoStatus.CANCELLED,
        ],
        ProductionMemoStatus.PLANNED: [
            ProductionMemoStatus.MACHINE_ASSIGNED,
            ProductionMemoStatus.RELEASED,
            ProductionMemoStatus.CANCELLED,
        ],
        ProductionMemoStatus.MACHINE_ASSIGNED: [
            ProductionMemoStatus.RELEASED,
            ProductionMemoStatus.PLANNED,
            ProductionMemoStatus.CANCELLED,
        ],
        ProductionMemoStatus.RELEASED: [
            ProductionMemoStatus.IN_PROGRESS,
            ProductionMemoStatus.PAUSED,
            ProductionMemoStatus.CANCELLED,
        ],
        ProductionMemoStatus.IN_PROGRESS: [
            ProductionMemoStatus.PAUSED,
            ProductionMemoStatus.COMPLETED,
            ProductionMemoStatus.CANCELLED,
        ],
        ProductionMemoStatus.PAUSED: [
            ProductionMemoStatus.IN_PROGRESS,
            ProductionMemoStatus.COMPLETED,
            ProductionMemoStatus.CANCELLED,
        ],
        ProductionMemoStatus.COMPLETED: [],
        ProductionMemoStatus.CANCELLED: [],
    }

    @classmethod
    def validate_transition(cls, current: ProductionMemoStatus, target: ProductionMemoStatus):
        allowed = cls.TRANSITIONS.get(current, [])
        if target not in allowed:
            raise InvalidStatusTransitionException(
                current_state=current.value,
                target_state=target.value,
                allowed_transitions=[s.value for s in allowed],
            )


class DispatchStateMachine:
    TRANSITIONS: Dict[DispatchStatus, List[DispatchStatus]] = {
        DispatchStatus.DRAFT: [
            DispatchStatus.READY,
            DispatchStatus.CANCELLED,
        ],
        DispatchStatus.READY: [
            DispatchStatus.LOADING,
            DispatchStatus.DISPATCHED,
            DispatchStatus.DRAFT,
            DispatchStatus.CANCELLED,
        ],
        DispatchStatus.LOADING: [
            DispatchStatus.DISPATCHED,
            DispatchStatus.READY,
            DispatchStatus.CANCELLED,
        ],
        DispatchStatus.DISPATCHED: [],
        DispatchStatus.CANCELLED: [],
    }

    @classmethod
    def validate_transition(cls, current: DispatchStatus, target: DispatchStatus):
        allowed = cls.TRANSITIONS.get(current, [])
        if target not in allowed:
            raise InvalidStatusTransitionException(
                current_state=current.value,
                target_state=target.value,
                allowed_transitions=[s.value for s in allowed],
            )
