from fastapi import APIRouter, Depends

from app.services.auth_service import CurrentUser, require_role
from app.services import audit_service


router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/")
def list_logs(user: CurrentUser = Depends(require_role("admin"))):
    return {"logs": audit_service.list_audit_logs(user.organization_id)}
