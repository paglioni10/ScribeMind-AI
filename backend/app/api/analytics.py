from fastapi import APIRouter, Depends

from app.services.auth_service import CurrentUser, require_dashboard_access
from app.services import analytics_service


router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/metrics")
def metrics(user: CurrentUser = Depends(require_dashboard_access)):
    return analytics_service.get_metrics(user.organization_id)


@router.get("/unanswered")
def unanswered(user: CurrentUser = Depends(require_dashboard_access)):
    return {"unanswered": analytics_service.get_unanswered(user.organization_id)}


@router.get("/gaps")
def gaps(user: CurrentUser = Depends(require_dashboard_access)):
    return {"gaps": analytics_service.get_knowledge_gaps(user.organization_id)}
