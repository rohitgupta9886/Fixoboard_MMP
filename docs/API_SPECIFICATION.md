# API Specification (REST v1)
## Project: FixoBoard Manufacturing Management System (MMS)
**Base URL:** `/api/v1`  
**Content-Type:** `application/json`  
**Authentication:** Bearer Token (`Authorization: Bearer <access_token>`)  

---

### 1. Standard Response Formats

#### 1.1 Standard Success Envelope
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

#### 1.2 Standard Paginated Envelope
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 142,
    "total_pages": 8
  }
}
```

#### 1.3 Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Sales order cannot be approved from DRAFT state. Must be SUBMITTED first.",
    "details": {
      "current_state": "DRAFT",
      "allowed_transitions": ["SUBMITTED", "CANCELLED"]
    }
  }
}
```

---

### 2. Detailed Endpoint Catalog

#### 2.1 Authentication & Profile (`/auth`)
* `POST /auth/login` - Request: `{ username, password }` $\rightarrow$ Returns tokens + user profile + permissions.
* `POST /auth/refresh` - Request: `{ refresh_token }` $\rightarrow$ Returns new access token.
* `POST /auth/logout` - Invalidate active session.
* `GET /auth/me` - Fetch authenticated user details and active permissions.
* `POST /auth/change-password` - Update password.

#### 2.2 Party Master (`/parties`)
* `GET /parties?page=1&page_size=20&search=PTY&is_active=true` - Paginated customer directory.
* `POST /parties` - Create customer counterparty.
* `GET /parties/{party_id}` - Detailed party profile with order & dispatch history.
* `PUT /parties/{party_id}` - Update party master.
* `PATCH /parties/{party_id}/toggle-status` - Activate/Deactivate customer.

#### 2.3 Product & Specification Masters (`/products`, `/specifications`)
* `GET /products` - List products with category, unit, active status.
* `POST /products` - Create product record.
* `GET /specifications/thicknesses` - List configurable thicknesses (e.g. 5, 8, 12, 18, 25, 30mm).
* `POST /specifications/thicknesses` - Add/Update thickness master.
* `GET /specifications/densities` - List configurable densities (e.g. 0.45, 0.50, 0.55 g/cm³).
* `POST /specifications/densities` - Add/Update density master.
* `GET /specifications/sizes` - List standard board sizes (e.g. 8x4 ft, 7x3 ft).
* `GET /specifications/finishes` - List surface finishes / grades.
* `GET /specifications/packing-types` - List packing modes (STANDARD, RAFFIA, CARDBOARD).

#### 2.4 Machine Master (`/machines`)
* `GET /machines` - List all extrusion lines with real-time operational status.
* `POST /machines` - Register new machine line.
* `GET /machines/{machine_id}` - Machine line details, capacity, and active run history.
* `PATCH /machines/{machine_id}/status` - Update machine status (`AVAILABLE`, `MAINTENANCE`, `IDLE`).

#### 2.5 Sales Orders (`/sales-orders`)
* `GET /sales-orders?status=SUBMITTED&party_id=...&priority=URGENT&page=1` - Filterable order list.
* `POST /sales-orders` - Create sales order with multi-line items (Manual or CAT).
* `GET /sales-orders/{order_id}` - Full order details with items, execution progress, and audit trail.
* `PUT /sales-orders/{order_id}` - Edit draft order.
* `POST /sales-orders/{order_id}/submit` - Transition: `DRAFT` $\rightarrow$ `SUBMITTED`.
* `POST /sales-orders/{order_id}/approve` - Transition: `SUBMITTED` $\rightarrow$ `APPROVED` (Requires `sales_orders:approve`).
* `POST /sales-orders/{order_id}/reject` - Transition: `SUBMITTED` $\rightarrow$ `REJECTED` with reason.
* `POST /sales-orders/{order_id}/cancel` - Cancel active order.

#### 2.6 Production Memos (Phase 1) (`/production-memos`)
* `GET /production-memos?status=RELEASED&machine_id=...` - Filterable production memos.
* `POST /production-memos` - Create memo from approved sales order line item.
* `GET /production-memos/{memo_id}` - Memo details with specifications and progress logs.
* `POST /production-memos/{memo_id}/approve` - Approve memo for scheduling.
* `POST /production-memos/{memo_id}/assign-machine` - Assign manual extrusion machine/line.
* `POST /production-memos/{memo_id}/release` - Release memo to shop-floor operator queue.

#### 2.7 Production Execution & Runs (`/production-runs`)
* `GET /production-runs?machine_id=...&status=IN_PROGRESS` - Active line runs.
* `POST /production-runs/start` - Operator clocks in a run for assigned memo.
* `POST /production-runs/{run_id}/pause` - Pause run with downtime reason.
* `POST /production-runs/{run_id}/resume` - Resume paused run.
* `POST /production-runs/{run_id}/complete` - Record actual good output, scrap, waste kg, and complete batch.

#### 2.8 Packing Queue & Records (`/packing`)
* `GET /packing/queue` - Ready-to-pack output from completed production runs.
* `POST /packing/record` - Create packing bundle record (Standard, Raffia, Cardboard).
* `GET /packing/records` - Completed packing list.

#### 2.9 Dispatch & Gate Pass (`/dispatch`)
* `GET /dispatch/queue` - Packed goods ready for vehicle loading.
* `POST /dispatch` - Draft new Dispatch order linked to sales order & packed items.
* `GET /dispatch/{dispatch_id}` - Dispatch sheet details.
* `POST /dispatch/{dispatch_id}/loading` - Transition to `LOADING`.
* `POST /dispatch/{dispatch_id}/confirm` - Confirm gate dispatch, generate gate pass timestamp.
* `GET /dispatch/{dispatch_id}/pdf` - Generate printable Dispatch Sheet PDF.

#### 2.10 Dashboard & Demand Analytics (`/dashboards`, `/reports`)
* `GET /dashboards/kpis` - Real-time operational KPI counts.
* `GET /reports/demand/party?from_date=...&to_date=...` - Aggregate demand by party.
* `GET /reports/demand/thickness?from_date=...&to_date=...` - Aggregate demand by thickness.
* `GET /reports/demand/density?from_date=...&to_date=...` - Aggregate demand by density.
* `GET /reports/production/yield` - Yield, scrap %, and machine utilization report.

#### 2.11 Audit & Administration (`/admin`)
* `GET /admin/users` - User directory.
* `POST /admin/users` - Create user.
* `PUT /admin/users/{user_id}/roles` - Assign roles.
* `GET /admin/roles` - Role-permission matrix.
* `GET /admin/audit-logs?entity_name=sales_orders&page=1` - Full audit log trail.
* `GET /admin/system-settings` - Configuration parameters (Order sources, CAT mappings, etc.).
