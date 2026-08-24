# Screen Specification & UI/UX Architecture
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard  

---

### 1. Global UI/UX Standards & Design Tokens

* **Industrial Usability:** High contrast, dense tabular displays, zero distracting animations, keyboard navigability (Tab/Enter/Escape), large touch-friendly action buttons (min 44px height) for shop floor terminals.
* **Palette:**
  * Primary Brand: Industrial Deep Navy (`#0F172A`, `#1E293B`, `#3B82F6`)
  * Neutral Surfaces: Slate Gray (`#F8FAFC`, `#F1F5F9`, `#E2E8F0`, `#334155`)
  * Status Colors:
    * Success / Good / Active: Emerald (`#10B981`, `#059669`)
    * Warning / WIP / Paused: Amber (`#F59E0B`, `#D97706`)
    * Danger / Rejected / Cancelled: Crimson (`#EF4444`, `#DC2626`)
    * Informational / Planned: Indigo / Sky (`#0284C7`, `#6366F1`)
* **State Management Per Screen:** Every data-driven screen implements explicit `Loading`, `Empty`, `Error`, and `Success` feedback components.

---

### 2. Comprehensive Screen Inventory (Screens 01 - 20)

| Screen # | Screen Title | Route URL | Target Roles | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-01** | Login & Auth Gateway | `/login` | Public / All | Secure JWT authentication with role redirection. |
| **SCR-02** | Executive & Ops Dashboard | `/dashboard` | Management, All | Real-time KPI metrics, drill-downs, party/thickness/density charts. |
| **SCR-03** | Party Directory | `/parties` | Sales, Admin, Mgmt | Customer listing with search, filtering, and balance summaries. |
| **SCR-04** | Party Profile & History | `/parties/:id` | Sales, Admin, Mgmt | 360-degree party view: contacts, active orders, dispatches. |
| **SCR-05** | Product & Spec Master | `/products` | Admin, Production, Sales | Products, thicknesses (mm), densities (g/cm³), and sizes. |
| **SCR-06** | Sales Order Directory | `/sales-orders` | Sales, Mgmt, Planning | Master list of customer orders with multi-status filters. |
| **SCR-07** | Create / Edit Sales Order | `/sales-orders/new` | Sales, Admin | Multi-item order intake with PO upload and CAT/Manual selector. |
| **SCR-08** | Sales Order Details & Flow | `/sales-orders/:id` | Sales, Mgmt, Planning | Line-item progress, timeline, approval actions, audit history. |
| **SCR-09** | Production Memo Directory | `/production-memos`| Production, Planning | Overview of all shop-floor manufacturing directives. |
| **SCR-10** | Production Memo Details | `/production-memos/:id`| Production, Supervisor | Line assignment, status transitions, batch progress view. |
| **SCR-11** | Machine Planning Board | `/production/planning`| Production Head, Planner| Extrusion line capacity, active assignments, schedule calendar. |
| **SCR-12** | Shop-Floor Execution Hub | `/production/execution`| Machine Operators, Sup | Big-button operator interface: Start/Pause/Complete, Scrap logs. |
| **SCR-13** | Machine Registry | `/machines` | Production, Admin | Extrusion line status, maintenance logs, hourly capacities. |
| **SCR-14** | Packaging Queue & Logging | `/packing` | Packing Department | Receive completed goods, log bundles (Standard/Raffia/Cardboard). |
| **SCR-15** | Dispatch Queue & Scheduling| `/dispatch` | Dispatch, Logistics | Staged packed goods ready for vehicle loading. |
| **SCR-16** | Dispatch Details & Gate Pass| `/dispatch/:id` | Dispatch, Security | Driver/vehicle details, gate verification, digital signatures. |
| **SCR-17** | Printable Dispatch Sheet | `/dispatch/:id/print`| Dispatch, Logistics | Clean, high-contrast printable/PDF gate pass with barcode/QR. |
| **SCR-18** | Demand & Yield Reports | `/reports` | Management, Sales, Prod | Multi-parameter exportable reports (Party, Thickness, Density). |
| **SCR-19** | User & Role Management | `/admin/users` | Admin | User provisioning, role assignments, account activation. |
| **SCR-20** | Enterprise Audit Trail | `/admin/audit` | Admin, Management | Immutable before/after JSON diffs of all critical actions. |

---

### 3. Screen Specifications (Sample Highlights)

#### Screen 02: Executive & Operations Dashboard (`/dashboard`)
* **Header:** Date-range picker, Plant selector (Future-ready), Refresh trigger.
* **Top KPI Grid (7 Cards with Drilldown):**
  * `Total Orders` $\rightarrow$ links to `/sales-orders`
  * `Pending Production` $\rightarrow$ links to `/production-memos?status=PLANNED`
  * `In-Progress Runs` $\rightarrow$ links to `/production/execution`
  * `Pending Packing` $\rightarrow$ links to `/packing`
  * `Ready for Dispatch` $\rightarrow$ links to `/dispatch?status=READY`
  * `Dispatched Today` $\rightarrow$ links to `/dispatch?status=DISPATCHED`
  * `Delayed Orders` $\rightarrow$ links to `/sales-orders?priority=URGENT`
* **Charts Section:**
  * Bar Chart: Party-wise Demand (Ordered vs. Delivered Sheets).
  * Pie/Donut Chart: Thickness-wise Distribution (5mm, 8mm, 12mm, 18mm, 25mm, 30mm).
  * Bar Chart: Density-wise Volume (0.45, 0.50, 0.55, 0.60 g/cm³).
  * Line Chart: Daily Planned vs. Actual Yield & Scrap %.

#### Screen 12: Shop-Floor Execution Hub (`/production/execution`)
* **Terminal Selector:** Choose active Machine / Extrusion Line.
* **Active Job Card:**
  * Memo Number & Sales Order Reference.
  * Product, Thickness (mm), Density (g/cm³), Sheet Size.
  * Target Quantity vs. Current Cumulative Output (Progress Bar).
* **Operator Action Buttons:**
  * `[ START RUN ]` (Green, min 60px height)
  * `[ PAUSE LINE ]` (Amber, prompts for downtime code: Die Cleaning, Heater Error, Meal Break)
  * `[ COMPLETE BATCH ]` (Blue, modal: enter Good Qty, Scrap Qty, Waste Kg, Operator Signature)
