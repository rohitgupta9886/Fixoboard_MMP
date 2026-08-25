from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.dispatch import Dispatch
from app.models.packing import PackingRecord
from app.models.production_memo import ProductionMemo
from app.models.production_run import ProductionRun
from app.models.sales_order import SalesOrder
from app.models.scanned_order import ScannedOrder
from app.models.user import User
from app.schemas.common import ApiResponse

router = APIRouter()


def time_ago(dt: Optional[datetime]) -> str:
    if not dt:
        return "recently"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = max(1, seconds // 60)
        return f"{minutes} min{'s' if minutes > 1 else ''} ago"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hr{'s' if hours > 1 else ''} ago"
    else:
        days = seconds // 86400
        return f"{days} day{'s' if days > 1 else ''} ago"


@router.get("", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_live_notifications(
    limit: int = Query(30, ge=5, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns real-time functional notification feeds for Admin, Management, and Factory Operations.
    Captures live sales order creations, approvals, production memos, shop-floor runs, and dispatches.
    """
    notifications: List[Dict[str, Any]] = []

    # 1. Fetch recent Audit Logs (Captures all explicit actions across the system)
    audit_stmt = (
        select(AuditLog)
        .options(selectinload(AuditLog.user))
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    audit_res = await db.execute(audit_stmt)
    logs = audit_res.scalars().all()

    for log in logs:
        action = (log.action or "").upper()
        entity = (log.entity_name or "").lower()
        actor = log.user.full_name if log.user else "System"

        n_type = "system"
        title = f"{log.action} on {log.entity_name}"
        desc_text = f"Action {action} performed by {actor}."
        link = "/dashboard"
        is_important = False

        if "sales_order" in entity or "order" in entity:
            n_type = "orders"
            link = "/sales-orders"
            if "CREATE" in action:
                title = "New Sales Order Created"
                desc_text = f"Sales order was created by {actor}."
                is_important = True
            elif "SUBMIT" in action:
                title = "Sales Order Submitted for Approval"
                desc_text = f"Order submitted for Management review by {actor}."
                is_important = True
            elif "APPROVE" in action:
                title = "Sales Order Approved"
                desc_text = f"Order approved by {actor}. Production memo queued."
                is_important = True
            elif "REJECT" in action or "CANCEL" in action:
                title = "Sales Order Status Changed"
                desc_text = f"Order marked as {action} by {actor}."
                is_important = True

        elif "production_memo" in entity or "memo" in entity:
            n_type = "production"
            link = "/production/memos"
            if "CREATE" in action or "PLAN" in action:
                title = "Production Memo Generated"
                desc_text = f"Production memo generated and queued for machine assignment by {actor}."
                is_important = True
            elif "ASSIGN" in action or "RELEASE" in action:
                title = "Memo Assigned to Extrusion Line"
                desc_text = f"Production memo assigned to machine floor by {actor}."
                is_important = True

        elif "production_run" in entity or "run" in entity:
            n_type = "production"
            link = "/production/execution"
            title = "Production Floor Output Logged"
            desc_text = f"Extrusion shift run recorded by {actor}."

        elif "packing" in entity:
            n_type = "orders"
            link = "/packing"
            title = "Packaging & Bundling Update"
            desc_text = f"Packing batch logged by {actor}."

        elif "dispatch" in entity:
            n_type = "dispatch"
            link = "/dispatch"
            title = "Dispatch Gate Clearance"
            desc_text = f"Vehicle manifest processed by {actor}."
            is_important = True

        elif "scanned" in entity or "ai" in entity:
            n_type = "orders"
            link = "/ai-scanner"
            title = "AI PO Digitized"
            desc_text = f"Order chit transcribed via AI Vision by {actor}."

        notifications.append({
            "id": f"audit_{log.id}",
            "type": n_type,
            "title": title,
            "desc": desc_text,
            "time": time_ago(log.created_at),
            "created_at": log.created_at.isoformat() if log.created_at else datetime.now(timezone.utc).isoformat(),
            "isImportant": is_important,
            "link": link,
            "actor": actor,
        })

    # 2. Add Live Sales Orders recent milestones
    so_stmt = (
        select(SalesOrder)
        .options(selectinload(SalesOrder.party), selectinload(SalesOrder.created_by_user))
        .order_by(SalesOrder.updated_at.desc())
        .limit(10)
    )
    so_res = await db.execute(so_stmt)
    recent_sos = so_res.scalars().all()

    for so in recent_sos:
        party_str = so.party.party_name if so.party else "Customer"
        amt_str = f"₹{float(so.total_amount or 0):,.2f}"
        
        # Avoid duplicate audit IDs
        notif_id = f"so_{so.id}_{so.status}"
        if not any(n["id"] == notif_id for n in notifications):
            is_important = so.status in ["SUBMITTED", "APPROVED", "DRAFT"]
            title_map = {
                "DRAFT": f"Draft Sales Order ({so.order_number})",
                "SUBMITTED": f"Order Awaiting Approval: {so.order_number}",
                "APPROVED": f"Sales Order Approved: {so.order_number}",
                "IN_PRODUCTION": f"Order in Extrusion: {so.order_number}",
                "COMPLETED": f"Order Completed: {so.order_number}",
            }
            notifications.append({
                "id": notif_id,
                "type": "orders",
                "title": title_map.get(str(so.status), f"Order {so.order_number}"),
                "desc": f"{party_str} • Value: {amt_str} • Status: {so.status}",
                "time": time_ago(so.updated_at or so.created_at),
                "created_at": (so.updated_at or so.created_at).isoformat() if (so.updated_at or so.created_at) else datetime.now(timezone.utc).isoformat(),
                "isImportant": is_important,
                "link": "/sales-orders",
                "actor": so.created_by_user.full_name if so.created_by_user else "Commercial Sales",
            })

    # 3. Add Live Production Memos recent milestones
    pm_stmt = (
        select(ProductionMemo)
        .options(selectinload(ProductionMemo.sales_order), selectinload(ProductionMemo.target_machine))
        .order_by(ProductionMemo.created_at.desc())
        .limit(8)
    )
    pm_res = await db.execute(pm_stmt)
    recent_pms = pm_res.scalars().all()

    for pm in recent_pms:
        so_num = pm.sales_order.order_number if pm.sales_order else "N/A"
        mach_name = pm.target_machine.machine_name if pm.target_machine else "Floor Planning"
        notif_id = f"pm_{pm.id}"
        if not any(n["id"] == notif_id for n in notifications):
            notifications.append({
                "id": notif_id,
                "type": "production",
                "title": f"Production Memo: {pm.memo_number}",
                "desc": f"Order {so_num} • Planned: {float(pm.planned_quantity or 0):,.0f} sheets on {mach_name} ({pm.status})",
                "time": time_ago(pm.created_at),
                "created_at": pm.created_at.isoformat() if pm.created_at else datetime.now(timezone.utc).isoformat(),
                "isImportant": pm.priority in ["HIGH", "URGENT"],
                "link": "/production/memos",
                "actor": "Plant Supervisor",
            })

    # 4. Add Live Dispatches recent milestones
    disp_stmt = (
        select(Dispatch)
        .options(selectinload(Dispatch.party), selectinload(Dispatch.sales_order))
        .order_by(Dispatch.created_at.desc())
        .limit(6)
    )
    disp_res = await db.execute(disp_stmt)
    recent_disps = disp_res.scalars().all()

    for d in recent_disps:
        p_name = d.party.party_name if d.party else "Customer"
        notif_id = f"disp_{d.id}"
        if not any(n["id"] == notif_id for n in notifications):
            notifications.append({
                "id": notif_id,
                "type": "dispatch",
                "title": f"Dispatch Manifest: {d.dispatch_number}",
                "desc": f"{p_name} • Vehicle: {d.vehicle_number or 'Unassigned'} • Driver: {d.driver_name or 'N/A'} ({d.status})",
                "time": time_ago(d.created_at),
                "created_at": d.created_at.isoformat() if d.created_at else datetime.now(timezone.utc).isoformat(),
                "isImportant": True,
                "link": "/dispatch",
                "actor": "Logistics Officer",
            })

    # Sort all notifications chronologically descending
    notifications.sort(key=lambda x: x["created_at"], reverse=True)

    return ApiResponse(
        success=True,
        data=notifications[:limit],
        message="Live notifications retrieved successfully.",
    )
