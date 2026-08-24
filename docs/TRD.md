# Technical Requirements Document (TRD)
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard  
**Status:** Approved Technical Architecture  

---

### 1. Technology Selection & Stack Rationale

| Component | Technology | Version | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript | 19.x / 5.x | Strong static typing, industrial ecosystem, modular component model. |
| **Frontend Build Tool** | Vite | 6.x | Near-instant HMR, optimized tree-shaking, fast production bundling. |
| **Routing** | React Router | 7.x | Nested layout routing, client-side route guards, programmatic navigation. |
| **Data Fetching / Cache** | TanStack Query | 5.x | Automatic cache invalidation, background refetching for shop-floor views. |
| **Form Management** | React Hook Form + Zod | 7.x / 3.x | Uncontrolled components for maximum typing speed, schema-driven validation. |
| **Styling** | Tailwind CSS + Lucide | 3.4+ / 0.4+ | Utility-first industrial UI system, predictable typography, high density. |
| **Backend API** | FastAPI (Python) | 0.115+ | High-performance ASGI framework, automatic OpenAPI documentation, async support. |
| **ORM / Data Access** | SQLAlchemy (Async) | 2.0+ | Modern 2.0 type-safe query syntax, Unit of Work, robust connection pooling. |
| **Database Migrations** | Alembic | 1.13+ | Versioned, auditable, reversible database schema evolution. |
| **Database Engine** | PostgreSQL | 16.x | ACID compliance, JSONB audit stores, sequence generators, index optimization. |
| **Cache & Pub/Sub** | Redis | 7.2+ | In-memory token blacklisting, sequence locks, distributed caching. |
| **Task Queue** | ARQ / Celery | Latest | Lightweight async workers for PDF rendering, scheduled metrics caching. |
| **Containerization** | Docker & Compose | 26.x / 2.x | Multi-stage reproducible builds, isolated network topologies. |

---

### 2. Authentication & Authorization (RBAC) Specification

#### JWT Strategy:
1. **Access Token:** Short-lived (15 minutes), containing `sub` (User UUID), `username`, `roles`, and `permissions` claims.
2. **Refresh Token:** Long-lived (7 days), stored in encrypted database store with device fingerprinting and single-use rotation.
3. **Password Security:** Argon2id / BCrypt with cost factor 12.
4. **Permission Engine:** Hierarchical format `domain:action` (e.g., `sales_orders:approve`, `production:assign_machine`, `dispatch:confirm`).

#### Predefined Role Permissions Matrix:

| Permission / Action | MAIN_HEAD | SALES | PRODUCTION | PACKING | DISPATCH | ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `parties:read` / `create` / `update` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `products:read` / `create` / `update` | ✅ | 👁️ (Read) | 👁️ (Read) | 👁️ (Read) | 👁️ (Read) | ✅ |
| `sales_orders:create` / `update` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `sales_orders:submit` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `sales_orders:approve` / `reject` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `production_memos:create` / `plan` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `machines:assign` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `production:start` / `pause` / `run` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `packing:execute` / `complete` | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `dispatch:create` / `load` / `confirm` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `dashboards:view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `reports:demand` / `export` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `users:manage` / `audit:view` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### 3. Non-Functional Specifications & SLA Targets

1. **Latency:** 95th percentile API response time $< 150\text{ms}$ for standard CRUD; $< 500\text{ms}$ for complex aggregated demand reports.
2. **Concurrency:** Tuned to support 100+ active factory floor sessions and office users simultaneously with connection pooling (max 50 pool size, 20 overflow).
3. **Availability:** $99.9\%$ operational uptime for factory floor line shifts.
4. **Data Durability & Backups:** Daily automated PostgreSQL WAL archiving + nightly logical dumps.
5. **Security Hardening:** OWASP Top 10 compliance, parameter binding (zero raw SQL concatenation), XSS sanitization, CSP headers, strict CORS, rate-limiting on `/api/v1/auth/*` (5 req/min/IP).
