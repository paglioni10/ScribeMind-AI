import unicodedata

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.db.supabase_client import get_supabase_client
from app.services.document_ingestion_service import ingest_text_document
from app.services.pdf_service import extract_text_from_pdf


router = APIRouter(prefix="/documents", tags=["Documents"])


def normalize_title(title: str) -> str:
    title = title.strip().lower()

    normalized = unicodedata.normalize("NFD", title)
    without_accents = "".join(
        char for char in normalized if unicodedata.category(char) != "Mn"
    )

    return " ".join(without_accents.split())


@router.get("/")
def list_documents():
    supabase = get_supabase_client()

    response = (
        supabase.table("documents")
        .select("id, title, source_type, source_url, created_at")
        .eq("organization_id", settings.default_organization_id)
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "documents": response.data or []
    }


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
):
    clean_title = title.strip()

    if not clean_title:
        raise HTTPException(
            status_code=400,
            detail="Informe um título para o documento.",
        )

    if not file.filename.endswith((".md", ".txt", ".pdf")):
        raise HTTPException(
            status_code=400,
            detail="Por enquanto, envie apenas arquivos .md, .txt ou .pdf.",
        )

    supabase = get_supabase_client()

    documents_response = (
        supabase.table("documents")
        .select("id, title")
        .eq("organization_id", settings.default_organization_id)
        .execute()
    )

    existing_documents = documents_response.data or []
    normalized_new_title = normalize_title(clean_title)

    for document in existing_documents:
        existing_title = document.get("title", "")

        if normalize_title(existing_title) == normalized_new_title:
            raise HTTPException(
                status_code=409,
                detail="Já existe um documento com esse título. Use outro título ou exclua o documento existente.",
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
        source_type=source_type,
        source_url=f"uploaded://{file.filename}",
    )

    return {
        "message": "Documento indexado com sucesso.",
        "filename": file.filename,
        "title": clean_title,
        "source_type": source_type,
        **result,
    }


@router.delete("/{document_id}")
def delete_document(document_id: str):
    supabase = get_supabase_client()

    response = (
        supabase.table("documents")
        .delete()
        .eq("id", document_id)
        .eq("organization_id", settings.default_organization_id)
        .execute()
    )

    return {
        "message": "Documento excluído com sucesso.",
        "document_id": document_id,
        "deleted": response.data or [],
    }