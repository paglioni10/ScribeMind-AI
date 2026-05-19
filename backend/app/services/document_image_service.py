from app.core.config import settings
from app.db.supabase_client import get_supabase_client


BUCKET_NAME = "document-images"


def save_document_images(
    document_id: str,
    document_version_id: str,
    images: list[dict],
) -> list[dict]:
    supabase = get_supabase_client()

    saved_images = []

    for image in images:
        file_path = (
            f"{settings.default_organization_id}/"
            f"{document_id}/"
            f"page-{image['page_number']}-image-{image['image_index']}.png"
        )

        supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=image["image_bytes"],
            file_options={
                "content-type": image["content_type"],
                "upsert": "true",
            },
        )

        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)

        image_response = (
            supabase.table("document_images")
            .insert(
                {
                    "organization_id": settings.default_organization_id,
                    "document_id": document_id,
                    "document_version_id": document_version_id,
                    "page_number": image["page_number"],
                    "image_index": image["image_index"],
                    "file_path": file_path,
                    "public_url": public_url,
                }
            )
            .execute()
        )

        if image_response.data:
            saved_images.append(image_response.data[0])

    return saved_images