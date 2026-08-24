# High-Level Design (HLD)
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard  
**Status:** Approved Architectural Specification  

---

### 1. System Architecture Overview
The FixoBoard MMS is designed as a **Domain-Centric Modular Monolith** optimized for factory reliability, low latency, robust data consistency, and clear vertical domain boundaries. The modular monolith architecture prevents premature distributed system failure modes while ensuring all modules can be extracted into discrete microservices in future phases (e.g., IoT edge processing, dedicated dispatch service).

```
                      +------------------------------------------+
                      |         USERS / SHOP-FLOOR TABLETS       |
                      |   (Management, Sales, Planner, Operator) |
                      +------------------------------------------+
                                           |
                                           | HTTPS / WebSockets
                                           v
                      +------------------------------------------+
                      |       React 19 + TypeScript PWA (SPA)    |
                      |  - Tailwind CSS Industrial Design System |
                      |  - TanStack Query v5 + React Hook Form   |
                      |  - Touch-Friendly Industrial UI          |
                      +------------------------------------------+
                                           |
                                           | REST JSON API (/api/v1)
                                           v
                      +------------------------------------------+
                      |             Reverse Proxy / Nginx        |
                      |      - SSL Termination & Rate Limiting   |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |             FastAPI Application          |
                      |  - Modular Monolith Architecture         |
                      |  - Domain-Driven Design (DDD)            |
                      |  - SQLAlchemy 2.0 Async / Sync Engine    |
                      |  - Centralized State Machine Engine      |
                      |  - Granular RBAC Middleware              |
                      +------------------------------------------+
                         /         |              \          \
                        /          |               \          \
                       v           v                v          v
          +---------------+ +---------------+ +----------+ +-------------+
          | PostgreSQL 16 | | Redis Engine  | | S3 / MinIO| | Background  |
          |  (Relational  | |  (Caching,    | | (PO Docs, | | Celery/ARQ  |
          |  ACID Store,  | |  Sessions,    | | Dispatch  | | Async Tasks |
          |   Audit Logs) | |  PubSub)      | |  PDFs)    | | (PDF/OCR)   |
          +---------------+ +---------------+ +----------+ +-------------+
                                   ^
                                   |
                  +----------------------------------+
                  |    FUTURE: Factory Edge Gateway  |
                  |  - OPC-UA / MQTT / Modbus Bridge |
                  |  - Machine Line PLC Telemetry    |
                  |  - Barcode / QR Label Printers   |
                  +----------------------------------+
```

---

### 2. Backend Module Boundaries (Modular Monolith)

The backend is structured into self-contained domain packages:

```
backend/app/
├── core/                   # Shared infrastructure: config, database, security, exceptions, logging
├── api/                    # API v1 router definitions and dependency injections
├── models/                 # SQLAlchemy ORM declarative models with audit mixins
├── schemas/                # Pydantic schemas for request/response validation
├── repositories/           # Database access layer isolating query mechanics
├── services/               # Core business logic, transaction orchestration, and validation
├── domain/                 # Domain invariants, state machine transitions, constants, enums
├── workers/                # Background async task definitions (PDF generation, async alerts)
└── utils/                  # Reusable utilities (number generators, date formatters, file helpers)
```

#### Detailed Domain Modules:
1. **`auth` & `users`:** User authentication, password management, token lifecycle, profile management.
2. **`rbac` & `roles`:** Dynamic roles, permission catalog, role-permission assignments, authorization middleware.
3. **`parties`:** Customer/Vendor directory, credit terms, address profiles, historical ledger.
4. **`products` & `specifications`:** Product taxonomy, dynamic thickness, density, dimensions, finishes, and conversion units.
5. **`sales_orders`:** Commercial order intake (Manual/CAT), line-item management, approval state engine.
6. **`production_memos`:** Production Memo planning, schedule alignment, order-to-memo traceability.
7. **`machines`:** Extrusion line registry, operational state tracking, capacity definitions.
8. **`production`:** Job execution, partial run capture, good/rejected/waste yield accounting.
9. **`value_addition`:** Phase 2 surface processing, CNC carving, lamination tracking.
10. **`packing`:** Bundle/box packaging, packing type classification, packaging completion verification.
11. **`dispatch`:** Vehicle assignment, gate pass generation, PDF dispatch sheets, delivery confirmation.
12. **`dashboards` & `reports`:** Real-time analytics, party-wise, thickness-wise, density-wise aggregation engines.
13. **`audit`:** Enterprise audit logging interceptor for all transactional mutations.
14. **`files`:** Secure document upload, MIME validation, storage abstraction (Local/S3/MinIO).

---

### 3. Frontend Architecture

The client application is built with modern web technologies adhering to industrial usability requirements:

* **Framework:** React 19 + TypeScript + Vite.
* **Routing:** React Router v7 with role-based Route Guards (`ProtectedRoute`, `PermissionGate`).
* **State Management & Server Cache:** TanStack Query v5 with optimistic updates, cache invalidation on mutations, and background polling for shop-floor views.
* **Forms & Validation:** React Hook Form paired with Zod schemas matching backend Pydantic definitions.
* **Component Architecture:** Modern Industrial Design System using Tailwind CSS, Lucide Icons, and accessible UI primitives.
* **Print & Export:** Client-side and server-generated PDF generation for Dispatch Sheets and Production Memos with standard print CSS media queries.

---

### 4. Integration & Extensibility (Future IoT & Machine Integration)

1. **Edge Gateway Interface:** Edge devices (Raspberry Pi / Industrial PC) will communicate via secure MQTT or lightweight HTTPS endpoints on `/api/v1/edge/*`.
2. **PLC Data Ingestion:** Machine run metrics (cycle count, extrusion speed, barrel temperatures, active runtime) can stream directly into the production runs domain without altering user workflow.
3. **ERP / Accounting Sync:** Dedicated Webhook and Event Bridge architecture for bidirectional syncing with Tally, SAP, or custom accounting platforms.
