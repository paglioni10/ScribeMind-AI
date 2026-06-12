from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.db.supabase_client import get_supabase_client
from app.services.auth_service import CurrentUser, get_current_user, require_role
from app.services.audit_service import record_audit


router = APIRouter(prefix="/access-requests", tags=["Access Requests"])


@router.get("/mine")
def my_request(user: CurrentUser = Depends(get_current_user)):
    """Status do pedido do próprio usuário + se já tem acesso."""
    supabase = get_supabase_client()
    existing = (
        supabase.table("dashboard_access_requests")
        .select("id, status, created_at")
        .eq("organization_id", user.organization_id)
        .eq("user_id", user.user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return {
        "can_view_dashboard": user.can_view_dashboard,
        "request": existing.data[0] if existing.data else None,
    }


@router.post("/")
def create_request(user: CurrentUser = Depends(get_current_user)):
    if user.can_view_dashboard:
        raise HTTPException(
            status_code=400, detail="Você já tem acesso ao dashboard."
        )

    supabase = get_supabase_client()

    # Já existe um pedido pendente? Retorna ele em vez de duplicar.
    pending = (
        supabase.table("dashboard_access_requests")
        .select("id, status, created_at")
        .eq("organization_id", user.organization_id)
        .eq("user_id", user.user_id)
        .eq("status", "pending")
        .limit(1)
        .execute()
    )
    if pending.data:
        return {"message": "Pedido já enviado.", "request": pending.data[0]}

    created = (
        supabase.table("dashboard_access_requests")
        .insert(
            {
                "organization_id": user.organization_id,
                "user_id": user.user_id,
                "status": "pending",
            }
        )
        .execute()
    )

    record_audit(
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="access_request.created",
        entity_type="access_request",
        entity_id=created.data[0]["id"],
    )

    return {"message": "Pedido enviado.", "request": created.data[0]}


@router.get("/")
def list_requests(user: CurrentUser = Depends(require_role("admin"))):
    """Pedidos pendentes da organização (para admin/owner)."""
    supabase = get_supabase_client()
    requests = (
        supabase.table("dashboard_access_requests")
        .select("id, user_id, status, created_at")
        .eq("organization_id", user.organization_id)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )

    rows = requests.data or []
    user_ids = [r["user_id"] for r in rows]

    profiles_map = {}
    if user_ids:
        profiles = (
            supabase.table("profiles")
            .select("id, full_name, email")
            .in_("id", user_ids)
            .execute()
        )
        profiles_map = {p["id"]: p for p in (profiles.data or [])}

    enriched = [
        {
            **r,
            "full_name": profiles_map.get(r["user_id"], {}).get("full_name"),
            "email": profiles_map.get(r["user_id"], {}).get("email"),
        }
        for r in rows
    ]
    return {"requests": enriched}


def _get_request(supabase, request_id, org_id):
    result = (
        supabase.table("dashboard_access_requests")
        .select("id, user_id, status")
        .eq("id", request_id)
        .eq("organization_id", org_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


@router.post("/{request_id}/approve")
def approve_request(
    request_id: str,
    user: CurrentUser = Depends(require_role("admin")),
):
    supabase = get_supabase_client()
    req = _get_request(supabase, request_id, user.organization_id)
    if not req:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")

    # Concede a permissão de dashboard ao membro
    supabase.table("organization_members").update({"dashboard_access": True}).eq(
        "user_id", req["user_id"]
    ).eq("organization_id", user.organization_id).execute()

    supabase.table("dashboard_access_requests").update(
        {
            "status": "approved",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
            "resolved_by": user.user_id,
        }
    ).eq("id", request_id).execute()

    record_audit(
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="access_request.approved",
        entity_type="access_request",
        entity_id=request_id,
        metadata={"target_user_id": req["user_id"]},
    )

    return {"message": "Acesso ao dashboard concedido.", "request_id": request_id}


@router.post("/{request_id}/deny")
def deny_request(
    request_id: str,
    user: CurrentUser = Depends(require_role("admin")),
):
    supabase = get_supabase_client()
    req = _get_request(supabase, request_id, user.organization_id)
    if not req:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")

    supabase.table("dashboard_access_requests").update(
        {
            "status": "denied",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
            "resolved_by": user.user_id,
        }
    ).eq("id", request_id).execute()

    record_audit(
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="access_request.denied",
        entity_type="access_request",
        entity_id=request_id,
        metadata={"target_user_id": req["user_id"]},
    )

    return {"message": "Pedido recusado.", "request_id": request_id}
