import io
from fastapi.testclient import TestClient


def test_ai_scanned_order_and_advisor_flow(client: TestClient):
    # 1. Login as Sales / Admin
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "sales", "password": "Fixo@12345"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload Scanned Order with Mock file & OCR text
    test_file_content = b"Simulated image capture for Apex Doors Bhiwandi WPC Ply 18mm 50 sheets"
    files = {
        "file": ("camera_chit.jpg", io.BytesIO(test_file_content), "image/jpeg"),
    }
    data = {
        "mock_raw_text": "Apex Doors & Interiors\nPh: 9823456789\nFixoBoard WPC Ply 18mm - 60 sheets\nWPC Solid Door 30mm - 20 pcs\nLocation: Bhiwandi Bay 4",
    }
    upload_res = client.post(
        "/api/v1/scanned-orders/upload",
        headers=headers,
        files=files,
        data=data,
    )
    assert upload_res.status_code == 201, f"Upload error: {upload_res.text}"
    scan = upload_res.json()
    assert "scan_number" in scan
    assert len(scan["items"]) > 0
    scan_id = scan["id"]

    # 3. Retrieve Scanned Order Details
    get_res = client.get(f"/api/v1/scanned-orders/{scan_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == scan_id

    # 4. Human-in-the-Loop Update Draft
    parties_res = client.get("/api/v1/parties/all", headers=headers)
    parties = parties_res.json()["data"]
    target_party_id = parties[0]["id"] if parties else scan.get("dealer_id")

    update_res = client.put(
        f"/api/v1/scanned-orders/{scan_id}",
        headers=headers,
        json={
            "extracted_customer_name": "Apex Doors Verified",
            "dealer_id": target_party_id,
            "extracted_remarks": "Supervisor verified before production approval",
        },
    )
    assert update_res.status_code == 200
    assert update_res.json()["extracted_customer_name"] == "Apex Doors Verified"

    # 5. Approve & Promote to Formal Sales Order
    approve_res = client.post(
        f"/api/v1/scanned-orders/{scan_id}/approve",
        headers=headers,
        json={
            "party_id": target_party_id,
            "priority": "HIGH",
            "required_date": "2026-09-10",
            "remarks": "Approved from Mobile Camera Scan",
        },
    )
    assert approve_res.status_code == 200, f"Approve error: {approve_res.text}"
    sales_order = approve_res.json()
    assert "order_number" in sales_order
    assert sales_order["order_source"] == "CAT"

    # 6. Test AI Advisor Chat Endpoint (Restricted to Admin & Plant Manager)
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "Fixo@12345"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    advisor_res = client.post(
        "/api/v1/ai-advisor/chat",
        headers=admin_headers,
        json={
            "session_id": "test-session-123",
            "message": "Which thickness is recommended for modular kitchen carcass?",
        },
    )
    assert advisor_res.status_code == 200
    advisor_data = advisor_res.json()
    assert "response_text" in advisor_data
    assert len(advisor_data["response_text"]) > 10
