from io import BytesIO

import fitz  # PyMuPDF
from PIL import Image


def extract_images_from_pdf(file_bytes: bytes) -> list[dict]:
    """
    Extrai imagens de um PDF.

    Retorna uma lista com:
    - page_number
    - image_index
    - filename
    - image_bytes
    - content_type
    """

    pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
    extracted_images = []

    for page_index in range(len(pdf_document)):
        page = pdf_document[page_index]
        images = page.get_images(full=True)

        for image_index, image_info in enumerate(images, start=1):
            xref = image_info[0]
            base_image = pdf_document.extract_image(xref)

            image_bytes = base_image["image"]
            image_extension = base_image.get("ext", "png")

            # Normaliza para PNG para evitar problemas com formatos diferentes
            image = Image.open(BytesIO(image_bytes))
            output_buffer = BytesIO()
            image.save(output_buffer, format="PNG")

            filename = f"page-{page_index + 1}-image-{image_index}.png"

            extracted_images.append(
                {
                    "page_number": page_index + 1,
                    "image_index": image_index,
                    "filename": filename,
                    "image_bytes": output_buffer.getvalue(),
                    "content_type": "image/png",
                    "original_extension": image_extension,
                }
            )

    pdf_document.close()

    return extracted_images