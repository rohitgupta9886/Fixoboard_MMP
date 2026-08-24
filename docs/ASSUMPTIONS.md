# Business Assumptions & Configuration Matrix
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard  
**Status:** Working Reference Document  

---

### 1. Ambiguous Requirements & Configurable Architectural Assumptions

To ensure the system remains resilient and production-ready without making arbitrary or unchangeable assumptions, all ambiguous client details have been implemented via configurable system parameters and master tables.

| # | Topic / Requirement Area | Handwritten Note / Ambiguity | System Implementation Strategy (Configurable) | Action Required from Client |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Order Source ("CAT + Manual")** | The phrase *"CAT + Manual"* appears in handwritten notes. The exact meaning of "CAT" (e.g. Catalog, Category Order, Customer App Terminal, Commercial Account Tracker) is unspecified. | Implemented as a configurable Order Source master: `MANUAL`, `CAT`, `EMAIL`, `PHONE`, `EDI`, `OTHER`. System settings allow renaming or reclassifying "CAT" without code modification. | Client to confirm what "CAT" stands for in their commercial workflow. |
| **2** | **Thickness Dimensions** | Mentioned examples: 25mm, 30mm. | Modeled as a dedicated `thicknesses` table allowing arbitrary thicknesses (e.g. 4mm, 5mm, 6mm, 8mm, 11mm, 12mm, 17mm, 18mm, 25mm, 30mm) to be added/edited by Admin. | Client to provide their full standard catalogue list of manufactured gauges. |
| **3** | **Density Dimensions** | Mentioned examples: 0.45, 0.50. | Modeled as a dedicated `densities` table allowing arbitrary specific gravities (e.g. 0.40, 0.45, 0.48, 0.50, 0.55, 0.60, 0.70 g/cm³) to be managed dynamically. | Client to provide full standard density grades. |
| **4** | **Production Measurement Units** | WPC Ply vs. WPC Doors vs. Door Frames use different units (Sheets vs. Pcs vs. Rft/Meters). | Product master supports configurable unit of measure (`Sheets`, `Pieces`, `Running Feet`, `Sq. Meter`, `Kilograms`) per product category. | Confirm unit preferences per product family. |
| **5** | **Machine Assignment Protocol** | Phase 1 requirement specifies manual machine selection. | Implemented as manual supervisor assignment. State machine guards prevent execution without assigned line. Domain layer is structured to accept algorithmic dispatching in future phases. | Phase 1 manual workflow approved. |
| **6** | **Phase 2 Value Addition** | Value addition is designated as Phase 2. | Domain and database tables (`value_addition_memos`, `value_addition_runs`) and transition hooks are scaffolded cleanly, allowing direct bypass to Packing in Phase 1 or optional Phase 2 routing. | Detailed routing specs for lamination / CNC to be finalized for Phase 2. |
| **7** | **Packaging Rules & Types** | Mentioned initial types: Standard, Raffia, Cardboard. | Modeled as dynamic `packing_types` master. Allows adding new packaging methods (e.g., Wooden Pallet, Shrink Wrap) via UI. | Confirm bundle count packing standards per thickness. |
| **8** | **Multi-Plant / Multi-Factory** | Current operations run in one manufacturing plant. | Data model includes plant/location identifiers (`location`, `plant_id`) to allow instant multi-plant expansion without database restructuring. | Single-plant configured by default. |
| **9** | **Raw Material / Inventory Tracking** | Formulation chemistry (PVC resin, foaming agents, calcium carbonate) not in Phase 1 scope. | Focused on finished goods and WIP batch progress. Inventory modules can plug directly into `production_runs` in Phase 2. | Raw material inventory deferred to Phase 2. |
| **10** | **AI PO Extraction** | AI-assisted PO extraction is optional/enhancement. | Architected with asynchronous human-in-the-loop validation (`extraction_jobs` $\rightarrow$ Draft SO review $\rightarrow$ Approved SO). Never auto-approves. | Provide 10-15 sample POs to train/tune extraction prompt templates. |
