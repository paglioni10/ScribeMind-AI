import logging

from app.db.supabase_client import get_supabase_client


logger = logging.getLogger("scribemind.audit")


def record_audit(
    organization_id: str,
    user_id: str | None,
    action: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    """
    Registra uma ação no histórico de auditoria.

    Falhas aqui NUNCA devem interromper a ação principal — por isso o
    try/except amplo. A auditoria é melhor-esforço.
    """
    try:
        supabase = get_supabase_client()
        supabase.table("audit_logs").insert(
            {
                "organization_id": organization_id,
                "user_id": user_id,
                "action": action,
                "entity_type": entity_type,
                "entity_id": str(entity_id) if entity_id is not None else None,
                "metadata": metadata or {},
            }
        ).execute()
    except Exception as error:  # noqa: BLE001
        logger.warning("Falha ao registrar auditoria (%s): %s", action, error)


def list_audit_logs(organization_id: str, limit: int = 100) -> list[dict]:
    supabase = get_supabase_client()

    logs = (
        supabase.table("audit_logs")
        .select("id, user_id, action, entity_type, entity_id, metadata, created_at")
        .eq("organization_id", organization_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    rows = logs.data or []
    user_ids = [r["user_id"] for r in rows if r.get("user_id")]

    profiles_map = {}
    if user_ids:
        profiles = (
            supabase.table("profiles")
            .select("id, full_name, email")
            .in_("id", list(set(user_ids)))
            .execute()
        )
        profiles_map = {p["id"]: p for p in (profiles.data or [])}

    enriched = []
    for row in rows:
        profile = profiles_map.get(row.get("user_id"), {})
        enriched.append(
            {
                **row,
                "actor_name": profile.get("full_name"),
                "actor_email": profile.get("email"),
            }
        )

    return enriched
