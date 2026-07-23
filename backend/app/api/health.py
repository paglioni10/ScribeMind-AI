from fastapi import APIRouter

from app.db.supabase_client import get_supabase_client

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "ScribeMind AI",
    }


@router.get("/db")
def health_check_db():
    """
    Faz uma consulta mínima ao banco para registrar atividade e evitar que o
    Supabase pause o projeto por inatividade. Chamado por um GitHub Action.
    """
    try:
        supabase = get_supabase_client()
        supabase.table("organizations").select("id").limit(1).execute()
        return {"status": "ok", "db": "reachable"}
    except Exception as error:  # noqa: BLE001
        return {"status": "error", "db": "unreachable", "detail": str(error)[:120]}
