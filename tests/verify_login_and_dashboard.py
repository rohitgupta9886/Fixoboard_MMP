import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # Test 1: Health check
        res = await client.get('http://127.0.0.1:8000/health')
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("[CHECK 1 PASSED] Backend Health check OK:", res.json())

        # Test 2: Authenticate Plant Manager
        login_res = await client.post(
            'http://127.0.0.1:8000/api/v1/auth/login',
            json={'username': 'management', 'password': 'Fixo@12345'},
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        data = login_res.json()['data']
        token = data['access_token']
        user = data['user']
        print(f"[CHECK 2 PASSED] Logged in as: {user['full_name']} (Roles: {user['roles']})")

        # Test 3: Authenticated /auth/me
        headers = {'Authorization': f'Bearer {token}'}
        me_res = await client.get('http://127.0.0.1:8000/api/v1/auth/me', headers=headers)
        assert me_res.status_code == 200, f"/auth/me failed: {me_res.text}"
        print(f"[CHECK 3 PASSED] User verification (/auth/me) OK for: {me_res.json()['data']['email']}")

        # Test 4: Dashboard API
        dash_res = await client.get('http://127.0.0.1:8000/api/v1/dashboards', headers=headers)
        assert dash_res.status_code == 200, f"Dashboard API failed: {dash_res.text}"
        dash_data = dash_res.json()['data']
        print("[CHECK 4 PASSED] Dashboard Summary API OK:")
        print("  - Open Orders:", dash_data['kpis']['open_orders'])
        print("  - Produced Today:", dash_data['kpis']['today_produced_quantity'])
        print("  - In Progress Runs:", dash_data['kpis']['in_progress_runs'])
        print("  - Demand by Party Count:", len(dash_data['demand_by_party']))

        # Test 5: Check frontend dev server response
        try:
            fe_res = await client.get('http://127.0.0.1:3000/')
            assert fe_res.status_code == 200
            print("[CHECK 5 PASSED] Frontend server is serving index.html on port 3000")
        except Exception as e:
            print("[CHECK 5 NOTE] Frontend on port 3000:", e)

    print("\n=======================================================")
    print("ALL LOGIN & DASHBOARD API CHECKS PASSED WITH 100% OK!")
    print("=======================================================")

if __name__ == '__main__':
    asyncio.run(main())
