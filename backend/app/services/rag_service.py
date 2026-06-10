from openai import OpenAI

from app.core.config import settings
from app.db.supabase_client import get_supabase_client
from app.services.embedding_service import generate_embedding


client = OpenAI(api_key=settings.openai_api_key)


def search_relevant_chunks(
    question: str, org_id: str, match_count: int = 5
) -> list[dict]:
    supabase = get_supabase_client()

    if settings.use_mock_ai:
        # inclui image_id na query do mock
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
            .select("id, content, source_url, section_title, document_id, chunk_index, image_id")
            .eq("organization_id", org_id)
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
            "org_id": org_id,
        },
    ).execute()

    chunks = response.data or []

    # Busca image_id para chunks que não retornam via RPC
    if chunks:
        chunk_ids = [c["id"] for c in chunks if "image_id" not in c]
        if chunk_ids:
            extra = (
                supabase.table("chunks")
                .select("id, image_id")
                .in_("id", chunk_ids)
                .execute()
            )
            image_id_map = {row["id"]: row.get("image_id") for row in (extra.data or [])}
            for chunk in chunks:
                if "image_id" not in chunk:
                    chunk["image_id"] = image_id_map.get(chunk["id"])

    return chunks


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

def build_sources(chunks: list[dict], org_id: str) -> list[dict]:
    supabase = get_supabase_client()

    sources = []
    seen_keys = set()

    for chunk in chunks:
        document_id = chunk.get("document_id")
        image_id = chunk.get("image_id")

        # Chunks visuais (image_id preenchido) são únicos por imagem.
        # Chunks de texto são agrupados por documento.
        unique_key = image_id if image_id else document_id or chunk.get("id")

        if unique_key in seen_keys:
            continue

        seen_keys.add(unique_key)

        images = []

        if image_id:
            # Chunk visual: retorna a imagem específica com seus metadados de descrição
            img_response = (
                supabase.table("document_images")
                .select(
                    "id, page_number, image_index, public_url, "
                    "description, description_status, description_provider"
                )
                .eq("id", image_id)
                .execute()
            )
            images = img_response.data or []

        elif document_id:
            # Chunk de texto: retorna até 3 imagens do documento
            img_response = (
                supabase.table("document_images")
                .select(
                    "id, page_number, image_index, public_url, "
                    "description, description_status, description_provider"
                )
                .eq("organization_id", org_id)
                .eq("document_id", document_id)
                .eq("description_status", "completed")
                .order("page_number")
                .order("image_index")
                .limit(3)
                .execute()
            )
            images = img_response.data or []

        sources.append(
            {
                "id": chunk.get("id"),
                "document_id": document_id,
                "image_id": image_id,
                "source_url": chunk.get("source_url"),
                "section_title": chunk.get("section_title"),
                "similarity": chunk.get("similarity"),
                "is_visual_chunk": bool(image_id),
                "images": images,
            }
        )

    return sources

def answer_question(question: str, org_id: str) -> dict:
    chunks = search_relevant_chunks(question, org_id)
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
            "sources": build_sources(chunks, org_id),
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
        "sources": build_sources(chunks, org_id),
    }