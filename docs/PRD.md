# Product Requirements Document (PRD)
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard  
**Status:** Approved for Implementation  

---

### 1. Product Overview & Vision
The FixoBoard Manufacturing Management System (MMS) is a specialized, responsive, web-based industrial ERP/MES (Manufacturing Execution System) built specifically for PVC foam board and WPC door/frame extrusion and fabrication plants.

It provides end-to-end traceability across 11 core functional modules, enforcing strict business rules, state machines, audit trails, and multi-dimensional analytical reporting.

---

### 2. Functional Modules & Detailed Specifications

#### MODULE 1: Authentication, Authorization & User Management
* **Purpose:** Provide secure, role-based access to the platform for office and factory floor users.
* **Key Features:**
  * JWT-based authentication (Access Token + Refresh Token architecture).
  * Password hashing via Argon2 / BCrypt with salted rounds.
  * Role-Based Access Control (RBAC) with granular permission trees (`resource:action`).
  * User provisioning, activation/deactivation, password reset, and session invalidation.
  * Predefined roles: `MAIN_HEAD`, `SALES`, `PRODUCTION`, `DISPATCH`, `ADMIN`, `PACKING`, `OPERATOR`.
  * Multi-factor & PIN-based fast switch architecture ready for shared shop-floor terminals.

#### MODULE 2: Executive & Operational Dashboard
* **Purpose:** Provide real-time operational visibility and strategic demand intelligence.
* **Key Metrics (KPI Cards):**
  * Total Orders (Count & Quantity).
  * Open / Pending Production Orders.
  * Work-In-Progress (WIP Extrusion & Runs).
  * Pending Value Addition (Phase 2).
  * Pending Packing Queue.
  * Ready for Dispatch (Validated Packed Goods).
  * Dispatched Today & Cumulative.
  * Delayed / Critical Priority Orders.
  * Today's Production Yield (Planned vs. Good vs. Scrap).
* **Charts & Analytics:**
  * Party-wise Demand & Fulfillment Distribution (Bar / Donut Chart).
  * Thickness-wise Demand Breakdown (Configurable values: e.g., 5mm to 30mm+).
  * Density-wise Demand Breakdown (Configurable values: e.g., 0.40 to 0.70 g/cm³).
  * Extrusion Line Utilization & Machine Status.
* **Interactivity:** Full drill-down navigation—clicking any KPI card or chart segment navigates to the relevant filtered listing.

#### MODULE 3: Customer / Party Master
* **Purpose:** Maintain verified commercial counterparty records.
* **Fields:** `party_id` (UUID), `party_code` (Unique, e.g., PTY-001), `party_name`, `contact_person`, `phone`, `email`, `billing_address`, `shipping_address`, `gst_number`, `credit_limit`, `payment_terms`, `status` (`ACTIVE`, `INACTIVE`), `created_at`, `updated_at`.
* **Features:** Search, multi-field filtering, address books, order history tab, dispatch history tab, soft deactivation.

#### MODULE 4: Product & Configurable Specification Master
* **Purpose:** Define standard product catalog and dynamic manufacturing parameter dimensions without hardcoding.
* **Entities:**
  * **Product Master:** `product_id`, `product_code`, `product_name`, `category` (PVC Ply, WPC Board, WPC Solid Door, WPC Hollow Door, Door Frame), `unit` (Sheets, Pieces, Running Feet, Sq. Meter), `description`, `status`.
  * **Thickness Master:** `thickness_id`, `value_mm` (e.g., 5, 6, 8, 11, 12, 17, 18, 25, 30), `display_label`, `is_active`.
  * **Density Master:** `density_id`, `value_g_cm3` (e.g., 0.42, 0.45, 0.48, 0.50, 0.55, 0.60), `display_label`, `is_active`.
  * **Size / Dimension Master:** `size_id`, `length_mm`, `width_mm`, `display_label` (e.g., 8x4 ft, 7x3 ft), `is_active`.
  * **Finish / Grade Master:** `grade_id`, `name` (e.g., Virgin, Recycled Core, Premium Smooth, Matte, Gloss, Wood Grain), `is_active`.

#### MODULE 5: Sales Order Management
* **Purpose:** Ingest, structure, validate, and govern commercial customer orders.
* **Order Header:** `order_id`, `order_number` (e.g., SO-2026-00001), `party_id`, `order_source` (Configurable: `CAT`, `MANUAL`, `EMAIL`, `EDI`, `PHONE`), `customer_po_number`, `order_date`, `required_date`, `priority` (`LOW`, `NORMAL`, `HIGH`, `URGENT`), `status`, `remarks`, `attachment_file_id`, `created_by`, `approved_by`, `created_at`, `updated_at`.
* **Order Line Items:** `order_item_id`, `order_id`, `product_id`, `thickness_id`, `density_id`, `size_id`, `grade_id`, `ordered_quantity`, `unit`, `unit_price`, `remarks`.
* **State Machine:**
  * `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `APPROVED` (or `REJECTED`) $\rightarrow$ `PARTIALLY_PRODUCTION` $\rightarrow$ `IN_PRODUCTION` $\rightarrow$ `PARTIALLY_DISPATCHED` $\rightarrow$ `COMPLETED` / `CANCELLED`.
* **Business Rule:** Only `APPROVED` sales orders are eligible for Production Memo generation.

#### MODULE 6: Production Memo (Phase 1)
* **Purpose:** Translate approved sales order line items into shop-floor manufacturing directives.
* **Fields:** `production_memo_id`, `memo_number` (e.g., PM-2026-00001), `sales_order_id`, `sales_order_item_id`, `planned_quantity`, `priority`, `required_date`, `target_machine_id`, `production_stage` (`EXTRUSION_PHASE_1`), `status`, `remarks`, `created_by`, `approved_by`, `created_at`, `updated_at`.
* **State Machine:**
  * `DRAFT` $\rightarrow$ `APPROVED` $\rightarrow$ `PLANNED` $\rightarrow$ `MACHINE_ASSIGNED` $\rightarrow$ `RELEASED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `PAUSED` $\rightarrow$ `COMPLETED` / `CANCELLED`.
* **Business Rule:** Every production memo maintains strict parentage to a sales order item; orphan memos are strictly disallowed.

#### MODULE 7: Machine & Line Master
* **Purpose:** Model extrusion lines, CNC routing stations, and calibration units.
* **Fields:** `machine_id`, `machine_code` (e.g., EXT-LINE-01), `machine_name`, `line_name`, `machine_type` (PVC Extruder, WPC Board Line, Door Frame Extruder, CNC Profiler), `rated_capacity_per_hour`, `status` (`AVAILABLE`, `RUNNING`, `IDLE`, `MAINTENANCE`, `OFFLINE`), `location`, `maintenance_status`, `description`.
* **Features:** Manual supervisor assignment, line status monitoring, machine breakdown logging.

#### MODULE 8: Production Execution & Job Runs
* **Purpose:** Capture shop-floor execution, partial runs, scrap generation, and shift progress.
* **Fields:** `production_run_id`, `production_memo_id`, `machine_id`, `operator_id`, `shift` (Morning, Evening, Night), `start_time`, `end_time`, `planned_quantity`, `good_quantity`, `rejected_quantity`, `waste_kg`, `status` (`IN_PROGRESS`, `PAUSED`, `COMPLETED`), `rejection_reason_code`, `remarks`.
* **Partial Batch Support:** Supports $N$ runs per memo until cumulative good output meets or exceeds planned requirement.

#### MODULE 9: Value Addition (Phase 2 Architecture)
* **Purpose:** Stage secondary processing (surface lamination, UV coating, CNC carving, edge sealing) post-extrusion.
* **Fields:** `va_memo_id`, `source_production_run_id`, `process_type` (Lamination, UV Coating, CNC Carving), `input_quantity`, `output_good_quantity`, `scrap_quantity`, `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`).
* **Design Rule:** Completely decoupled via status bridge so Phase 1 runs can route directly to Packing or optional Phase 2.

#### MODULE 10: Packing & Bundling Management
* **Purpose:** Standardize bundle packaging, palletization, and verify physical piece counts.
* **Packaging Types Master:** Configurable options (`STANDARD`, `RAFFIA`, `CARDBOARD`, `CORNER_GUARDED_PALLET`).
* **Fields:** `packing_id`, `packing_number` (e.g., PKG-2026-00001), `sales_order_item_id`, `production_run_id`, `packing_type_id`, `packed_quantity`, `package_count` (number of bundles/boxes), `pieces_per_bundle`, `packed_by`, `packed_at`, `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`), `remarks`.
* **Business Rule:** Only verified `COMPLETED` packing records become eligible for Dispatch allocation.

#### MODULE 11: Dispatch & Gate Pass Management
* **Purpose:** Create, verify, and confirm outbound shipments linked to packed stock.
* **Fields:** `dispatch_id`, `dispatch_number` (e.g., DS-2026-00001), `party_id`, `sales_order_id`, `vehicle_number`, `driver_name`, `driver_phone`, `transporter_name`, `lr_number` (Lorry Receipt), `dispatch_date`, `status` (`DRAFT`, `READY`, `LOADING`, `DISPATCHED`, `CANCELLED`), `verified_by`, `gate_pass_timestamp`, `remarks`.
* **Dispatch Line Items:** `dispatch_item_id`, `dispatch_id`, `packing_id`, `product_id`, `dispatched_quantity`, `package_count`.
* **Features:** Printable / Downloadable Dispatch Sheet (PDF layout with barcode/QR placeholder, transporter signature blocks, and itemized specs).
* **State Machine:** State moves to `DISPATCHED` only upon gate confirmation, automatically transitioning the parent Sales Order to `PARTIALLY_DISPATCHED` or `COMPLETED`.

#### MODULE 12: Audit Logging & Security Administration
* **Purpose:** Full compliance tracking and unauthorized change prevention.
* **Fields:** `audit_id`, `user_id`, `action` (e.g., `APPROVE_SO`, `ASSIGN_MACHINE`, `CONFIRM_DISPATCH`), `entity_name`, `entity_id`, `timestamp`, `ip_address`, `user_agent`, `old_values` (JSONB), `new_values` (JSONB), `metadata` (JSONB).
