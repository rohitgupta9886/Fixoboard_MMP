# Data Flow Architecture (DFD)
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard  

---

### 1. Data Flow Pipelines

#### DF-01: End-to-End Manufacturing & Commercial Lifecycle
```
[ Customer PO ]
      │
      ▼
( 1. Ingest Sales Order ) ───> [ sales_orders ] & [ sales_order_items ]
      │
      ▼
( 2. Management Approval ) ───> State: APPROVED, Status Log & Audit
      │
      ▼
( 3. Plan Production Memo ) ───> [ production_memos ] (Link to SO Line Item)
      │
      ▼
( 4. Line Allocation ) ─────> [ machines ] (Status: RUNNING)
      │
      ▼
( 5. Execution Run ) ────────> [ production_runs ] (Records: Good, Scrap, Waste)
      │
      ▼
( 6. Packing Operation ) ────> [ packing_records ] (Standard / Raffia / Cardboard)
      │
      ▼
( 7. Dispatch Loading ) ─────> [ dispatches ] & [ dispatch_items ]
      │
      ▼
( 8. Gate Out Confirmation ) ──> [ sales_orders ] (State: COMPLETED / PARTIALLY_DISPATCHED)
```

---

#### DF-02: Multi-Dimensional Master Data Propagation to Order Items
```
 [ parties ] ──────────┐
 [ products ] ─────────┼───> [ sales_order_items ] ───> [ production_memos ]
 [ thicknesses ] ──────┤            │                            │
 [ densities ] ────────┤            ▼                            ▼
 [ product_sizes ] ────┤     Calculated Mass (kg)        Extrusion Run Targets
 [ product_finishes ] ─┘     = L x W x T x Density       = Good Sheets Required
```

---

#### DF-03: Production Execution & Yield Ledger Flow
```
 [ production_memos ] (Planned: 1000 Sheets)
           │
           ├─── Run 1 (Shift A, Line 1): Good=400, Rejected=15, Waste=8.5kg
           ├─── Run 2 (Shift B, Line 1): Good=350, Rejected=10, Waste=6.2kg
           └─── Run 3 (Shift A, Line 2): Good=250, Rejected=5,  Waste=3.1kg
                                         ──────────────────────────────────
                                         Total Good: 1000 -> Memo COMPLETED
                                         Total Scrap: 30, Total Waste: 17.8kg
```

---

#### DF-04: Packaging to Dispatch Queue Allocation
```
 [ production_runs ] ──> Produced Good Qty (1000)
                               │
                               ▼
 [ packing_records ] ──> Packaged in 50 Bundles of 20 Sheets (Raffia Mode)
                               │
                               ▼
 [ dispatches ] ───────> Loading Vehicle MH-12-AB-1234
                         Item: 50 Bundles (1000 Sheets)
                         Gate Out Confirmed ──> Dispatched
```

---

#### DF-05: Real-Time Aggregate Analytics Engine
```
 [ sales_order_items ] ──┐
 [ production_runs ] ────┼──> [ Analytics Aggregator Engine ] ──> Real-Time Dashboard
 [ packing_records ] ────┤       (PostgreSQL GroupBy / Views)      - Party Demand
 [ dispatch_items ] ─────┘                                         - Thickness Breakdown
                                                                   - Density Breakdown
                                                                   - Yield / Scrap Ratios
```
