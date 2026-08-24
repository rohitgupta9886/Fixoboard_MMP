from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_login_and_rbacs(client: TestClient):
    # Test valid login
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "sales", "password": "Fixo@12345"},
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    token = res_data["data"]["access_token"]
    assert token is not None

    headers = {"Authorization": f"Bearer {token}"}

    # Sales can read parties
    party_res = client.get("/api/v1/parties", headers=headers)
    assert party_res.status_code == 200
    assert party_res.json()["success"] is True

    # Sales cannot manage users (403 Forbidden)
    user_res = client.get("/api/v1/users", headers=headers)
    assert user_res.status_code == 403
    assert user_res.json()["error"]["code"] == "FORBIDDEN"


def test_dashboard_kpis(client: TestClient):
    # Log in as management
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "management", "password": "Fixo@12345"},
    )
    token = response.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch dashboard data
    dash_res = client.get("/api/v1/dashboards", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()["data"]
    assert "kpis" in dash_data
    assert "demand_by_party" in dash_data
    assert "demand_by_thickness" in dash_data
    assert "demand_by_density" in dash_data
