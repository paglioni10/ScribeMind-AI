from app.core.config import settings
from app.db.supabase_client import get_supabase_client
from app.services.embedding_service import generate_embedding


def split_text_into_chunks(text: str, max_chars: int = 1000) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks = []
    current_chunk = ""

    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) + 2 <= max_chars:
            current_chunk += "\n\n" + paragraph if current_chunk else paragraph
        else:
            chunks.append(current_chunk)
            current_chunk = paragraph

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def ingest_text_document(
    title: str,
    content: str,
    source_type: str = "upload",
    source_url: str | None = None,
) -> dict:
    supabase = get_supabase_client()

    document_response = supabase.table("documents").insert(
        {
            "organization_id": settings.default_organization_id,
            "title": title,
            "source_type": source_type,
            "source_url": source_url,
        }
    ).execute()

    document = document_response.data[0]

    version_response = supabase.table("document_versions").insert(
        {
            "document_id": document["id"],
            "version_label": "v1",
        }
    ).execute()

    document_version = version_response.data[0]

    chunks = split_text_into_chunks(content)

    for index, chunk in enumerate(chunks):
        embedding = generate_embedding(chunk)

        supabase.table("chunks").insert(
            {
                "organization_id": settings.default_organization_id,
                "document_id": document["id"],
                "document_version_id": document_version["id"],
                "content": chunk,
                "embedding": embedding,
                "source_url": source_url,
                "section_title": title,
                "chunk_index": index,
            }
        ).execute()

    return {
        "document_id": document["id"],
        "document_version_id": document_version["id"],
        "chunks_created": len(chunks),
    }