import pytest
import httpx
import asyncio
from app.main import app

BASE_URL = "http://testserver"


@pytest.mark.asyncio
async def test_complete_end_to_end_manufacturing_lifecycle_uat():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url=BASE_URL, timeout=30.0) as client:
        # =========================================================================
        # 1. Health Check
        # =========================================================================
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
        print("\n[UAT-01 PASSED] Health check endpoint operational.")

        # =========================================================================
        # 2. RBAC Authentication for all personas
        # =========================================================================
        roles_to_test = {
            "management": ("Fixo@12345", "MAIN_HEAD"),
            "admin": ("Fixo@12345", "ADMIN"),
            "sales": ("Fixo@12345", "SALES"),
            "production": ("Fixo@12345", "PRODUCTION"),
            "operator1": ("Fixo@12345", "OPERATOR"),
            "packing": ("Fixo@12345", "PACKING"),
            "dispatch": ("Fixo@12345", "DISPATCH"),
        }

        tokens = {}
        for username, (password, role_name) in roles_to_test.items():
            login_res = await client.post(
                "/api/v1/auth/login",
                json={"username": username, "password": password},
            )
            assert login_res.status_code == 200, f"Login failed for {username}: {login_res.text}"
            data = login_res.json()["data"]
            assert "access_token" in data
            assert role_name in data["user"]["roles"]
            tokens[username] = data["access_token"]

        print(f"[UAT-02 PASSED] Successfully authenticated all {len(tokens)} industrial personas with RBAC.")

        sales_headers = {"Authorization": f"Bearer {tokens['sales']}"}
        mgmt_headers = {"Authorization": f"Bearer {tokens['management']}"}
        prod_headers = {"Authorization": f"Bearer {tokens['production']}"}
        op_headers = {"Authorization": f"Bearer {tokens['operator1']}"}
        pack_headers = {"Authorization": f"Bearer {tokens['packing']}"}
        disp_headers = {"Authorization": f"Bearer {tokens['dispatch']}"}
        admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}

        # =========================================================================
        # 3. Master Data Verification
        # =========================================================================
        parties_res = await client.get("/api/v1/parties/all", headers=sales_headers)
        assert parties_res.status_code == 200
        parties = parties_res.json()["data"]
        assert len(parties) >= 1
        party = parties[0]

        products_res = await client.get("/api/v1/products/all", headers=sales_headers)
        assert products_res.status_code == 200
        products = products_res.json()["data"]
        assert len(products) >= 1
        product = products[0]

        thicknesses_res = await client.get("/api/v1/specifications/thicknesses", headers=sales_headers)
        assert thicknesses_res.status_code == 200
        thicknesses = thicknesses_res.json()["data"]
        assert len(thicknesses) >= 1
        thick1 = thicknesses[0]
        thick2 = thicknesses[1] if len(thicknesses) > 1 else thicknesses[0]

        densities_res = await client.get("/api/v1/specifications/densities", headers=sales_headers)
        assert densities_res.status_code == 200
        densities = densities_res.json()["data"]
        assert len(densities) >= 1
        dense = densities[0]

        machines_res = await client.get("/api/v1/machines/all", headers=prod_headers)
        assert machines_res.status_code == 200
        machines = machines_res.json()["data"]
        assert len(machines) >= 1
        machine = machines[0]

        packing_types_res = await client.get("/api/v1/specifications/packing-types", headers=pack_headers)
        assert packing_types_res.status_code == 200
        packing_types = packing_types_res.json()["data"]
        assert len(packing_types) >= 1
        packing_type = packing_types[0]

        print(f"[UAT-03 PASSED] Verified Master Data (Parties={len(parties)}, Products={len(products)}, Thicknesses={len(thicknesses)}, Densities={len(densities)}, Machines={len(machines)}).")

        # =========================================================================
        # 4. Create Commercial Sales Order (CAT Source + Multi-Item)
        # =========================================================================
        order_payload = {
            "party_id": party["id"],
            "order_source": "CAT",
            "customer_po_number": "PO-E2E-TEST-2026",
            "required_date": "2026-09-01",
            "priority": "HIGH",
            "remarks": "Priority E2E test order with moisture barrier packaging",
            "items": [
                {
                    "product_id": product["id"],
                    "thickness_id": thick1["id"],
                    "density_id": dense["id"],
                    "ordered_quantity": 100,
                    "unit_price": 1350.0,
                    "unit": "Sheets",
                    "remarks": "Line 1 item",
                },
                {
                    "product_id": product["id"],
                    "thickness_id": thick2["id"],
                    "density_id": dense["id"],
                    "ordered_quantity": 50,
                    "unit_price": 1500.0,
                    "unit": "Sheets",
                    "remarks": "Line 2 item",
                },
            ],
        }

        create_order_res = await client.post("/api/v1/sales-orders", json=order_payload, headers=sales_headers)
        assert create_order_res.status_code in [200, 201], f"Create SO failed: {create_order_res.text}"
        order = create_order_res.json()["data"]
        order_id = order["id"]
        assert order["status"] == "DRAFT"
        assert float(order["total_quantity"]) == 150.0
        assert len(order["items"]) == 2
        order_item_1 = order["items"][0]
        print(f"[UAT-04 PASSED] Created Sales Order {order['order_number']} (Status: DRAFT, 150 Sheets, 2 Line Items).")

        # =========================================================================
        # 5. Workflow: Submit & Approve Sales Order
        # =========================================================================
        submit_res = await client.post(f"/api/v1/sales-orders/{order_id}/submit", headers=sales_headers)
        assert submit_res.status_code == 200
        assert submit_res.json()["data"]["status"] == "SUBMITTED"

        approve_res = await client.post(f"/api/v1/sales-orders/{order_id}/approve", headers=mgmt_headers)
        assert approve_res.status_code == 200
        assert approve_res.json()["data"]["status"] == "APPROVED"
        print(f"[UAT-05 PASSED] State Machine Transition: DRAFT -> SUBMITTED -> APPROVED.")

        # =========================================================================
        # 6. Issue Production Memo (Phase 1)
        # =========================================================================
        memo_payload = {
            "sales_order_id": order_id,
            "sales_order_item_id": order_item_1["id"],
            "planned_quantity": 100,
            "priority": "HIGH",
            "required_date": "2026-08-30",
            "target_machine_id": machine["id"],
        }
        create_memo_res = await client.post("/api/v1/production-memos", json=memo_payload, headers=prod_headers)
        assert create_memo_res.status_code in [200, 201], f"Create Memo failed: {create_memo_res.text}"
        memo = create_memo_res.json()["data"]
        memo_id = memo["id"]
        assert memo["status"] in ["MACHINE_ASSIGNED", "PLANNED"]
        print(f"[UAT-06 PASSED] Generated Production Memo {memo['memo_number']} for 100 Sheets.")

        # =========================================================================
        # 7. Machine Assignment & Release to Shop Floor
        # =========================================================================
        if memo["status"] != "MACHINE_ASSIGNED":
            assign_res = await client.post(
                f"/api/v1/production-memos/{memo_id}/assign-machine",
                json={"machine_id": machine["id"]},
                headers=prod_headers,
            )
            assert assign_res.status_code == 200
            assert assign_res.json()["data"]["status"] == "MACHINE_ASSIGNED"

        release_res = await client.post(f"/api/v1/production-memos/{memo_id}/release", headers=prod_headers)
        assert release_res.status_code == 200
        assert release_res.json()["data"]["status"] == "RELEASED"
        print(f"[UAT-07 PASSED] Memo {memo['memo_number']} assigned to {machine['line_name']} and RELEASED to floor.")

        # =========================================================================
        # 8. Start Floor Execution Run on Extrusion Line
        # =========================================================================
        start_run_res = await client.post(
            "/api/v1/production-runs/start",
            json={
                "production_memo_id": memo_id,
                "machine_id": machine["id"],
                "planned_quantity": 100,
                "shift": "Shift A (08:00 - 16:00)",
            },
            headers=op_headers,
        )
        assert start_run_res.status_code in [200, 201], f"Start run failed: {start_run_res.text}"
        run = start_run_res.json()["data"]
        run_id = run["id"]
        assert run["status"] == "IN_PROGRESS"
        print(f"[UAT-08 PASSED] Floor Operator started Run on {machine['line_name']} (Status: IN_PROGRESS).")

        # =========================================================================
        # 9. Complete Production Run with Yield & Scrap Metrics
        # =========================================================================
        complete_run_res = await client.post(
            f"/api/v1/production-runs/{run_id}/complete",
            json={
                "good_quantity": 100,
                "rejected_quantity": 2,
                "waste_kg": 14.5,
                "rejection_reason": "Edge trimming defect",
                "remarks": "Run completed with optimal die temperature",
            },
            headers=op_headers,
        )
        assert complete_run_res.status_code == 200, f"Complete run failed: {complete_run_res.text}"
        comp_run = complete_run_res.json()["data"]
        assert float(comp_run["good_quantity"]) == 100.0
        assert float(comp_run["rejected_quantity"]) == 2.0
        assert float(comp_run["waste_kg"]) == 14.5
        assert comp_run["status"] == "COMPLETED"
        print(f"[UAT-09 PASSED] Output logged: 100 Prime Good Sheets, 2 Rejects, 14.5 Kg Waste.")

        # =========================================================================
        # 10. Packaging into Standard / Cardboard Bundles
        # =========================================================================
        pack_payload = {
            "sales_order_item_id": order_item_1["id"],
            "production_run_id": run_id,
            "packing_type_id": packing_type["id"],
            "packed_quantity": 100,
            "package_count": 10,
            "pieces_per_package": 10,
            "remarks": "Wrapped with moisture barrier & edge corner protectors",
        }
        create_pack_res = await client.post("/api/v1/packing", json=pack_payload, headers=pack_headers)
        assert create_pack_res.status_code in [200, 201], f"Create packing failed: {create_pack_res.text}"
        packing_record = create_pack_res.json()["data"]
        packing_id = packing_record["id"]
        assert float(packing_record["packed_quantity"]) == 100.0
        assert packing_record["package_count"] == 10
        print(f"[UAT-10 PASSED] Packaging Slip {packing_record['packing_number']} created (10 Bundles, 100 Sheets).")

        # =========================================================================
        # 11. Logistics & Dispatch Slip Generation
        # =========================================================================
        dispatch_payload = {
            "party_id": party["id"],
            "sales_order_id": order_id,
            "vehicle_number": "GJ-01-XX-9999",
            "driver_name": "Ramesh Singh",
            "driver_phone": "9876543210",
            "transporter": "V-Trans Roadways",
            "lr_number": "LR-2026-00991",
            "dispatch_date": "2026-08-24",
            "remarks": "Gate cleared for commercial transit",
            "items": [
                {
                    "packing_id": packing_id,
                    "sales_order_item_id": order_item_1["id"],
                    "dispatched_quantity": 100,
                    "package_count": 10,
                }
            ],
        }
        create_disp_res = await client.post("/api/v1/dispatches", json=dispatch_payload, headers=disp_headers)
        assert create_disp_res.status_code in [200, 201], f"Create dispatch failed: {create_disp_res.text}"
        dispatch = create_disp_res.json()["data"]
        dispatch_id = dispatch["id"]
        assert dispatch["status"] == "READY"
        print(f"[UAT-11 PASSED] Dispatch Slip {dispatch['dispatch_number']} registered (Vehicle: GJ-01-XX-9999).")

        # =========================================================================
        # 12. Gate Clearance & Verification
        # =========================================================================
        gate_out_res = await client.post(f"/api/v1/dispatches/{dispatch_id}/gate-out", headers=disp_headers)
        assert gate_out_res.status_code == 200, f"Gate out failed: {gate_out_res.text}"
        assert gate_out_res.json()["data"]["status"] == "DISPATCHED"
        assert gate_out_res.json()["data"]["gate_out_time"] is not None
        print(f"[UAT-12 PASSED] Gate Out verified and confirmed for {dispatch['dispatch_number']}.")

        # =========================================================================
        # 13. PDF Dispatch Sheet Generation & Verification
        # =========================================================================
        pdf_res = await client.get(f"/api/v1/dispatches/{dispatch_id}/pdf", headers=disp_headers)
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert pdf_res.content.startswith(b"%PDF")
        assert len(pdf_res.content) > 1000
        print(f"[UAT-13 PASSED] Verified ReportLab PDF Dispatch Sheet Generation ({len(pdf_res.content)} bytes, binary header %PDF).")

        # =========================================================================
        # 14. Real-time Dashboard KPIs & Demand Intelligence Verification
        # =========================================================================
        dash_res = await client.get("/api/v1/dashboards", headers=mgmt_headers)
        assert dash_res.status_code == 200
        summary = dash_res.json()["data"]
        kpis = summary["kpis"]
        assert kpis["total_orders"] >= 1
        assert kpis["dispatched_count"] >= 1
        assert len(summary["demand_by_party"]) >= 1
        assert len(summary["demand_by_thickness"]) >= 1
        assert len(summary["demand_by_density"]) >= 1
        print(f"[UAT-14 PASSED] Computed Executive Dashboard KPIs and 3-way demand intelligence (Party, Thickness, Density).")

        # =========================================================================
        # 15. Compliance Audit Trail Verification
        # =========================================================================
        audit_res = await client.get("/api/v1/audit-logs", headers=admin_headers)
        assert audit_res.status_code == 200
        logs = audit_res.json()["data"]
        assert len(logs) >= 5
        print(f"[UAT-15 PASSED] Immutable Audit Trail verified ({len(logs)} audit entries logged across all events).")
        print("\n=======================================================")
        print("ALL 15 END-TO-END USER ACCEPTANCE TESTS PASSED 100%!")
        print("=======================================================")


if __name__ == "__main__":
    asyncio.run(test_complete_end_to_end_manufacturing_lifecycle_uat())
