from app.db.supabase_client import get_supabase_client


def _make_title(question: str) -> str:
    title = " ".join(question.strip().split())
    return title[:60] if title else "Nova conversa"


def create_conversation(organization_id: str, user_id: str, title: str) -> dict:
    supabase = get_supabase_client()
    response = (
        supabase.table("conversations")
        .insert(
            {
                "organization_id": organization_id,
                "user_id": user_id,
                "title": title,
            }
        )
        .execute()
    )
    return response.data[0]


def get_or_create_conversation(
    organization_id: str,
    user_id: str,
    conversation_id: str | None,
    first_question: str,
) -> dict:
    """Valida a conversa existente (dono + org) ou cria uma nova."""
    supabase = get_supabase_client()

    if conversation_id:
        existing = (
            supabase.table("conversations")
            .select("id, title")
            .eq("id", conversation_id)
            .eq("organization_id", organization_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            return existing.data[0]

    return create_conversation(
        organization_id, user_id, _make_title(first_question)
    )


def save_message(
    conversation_id: str,
    role: str,
    content: str,
    sources: list | None = None,
    answered: bool | None = None,
) -> dict:
    supabase = get_supabase_client()
    payload = {
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "sources": sources or [],
    }
    if answered is not None:
        payload["answered"] = answered

    response = supabase.table("messages").insert(payload).execute()
    return response.data[0]


def list_conversations(organization_id: str, user_id: str) -> list[dict]:
    supabase = get_supabase_client()
    response = (
        supabase.table("conversations")
        .select("id, title, created_at")
        .eq("organization_id", organization_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def get_conversation_messages(
    organization_id: str, user_id: str, conversation_id: str
) -> dict | None:
    supabase = get_supabase_client()

    conversation = (
        supabase.table("conversations")
        .select("id, title, created_at")
        .eq("id", conversation_id)
        .eq("organization_id", organization_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not conversation.data:
        return None

    messages = (
        supabase.table("messages")
        .select("id, role, content, sources, created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )

    return {
        "conversation": conversation.data[0],
        "messages": messages.data or [],
    }


def delete_conversation(
    organization_id: str, user_id: str, conversation_id: str
) -> bool:
    supabase = get_supabase_client()
    response = (
        supabase.table("conversations")
        .delete()
        .eq("id", conversation_id)
        .eq("organization_id", organization_id)
        .eq("user_id", user_id)
        .execute()
    )
    return bool(response.data)


def rename_conversation(
    organization_id: str, user_id: str, conversation_id: str, title: str
) -> dict | None:
    supabase = get_supabase_client()
    response = (
        supabase.table("conversations")
        .update({"title": title.strip()[:60]})
        .eq("id", conversation_id)
        .eq("organization_id", organization_id)
        .eq("user_id", user_id)
        .execute()
    )
    return response.data[0] if response.data else None
