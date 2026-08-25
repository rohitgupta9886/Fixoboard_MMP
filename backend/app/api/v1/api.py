from fastapi import APIRouter

from app.api.v1.endpoints import (
    ai_po,
    audit,
    auth,
    dashboards,
    dispatch,
    machines,
    packing,
    parties,
    production_memos,
    production_runs,
    products,
    reports,
    roles,
    sales_orders,
    specifications,
    users,
    crm,
    ai_advisor,
    scanned_orders,
    public_portal,
    notifications,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles & Permissions"])
api_router.include_router(parties.router, prefix="/parties", tags=["Parties"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(specifications.router, prefix="/specifications", tags=["Specifications"])
api_router.include_router(machines.router, prefix="/machines", tags=["Machines"])
api_router.include_router(sales_orders.router, prefix="/sales-orders", tags=["Sales Orders"])
api_router.include_router(production_memos.router, prefix="/production-memos", tags=["Production Memos"])
api_router.include_router(production_runs.router, prefix="/production-runs", tags=["Production Runs"])
api_router.include_router(packing.router, prefix="/packing", tags=["Packing"])
api_router.include_router(dispatch.router, prefix="/dispatch", tags=["Dispatch"])
api_router.include_router(dispatch.router, prefix="/dispatches", tags=["Dispatch (Alias)"])
api_router.include_router(dashboards.router, prefix="/dashboards", tags=["Dashboards"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Live Notifications"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Logs"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["Audit Logs (Alias)"])
api_router.include_router(ai_po.router, prefix="/ai-po", tags=["Automated PO Extraction"])
api_router.include_router(crm.router, prefix="/crm", tags=["CRM & Leads"])
api_router.include_router(ai_advisor.router, prefix="/ai-advisor", tags=["Smart Product Advisor"])
api_router.include_router(scanned_orders.router, prefix="/scanned-orders", tags=["Digital Order Scanner"])
api_router.include_router(public_portal.router, prefix="/public", tags=["Public Portal & Dealers"])


