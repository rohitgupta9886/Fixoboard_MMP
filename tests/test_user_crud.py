from fastapi.testclient import TestClient


def test_user_crud_lifecycle(client: TestClient):
    # 1. Login as admin
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "Fixo@12345"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    admin_id = login_res.json()["data"]["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. List users
    list_res = client.get("/api/v1/users", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["success"] is True
    initial_total = list_res.json()["pagination"]["total"]

    # 3. Create a new user
    new_user_data = {
        "username": "test_operator_crud",
        "email": "test_operator_crud@fixoboard.com",
        "password": "Password@123",
        "full_name": "Test CRUD Operator",
        "phone_number": "+91 9988776655",
        "department": "Extrusion Line 1",
        "role_ids": [],
    }
    create_res = client.post("/api/v1/users", json=new_user_data, headers=headers)
    assert create_res.status_code == 200
    created_user = create_res.json()["data"]
    created_user_id = created_user["id"]
    assert created_user["username"] == "test_operator_crud"
    assert created_user["email"] == "test_operator_crud@fixoboard.com"
    assert created_user["is_active"] is True

    # 4. Read single user by ID
    get_res = client.get(f"/api/v1/users/{created_user_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == created_user_id

    # 5. Search users
    search_res = client.get("/api/v1/users?search=test_operator_crud", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()["data"]) >= 1

    # 6. Update user
    update_data = {
        "full_name": "Test CRUD Operator Updated",
        "department": "Quality Assurance",
        "phone_number": "+91 9123456789",
    }
    update_res = client.put(f"/api/v1/users/{created_user_id}", json=update_data, headers=headers)
    assert update_res.status_code == 200
    updated_user = update_res.json()["data"]
    assert updated_user["full_name"] == "Test CRUD Operator Updated"
    assert updated_user["department"] == "Quality Assurance"

    # 7. Toggle status (Deactivate)
    status_res = client.patch(
        f"/api/v1/users/{created_user_id}/status",
        json={"is_active": False},
        headers=headers,
    )
    assert status_res.status_code == 200
    assert status_res.json()["data"]["is_active"] is False

    # 8. Self-deletion prevention
    self_del_res = client.delete(f"/api/v1/users/{admin_id}", headers=headers)
    assert self_del_res.status_code == 400

    # 9. Delete created user
    del_res = client.delete(f"/api/v1/users/{created_user_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 10. Verify user no longer exists
    not_found_res = client.get(f"/api/v1/users/{created_user_id}", headers=headers)
    assert not_found_res.status_code == 404
