# Database Design & Entity Relationship Specification
## Project: FixoBoard Manufacturing Management System (MMS)
**Database Engine:** PostgreSQL 16  
**ORM:** SQLAlchemy 2.0 (Async Engine)  
**Schema Version:** 1.0.0  

---

### 1. Database Conventions & Standards

1. **Primary Keys:** UUID v4 (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`) for distributed scalability and safety.
2. **Business Identifiers:** Human-readable unique codes (`order_number`, `memo_number`, `dispatch_number`, `machine_code`) generated via sequences.
3. **Audit Columns:** Every stateful/transactional table inherits standard audit mixins:
   * `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   * `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   * `created_by UUID REFERENCES users(id)`
   * `updated_by UUID REFERENCES users(id)`
   * `version INT NOT NULL DEFAULT 1` (Optimistic locking)
4. **Data Integrity:** Strict Foreign Keys, Check Constraints (`CHECK (ordered_quantity > 0)`), NOT NULL invariants, and compound indexes on filter predicates.
5. **No Soft Deletion of Transaction Records:** Status fields (`CANCELLED`, `REJECTED`, `REVERSED`) are used. Master records retain `is_active BOOLEAN DEFAULT TRUE`.

---

### 2. Entity Relational Diagram (Textual Representation)

```
 [ users ] ──< [ user_roles ] >── [ roles ] ──< [ role_permissions ] >── [ permissions ]
     │
     ├──< [ audit_logs ]
     │
 [ parties ] ──< [ sales_orders ] ──< [ sales_order_items ] ──< [ production_memos ]
                       │                       │                          │
                       │                       ├─> [ products ]           ├─> [ machines ]
                       │                       ├─> [ thicknesses ]        │
                       │                       ├─> [ densities ]          ├──< [ production_runs ]
                       │                       ├─> [ sizes ]              │          │
                       │                       └─> [ finishes ]           │          │
                       │                                                  │          v
                       └──< [ dispatches ] <── [ dispatch_items ] <── [ packing_records ]
```

---

### 3. Detailed Table Schema Definitions

#### 3.1 Authentication & Master Tables
```sql
-- 1. users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    phone_number VARCHAR(20),
    department VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- MAIN_HEAD, SALES, PRODUCTION, PACKING, DISPATCH, ADMIN
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g. sales_orders:approve
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

-- 4. role_permissions
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. user_roles
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 6. parties (Customers / Clients)
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_code VARCHAR(30) UNIQUE NOT NULL,
    party_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    billing_address TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    gst_number VARCHAR(20),
    payment_terms VARCHAR(100),
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
CREATE INDEX idx_parties_code ON parties(party_code);
CREATE INDEX idx_parties_name ON parties(party_name);

-- 7. product_categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 8. products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES product_categories(id) ON DELETE RESTRICT,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'Sheets', -- Sheets, Pcs, Rft, SqM
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. thicknesses (Configurable Master)
CREATE TABLE thicknesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value_mm NUMERIC(5, 2) UNIQUE NOT NULL, -- 5.00, 8.00, 12.00, 18.00, 25.00, 30.00
    display_label VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. densities (Configurable Master)
CREATE TABLE densities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value_g_cm3 NUMERIC(4, 3) UNIQUE NOT NULL, -- 0.450, 0.500, 0.550, 0.600
    display_label VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. product_sizes (Configurable Master)
CREATE TABLE product_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    length_mm NUMERIC(8, 2) NOT NULL,
    width_mm NUMERIC(8, 2) NOT NULL,
    display_label VARCHAR(50) NOT NULL, -- e.g., '8 ft x 4 ft (2440 x 1220 mm)'
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 12. product_finishes / grades
CREATE TABLE product_finishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'Standard Smooth', 'Matte', 'Wood Grain', 'Virgin Core'
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 13. machines (Extrusion Lines & Stations)
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_code VARCHAR(50) UNIQUE NOT NULL,
    machine_name VARCHAR(100) NOT NULL,
    line_name VARCHAR(50) NOT NULL,
    machine_type VARCHAR(50) NOT NULL, -- 'PVC_EXTRUDER', 'WPC_BOARD_LINE', 'DOOR_FRAME_LINE'
    rated_capacity_hourly NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, RUNNING, IDLE, MAINTENANCE, OFFLINE
    location VARCHAR(100),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. packing_types (Configurable Master)
CREATE TABLE packing_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- STANDARD, RAFFIA, CARDBOARD, CORNER_GUARDED
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 15. files / attachments
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 3.2 Core Manufacturing Transaction Tables
```sql
-- 16. sales_orders
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- SO-2026-000001
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    order_source VARCHAR(30) NOT NULL DEFAULT 'MANUAL', -- MANUAL, CAT, EMAIL, PHONE, OTHER
    customer_po_number VARCHAR(100),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED, PARTIALLY_PRODUCTION, IN_PRODUCTION, PARTIALLY_DISPATCHED, COMPLETED
    remarks TEXT,
    attachment_id UUID REFERENCES uploaded_files(id),
    total_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_so_party ON sales_orders(party_id);
CREATE INDEX idx_so_status ON sales_orders(status);
CREATE INDEX idx_so_date ON sales_orders(order_date);

-- 17. sales_order_items
CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    thickness_id UUID NOT NULL REFERENCES thicknesses(id) ON DELETE RESTRICT,
    density_id UUID NOT NULL REFERENCES densities(id) ON DELETE RESTRICT,
    size_id UUID REFERENCES product_sizes(id) ON DELETE RESTRICT,
    finish_id UUID REFERENCES product_finishes(id) ON DELETE RESTRICT,
    ordered_quantity NUMERIC(10, 2) NOT NULL CHECK (ordered_quantity > 0),
    produced_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (produced_quantity >= 0),
    packed_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (packed_quantity >= 0),
    dispatched_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (dispatched_quantity >= 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'Sheets',
    unit_price NUMERIC(10, 2) DEFAULT 0.00,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_soi_order ON sales_order_items(sales_order_id);
CREATE INDEX idx_soi_specs ON sales_order_items(product_id, thickness_id, density_id);

-- 18. production_memos (Phase 1)
CREATE TABLE production_memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memo_number VARCHAR(50) UNIQUE NOT NULL, -- PM-2026-000001
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
    sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id) ON DELETE RESTRICT,
    planned_quantity NUMERIC(10, 2) NOT NULL CHECK (planned_quantity > 0),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    required_date DATE NOT NULL,
    target_machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    production_stage VARCHAR(30) NOT NULL DEFAULT 'EXTRUSION_PHASE_1',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, PLANNED, MACHINE_ASSIGNED, RELEASED, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
    remarks TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pm_so ON production_memos(sales_order_id);
CREATE INDEX idx_pm_status ON production_memos(status);
CREATE INDEX idx_pm_machine ON production_memos(target_machine_id);

-- 19. production_runs (Shop-floor execution batches)
CREATE TABLE production_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_memo_id UUID NOT NULL REFERENCES production_memos(id) ON DELETE RESTRICT,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    shift VARCHAR(20) NOT NULL DEFAULT 'DAY', -- DAY, NIGHT, GENERAL
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    planned_quantity NUMERIC(10, 2) NOT NULL,
    good_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (good_quantity >= 0),
    rejected_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (rejected_quantity >= 0),
    waste_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (waste_kg >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
    rejection_reason TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pr_memo ON production_runs(production_memo_id);
CREATE INDEX idx_pr_machine ON production_runs(machine_id);

-- 20. packing_records
CREATE TABLE packing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    packing_number VARCHAR(50) UNIQUE NOT NULL, -- PKG-2026-000001
    sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id) ON DELETE RESTRICT,
    production_run_id UUID REFERENCES production_runs(id) ON DELETE SET NULL,
    packing_type_id UUID NOT NULL REFERENCES packing_types(id) ON DELETE RESTRICT,
    packed_quantity NUMERIC(10, 2) NOT NULL CHECK (packed_quantity > 0),
    package_count INT NOT NULL DEFAULT 1 CHECK (package_count > 0),
    pieces_per_package INT,
    packed_by UUID NOT NULL REFERENCES users(id),
    packed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- PENDING, IN_PROGRESS, COMPLETED, REJECTED
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pkg_soi ON packing_records(sales_order_item_id);

-- 21. dispatches
CREATE TABLE dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_number VARCHAR(50) UNIQUE NOT NULL, -- DS-2026-000001
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(20),
    transporter VARCHAR(100),
    lr_number VARCHAR(50),
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, READY, LOADING, DISPATCHED, CANCELLED
    remarks TEXT,
    created_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    gate_out_time TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_disp_so ON dispatches(sales_order_id);
CREATE INDEX idx_disp_party ON dispatches(party_id);
CREATE INDEX idx_disp_status ON dispatches(status);

-- 22. dispatch_items
CREATE TABLE dispatch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
    packing_id UUID NOT NULL REFERENCES packing_records(id) ON DELETE RESTRICT,
    sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id) ON DELETE RESTRICT,
    dispatched_quantity NUMERIC(10, 2) NOT NULL CHECK (dispatched_quantity > 0),
    package_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_di_dispatch ON dispatch_items(dispatch_id);

-- 23. audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_time ON audit_logs(created_at);

-- 24. system_settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
