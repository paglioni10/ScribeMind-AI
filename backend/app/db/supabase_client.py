from supabase import create_client, Client

from app.core.config import settings


def get_supabase_client() -> Client:
    """Cliente padrão (service key se disponível, senão a key normal)."""
    key = settings.supabase_service_key or settings.supabase_key
    return create_client(settings.supabase_url, key)


def get_supabase_auth_client() -> Client:
    """
    Cliente para verificar tokens de usuário.
    Usa a key pública (anon) — suficiente para auth.get_user(jwt).
    """
    return create_client(settings.supabase_url, settings.supabase_key)
