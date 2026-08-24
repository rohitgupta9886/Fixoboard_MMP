# Business Requirements Document (BRD)
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard (PVC/WPC Ply, WPC Doors & Frames Manufacturing)  
**Status:** Approved for Implementation Planning  

---

### 1. Executive Summary & Business Context
FixoBoard is a specialized industrial manufacturer producing PVC/WPC Foam Boards/Ply, WPC Solid & Hollow Doors, and Extruded WPC Door Frames. The manufacturing process involves high-capital polymer extrusion lines, calibration, cooling, surface finishing/value addition, precision cutting, batch packing, quality grading, and structured dispatch logistics.

Currently, factory operations and order tracking rely on manual paperwork, physical registers, telephonic handovers between sales, shop-floor supervisors, packing leads, and dispatch operators. This causes communication gaps, order status blindspots, untracked production waste/rejections, planning bottlenecks, and lack of real-time management analytics (e.g., party-wise, thickness-wise, and density-wise demand).

The FixoBoard Manufacturing Management System (MMS) is an industrial-grade, role-based workflow platform designed to digitize the end-to-end manufacturing lifecycle: from Sales Order ingestion through Phase 1 Extrusion Production, Phase 2 Value Addition, Packaging, and final Dispatch Sheet verification.

---

### 2. Business Objectives & Traceability Matrix

| ID | Business Requirement Description | Target Department | Measurable Business Outcome |
| :--- | :--- | :--- | :--- |
| **BR-001** | Digitize customer order processing across CAT & Manual sources | Sales / Commercial | Eliminate order misplacement, ensure instantaneous order entry with PO attachment traceability. |
| **BR-002** | Convert approved sales orders into structured production requirements | Sales / Planning | Prevent unauthorized production; eliminate discrepancies between commercial order items and shop-floor memos. |
| **BR-003** | Provide controlled production planning and scheduling | Production / Planning | Structured line allocation, batch prioritization, and schedule visibility for shift supervisors. |
| **BR-004** | Line-level visibility of job orders for machine operators | Production (Shop Floor) | Clear, unambiguous operator task lists with target quantities, specifications (thickness, density, size), and priority. |
| **BR-005** | Real-time tracking of production execution (Good, Rejected, Waste) | Production / Operations | Capture yield, scrap rate, machine downtime, and batch progress incrementally. |
| **BR-006** | Support Phase 2 Value Addition workflows | Value Addition / Finishing | Track secondary processes (lamination, CNC routing, UV coating, embossing) without breaking Phase 1 flow. |
| **BR-007** | Standardized, trackable packaging operations | Packing Department | Verify packed quantities against production output across Standard, Raffia, and Cardboard modes. |
| **BR-008** | Controlled Dispatch Sheet generation and gate verification | Dispatch & Logistics | Prevent dispatching unapproved/unpackaged material; link transporter/vehicle details with printable gate passes. |
| **BR-009** | Executive visibility and drill-down operational metrics | Management / Directors | Real-time KPI dashboards (open orders, WIP, delayed jobs, planned vs. actual output). |
| **BR-010** | Party-wise demand and fulfillment analytics | Management / Sales | Aggregate volume, SKU preference, and fulfillment velocity per client account. |
| **BR-011** | Thickness-wise production and demand analytics | Management / Operations | Dynamic metrics across all manufactured gauges (e.g., 5mm, 8mm, 12mm, 18mm, 25mm, 30mm). |
| **BR-012** | Density-wise production and demand analytics | Management / Operations | Dynamic tracking across material densities (e.g., 0.45, 0.50, 0.55, 0.60 g/cm³). |
| **BR-013** | Strict Role-Based Access Control (RBAC) | All Departments | Least-privilege access across Management, Sales, Planning, Production, Packing, Dispatch, and Admin. |
| **BR-014** | Complete enterprise auditability | Compliance / Admin | Immutable audit log capturing user ID, timestamp, entity, before/after states, and action context. |
| **BR-015** | Data integrity & deletion protection for critical records | IT / Compliance | Prevent deletion of live/historical commercial and manufacturing transactions; enforce state reversals/cancellations. |
| **BR-016** | Extensible foundation for future IoT / PLC / ERP integrations | Engineering / DevOps | Edge gateway compatibility, MQTT/OPC-UA message ingestion schema, and modular REST APIs. |

---

### 3. Business Scope & Boundaries

#### In-Scope (Phase 1 Core)
1. **Master Data Management:** Party/Customer Master, Product Master, Configurable Specification Masters (Thickness, Density, Size, Finish, Grade, Color), Machine/Line Master, Packaging Types Master.
2. **Sales Order Management:** Ingestion via Manual & CAT sources, multi-line item specification, approval workflow state machine, PO attachments.
3. **Production Planning & Memos (Phase 1):** Traceable memo generation linked 1:1 or 1:N with sales order items, manual machine/line assignment, release workflow.
4. **Shop Floor Execution:** Job queue, start/pause/resume/complete actions, incremental/partial production run recording (good qty, rejected qty, waste kg/sheets, remarks).
5. **Phase 2 Architecture Readiness:** Extensible domain schema for Value Addition jobs.
6. **Packing Management:** Production-to-packing queue, packaging type selection (Standard, Raffia, Cardboard), bundle/package count tracking.
7. **Dispatch Management:** Dispatch queue from packed inventory, vehicle & driver assignment, digital & printable Dispatch Sheet (PDF/Print), dispatch confirmation.
8. **Management Analytics:** Real-time dashboard with drill-down navigation, party-wise, thickness-wise, and density-wise demand and fulfillment reports.
9. **Security, RBAC & Audit:** JWT auth, granular permissions, immutable transaction audit trail.

#### Out-of-Scope (Deferred to Phase 2/3)
1. Automated AI PO auto-approval (AI is strictly human-in-the-loop draft generation).
2. Automated algorithmic machine scheduling / Genetic Algorithm optimization (Phase 1 is strictly manual supervisor line assignment).
3. Direct hardware-level PLC/SCADA wiring (handled via future Edge Gateway protocol adapters).
4. Multi-plant distributed ERP synchronization (architecture prepared, single-plant active in Phase 1).

---

### 4. Stakeholder Roles & Responsibilities

| Role | Department | Key Responsibilities in System |
| :--- | :--- | :--- |
| **Main Head / Management** | Executive | Strategic oversight, viewing aggregated and drill-down dashboards, approving high-value orders/exceptions, performance monitoring. |
| **Sales Executive / Manager** | Sales | Onboarding customers, creating sales orders (Manual/CAT), uploading PO documents, tracking fulfillment status, communicating with clients. |
| **Production Head / Planner** | Planning / Production | Reviewing approved sales orders, generating Production Memos, allocating extrusion machines/lines, managing shift priorities. |
| **Machine Operator / Supervisor** | Factory Floor | Clocking in job runs, reporting actual output, logging scrap/rejections and downtime reasons, completing production runs. |
| **Packing Operator** | Packing | Receiving finished goods from extrusion lines, selecting packing mode, recording bundle counts and packaging completion. |
| **Dispatch Manager / Officer** | Logistics | Verifying packed goods, scheduling transport vehicles, generating Dispatch Sheets, confirming gate dispatch. |
| **System Administrator** | IT | User provisioning, role & permission configuration, master data maintenance, system settings and audit review. |

---

### 5. Success Metrics & KPIs
1. **Order-to-Production Lead Time:** Reduction of administrative turnaround from order reception to line release by >60%.
2. **Production Reconciliation Accuracy:** 100% traceability between ordered quantity, produced good quantity, packed bundles, and dispatched goods.
3. **Scrap & Rejection Visibility:** Immediate daily visibility into line-wise and density-wise rejection percentages.
4. **Dispatch Accuracy:** Zero shipments dispatched without validated packing verification and signed digital dispatch sheets.
5. **Data Freshness:** Dashboard metrics updated in real-time (<2 seconds from transactional commit).
