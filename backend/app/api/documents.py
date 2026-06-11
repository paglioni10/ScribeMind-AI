import unicodedata

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.db.supabase_client import get_supabase_client
from app.services.auth_service import CurrentUser, get_current_user, require_role
from app.services.document_ingestion_service import ingest_text_document
from app.services.document_image_service import save_document_images
from app.services.pdf_image_service import extract_images_from_pdf
from app.services.pdf_service import extract_text_from_pdf
from app.services.reprocess_service import reprocess_document


router = APIRouter(prefix="/documents", tags=["Documents"])


def normalize_title(title: str) -> str:
    title = title.strip().lower()

    normalized = unicodedata.normalize("NFD", title)
    without_accents = "".join(
        char for char in normalized if unicodedata.category(char) != "Mn"
    )

    return " ".join(without_accents.split())


@router.get("/")
def list_documents(user: CurrentUser = Depends(get_current_user)):
    supabase = get_supabase_client()

    response = (
        supabase.table("documents")
        .select("id, title, source_type, source_url, created_at")
        .eq("organization_id", user.organization_id)
        .order("created_at", desc=True)
        .execute()
    )

    documents = response.data or []

    # Metadados: contagem de chunks (texto vs visual) e imagens por documento.
    chunks = (
        supabase.table("chunks")
        .select("document_id, image_id")
        .eq("organization_id", user.organization_id)
        .execute()
    )
    images = (
        supabase.table("document_images")
        .select("document_id")
        .eq("organization_id", user.organization_id)
        .execute()
    )

    chunk_counts: dict[str, int] = {}
    visual_chunk_counts: dict[str, int] = {}
    for chunk in chunks.data or []:
        doc_id = chunk.get("document_id")
        if not doc_id:
            continue
        chunk_counts[doc_id] = chunk_counts.get(doc_id, 0) + 1
        if chunk.get("image_id"):
            visual_chunk_counts[doc_id] = visual_chunk_counts.get(doc_id, 0) + 1

    image_counts: dict[str, int] = {}
    for image in images.data or []:
        doc_id = image.get("document_id")
        if doc_id:
            image_counts[doc_id] = image_counts.get(doc_id, 0) + 1

    for document in documents:
        doc_id = document["id"]
        document["chunk_count"] = chunk_counts.get(doc_id, 0)
        document["visual_chunk_count"] = visual_chunk_counts.get(doc_id, 0)
        document["image_count"] = image_counts.get(doc_id, 0)

    return {"documents": documents}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    user: CurrentUser = Depends(get_current_user),
):
    clean_title = title.strip()

    if not clean_title:
        raise HTTPException(status_code=400, detail="Informe um título para o documento.")

    if not file.filename.endswith((".md", ".txt", ".pdf")):
        raise HTTPException(
            status_code=400,
            detail="Por enquanto, envie apenas arquivos .md, .txt ou .pdf.",
        )

    supabase = get_supabase_client()

    documents_response = (
        supabase.table("documents")
        .select("id, title")
        .eq("organization_id", user.organization_id)
        .execute()
    )

    existing_documents = documents_response.data or []
    normalized_new_title = normalize_title(clean_title)

    for document in existing_documents:
        if normalize_title(document.get("title", "")) == normalized_new_title:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Já existe um documento com esse título. "
                    "Use outro título ou exclua o documento existente."
                ),
            )

    raw_content = await file.read()

    if file.filename.endswith(".pdf"):
        content = extract_text_from_pdf(raw_content)
        source_type = "pdf"
    else:
        content = raw_content.decode("utf-8")
        source_type = "upload"

    if not content.strip():
        raise HTTPException(
            status_code=400,
            detail="Não foi possível extrair texto desse arquivo.",
        )

    result = ingest_text_document(
        title=clean_title,
        content=content,
        organization_id=user.organization_id,
        source_type=source_type,
        source_url=f"uploaded://{file.filename}",
    )

    images_saved = []

    if file.filename.endswith(".pdf"):
        extracted_images = extract_images_from_pdf(raw_content)

        if extracted_images:
            images_saved = save_document_images(
                document_id=result["document_id"],
                document_version_id=result["document_version_id"],
                images=extracted_images,
                organization_id=user.organization_id,
            )

    return {
        "message": "Documento indexado com sucesso.",
        "filename": file.filename,
        "title": clean_title,
        "source_type": source_type,
        "images_extracted": len(images_saved),
        **result,
    }


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    user: CurrentUser = Depends(require_role("admin")),
):
    supabase = get_supabase_client()

    response = (
        supabase.table("documents")
        .delete()
        .eq("id", document_id)
        .eq("organization_id", user.organization_id)
        .execute()
    )

    return {
        "message": "Documento excluído com sucesso.",
        "document_id": document_id,
        "deleted": response.data or [],
    }


@router.post("/{document_id}/reprocess")
def reprocess(
    document_id: str,
    user: CurrentUser = Depends(require_role("admin")),
):
    result = reprocess_document(document_id, user.organization_id)

    if result.get("error") == "not_found":
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    return {
        "message": "Documento reprocessado com sucesso.",
        "document_id": document_id,
        **result,
    }


@router.get("/{document_id}/images")
def list_document_images(
    document_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    supabase = get_supabase_client()

    response = (
        supabase.table("document_images")
        .select(
            "id, page_number, image_index, file_path, public_url, "
            "description, description_status, description_provider, described_at, created_at"
        )
        .eq("organization_id", user.organization_id)
        .eq("document_id", document_id)
        .order("page_number")
        .order("image_index")
        .execute()
    )

    return {
        "document_id": document_id,
        "images": response.data or [],
    }
