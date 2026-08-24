import asyncio
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import get_password_hash
from app.domain.enums import MachineStatus, OrderPriority, OrderSource, ProductionMemoStatus, ProductionRunStatus, SalesOrderStatus, SystemRole
import app.models  # Ensure all models are registered
from app.models.audit import AuditLog
from app.models.machine import Machine
from app.models.packing import PackingRecord
from app.models.party import Party
from app.models.product import Product, ProductCategory
from app.models.production_memo import ProductionMemo
from app.models.production_run import ProductionRun
from app.models.role import Permission, Role
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.specification import Density, PackingType, ProductFinish, ProductSize, Thickness
from app.models.user import User


async def seed_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        user_check = await session.execute(select(User))
        if user_check.first():
            # Sync OPERATOR role permissions if needed
            op_role_res = await session.execute(
                select(Role).options(selectinload(Role.permissions)).where(Role.name == SystemRole.OPERATOR.value)
            )
            op_role = op_role_res.scalar_one_or_none()
            if op_role:
                has_mach_manage = any(p.code == "machines:manage" for p in op_role.permissions)
                if not has_mach_manage:
                    mach_perm_res = await session.execute(select(Permission).where(Permission.code == "machines:manage"))
                    mach_perm = mach_perm_res.scalar_one_or_none()
                    if mach_perm:
                        op_role.permissions.append(mach_perm)
                        await session.commit()
            print("Database already contains data. Skipping initial seeding.")
            return

        print("Seeding FixoBoard MMS database...")

        # 1. Seed Permissions
        permissions_data = [
            # Parties
            ("parties:read", "parties", "read", "View customer profiles"),
            ("parties:create", "parties", "create", "Create new customer profile"),
            ("parties:update", "parties", "update", "Edit customer profile"),
            # Products & Specs
            ("products:read", "products", "read", "View products and specifications"),
            ("products:create", "products", "create", "Create products and specifications"),
            ("products:update", "products", "update", "Update products and specifications"),
            # Machines
            ("machines:read", "machines", "read", "View machine status"),
            ("machines:manage", "machines", "manage", "Register and update machines"),
            # Sales Orders
            ("sales_orders:read", "sales_orders", "read", "View sales orders"),
            ("sales_orders:create", "sales_orders", "create", "Create sales orders"),
            ("sales_orders:update", "sales_orders", "update", "Edit draft sales orders"),
            ("sales_orders:submit", "sales_orders", "submit", "Submit sales order for approval"),
            ("sales_orders:approve", "sales_orders", "approve", "Approve or reject sales orders"),
            ("sales_orders:cancel", "sales_orders", "cancel", "Cancel sales orders"),
            # Production Memos
            ("production:read", "production", "read", "View production memos and jobs"),
            ("production:plan", "production", "plan", "Plan memos and assign machines"),
            ("production:execute", "production", "execute", "Execute shop floor production runs"),
            # Packing
            ("packing:read", "packing", "read", "View packing queue"),
            ("packing:execute", "packing", "execute", "Record packaging completion"),
            # Dispatch
            ("dispatch:read", "dispatch", "read", "View dispatch queue and orders"),
            ("dispatch:create", "dispatch", "create", "Create dispatch orders and load vehicles"),
            ("dispatch:confirm", "dispatch", "confirm", "Confirm gate dispatch and print gate passes"),
            # Analytics & Admin
            ("dashboards:view", "dashboards", "view", "View executive and ops dashboard"),
            ("reports:view", "reports", "view", "View multi-dimensional demand reports"),
            ("users:manage", "users", "manage", "Manage system users and roles"),
            ("audit:view", "audit", "view", "View enterprise audit logs"),
        ]

        permission_map = {}
        for code, res, act, desc in permissions_data:
            p = Permission(code=code, resource=res, action=act, description=desc)
            session.add(p)
            permission_map[code] = p
        await session.flush()

        # 2. Seed Roles
        role_map = {}
        all_perms = list(permission_map.values())

        # Main Head / Management (all operational + approval + reports + dashboards)
        main_head_role = Role(
            name=SystemRole.MAIN_HEAD.value,
            display_name="Main Head / Management",
            description="Executive management with full visibility and commercial approval rights",
            is_system_role=True,
            permissions=[p for p in all_perms if p.code != "users:manage"],
        )
        session.add(main_head_role)
        role_map[SystemRole.MAIN_HEAD.value] = main_head_role

        # Admin
        admin_role = Role(
            name=SystemRole.ADMIN.value,
            display_name="System Administrator",
            description="System configuration, security, user administration, and master management",
            is_system_role=True,
            permissions=all_perms,
        )
        session.add(admin_role)
        role_map[SystemRole.ADMIN.value] = admin_role

        # Sales
        sales_role = Role(
            name=SystemRole.SALES.value,
            display_name="Sales Department",
            description="Customer onboarding, order creation, order submission, and order tracking",
            is_system_role=True,
            permissions=[
                permission_map["parties:read"],
                permission_map["parties:create"],
                permission_map["parties:update"],
                permission_map["products:read"],
                permission_map["sales_orders:read"],
                permission_map["sales_orders:create"],
                permission_map["sales_orders:update"],
                permission_map["sales_orders:submit"],
                permission_map["production:read"],
                permission_map["dashboards:view"],
                permission_map["reports:view"],
            ],
        )
        session.add(sales_role)
        role_map[SystemRole.SALES.value] = sales_role

        # Production / Planning
        prod_role = Role(
            name=SystemRole.PRODUCTION.value,
            display_name="Production / Planning Lead",
            description="Production memo scheduling, machine line allocation, execution monitoring",
            is_system_role=True,
            permissions=[
                permission_map["products:read"],
                permission_map["machines:read"],
                permission_map["machines:manage"],
                permission_map["sales_orders:read"],
                permission_map["production:read"],
                permission_map["production:plan"],
                permission_map["production:execute"],
                permission_map["dashboards:view"],
                permission_map["reports:view"],
            ],
        )
        session.add(prod_role)
        role_map[SystemRole.PRODUCTION.value] = prod_role

        # Packing
        packing_role = Role(
            name=SystemRole.PACKING.value,
            display_name="Packing Department",
            description="Bundling, packaging verification across Standard, Raffia, Cardboard",
            is_system_role=True,
            permissions=[
                permission_map["products:read"],
                permission_map["production:read"],
                permission_map["packing:read"],
                permission_map["packing:execute"],
                permission_map["dashboards:view"],
            ],
        )
        session.add(packing_role)
        role_map[SystemRole.PACKING.value] = packing_role

        # Dispatch
        dispatch_role = Role(
            name=SystemRole.DISPATCH.value,
            display_name="Dispatch & Logistics",
            description="Vehicle assignment, dispatch queue verification, gate pass confirmation",
            is_system_role=True,
            permissions=[
                permission_map["parties:read"],
                permission_map["products:read"],
                permission_map["sales_orders:read"],
                permission_map["packing:read"],
                permission_map["dispatch:read"],
                permission_map["dispatch:create"],
                permission_map["dispatch:confirm"],
                permission_map["dashboards:view"],
                permission_map["reports:view"],
            ],
        )
        session.add(dispatch_role)
        role_map[SystemRole.DISPATCH.value] = dispatch_role

        # Machine Operator
        op_role = Role(
            name=SystemRole.OPERATOR.value,
            display_name="Machine Operator",
            description="Shop floor terminal user for clocking in/out job runs and logging scrap",
            is_system_role=True,
            permissions=[
                permission_map["products:read"],
                permission_map["machines:read"],
                permission_map["machines:manage"],
                permission_map["production:read"],
                permission_map["production:execute"],
            ],
        )
        session.add(op_role)
        role_map[SystemRole.OPERATOR.value] = op_role

        await session.flush()

        # 3. Seed Standard Users for Each Role
        default_pwd = get_password_hash("Fixo@12345")
        users_data = [
            ("admin", "admin@fixoboard.com", "Admin User", "Administration", [admin_role]),
            ("management", "head@fixoboard.com", "Rajesh Singhania (Head)", "Executive", [main_head_role]),
            ("sales", "sales@fixoboard.com", "Amit Sharma (Sales)", "Sales & Commercial", [sales_role]),
            ("production", "prod@fixoboard.com", "Vikas Patel (Production)", "Plant Operations", [prod_role]),
            ("packing", "packing@fixoboard.com", "Suresh Verma (Packing)", "Finishing & Packaging", [packing_role]),
            ("dispatch", "dispatch@fixoboard.com", "Manoj Kumar (Dispatch)", "Logistics", [dispatch_role]),
            ("operator1", "operator1@fixoboard.com", "Ramesh Kumar (Operator Line 1)", "Extrusion Line 1", [op_role]),
        ]

        user_map = {}
        for uname, email, fname, dept, roles in users_data:
            u = User(
                username=uname,
                email=email,
                full_name=fname,
                department=dept,
                hashed_password=default_pwd,
                is_active=True,
                is_superuser=(uname == "admin"),
                roles=roles,
            )
            session.add(u)
            user_map[uname] = u
        await session.flush()

        # 4. Seed Product Categories & Products
        pvc_cat = ProductCategory(name="PVC Foam Ply & Boards", code="CAT-PVC", description="High-density and standard PVC foam boards")
        wpc_board_cat = ProductCategory(name="WPC Ply & Boards", code="CAT-WPC-B", description="Wood polymer composite boards")
        wpc_door_cat = ProductCategory(name="WPC Solid Doors", code="CAT-WPC-D", description="Solid and hollow core extruded WPC doors")
        wpc_frame_cat = ProductCategory(name="WPC Door Frames (Chaukhat)", code="CAT-WPC-F", description="Heavy-duty extruded WPC door frames")
        
        session.add_all([pvc_cat, wpc_board_cat, wpc_door_cat, wpc_frame_cat])
        await session.flush()

        products = [
            Product(category_id=pvc_cat.id, product_code="PROD-PVC-001", product_name="FixoBoard Standard PVC Foam Board", unit="Sheets", description="Multi-purpose PVC foam sheet for furniture & signage"),
            Product(category_id=pvc_cat.id, product_code="PROD-PVC-002", product_name="FixoBoard High-Density Celuka Foam Ply", unit="Sheets", description="Hard surface Celuka PVC board for modular kitchens"),
            Product(category_id=wpc_board_cat.id, product_code="PROD-WPC-001", product_name="FixoBoard Premium WPC Board", unit="Sheets", description="100% waterproof and termite proof composite board"),
            Product(category_id=wpc_door_cat.id, product_code="PROD-DOOR-001", product_name="FixoBoard Solid Core Extruded WPC Door", unit="Pieces", description="Solid composite factory finished interior door"),
            Product(category_id=wpc_frame_cat.id, product_code="PROD-FRAME-001", product_name="FixoBoard WPC Door Frame (Chaukhat)", unit="Running Feet", description="Ready-to-fit extruded composite door frame"),
        ]
        session.add_all(products)
        await session.flush()

        # 5. Seed Specifications Masters (Thicknesses, Densities, Sizes, Finishes, Packing Types)
        thickness_values = [
            (Decimal("5.00"), "5 mm"),
            (Decimal("8.00"), "8 mm"),
            (Decimal("12.00"), "12 mm"),
            (Decimal("18.00"), "18 mm"),
            (Decimal("25.00"), "25 mm"),
            (Decimal("30.00"), "30 mm"),
        ]
        thickness_objs = [Thickness(value_mm=v, display_label=l) for v, l in thickness_values]
        session.add_all(thickness_objs)

        density_values = [
            (Decimal("0.450"), "0.45 g/cm³"),
            (Decimal("0.500"), "0.50 g/cm³"),
            (Decimal("0.550"), "0.55 g/cm³"),
            (Decimal("0.600"), "0.60 g/cm³"),
        ]
        density_objs = [Density(value_g_cm3=v, display_label=l) for v, l in density_values]
        session.add_all(density_objs)

        sizes = [
            ProductSize(length_mm=Decimal("2440.00"), width_mm=Decimal("1220.00"), display_label="8 ft x 4 ft (2440 x 1220 mm)"),
            ProductSize(length_mm=Decimal("2134.00"), width_mm=Decimal("914.00"), display_label="7 ft x 3 ft (2134 x 914 mm)"),
        ]
        session.add_all(sizes)

        finishes = [
            ProductFinish(name="Standard Matte Smooth"),
            ProductFinish(name="High Gloss Hard Crust"),
            ProductFinish(name="Wood Grain Embossed"),
            ProductFinish(name="Virgin Core Natural White"),
        ]
        session.add_all(finishes)

        packing_types = [
            PackingType(code="STANDARD", name="Standard Strapped Bundle", description="Corner edge protectors with plastic strapping"),
            PackingType(code="RAFFIA", name="Raffia Fabric Wrapped", description="Moisture-resistant woven raffia sack wrapping"),
            PackingType(code="CARDBOARD", name="Corrugated Cardboard Box", description="Heavy-duty 5-ply corrugated carton packaging"),
        ]
        session.add_all(packing_types)
        await session.flush()

        # 6. Seed Extrusion Lines / Machines
        machines = [
            Machine(machine_code="EXT-LINE-01", machine_name="Extruder Line 1 (8x4 PVC Board)", line_name="Line 1", machine_type="PVC_EXTRUDER", rated_capacity_hourly=Decimal("45.00"), status=MachineStatus.AVAILABLE.value, location="Shop Floor Bay A"),
            Machine(machine_code="EXT-LINE-02", machine_name="Extruder Line 2 (Celuka High Density)", line_name="Line 2", machine_type="PVC_CELUKA", rated_capacity_hourly=Decimal("38.00"), status=MachineStatus.AVAILABLE.value, location="Shop Floor Bay A"),
            Machine(machine_code="EXT-LINE-03", machine_name="Extruder Line 3 (WPC Solid Board)", line_name="Line 3", machine_type="WPC_EXTRUDER", rated_capacity_hourly=Decimal("30.00"), status=MachineStatus.AVAILABLE.value, location="Shop Floor Bay B"),
            Machine(machine_code="EXT-LINE-04", machine_name="Extruder Line 4 (WPC Door & Frame Line)", line_name="Line 4", machine_type="DOOR_LINE", rated_capacity_hourly=Decimal("25.00"), status=MachineStatus.AVAILABLE.value, location="Shop Floor Bay C"),
        ]
        session.add_all(machines)
        await session.flush()

        # 7. Seed Customer Parties
        parties = [
            Party(party_code="PTY-001", party_name="Royal Interiors & Plywood Mart", contact_person="Ramesh Jain", phone="9876543210", email="orders@royalinteriors.com", billing_address="14/2 Industrial Area, GIDC, Ahmedabad", shipping_address="Plot 55, Ring Road Warehouse, Ahmedabad", gst_number="24AAACR1234F1Z5", payment_terms="30 Days Net", credit_limit=Decimal("500000.00"), created_by=user_map["sales"].id),
            Party(party_code="PTY-002", party_name="Apex Door Distributors Pvt Ltd", contact_person="Sandeep Agarwal", phone="9823456789", email="purchase@apexdoors.com", billing_address="B-404 Commerce Hub, Andheri East, Mumbai", shipping_address="Apex Logistics Hub, Bhiwandi, Maharashtra", gst_number="27AAACA9876B1Z2", payment_terms="45 Days Net", credit_limit=Decimal("1200000.00"), created_by=user_map["sales"].id),
            Party(party_code="PTY-003", party_name="Universal Timber & Modular Solutions", contact_person="Deepak Mehta", phone="9811122233", email="dmehta@universaltimber.in", billing_address="Plot 88, Sector 6, Noida, UP", shipping_address="Plot 88, Sector 6, Noida, UP", gst_number="09AAACU5555C1Z1", payment_terms="15 Days Net", credit_limit=Decimal("350000.00"), created_by=user_map["sales"].id),
        ]
        session.add_all(parties)
        await session.flush()

        # 8. Seed Sample Sales Order (Approved), Production Memo, Run, Packing, and Dispatch
        so1 = SalesOrder(
            order_number="SO-2026-000001",
            party_id=parties[0].id,
            order_source=OrderSource.MANUAL.value,
            customer_po_number="PO-ROYAL-789",
            order_date=date.today() - timedelta(days=2),
            required_date=date.today() + timedelta(days=5),
            priority=OrderPriority.HIGH.value,
            status=SalesOrderStatus.IN_PRODUCTION.value,
            remarks="Urgent requirement for commercial interior project",
            total_quantity=Decimal("1000.00"),
            created_by=user_map["sales"].id,
            approved_by=user_map["management"].id,
            approved_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        session.add(so1)
        await session.flush()

        so1_item1 = SalesOrderItem(
            sales_order_id=so1.id,
            product_id=products[0].id,
            thickness_id=thickness_objs[4].id, # 25mm
            density_id=density_objs[0].id, # 0.45
            size_id=sizes[0].id,
            finish_id=finishes[0].id,
            ordered_quantity=Decimal("600.00"),
            produced_quantity=Decimal("400.00"),
            packed_quantity=Decimal("400.00"),
            dispatched_quantity=Decimal("0.00"),
            unit="Sheets",
            unit_price=Decimal("1250.00"),
            remarks="25mm 0.45 density standard size",
            created_by=user_map["sales"].id,
        )
        so1_item2 = SalesOrderItem(
            sales_order_id=so1.id,
            product_id=products[2].id,
            thickness_id=thickness_objs[5].id, # 30mm
            density_id=density_objs[1].id, # 0.50
            size_id=sizes[0].id,
            finish_id=finishes[1].id,
            ordered_quantity=Decimal("400.00"),
            produced_quantity=Decimal("0.00"),
            packed_quantity=Decimal("0.00"),
            dispatched_quantity=Decimal("0.00"),
            unit="Sheets",
            unit_price=Decimal("1850.00"),
            remarks="30mm 0.50 density WPC board",
            created_by=user_map["sales"].id,
        )
        session.add_all([so1_item1, so1_item2])
        await session.flush()

        # Seed Production Memo for Item 1
        pm1 = ProductionMemo(
            memo_number="PM-2026-000001",
            sales_order_id=so1.id,
            sales_order_item_id=so1_item1.id,
            planned_quantity=Decimal("600.00"),
            priority=OrderPriority.HIGH.value,
            required_date=date.today() + timedelta(days=4),
            target_machine_id=machines[0].id,
            status=ProductionMemoStatus.IN_PROGRESS.value,
            remarks="Extrusion batch 1 on Line 1",
            created_by=user_map["production"].id,
            approved_by=user_map["production"].id,
            assigned_by=user_map["production"].id,
        )
        session.add(pm1)
        await session.flush()

        # Seed Production Run 1 (400 Good, 15 Rejections, 8.5 kg waste)
        run1 = ProductionRun(
            production_memo_id=pm1.id,
            machine_id=machines[0].id,
            operator_id=user_map["operator1"].id,
            shift="DAY",
            start_time=datetime.now(timezone.utc) - timedelta(hours=8),
            end_time=datetime.now(timezone.utc) - timedelta(hours=2),
            planned_quantity=Decimal("400.00"),
            good_quantity=Decimal("400.00"),
            rejected_quantity=Decimal("15.00"),
            waste_kg=Decimal("8.50"),
            status=ProductionRunStatus.COMPLETED.value,
            rejection_reason="Die lines during calibration restart",
            remarks="Run completed successfully with high surface finish",
        )
        session.add(run1)
        await session.flush()

        # Seed Packing Record for 400 sheets in Raffia bundles (20 sheets per bundle = 20 packages)
        pkg1 = PackingRecord(
            packing_number="PKG-2026-000001",
            sales_order_item_id=so1_item1.id,
            production_run_id=run1.id,
            packing_type_id=packing_types[1].id, # RAFFIA
            packed_quantity=Decimal("400.00"),
            package_count=20,
            pieces_per_package=20,
            packed_by=user_map["packing"].id,
            packed_at=datetime.now(timezone.utc) - timedelta(hours=1),
            status="COMPLETED",
            remarks="20 bundles of 20 sheets packed in Raffia with corner protectors",
        )
        session.add(pkg1)
        await session.flush()

        # Audit initial seed
        audit1 = AuditLog(
            user_id=user_map["admin"].id,
            action="SYSTEM_INIT_SEED",
            entity_name="system",
            entity_id="init",
            new_values={"status": "seeded_successfully"},
        )
        session.add(audit1)

        await session.commit()
        print("Database seeded successfully with master catalogs, users, orders, and runs!")


if __name__ == "__main__":
    asyncio.run(seed_database())
