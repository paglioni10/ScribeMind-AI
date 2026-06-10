from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db.supabase_client import get_supabase_client
from app.services.auth_service import CurrentUser, get_current_user, require_role


router = APIRouter(prefix="/members", tags=["Members"])


class UpdateRoleRequest(BaseModel):
    role: str  # member | admin | owner


@router.get("/")
def list_members(user: CurrentUser = Depends(get_current_user)):
    supabase = get_supabase_client()

    members = (
        supabase.table("organization_members")
        .select("id, user_id, role, created_at")
        .eq("organization_id", user.organization_id)
        .order("created_at")
        .execute()
    )

    rows = members.data or []
    user_ids = [row["user_id"] for row in rows]

    profiles_map = {}
    if user_ids:
        profiles = (
            supabase.table("profiles")
            .select("id, full_name, email")
            .in_("id", user_ids)
            .execute()
        )
        profiles_map = {p["id"]: p for p in (profiles.data or [])}

    enriched = []
    for row in rows:
        profile = profiles_map.get(row["user_id"], {})
        enriched.append(
            {
                **row,
                "full_name": profile.get("full_name"),
                "email": profile.get("email"),
                "is_you": row["user_id"] == user.user_id,
            }
        )

    return {"members": enriched}


@router.patch("/{member_id}")
def update_member_role(
    member_id: str,
    request: UpdateRoleRequest,
    user: CurrentUser = Depends(require_role("admin")),
):
    if request.role not in ("member", "admin", "owner"):
        raise HTTPException(status_code=400, detail="Papel inválido.")

    supabase = get_supabase_client()

    target = (
        supabase.table("organization_members")
        .select("id, user_id, role, organization_id")
        .eq("id", member_id)
        .eq("organization_id", user.organization_id)
        .limit(1)
        .execute()
    )
    if not target.data:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    member = target.data[0]

    # Só owner pode promover/rebaixar para/de owner
    if (request.role == "owner" or member["role"] == "owner") and user.role != "owner":
        raise HTTPException(
            status_code=403,
            detail="Apenas o owner pode gerenciar o papel de owner.",
        )

    updated = (
        supabase.table("organization_members")
        .update({"role": request.role})
        .eq("id", member_id)
        .eq("organization_id", user.organization_id)
        .execute()
    )

    return {"message": "Papel atualizado.", "member": updated.data[0]}


@router.delete("/{member_id}")
def remove_member(
    member_id: str,
    user: CurrentUser = Depends(require_role("admin")),
):
    supabase = get_supabase_client()

    target = (
        supabase.table("organization_members")
        .select("id, user_id, role")
        .eq("id", member_id)
        .eq("organization_id", user.organization_id)
        .limit(1)
        .execute()
    )
    if not target.data:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    member = target.data[0]

    if member["role"] == "owner":
        raise HTTPException(status_code=403, detail="Não é possível remover o owner.")

    if member["user_id"] == user.user_id:
        raise HTTPException(status_code=400, detail="Você não pode remover a si mesmo.")

    supabase.table("organization_members").delete().eq("id", member_id).eq(
        "organization_id", user.organization_id
    ).execute()

    return {"message": "Membro removido.", "member_id": member_id}
