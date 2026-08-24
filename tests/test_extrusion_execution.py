import asyncio
import pytest
import httpx
from app.main import app


@pytest.mark.asyncio
async def test_extrusion_lifecycle():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        # 1. Login as operator / production head
        login_res = await client.post(
            '/api/v1/auth/login',
            json={'username': 'management', 'password': 'Fixo@12345'},
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Create fresh order and memo for isolated test
        parties_res = await client.get('/api/v1/parties/all', headers=headers)
        party_id = parties_res.json()['data'][0]['id']
        prods_res = await client.get('/api/v1/products/all', headers=headers)
        product_id = prods_res.json()['data'][0]['id']
        thicks_res = await client.get('/api/v1/specifications/thicknesses', headers=headers)
        thickness_id = thicks_res.json()['data'][0]['id']
        dens_res = await client.get('/api/v1/specifications/densities', headers=headers)
        density_id = dens_res.json()['data'][0]['id']
        machines_res = await client.get('/api/v1/machines/all', headers=headers)
        machine_id = machines_res.json()['data'][0]['id']

        order_res = await client.post('/api/v1/sales-orders', json={
            'party_id': party_id,
            'order_source': 'MANUAL',
            'required_date': '2026-09-15',
            'priority': 'URGENT',
            'remarks': 'Extrusion test order',
            'items': [{
                'product_id': product_id,
                'thickness_id': thickness_id,
                'density_id': density_id,
                'ordered_quantity': 100,
                'unit_price': 1500.0,
                'unit': 'Sheets',
            }],
        }, headers=headers)
        assert order_res.status_code == 200
        order = order_res.json()['data']
        item_id = order['items'][0]['id']

        # Submit & Approve Order
        await client.post(f"/api/v1/sales-orders/{order['id']}/submit", headers=headers)
        await client.post(f"/api/v1/sales-orders/{order['id']}/approve", headers=headers)

        # Generate memo and assign machine
        memo_res = await client.post('/api/v1/production-memos', json={
            'sales_order_id': order['id'],
            'sales_order_item_id': item_id,
            'target_machine_id': machine_id,
            'planned_quantity': 100,
            'priority': 'URGENT',
            'required_date': '2026-09-15',
            'remarks': 'Auto test memo',
        }, headers=headers)
        assert memo_res.status_code == 200, f"Memo creation failed: {memo_res.text}"
        memo = memo_res.json()['data']
        memo_id = memo['id']

        # Release memo to shop floor
        release_res = await client.post(f"/api/v1/production-memos/{memo_id}/release", headers=headers)
        assert release_res.status_code == 200
        memo = release_res.json()['data']
        print(f"[CHECK 1 PASSED] Generated & Released Memo: {memo['memo_number']} (Status: {memo['status']})")

        # 3. Start Production Run
        start_payload = {
            'production_memo_id': memo['id'],
            'machine_id': memo.get('target_machine_id') or None,
            'shift': 'Shift A (08:00 - 16:00)',
            'planned_quantity': 100,
            'remarks': 'Automated verification run',
        }
        start_res = await client.post('/api/v1/production-runs/start', json=start_payload, headers=headers)
        assert start_res.status_code == 200, f"Start Run failed: {start_res.text}"
        run = start_res.json()['data']
        print(f"[CHECK 2 PASSED] Production Run started: {run['id']} (Status: {run['status']})")

        # 4. Log Output (+25 sheets, +2.5kg scrap)
        out_payload = {
            'good_quantity': 25,
            'rejected_quantity': 0,
            'scrap_weight_kg': 2.5,
            'defect_reason': 'SURFACE_DEFECT',
            'remarks': 'First batch test',
        }
        out_res = await client.post(f"/api/v1/production-runs/{run['id']}/output", json=out_payload, headers=headers)
        assert out_res.status_code == 200, f"Log output failed: {out_res.text}"
        logged_run = out_res.json()['data']
        print(f"[CHECK 3 PASSED] Logged output. Good Qty: {logged_run['good_quantity']}, Scrap: {logged_run['waste_kg']} kg")

        # 5. Pause Run
        pause_res = await client.post(
            f"/api/v1/production-runs/{run['id']}/pause",
            json={'rejection_reason': 'OPERATOR_PAUSE', 'remarks': 'Test pause'},
            headers=headers,
        )
        assert pause_res.status_code == 200
        print(f"[CHECK 4 PASSED] Paused Run: {pause_res.json()['data']['status']}")

        # 6. Resume Run
        resume_res = await client.post(f"/api/v1/production-runs/{run['id']}/resume", headers=headers)
        assert resume_res.status_code == 200
        print(f"[CHECK 5 PASSED] Resumed Run: {resume_res.json()['data']['status']}")

    print("\n=======================================================")
    print("ALL PRODUCTION EXTRUSION RUN CHECKS PASSED WITH 100% OK!")
    print("=======================================================")

if __name__ == '__main__':
    asyncio.run(test_extrusion_lifecycle())
