from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError, PdfStreamError


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(file_bytes))

        pages_text = []

        for page_index, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""

            if text.strip():
                pages_text.append(
                    f"\n\n--- Página {page_index} ---\n\n{text.strip()}"
                )

        return "\n".join(pages_text).strip()

    except (PdfReadError, PdfStreamError, Exception):
        return ""