from fastapi import APIRouter, Depends, File, UploadFile
from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.ai_po_service import AiPoExtractionService

router = APIRouter()


@router.post("/extract", response_model=ApiResponse[dict])
async def extract_po_document(
    file: UploadFile = File(...),
    current_user: User = Depends(require_permission("sales_orders:create")),
):
    contents = await file.read()
    service = AiPoExtractionService()
    result = await service.extract_po_draft(
        file_name=file.filename or "uploaded_order.jpg",
        file_bytes=contents,
        mime_type=file.content_type,
    )
    return ApiResponse(data=result, message="PO document extracted for review")
