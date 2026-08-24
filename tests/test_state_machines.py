import pytest
from app.core.exceptions import InvalidStatusTransitionException
from app.domain.enums import DispatchStatus, ProductionMemoStatus, SalesOrderStatus
from app.domain.state_machines import DispatchStateMachine, ProductionMemoStateMachine, SalesOrderStateMachine


def test_sales_order_valid_transitions():
    SalesOrderStateMachine.validate_transition(SalesOrderStatus.DRAFT, SalesOrderStatus.SUBMITTED)
    SalesOrderStateMachine.validate_transition(SalesOrderStatus.SUBMITTED, SalesOrderStatus.APPROVED)
    SalesOrderStateMachine.validate_transition(SalesOrderStatus.APPROVED, SalesOrderStatus.IN_PRODUCTION)
    SalesOrderStateMachine.validate_transition(SalesOrderStatus.IN_PRODUCTION, SalesOrderStatus.COMPLETED)


def test_sales_order_invalid_transition_throws_exception():
    with pytest.raises(InvalidStatusTransitionException) as exc_info:
        SalesOrderStateMachine.validate_transition(SalesOrderStatus.DRAFT, SalesOrderStatus.COMPLETED)
    assert exc_info.value.code == "INVALID_STATUS_TRANSITION"


def test_production_memo_transitions():
    ProductionMemoStateMachine.validate_transition(ProductionMemoStatus.DRAFT, ProductionMemoStatus.APPROVED)
    ProductionMemoStateMachine.validate_transition(ProductionMemoStatus.APPROVED, ProductionMemoStatus.MACHINE_ASSIGNED)
    ProductionMemoStateMachine.validate_transition(ProductionMemoStatus.MACHINE_ASSIGNED, ProductionMemoStatus.RELEASED)
    ProductionMemoStateMachine.validate_transition(ProductionMemoStatus.RELEASED, ProductionMemoStatus.IN_PROGRESS)
    ProductionMemoStateMachine.validate_transition(ProductionMemoStatus.IN_PROGRESS, ProductionMemoStatus.COMPLETED)

    with pytest.raises(InvalidStatusTransitionException):
        ProductionMemoStateMachine.validate_transition(ProductionMemoStatus.DRAFT, ProductionMemoStatus.COMPLETED)


def test_dispatch_transitions():
    DispatchStateMachine.validate_transition(DispatchStatus.DRAFT, DispatchStatus.READY)
    DispatchStateMachine.validate_transition(DispatchStatus.READY, DispatchStatus.LOADING)
    DispatchStateMachine.validate_transition(DispatchStatus.LOADING, DispatchStatus.DISPATCHED)

    with pytest.raises(InvalidStatusTransitionException):
        DispatchStateMachine.validate_transition(DispatchStatus.DRAFT, DispatchStatus.DISPATCHED)
