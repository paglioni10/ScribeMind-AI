from app.db.supabase_client import get_supabase_client
from app.services.embedding_service import generate_embedding
from app.services.image_description_service import generate_image_description


BUCKET_NAME = "document-images"


def _build_visual_chunk_content(page_number, image_index, description, public_url) -> str:
    return (
        f"[Imagem do documento — página {page_number}, imagem {image_index}]\n\n"
        f"{description}\n\n"
        f"URL da imagem: {public_url}"
    )


def reprocess_document(document_id: str, organization_id: str) -> dict:
    """
    Reindexa um documento já existente sem precisar reenviar o arquivo:
      - re-descreve cada imagem via Vision (a partir dos bytes no Storage);
      - reconstrói o chunk visual (conteúdo + embedding) de cada imagem;
      - re-gera o embedding dos chunks de texto.
    """
    supabase = get_supabase_client()

    # Confirma que o documento pertence à organização
    document = (
        supabase.table("documents")
        .select("id")
        .eq("id", document_id)
        .eq("organization_id", organization_id)
        .limit(1)
        .execute()
    )
    if not document.data:
        return {"error": "not_found"}

    images_reprocessed = 0
    text_chunks_reembedded = 0

    # 1) Imagens — re-descrição via Vision + chunk visual
    images = (
        supabase.table("document_images")
        .select("id, page_number, image_index, file_path, public_url")
        .eq("organization_id", organization_id)
        .eq("document_id", document_id)
        .execute()
    )

    for image in images.data or []:
        try:
            image_bytes = supabase.storage.from_(BUCKET_NAME).download(
                image["file_path"]
            )
        except Exception:
            # Sem os bytes não dá para re-descrever; pula esta imagem
            continue

        description_data = generate_image_description(
            {
                "image_bytes": image_bytes,
                "page_number": image["page_number"],
                "image_index": image["image_index"],
            }
        )

        supabase.table("document_images").update(
            {
                "description": description_data["description"],
                "description_status": description_data["description_status"],
                "description_provider": description_data["description_provider"],
                "described_at": description_data["described_at"],
            }
        ).eq("id", image["id"]).execute()

        # Reconstrói o chunk visual vinculado a esta imagem
        visual_content = _build_visual_chunk_content(
            image["page_number"],
            image["image_index"],
            description_data["description"],
            image["public_url"],
        )

        supabase.table("chunks").update(
            {
                "content": visual_content,
                "embedding": generate_embedding(visual_content),
            }
        ).eq("image_id", image["id"]).eq(
            "organization_id", organization_id
        ).execute()

        images_reprocessed += 1

    # 2) Chunks de texto — re-embedding a partir do conteúdo atual
    text_chunks = (
        supabase.table("chunks")
        .select("id, content, image_id")
        .eq("organization_id", organization_id)
        .eq("document_id", document_id)
        .is_("image_id", "null")
        .execute()
    )

    for chunk in text_chunks.data or []:
        content = chunk.get("content") or ""
        if not content.strip():
            continue
        supabase.table("chunks").update(
            {"embedding": generate_embedding(content)}
        ).eq("id", chunk["id"]).execute()
        text_chunks_reembedded += 1

    return {
        "images_reprocessed": images_reprocessed,
        "text_chunks_reembedded": text_chunks_reembedded,
    }
