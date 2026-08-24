import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.core.config import settings
from app.models.user import User
from app.schemas.sales_order import SalesOrderResponse
from app.schemas.scanned_order import (
    ScannedOrderApprove,
    ScannedOrderCreate,
    ScannedOrderResponse,
    ScannedOrderUpdate,
)
from app.services.handwritten_order_service import HandwrittenOrderService

router = APIRouter()


@router.get("", response_model=List[ScannedOrderResponse])
async def list_scanned_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    dealer_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = HandwrittenOrderService(session)
    scans, _ = await service.get_scanned_orders(
        skip=skip,
        limit=limit,
        status=status,
        dealer_id=dealer_id,
    )
    return scans


@router.post("/upload", response_model=ScannedOrderResponse, status_code=status.HTTP_201_CREATED)
async def upload_handwritten_order_image(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    dealer_id: Optional[str] = Form(None),
    mock_raw_text: Optional[str] = Form(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    file_bytes = None
    file_name = None
    mime_type = None
    final_image_url = image_url

    if file is not None:
        file_bytes = await file.read()
        file_name = file.filename or "captured_order.jpg"
        mime_type = file.content_type or "image/jpeg"

        # Save to local uploads directory
        save_dir = os.path.join(settings.LOCAL_UPLOAD_DIR, "scanned_orders")
        os.makedirs(save_dir, exist_ok=True)
        ext = os.path.splitext(file_name)[1] or ".jpg"
        unique_name = f"scan_{uuid.uuid4().hex[:10]}{ext}"
        file_path = os.path.join(save_dir, unique_name)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        final_image_url = f"/uploads/scanned_orders/{unique_name}"

    if not final_image_url:
        final_image_url = "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=60"

    service = HandwrittenOrderService(session)
    scan = await service.parse_and_create_scan(
        image_url=final_image_url,
        dealer_id=dealer_id,
        user_id=current_user.id,
        mock_raw_text=mock_raw_text,
        file_bytes=file_bytes,
        file_name=file_name,
        mime_type=mime_type,
    )
    await session.commit()
    return scan


@router.get("/{scan_id}", response_model=ScannedOrderResponse)
async def get_scanned_order(
    scan_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = HandwrittenOrderService(session)
    return await service.get_scanned_order_by_id(scan_id)


@router.put("/{scan_id}", response_model=ScannedOrderResponse)
async def update_scanned_order_draft(
    scan_id: str,
    data: ScannedOrderUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = HandwrittenOrderService(session)
    scan = await service.update_draft(scan_id=scan_id, data=data, user_id=current_user.id)
    await session.commit()
    return scan


@router.post("/{scan_id}/approve", response_model=SalesOrderResponse)
async def approve_scanned_order(
    scan_id: str,
    approval_data: ScannedOrderApprove,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = HandwrittenOrderService(session)
    _, sales_order = await service.approve_and_promote_to_sales_order(
        scan_id=scan_id,
        approval_data=approval_data,
        user_id=current_user.id,
    )
    await session.commit()
    return sales_order


@router.post("/{scan_id}/reject", response_model=ScannedOrderResponse)
async def reject_scanned_order(
    scan_id: str,
    reason: Optional[str] = Form(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = HandwrittenOrderService(session)
    scan = await service.reject_scan(
        scan_id=scan_id,
        reason=reason,
        user_id=current_user.id,
    )
    await session.commit()
    return scan


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scanned_order(
    scan_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = HandwrittenOrderService(session)
    await service.delete_scan(scan_id=scan_id, user_id=current_user.id)
    await session.commit()
    return None
