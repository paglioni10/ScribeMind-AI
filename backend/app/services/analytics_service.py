from collections import Counter
from datetime import datetime, timedelta, timezone

from app.db.supabase_client import get_supabase_client


STOPWORDS = {
    "como", "para", "quero", "preciso", "fazer", "sobre", "qual", "quais",
    "onde", "quando", "porque", "pelo", "pela", "esse", "essa", "este",
    "esta", "isso", "documento", "processo", "the", "uma", "que", "com",
    "dos", "das", "por", "não", "nao", "sim", "tem", "ter", "meu", "minha",
    "seu", "sua", "são", "sao", "ele", "ela", "isso", "aqui", "ali",
}


def _org_conversation_ids(supabase, org_id: str) -> list[str]:
    response = (
        supabase.table("conversations")
        .select("id")
        .eq("organization_id", org_id)
        .execute()
    )
    return [row["id"] for row in (response.data or [])]


def _org_messages(supabase, org_id: str) -> list[dict]:
    conversation_ids = _org_conversation_ids(supabase, org_id)
    if not conversation_ids:
        return []
    response = (
        supabase.table("messages")
        .select("conversation_id, role, content, answered, created_at")
        .in_("conversation_id", conversation_ids)
        .order("conversation_id")
        .order("created_at")
        .execute()
    )
    return response.data or []


def get_metrics(org_id: str) -> dict:
    supabase = get_supabase_client()
    messages = _org_messages(supabase, org_id)

    user_messages = [m for m in messages if m["role"] == "user"]
    assistant_messages = [m for m in messages if m["role"] == "assistant"]
    answered = sum(1 for m in assistant_messages if m.get("answered") is True)
    unanswered = sum(1 for m in assistant_messages if m.get("answered") is False)

    total_questions = len(user_messages)
    answer_rate = round(answered / total_questions * 100, 1) if total_questions else 0.0

    # Perguntas por dia (últimos 7 dias)
    today = datetime.now(timezone.utc).date()
    last_7 = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
    per_day = {d.isoformat(): 0 for d in last_7}
    for m in user_messages:
        created = m.get("created_at")
        if not created:
            continue
        try:
            day = datetime.fromisoformat(created.replace("Z", "+00:00")).date().isoformat()
        except ValueError:
            continue
        if day in per_day:
            per_day[day] += 1

    # Contagens da base
    def _count(table):
        r = (
            supabase.table(table)
            .select("id", count="exact")
            .eq("organization_id", org_id)
            .execute()
        )
        return r.count or 0

    return {
        "total_conversations": len(_org_conversation_ids(supabase, org_id)),
        "total_questions": total_questions,
        "answered": answered,
        "unanswered": unanswered,
        "answer_rate": answer_rate,
        "total_documents": _count("documents"),
        "total_chunks": _count("chunks"),
        "total_images": _count("document_images"),
        "total_members": _count("organization_members"),
        "questions_per_day": [
            {"date": day, "count": count} for day, count in per_day.items()
        ],
    }


def get_unanswered(org_id: str, limit: int = 50) -> list[dict]:
    """Perguntas cujo assistente não conseguiu responder."""
    supabase = get_supabase_client()
    messages = _org_messages(supabase, org_id)

    unanswered = []
    previous_user = {}  # conversation_id -> última pergunta do usuário

    for m in messages:
        conv = m["conversation_id"]
        if m["role"] == "user":
            previous_user[conv] = m
        elif m["role"] == "assistant" and m.get("answered") is False:
            question = previous_user.get(conv)
            if question:
                unanswered.append(
                    {
                        "question": question["content"],
                        "conversation_id": conv,
                        "created_at": m.get("created_at"),
                    }
                )

    # Mais recentes primeiro
    unanswered.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return unanswered[:limit]


def get_knowledge_gaps(org_id: str, top: int = 10) -> list[dict]:
    """Termos mais frequentes nas perguntas sem resposta = lacunas na base."""
    unanswered = get_unanswered(org_id, limit=500)

    counter = Counter()
    for item in unanswered:
        text = (item["question"] or "").lower()
        for char in "?.!,;:/-\"'()":
            text = text.replace(char, " ")
        for word in text.split():
            word = word.strip()
            if len(word) >= 4 and word not in STOPWORDS:
                counter[word] += 1

    return [
        {"term": term, "count": count} for term, count in counter.most_common(top)
    ]
