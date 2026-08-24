import asyncio
import pytest
import httpx
from app.main import app


@pytest.mark.asyncio
async def test_order_submission():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        # 1. Login
        login_res = await client.post(
            '/api/v1/auth/login',
            json={'username': 'management', 'password': 'Fixo@12345'},
        )
        assert login_res.status_code == 200
        token = login_res.json()['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Get master data
        parties_res = await client.get('/api/v1/parties/all', headers=headers)
        party_id = parties_res.json()['data'][0]['id']

        prods_res = await client.get('/api/v1/products/all', headers=headers)
        product_id = prods_res.json()['data'][0]['id']

        thicks_res = await client.get('/api/v1/specifications/thicknesses', headers=headers)
        thickness_id = thicks_res.json()['data'][0]['id']

        dens_res = await client.get('/api/v1/specifications/densities', headers=headers)
        density_id = dens_res.json()['data'][0]['id']

        # 3. Create Sales Order with MANUAL source
        payload = {
            'party_id': party_id,
            'order_source': 'MANUAL',
            'required_date': '2026-09-01',
            'priority': 'NORMAL',
            'remarks': 'Testing UI Submit and Queue',
            'items': [
                {
                    'product_id': product_id,
                    'thickness_id': thickness_id,
                    'density_id': density_id,
                    'ordered_quantity': 100,
                    'unit_price': 1350.0,
                    'unit': 'Sheets',
                }
            ],
        }

        create_res = await client.post('/api/v1/sales-orders', json=payload, headers=headers)
        assert create_res.status_code == 200, f"Create failed: {create_res.text}"
        order = create_res.json()['data']
        print(f"[TEST 1 PASSED] Order created successfully: {order['order_number']} (Status: {order['status']})")

        # 4. Submit Sales Order
        submit_res = await client.post(f"/api/v1/sales-orders/{order['id']}/submit", headers=headers)
        assert submit_res.status_code == 200, f"Submit failed: {submit_res.text}"
        submitted_order = submit_res.json()['data']
        print(f"[TEST 2 PASSED] Order transitioned to: {submitted_order['status']}")

    print("\n=======================================================")
    print("ORDER CREATION AND QUEUE SUBMISSION VERIFIED 100% OK!")
    print("=======================================================")


if __name__ == '__main__':
    asyncio.run(test_order_submission())
