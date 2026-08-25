import json
import logging
from decimal import Decimal
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.ai_interaction import AIConversation, AIMessage
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.party import Party
from app.models.production_memo import ProductionMemo
from app.models.production_run import ProductionRun
from app.models.machine import Machine
from app.models.packing import PackingRecord
from app.models.dispatch import Dispatch
from app.models.product import Product, ProductCategory
from app.models.scanned_order import ScannedOrder
from app.models.specification import Thickness, Density, PackingType
from app.models.user import User
from app.schemas.ai_advisor import AIAdvisorRequest, AIAdvisorResponse, ProductRecommendationItem

logger = logging.getLogger(__name__)

# Verified FixoBoard Technical Specs & Recommendations
FIXOBOARD_KNOWLEDGE_BASE = [
    {
        "category_code": "PVC_WPC_PLY",
        "product_code": "PROD-PVC-001",
        "product_name": "FixoBoard 100% Lead-Free PVC / WPC Ply",
        "suitable_applications": ["Kitchen Carcass", "Bathroom Cabinets", "Wardrobes", "Partitions", "Furniture", "Shuttering & Centering"],
        "recommended_thickness": "18 mm (for load-bearing carcasses / doors) / 12 mm / 6 mm (for back panels)",
        "recommended_density": "0.50 g/cm³ - 0.60 g/cm³",
        "verified_rationale": [
            "100% Lead-Free & Non-Toxic formulation (SGS Lab Certified).",
            "100% Waterproof & Moisture Resistant - zero swelling in continuous water contact.",
            "100% Termite Proof & Borer Proof - eliminates costly chemical pest treatments.",
            "Fire Retardant (Self-extinguishing Class V0 properties).",
            "Superior screw withdrawal force & high surface hardness.",
            "100% Recyclable green alternative to natural timber, MDF, and Particle Board."
        ],
        "certifications": ["SGS Certified Lead-Free", "ISO 9001:2015", "Limca Book of Records Listed", "ROHS Compliant"],
        "advantages_vs_plywood": [
            "Plywood delaminates and swells in moisture; FixoBoard maintains 0.0% water absorption.",
            "Plywood requires termite pest control; FixoBoard is immune to biological infestation.",
            "Zero hazardous formaldehyde or lead off-gassing."
        ],
        "estimated_price_range": "₹85 - ₹165 per sq. ft. depending on gauge & density",
        "keywords": ["kitchen", "carcass", "waterproof", "plywood", "termite", "moisture", "cabinet", "wardrobe", "ply", "pvc board", "wpc sheet"]
    },
    {
        "category_code": "WPC_DOORS",
        "product_code": "PROD-DOOR-001",
        "product_name": "FixoBoard Solid Core WPC Doors",
        "suitable_applications": ["Bathroom Doors", "Bedroom Doors", "Balcony Doors", "Commercial Offices", "Hospital Doors"],
        "recommended_thickness": "28 mm / 30 mm / 32 mm",
        "recommended_density": "0.55 g/cm³ - 0.60 g/cm³ Solid Core",
        "verified_rationale": [
            "Solid extruded composite core with zero hollow pockets or warping.",
            "100% waterproof - ideal for high-humidity bathroom doors.",
            "High impact strength and excellent acoustic insulation.",
            "Ready to paint, polish, laminate, or CNC carve."
        ],
        "certifications": ["SGS Tested", "Fire Retardant", "Lead-Free"],
        "advantages_vs_plywood": [
            "Flush doors rot at bottom in bathrooms; WPC doors last a lifetime without rotting.",
            "Zero joint cracking or seasonal expansion."
        ],
        "estimated_price_range": "₹1,850 - ₹4,500 per piece depending on dimension & finish",
        "keywords": ["door", "bathroom door", "flush door", "solid door", "bedroom door", "waterproof door", "wpc door"]
    },
    {
        "category_code": "PRELAM_PLY",
        "product_code": "PROD-PRELAM-001",
        "product_name": "FixoBoard Prelaminate Textured Board",
        "suitable_applications": ["Designer Wardrobes", "Modular Kitchen Shutters", "Office Workstations", "Retail Fixtures", "Wall Paneling"],
        "recommended_thickness": "12 mm / 18 mm",
        "recommended_density": "0.55 g/cm³",
        "verified_rationale": [
            "Factory fused decorative surface with zero manual adhesive bubble risk.",
            "High scratch & stain resistance.",
            "Available in contemporary woodgrain, solid pastels, and metallic textures.",
            "Edges easily finished with matching PVC edge-banding tapes."
        ],
        "certifications": ["SGS Certified Surface Wear", "Lead-Free"],
        "advantages_vs_plywood": [
            "Saves 50% labor and time compared to manual mica/laminate pressing.",
            "Zero chemical smell or volatile adhesive fumes."
        ],
        "estimated_price_range": "₹110 - ₹195 per sq. ft.",
        "keywords": ["prelam", "prelaminate", "shutter", "finish", "decorative", "texture", "woodgrain", "wardrobe shutter"]
    },
    {
        "category_code": "DOOR_FRAMES",
        "product_code": "PROD-FRAME-001",
        "product_name": "FixoBoard Solid WPC Door Frames (Chaukhat)",
        "suitable_applications": ["Door Frame / Chaukhat Replacement for Residential & Commercial Buildings"],
        "recommended_thickness": "3x2 inch, 4x2 inch, 5x2.5 inch Solid Profiles",
        "recommended_density": "0.60 g/cm³ High Density Extrusion",
        "verified_rationale": [
            "Direct substitute for traditional teak, sal, or concrete door frames.",
            "Never cracks, rots, or attracts termites in wet walls.",
            "Easy screw holding for heavy hinges and hardware.",
            "Pre-rebated profile for seamless door fitting."
        ],
        "certifications": ["Heavy Duty Screw Holding Tested", "Lead Free"],
        "advantages_vs_plywood": [
            "Natural timber chaukhats bend and get eaten by termites; WPC Chaukhat is permanent.",
            "Saves cutting natural forest trees."
        ],
        "estimated_price_range": "₹110 - ₹180 per running foot",
        "keywords": ["chaukhat", "door frame", "frame", "frame profile", "fitting"]
    },
    {
        "category_code": "PVC_MARBLE",
        "product_code": "PROD-MARBLE-001",
        "product_name": "FixoBoard UV Gloss PVC Marble Sheets",
        "suitable_applications": ["Living Room Accent Walls", "TV Units", "Elevator Lobbies", "Bathroom Wall Cladding", "Hotel Receptions"],
        "recommended_thickness": "3.0 mm / 3.8 mm",
        "recommended_density": "High Gloss UV Topcoat",
        "verified_rationale": [
            "Luxurious natural Italian marble appearance at 1/10th the cost and weight.",
            "UV coating protects against color fading, scratches, and yellowing.",
            "100% waterproof and easily cleaned with a damp cloth.",
            "Direct installation over plastered walls with silicone / hybrid polymer adhesives."
        ],
        "certifications": ["UV Class 1 Fire Rated", "Stain Proof Tested"],
        "advantages_vs_plywood": [
            "Replaces heavy, expensive, porous stone with lightweight seamless sheets.",
            "Instant installation without masonry work."
        ],
        "estimated_price_range": "₹1,400 - ₹2,600 per 8x4 ft sheet",
        "keywords": ["marble", "pvc marble", "wall panel", "wall cladding", "tv unit", "accent wall", "gloss sheet", "uv sheet"]
    }
]


class AIAdvisorService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_conversation(self, session_id: str, visitor_name: Optional[str] = None) -> AIConversation:
        stmt = select(AIConversation).where(AIConversation.session_id == session_id)
        res = await self.session.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            conv = AIConversation(
                session_id=session_id,
                visitor_name=visitor_name,
            )
            self.session.add(conv)
            await self.session.flush()
        return conv

    async def fetch_live_database_snapshot(self) -> Dict[str, Any]:
        """
        Gathers comprehensive live database intelligence across all plant operations.
        """
        snapshot: Dict[str, Any] = {
            "sales_orders": [],
            "machines": [],
            "production_memos": [],
            "production_runs": [],
            "packing_records": [],
            "dispatches": [],
            "parties": [],
            "products": [],
            "specifications": {
                "thicknesses": [],
                "densities": [],
                "packing_types": [],
            },
            "scanned_orders": [],
            "users": [],
            "kpis": {},
        }

        try:
            # 1. Sales Orders & Line Items
            so_stmt = (
                select(SalesOrder)
                .options(
                    selectinload(SalesOrder.party),
                    selectinload(SalesOrder.items).selectinload(SalesOrderItem.product),
                    selectinload(SalesOrder.items).selectinload(SalesOrderItem.thickness),
                    selectinload(SalesOrder.items).selectinload(SalesOrderItem.density),
                )
                .order_by(SalesOrder.created_at.desc())
                .limit(50)
            )
            so_res = await self.session.execute(so_stmt)
            orders = so_res.scalars().all()
            
            total_revenue = 0.0
            for o in orders:
                party_name = o.party.party_name if o.party else "Direct / Unassigned"
                item_summaries = []
                order_amount = 0.0
                
                for it in (o.items or []):
                    prod_name = it.product.product_name if (hasattr(it, 'product') and it.product) else "PVC Sheet"
                    th_str = f"{it.thickness.value_mm}mm" if (hasattr(it, 'thickness') and it.thickness) else ""
                    qty = float(it.ordered_quantity or 0)
                    price = float(it.unit_price or 0)
                    item_summaries.append(f"{prod_name} {th_str} ({qty:.0f} pcs @ ₹{price:,.2f})".strip())
                    order_amount += qty * price
                
                total_revenue += order_amount
                snapshot["sales_orders"].append({
                    "order_number": o.order_number,
                    "party": party_name,
                    "status": str(o.status),
                    "priority": str(o.priority or "NORMAL"),
                    "total_amount": order_amount,
                    "total_quantity": float(o.total_quantity or 0) or sum(float(it.ordered_quantity or 0) for it in (o.items or [])),
                    "order_date": str(o.order_date) if o.order_date else None,
                    "required_date": str(o.required_date) if o.required_date else None,
                    "customer_po_number": o.customer_po_number,
                    "items": item_summaries,
                })

            # 2. Machines / Extrusion Lines
            mach_stmt = select(Machine).order_by(Machine.machine_code.asc())
            mach_res = await self.session.execute(mach_stmt)
            machines = mach_res.scalars().all()
            for m in machines:
                snapshot["machines"].append({
                    "machine_code": m.machine_code,
                    "name": m.machine_name,
                    "line_name": m.line_name,
                    "machine_type": m.machine_type,
                    "status": str(m.status),
                    "capacity_hourly": float(m.rated_capacity_hourly or 0),
                    "location": m.location,
                })

            # 3. Production Memos
            memo_stmt = (
                select(ProductionMemo)
                .options(
                    selectinload(ProductionMemo.sales_order),
                    selectinload(ProductionMemo.target_machine),
                )
                .order_by(ProductionMemo.created_at.desc())
                .limit(30)
            )
            memo_res = await self.session.execute(memo_stmt)
            memos = memo_res.scalars().all()
            for memo in memos:
                so_num = memo.sales_order.order_number if memo.sales_order else "N/A"
                mach_name = memo.target_machine.machine_name if memo.target_machine else "Extrusion Line"
                snapshot["production_memos"].append({
                    "memo_number": memo.memo_number,
                    "sales_order": so_num,
                    "machine": mach_name,
                    "planned_quantity": float(memo.planned_quantity or 0),
                    "status": str(memo.status),
                    "priority": str(memo.priority or "NORMAL"),
                    "required_date": str(memo.required_date) if memo.required_date else None,
                    "stage": memo.production_stage,
                })

            # 4. Production Runs
            run_stmt = (
                select(ProductionRun)
                .options(
                    selectinload(ProductionRun.machine),
                    selectinload(ProductionRun.operator),
                )
                .order_by(ProductionRun.created_at.desc())
                .limit(30)
            )
            run_res = await self.session.execute(run_stmt)
            runs = run_res.scalars().all()
            total_produced = sum(float(r.good_quantity or 0) for r in runs)
            total_waste = sum(float(r.waste_kg or 0) for r in runs)
            for r in runs:
                mach_name = r.machine.machine_name if r.machine else "Line 1"
                op_name = r.operator.full_name if r.operator else "Shift Operator"
                snapshot["production_runs"].append({
                    "run_id": str(r.id),
                    "machine": mach_name,
                    "operator": op_name,
                    "shift": r.shift,
                    "good_quantity": float(r.good_quantity or 0),
                    "rejected_quantity": float(r.rejected_quantity or 0),
                    "waste_kg": float(r.waste_kg or 0),
                    "status": str(r.status),
                })

            # 5. Packaging Records
            pack_stmt = (
                select(PackingRecord)
                .options(
                    selectinload(PackingRecord.packing_type),
                    selectinload(PackingRecord.packer),
                )
                .order_by(PackingRecord.created_at.desc())
                .limit(30)
            )
            pack_res = await self.session.execute(pack_stmt)
            packs = pack_res.scalars().all()
            for p in packs:
                pt_name = p.packing_type.name if p.packing_type else "Standard Wrapping"
                packer_name = p.packer.full_name if p.packer else "Packer"
                snapshot["packing_records"].append({
                    "packing_number": p.packing_number,
                    "package_count": p.package_count,
                    "packed_quantity": float(p.packed_quantity or 0),
                    "packing_type": pt_name,
                    "packed_by": packer_name,
                    "status": str(p.status),
                })

            # 6. Dispatches
            disp_stmt = (
                select(Dispatch)
                .options(
                    selectinload(Dispatch.party),
                    selectinload(Dispatch.sales_order),
                )
                .order_by(Dispatch.created_at.desc())
                .limit(30)
            )
            disp_res = await self.session.execute(disp_stmt)
            dispatches = disp_res.scalars().all()
            for d in dispatches:
                p_name = d.party.party_name if d.party else "N/A"
                so_num = d.sales_order.order_number if d.sales_order else "N/A"
                snapshot["dispatches"].append({
                    "dispatch_number": d.dispatch_number,
                    "party": p_name,
                    "sales_order": so_num,
                    "vehicle_number": d.vehicle_number,
                    "driver_name": d.driver_name,
                    "driver_phone": d.driver_phone,
                    "transporter": d.transporter,
                    "status": str(d.status),
                    "dispatch_date": str(d.dispatch_date) if d.dispatch_date else None,
                })

            # 7. Customer Parties
            party_stmt = select(Party).limit(50)
            party_res = await self.session.execute(party_stmt)
            parties = party_res.scalars().all()
            for pt in parties:
                snapshot["parties"].append({
                    "party_code": pt.party_code,
                    "party_name": pt.party_name,
                    "contact_person": pt.contact_person,
                    "phone": pt.phone,
                    "email": pt.email,
                    "credit_limit": float(pt.credit_limit or 0),
                    "gst_number": pt.gst_number,
                    "billing_address": pt.billing_address,
                })

            # 8. Master Products & Categories
            prod_stmt = select(Product).options(selectinload(Product.category)).limit(30)
            prod_res = await self.session.execute(prod_stmt)
            products = prod_res.scalars().all()
            for pr in products:
                snapshot["products"].append({
                    "product_code": pr.product_code,
                    "product_name": pr.product_name,
                    "category": pr.category.name if pr.category else "Standard PVC",
                    "unit": pr.unit,
                    "description": pr.description,
                })

            # 9. Master Specifications
            th_res = await self.session.execute(select(Thickness).where(Thickness.is_active == True))
            snapshot["specifications"]["thicknesses"] = [float(t.value_mm) for t in th_res.scalars().all()]

            den_res = await self.session.execute(select(Density).where(Density.is_active == True))
            snapshot["specifications"]["densities"] = [float(d.value_g_cm3) for d in den_res.scalars().all()]

            pack_type_res = await self.session.execute(select(PackingType).where(PackingType.is_active == True))
            snapshot["specifications"]["packing_types"] = [pt.name for pt in pack_type_res.scalars().all()]

            # 10. Scanned OCR Orders
            scan_stmt = (
                select(ScannedOrder)
                .options(selectinload(ScannedOrder.items))
                .order_by(ScannedOrder.created_at.desc())
                .limit(15)
            )
            scan_res = await self.session.execute(scan_stmt)
            scans = scan_res.scalars().all()
            for sc in scans:
                total_scanned_qty = sum(float(it.quantity or 0) for it in (sc.items or []))
                snapshot["scanned_orders"].append({
                    "scan_number": sc.scan_number,
                    "customer_name": sc.extracted_customer_name,
                    "sheets": total_scanned_qty,
                    "confidence": float(sc.overall_confidence or 0),
                    "status": str(sc.status),
                })

            # 11. Users & Roles
            user_stmt = select(User).options(selectinload(User.roles)).limit(30)
            user_res = await self.session.execute(user_stmt)
            users = user_res.scalars().all()
            for u in users:
                role_names = [r.name for r in (u.roles or [])]
                snapshot["users"].append({
                    "username": u.username,
                    "full_name": u.full_name,
                    "email": u.email,
                    "roles": role_names,
                    "department": getattr(u, 'department', None),
                    "is_active": u.is_active,
                })

            # High-level KPIs
            open_statuses = {"DRAFT", "SUBMITTED", "APPROVED", "IN_PRODUCTION"}
            active_mach_statuses = {"RUNNING", "IN_PROGRESS", "ACTIVE", "AVAILABLE"}
            snapshot["kpis"] = {
                "total_orders_tracked": len(snapshot["sales_orders"]),
                "total_order_value_inr": total_revenue,
                "open_orders": len([o for o in snapshot["sales_orders"] if o["status"] in open_statuses]),
                "active_machines": len([m for m in snapshot["machines"] if m["status"] in active_mach_statuses]),
                "total_machines": len(snapshot["machines"]),
                "recent_production_sheets": total_produced,
                "recent_waste_kg": total_waste,
                "pending_dispatches": len([d for d in snapshot["dispatches"] if d["status"] in {"DRAFT", "READY", "LOADING", "STAGED"}]),
                "total_parties": len(snapshot["parties"]),
                "total_users": len(snapshot["users"]),
            }

        except Exception as e:
            logger.error(f"Error fetching live database snapshot for AI advisor: {e}", exc_info=True)

        return snapshot

    async def execute_gemini_query(self, user_query: str, db_snapshot: Dict[str, Any], user_role: str) -> Optional[str]:
        """
        Executes reasoning using Google Gemini API with the live DB snapshot.
        Uses async HTTP with timeout and robust fallback.
        """
        api_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY
        if not api_key:
            return None

        system_prompt = f"""
You are the FixoBoard Executive Plant & Business Intelligence AI Advisor.
You are speaking directly to a factory {user_role} (Administrator or Plant Manager).
You have full real-time access to the company's SQL Database across all operations:
- Commercial Sales Orders, Line Items, Amounts, Deadlines & Parties
- Extrusion Line Telemetry (Line speed, status, operator, capacity)
- Production Planning Memos & Active Extrusion Runs (Output sheets, scrap/waste kg, yields)
- Packaging & Bundling records
- Logistics & Gate Dispatches (Vehicles, drivers, status)
- Customer Parties / Dealers (Credit limits, balances, cities, phones)
- Master Specifications (Available thicknesses: {db_snapshot.get('specifications', {}).get('thicknesses', [])} mm, Densities: {db_snapshot.get('specifications', {}).get('densities', [])} g/cm³)
- Products Catalog (PVC Ply, Solid WPC Doors, Prelam, Door Frames, UV Marble)
- Scanned OCR Orders queue
- Users and active roles

CURRENT LIVE DATABASE SNAPSHOT:
{json.dumps(db_snapshot, indent=2)}

INSTRUCTIONS FOR OUTPUT FORMATTING & READABILITY:
1. Format all responses in clean, highly readable, structured Markdown.
2. ALWAYS make key figures, metrics, facts, monetary values, quantities, dates, status badges, and company names **BOLD** (e.g., **₹2,45,000.00**, **18 mm**, **0.55 g/cm³**, **150 Sheets**, **Line 01 [ACTIVE]**, **SGS Certified Lead-Free**).
3. Use clear section headers (`### Section Title`) to organize multi-part information logically.
4. When comparing options, reviewing orders, machines, or metrics, present the data in a clean Markdown Table (`| Column 1 | Column 2 |`) or itemized bullet points with bold titles (`- **Key Metric**: Details`).
5. When recommending PVC/WPC products, explicitly specify the exact thickness, density grade, price range, and verified advantages over plywood.
6. Provide crisp, professional, and directly actionable insights for plant operations and commercial decisions.
"""
        model_name = settings.GEMINI_MODEL or "gemini-1.5-flash"
        
        # 1. Try Gemini REST API via httpx (async)
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"{system_prompt}\n\nUser Question: {user_query}"}
                        ]
                    }
                ]
            }
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
        except Exception as ex:
            logger.warning(f"Gemini REST API call failed: {ex}")

        return None

    def execute_nlp_fallback(self, query: str, db_snapshot: Dict[str, Any]) -> str:
        """
        Comprehensive rule-based & fuzzy NLP entity query engine.
        Answers queries for all tables and views in the database.
        """
        q = query.lower().strip()
        kpis = db_snapshot.get("kpis", {})

        # 1. Sales Orders / Commercial POs
        if any(k in q for k in ["order", "sales order", "po", "booking", "so-", "revenue", "sale"]):
            orders = db_snapshot.get("sales_orders", [])
            if not orders:
                return "There are currently no sales orders logged in the database."
            
            # Check for specific order number in query
            for o in orders:
                if o["order_number"].lower() in q:
                    items_str = "\n".join([f"  - {it}" for it in o.get("items", [])]) or "  - Standard PVC Sheets"
                    return (
                        f"### Order Details: **{o['order_number']}**\n\n"
                        f"- **Customer Party**: **{o['party']}**\n"
                        f"- **Current Status**: `{o['status']}`\n"
                        f"- **Priority**: `{o.get('priority', 'NORMAL')}`\n"
                        f"- **Total Amount**: **₹{o['total_amount']:,.2f}**\n"
                        f"- **Total Quantity**: {o.get('total_quantity', 'N/A')} sheets\n"
                        f"- **Order Date**: {o.get('order_date') or 'Recorded'}\n"
                        f"- **Required Delivery**: {o.get('required_date') or 'Standard delivery'}\n"
                        f"- **Customer PO #**: {o.get('customer_po_number') or 'Direct'}\n\n"
                        f"**Line Items:**\n{items_str}"
                    )

            # Check for party filter
            matched_orders = [o for o in orders if any(word in o["party"].lower() for word in q.split() if len(word) > 3)]
            if matched_orders:
                lines = [
                    f"### Orders for Matching Customer:",
                    f"| Order Number | Customer | Status | Total Amount | Line Items |",
                    f"| :--- | :--- | :--- | :--- | :--- |"
                ]
                for o in matched_orders[:6]:
                    items_peek = "; ".join(o["items"][:2]) if o.get("items") else "Sheets"
                    lines.append(f"| **{o['order_number']}** | {o['party']} | `{o['status']}` | ₹{o['total_amount']:,.2f} | {items_peek} |")
                return "\n".join(lines)

            # Check for status filter (e.g. open, in production, draft, completed)
            if "open" in q or "active" in q or "pending" in q:
                open_orders = [o for o in orders if o["status"] in ["DRAFT", "SUBMITTED", "APPROVED", "IN_PRODUCTION"]]
                lines = [
                    f"### Active & Open Sales Orders ({len(open_orders)} Orders)",
                    f"| Order # | Customer | Status | Priority | Amount | Required By |",
                    f"| :--- | :--- | :--- | :--- | :--- | :--- |"
                ]
                for o in open_orders[:8]:
                    lines.append(f"| **{o['order_number']}** | {o['party']} | `{o['status']}` | `{o.get('priority', 'NORMAL')}` | ₹{o['total_amount']:,.2f} | {o.get('required_date') or 'ASAP'} |")
                return "\n".join(lines)

            # General Orders Summary
            lines = [
                f"### Live Commercial Orders Summary",
                f"- **Total Tracked Orders**: **{kpis.get('total_orders_tracked', len(orders))}**",
                f"- **Open / Active Orders**: **{kpis.get('open_orders', 0)}**",
                f"- **Total Order Value**: **₹{kpis.get('total_order_value_inr', 0):,.2f}**\n",
                f"**Latest Sales Orders in Database:**\n",
                f"| Order # | Customer | Status | Total Amount | Required Date |",
                f"| :--- | :--- | :--- | :--- | :--- |",
            ]
            for o in orders[:6]:
                lines.append(f"| **{o['order_number']}** | {o['party']} | `{o['status']}` | ₹{o['total_amount']:,.2f} | {o.get('required_date') or 'Standard'} |")
            return "\n".join(lines)

        # 2. Machines / Extrusion Lines
        if any(k in q for k in ["machine", "extrusion", "line", "speed", "mpm", "rpm", "operator", "capacity"]):
            machines = db_snapshot.get("machines", [])
            if not machines:
                return "No extrusion lines found in the database."
            
            lines = [
                f"### Extrusion Lines Status ({len(machines)} Lines Total)",
                f"| Machine Code | Machine Name | Line | Status | Rated Capacity |",
                f"| :--- | :--- | :--- | :--- | :--- |",
            ]
            for m in machines:
                lines.append(f"| `{m['machine_code']}` | **{m['name']}** | {m.get('line_name', 'Line 1')} | `{m['status']}` | {m.get('capacity_hourly', 0):.0f} kg/hr |")
            
            active_count = sum(1 for m in machines if m['status'] in ['RUNNING', 'IN_PROGRESS', 'ACTIVE', 'AVAILABLE'])
            lines.append(f"\n*Extrusion Summary: **{active_count}/{len(machines)}** machines active/available.*")
            return "\n".join(lines)

        # 3. Production Runs, Output & Scrap / Waste
        if any(k in q for k in ["production", "run", "waste", "scrap", "produced", "output", "quantity", "yield", "scrap kg"]):
            runs = db_snapshot.get("production_runs", [])
            total_produced = kpis.get("recent_production_sheets", 0)
            total_waste = kpis.get("recent_waste_kg", 0)
            
            lines = [
                f"### Production Floor Output & Scrap Log",
                f"- **Total Sheets Produced**: **{total_produced:,.0f} sheets**",
                f"- **Total Scrap / Waste Logged**: **{total_waste:,.1f} kg**",
                f"- **Active Extrusion Runs Tracked**: {len(runs)}\n",
                f"**Recent Production Runs:**\n",
                f"| Machine | Shift | Good Qty (Sheets) | Rejected | Waste (kg) | Status |",
                f"| :--- | :--- | :--- | :--- | :--- | :--- |"
            ]
            for r in runs[:6]:
                lines.append(f"| **{r.get('machine', 'Line')}** | {r.get('shift', 'DAY')} | {r['good_quantity']:.0f} | {r.get('rejected_quantity', 0):.0f} | {r['waste_kg']:.1f} kg | `{r['status']}` |")
            lines.append(f"\n*FixoBoard Sustainability Note: 100% of factory PVC/WPC scrap is re-granulated and recycled.*")
            return "\n".join(lines)

        # 4. Production Planning Memos
        if any(k in q for k in ["memo", "planning", "schedule", "shift"]):
            memos = db_snapshot.get("production_memos", [])
            if not memos:
                return "No production planning memos currently recorded in the database."
            lines = [
                f"### Production Planning Memos ({len(memos)} Memos)",
                f"| Memo # | Sales Order | Planned Qty | Priority | Machine | Status |",
                f"| :--- | :--- | :--- | :--- | :--- | :--- |"
            ]
            for m in memos[:6]:
                lines.append(f"| **{m['memo_number']}** | {m['sales_order']} | {m['planned_quantity']:.0f} sheets | `{m['priority']}` | {m.get('machine', 'Floor')} | `{m['status']}` |")
            return "\n".join(lines)

        # 5. Packaging & Bundling
        if any(k in q for k in ["pack", "packing", "bundle", "package", "wrapping"]):
            packs = db_snapshot.get("packing_records", [])
            if not packs:
                return "No packaging records currently found."
            lines = [
                f"### Packaging & Bundling Queue ({len(packs)} Records)",
                f"| Packing # | Package Count | Total Sheets | Wrapping Type | Status |",
                f"| :--- | :--- | :--- | :--- | :--- |"
            ]
            for p in packs[:6]:
                lines.append(f"| **{p['packing_number']}** | {p['package_count']} | {p['packed_quantity']:.0f} sheets | {p.get('packing_type', 'Standard')} | `{p['status']}` |")
            return "\n".join(lines)

        # 6. Dispatches & Logistics
        if any(k in q for k in ["dispatch", "vehicle", "truck", "gate", "transport", "driver", "logistics"]):
            dispatches = db_snapshot.get("dispatches", [])
            if not dispatches:
                return "There are no pending dispatches staged in the dock."
            lines = [
                f"### Logistics & Staged Gate Dispatches ({len(dispatches)} Shipments)",
                f"| Dispatch # | Customer | Sales Order | Vehicle # | Driver | Status |",
                f"| :--- | :--- | :--- | :--- | :--- | :--- |"
            ]
            for d in dispatches[:6]:
                lines.append(f"| **{d['dispatch_number']}** | {d['party']} | {d['sales_order']} | {d['vehicle_number']} | {d['driver_name']} | `{d['status']}` |")
            return "\n".join(lines)

        # 7. Customer Parties & Dealers
        if any(k in q for k in ["party", "customer", "dealer", "distributor", "client", "balance", "credit", "phone"]):
            parties = db_snapshot.get("parties", [])
            if not parties:
                return "No customer parties found in the database."
            
            # Check for specific party query
            for p in parties:
                if p["party_name"].lower() in q or p["party_code"].lower() in q:
                    return (
                        f"### Customer Account: **{p['party_name']}**\n\n"
                        f"- **Party Code**: `{p['party_code']}`\n"
                        f"- **Contact Person**: {p.get('contact_person') or 'Direct'}\n"
                        f"- **Phone**: {p.get('phone') or 'N/A'}\n"
                        f"- **Email**: {p.get('email') or 'N/A'}\n"
                        f"- **Credit Limit**: **₹{p['credit_limit']:,.2f}**\n"
                        f"- **GST #**: {p.get('gst_number') or 'N/A'}\n"
                        f"- **Billing Address**: {p.get('billing_address') or 'N/A'}\n"
                    )

            lines = [
                f"### Customer Accounts & Authorized Dealers ({len(parties)} Parties)",
                f"| Code | Customer / Dealer Name | Contact Person | Phone | Credit Limit |",
                f"| :--- | :--- | :--- | :--- | :--- |"
            ]
            for p in parties[:6]:
                lines.append(f"| `{p['party_code']}` | **{p['party_name']}** | {p.get('contact_person') or 'N/A'} | {p.get('phone') or 'N/A'} | ₹{p['credit_limit']:,.0f} |")
            return "\n".join(lines)

        # 8. Master Specifications (Thicknesses, Densities, Packing)
        if any(k in q for k in ["thickness", "density", "specification", "gauge", "specs"]):
            specs = db_snapshot.get("specifications", {})
            th_list = ", ".join([f"**{t} mm**" for t in specs.get("thicknesses", [6, 8, 12, 18, 25])])
            den_list = ", ".join([f"**{d} g/cm³**" for d in specs.get("densities", [0.45, 0.50, 0.55, 0.60])])
            pack_list = ", ".join(specs.get("packing_types", ["Standard Plastic Wrapping", "Raffia Protection", "Cardboard Box Packing"]))

            return (
                f"### Master Factory Specifications\n\n"
                f"- **Available Thicknesses**: {th_list}\n"
                f"- **Standard Densities**: {den_list}\n"
                f"- **Packaging Formats**: {pack_list}\n\n"
                f"**Application Guidelines:**\n"
                f"- **Kitchen Carcass**: 18 mm (0.50 - 0.60 g/cm³)\n"
                f"- **Bathroom Doors**: 28 - 32 mm Solid WPC (0.55 - 0.60 g/cm³)\n"
                f"- **Wardrobe Shutters / Backs**: 12 mm & 6 mm (0.50 g/cm³)\n"
                f"- **Wall Cladding**: 3.0 mm UV Marble Sheets"
            )

        # 9. Scanned AI OCR Orders
        if any(k in q for k in ["scanned", "ocr", "scanner", "chit"]):
            scans = db_snapshot.get("scanned_orders", [])
            if not scans:
                return "No scanned orders in the OCR queue."
            lines = [
                f"### Scanned OCR Orders Queue ({len(scans)} Scans)",
                f"| Scan # | Extracted Customer | Sheets | Confidence | Status |",
                f"| :--- | :--- | :--- | :--- | :--- |"
            ]
            for s in scans[:6]:
                lines.append(f"| **{s['scan_number']}** | {s['customer_name'] or 'Unknown'} | {s.get('sheets', 0):.0f} | {s['confidence']:.1f}% | `{s['status']}` |")
            return "\n".join(lines)

        # 10. Users & Roles
        if any(k in q for k in ["user", "employee", "staff", "admin", "manager", "role"]):
            users = db_snapshot.get("users", [])
            lines = [
                f"### Factory User Directory ({len(users)} Users)",
                f"| Name | Username | Email | Roles |",
                f"| :--- | :--- | :--- | :--- |"
            ]
            for u in users[:6]:
                roles_str = ", ".join(u.get("roles", [])) or "User"
                lines.append(f"| **{u['full_name']}** | `{u['username']}` | {u['email']} | {roles_str} |")
            return "\n".join(lines)

        # 11. Technical Product Guidance / Comparisons
        matched_items = []
        for item in FIXOBOARD_KNOWLEDGE_BASE:
            if any(kw in q for kw in item["keywords"]):
                matched_items.append(item)

        if matched_items:
            top = matched_items[0]
            rationale_bullets = "\n".join([f"  - {r}" for r in top["verified_rationale"][:3]])
            advantages_bullets = "\n".join([f"  - {a}" for a in top["advantages_vs_plywood"]])
            return (
                f"### Product Recommendation: **{top['product_name']}**\n\n"
                f"- **Recommended Thickness**: **{top['recommended_thickness']}**\n"
                f"- **Density**: **{top['recommended_density']}**\n"
                f"- **Price Estimate**: {top['estimated_price_range']}\n\n"
                f"**Key Verified Features:**\n{rationale_bullets}\n\n"
                f"**Advantages vs Traditional Plywood:**\n{advantages_bullets}\n\n"
                f"**Certifications**: {', '.join(top['certifications'])}"
            )

        # 12. Default Comprehensive Overview
        return (
            f"### FixoBoard Enterprise Plant Intelligence\n\n"
            f"I have live real-time access to all records in the factory database:\n\n"
            f"- **Sales Orders**: {kpis.get('total_orders_tracked', 0)} orders (₹{kpis.get('total_order_value_inr', 0):,.2f} total value)\n"
            f"- **Extrusion Lines**: {kpis.get('active_machines', 0)}/{kpis.get('total_machines', 0)} active lines\n"
            f"- **Production Output**: {kpis.get('recent_production_sheets', 0):,.0f} sheets produced, {kpis.get('recent_waste_kg', 0):,.1f} kg scrap logged\n"
            f"- **Logistics Dispatches**: {kpis.get('pending_dispatches', 0)} pending shipments\n"
            f"- **Customer Parties**: {kpis.get('total_parties', 0)} registered accounts\n"
            f"- **Technical Specs**: Lead-Free PVC/WPC, Prelam, Solid WPC Doors & UV Marble\n\n"
            f"**You can ask me questions like:**\n"
            f"- *'Show all open sales orders with amounts'* \n"
            f"- *'What is the status of our machines and extrusion lines?'* \n"
            f"- *'How much scrap waste was produced in recent runs?'* \n"
            f"- *'List pending dispatches and vehicle numbers'* \n"
            f"- *'What thickness and density do you recommend for modular kitchen carcasses?'*"
        )

    async def process_query(self, req: AIAdvisorRequest, user: Optional[User] = None) -> AIAdvisorResponse:
        query_text = req.get_query_text()
        session_id = req.get_session_id()
        user_role = "Plant Head / Administrator" if user else "Executive"

        conv = await self.get_or_create_conversation(
            session_id=session_id,
            visitor_name=req.visitor_name or req.user_name or (user.full_name if user else None),
        )

        # Log User Message
        user_msg = AIMessage(
            conversation_id=conv.id,
            sender="user",
            content=query_text or "General Status",
        )
        self.session.add(user_msg)

        # 1. Fetch live database snapshot
        db_snapshot = await self.fetch_live_database_snapshot()

        # 2. Try Google Gemini API reasoning
        response_text = await self.execute_gemini_query(query_text, db_snapshot, user_role)

        # 3. Fallback to NLP entity query engine if Gemini is unavailable
        if not response_text:
            response_text = self.execute_nlp_fallback(query_text, db_snapshot)

        # 4. Check for matched product recommendations
        matched_items: List[ProductRecommendationItem] = []
        for item in FIXOBOARD_KNOWLEDGE_BASE:
            if any(kw in query_text.lower() for kw in item["keywords"]):
                matched_items.append(
                    ProductRecommendationItem(
                        category_code=item["category_code"],
                        product_code=item["product_code"],
                        product_name=item["product_name"],
                        category_name=item["category_code"],
                        recommended_thickness=item["recommended_thickness"],
                        recommended_density=item["recommended_density"],
                        verified_rationale=item["verified_rationale"],
                        suitable_applications=item["suitable_applications"],
                        certifications=item["certifications"],
                        advantages_vs_plywood=item["advantages_vs_plywood"],
                        estimated_price_range=item["estimated_price_range"],
                        match_score=95.0,
                    )
                )

        # Log Assistant Response
        matched_payload = [m.model_dump() for m in matched_items] if matched_items else None
        asst_msg = AIMessage(
            conversation_id=conv.id,
            sender="assistant",
            content=response_text,
            matched_products=matched_payload,
            action_type="RECOMMENDATION" if matched_items else "DATABASE_INTELLIGENCE",
        )
        self.session.add(asst_msg)
        await self.session.flush()

        return AIAdvisorResponse(
            session_id=session_id,
            conversation_id=str(conv.id),
            response_text=response_text,
            assistant_reply=response_text,
            intent="DATABASE_INTELLIGENCE",
            matched_products=matched_items,
            recommended_products=matched_items,
            action_type="DATABASE_INTELLIGENCE",
            lead_created=False,
            lead_id=None,
            requires_human_followup=False,
            safety_disclaimer="Operational data sourced in real-time from FixoBoard core database.",
        )
