from openai import OpenAI

from app.core.config import settings
from app.db.supabase_client import get_supabase_client
from app.services.embedding_service import generate_embedding


client = OpenAI(api_key=settings.openai_api_key)


def search_relevant_chunks(question: str, match_count: int = 5) -> list[dict]:
    supabase = get_supabase_client()

    if settings.use_mock_ai:
        stopwords = {
            "como",
            "para",
            "quero",
            "preciso",
            "fazer",
            "sobre",
            "qual",
            "quais",
            "onde",
            "quando",
            "porque",
            "pelo",
            "pela",
            "esse",
            "essa",
            "este",
            "esta",
            "isso",
            "documento",
            "processo",
            "solicito",
            "solicitar",
            "configuro",
            "configurar",
            "acesso",
            "sistema",
            "empresa",
            "interno",
            "interna",
        }

        cleaned_question = (
            question.lower()
            .replace("?", " ")
            .replace(".", " ")
            .replace(",", " ")
            .replace(":", " ")
            .replace(";", " ")
            .replace("!", " ")
            .replace("/", " ")
            .replace("-", " ")
        )

        keywords = [
            word.strip()
            for word in cleaned_question.split()
            if len(word.strip()) >= 3 and word.strip() not in stopwords
        ]

        response = (
            supabase.table("chunks")
            .select("id, content, source_url, section_title, document_id, chunk_index")
            .eq("organization_id", settings.default_organization_id)
            .execute()
        )

        chunks = response.data or []
        scored_chunks = []

        for chunk in chunks:
            title = chunk.get("section_title", "") or ""
            content = chunk.get("content", "") or ""

            title_lower = title.lower()
            content_lower = content.lower()
            full_text = f"{title_lower} {content_lower}"

            score = 0

            for keyword in keywords:
                if keyword in title_lower:
                    score += 3

                if keyword in content_lower:
                    score += 1

            if score > 0:
                chunk["similarity"] = score
                scored_chunks.append(chunk)

        scored_chunks.sort(
            key=lambda item: item.get("similarity", 0),
            reverse=True,
        )

        return scored_chunks[:match_count]

    query_embedding = generate_embedding(question)

    response = supabase.rpc(
        "match_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "org_id": settings.default_organization_id,
        },
    ).execute()

    return response.data or []


def build_context(chunks: list[dict]) -> str:
    if not chunks:
        return "Nenhum contexto encontrado."

    context_parts = []

    for index, chunk in enumerate(chunks, start=1):
        source = chunk.get("source_url") or "Fonte não informada"
        section = chunk.get("section_title") or "Seção não informada"
        content = chunk.get("content") or ""

        context_parts.append(
            f"""
Fonte [{index}]
Seção: {section}
URL: {source}
Conteúdo:
{content}
"""
        )

    return "\n---\n".join(context_parts)


def build_sources(chunks: list[dict]) -> list[dict]:
    return [
        {
            "id": chunk.get("id"),
            "source_url": chunk.get("source_url"),
            "section_title": chunk.get("section_title"),
            "similarity": chunk.get("similarity"),
        }
        for chunk in chunks
    ]


def answer_question(question: str) -> dict:
    chunks = search_relevant_chunks(question)
    context = build_context(chunks)

    if settings.use_mock_ai:
        if not chunks:
            return {
                "answer": "Modo mock ativo: não encontrei nenhum documento relacionado à pergunta.",
                "sources": [],
            }

        first_chunk = chunks[0]
        content = first_chunk.get("content", "")

        return {
            "answer": (
                "Modo mock ativo: encontrei um trecho relacionado nos documentos.\n\n"
                f"{content}\n\n"
                "Fonte: [Fonte 1]"
            ),
            "sources": build_sources(chunks),
        }

    system_prompt = """
Você é o ScribeMind AI, um assistente corporativo de processos.

Regras obrigatórias:
- Responda apenas com base no contexto fornecido.
- Não invente procedimentos.
- Se o contexto não tiver a resposta, diga: "Não encontrei essa informação nos guias disponíveis."
- Responda em português.
- Seja claro, direto e operacional.
- Quando possível, cite a fonte usando o formato [Fonte 1], [Fonte 2], etc.
"""

    user_prompt = f"""
Pergunta do usuário:
{question}

Contexto recuperado:
{context}
"""

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": build_sources(chunks),
    }