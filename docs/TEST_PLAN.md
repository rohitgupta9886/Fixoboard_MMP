# Comprehensive Quality Assurance & Test Plan
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard  

---

### 1. Testing Strategy Overview

The testing strategy spans 4 automated and manual testing tiers:

```
                  +-----------------------------------+
                  |   End-to-End (E2E) Critical Flow  |
                  |     (Order -> Prod -> Dispatch)   |
                  +-----------------------------------+
                                    |
                  +-----------------------------------+
                  |    API & Integration Test Suite   |
                  |  (State Transitions, RBAC, DB)    |
                  +-----------------------------------+
                                    |
                  +-----------------------------------+
                  |  Unit Tests (Services, Machines,  |
                  |      Calculations, Schemas)       |
                  +-----------------------------------+
```

---

### 2. Critical Test Scenarios & Acceptance Test Cases

#### Category A: Authentication & RBAC Test Cases
* **TC-AUTH-01:** Valid credentials return valid JWT access & refresh token.
* **TC-AUTH-02:** Invalid credentials return 401 Unauthorized with standardized error envelope.
* **TC-RBAC-01:** User with `SALES` role can create sales order, but gets 403 Forbidden when attempting `POST /sales-orders/{id}/approve`.
* **TC-RBAC-02:** User with `PRODUCTION` role can create production memo and assign machine, but cannot alter customer master.

#### Category B: Domain State Machine & Transition Invariant Tests
* **TC-STATE-01 (Valid SO Flow):** `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `APPROVED` succeeds.
* **TC-STATE-02 (Invalid SO Jump):** `DRAFT` $\rightarrow$ `APPROVED` or `DRAFT` $\rightarrow$ `DISPATCHED` rejected with `INVALID_STATUS_TRANSITION`.
* **TC-STATE-03 (Memo Gate):** Attempting to generate Production Memo from a `SUBMITTED` (unapproved) Sales Order fails with 400 Bad Request.
* **TC-STATE-04 (Machine Assignment Gate):** Attempting to release a Production Memo without assigned machine fails.

#### Category C: Production Yield & Partial Run Tests
* **TC-PROD-01 (Multi-Run Partial Batch):**
  * Target Planned: 1000 sheets.
  * Run 1 completes with 400 Good, 20 Scrap $\rightarrow$ Memo status remains `IN_PROGRESS`.
  * Run 2 completes with 350 Good, 10 Scrap $\rightarrow$ Memo status remains `IN_PROGRESS`.
  * Run 3 completes with 250 Good, 5 Scrap $\rightarrow$ Cumulative good reaches 1000 $\rightarrow$ Memo status transitions to `COMPLETED`.
* **TC-PROD-02 (Negative/Zero Rejection):** Entering negative quantities for good or rejected sheets is rejected by schema validator.

#### Category D: Packaging & Dispatch Verification Tests
* **TC-PKG-01:** Packaging completes for Standard, Raffia, and Cardboard methods and updates packed balance on order item.
* **TC-DISP-01 (Overshipment Guard):** Attempting to dispatch quantity $> \text{packed quantity}$ is blocked by validation logic.
* **TC-DISP-02 (Gate Pass Generation):** Confirming dispatch updates status to `DISPATCHED`, records gate timestamp, and updates Sales Order to `COMPLETED`.

#### Category E: Analytics & Demand Aggregation Tests
* **TC-REP-01:** Party-wise demand endpoint sums ordered, produced, packed, and dispatched quantities correctly.
* **TC-REP-02:** Thickness-wise breakdown accurately partitions quantities across all configurable millimeter classes.
* **TC-REP-03:** Density-wise breakdown accurately aggregates volume across all specific gravity grades.
