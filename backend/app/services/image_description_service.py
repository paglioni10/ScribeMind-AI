from datetime import datetime, timezone


def generate_mock_image_description(image: dict) -> dict:
    page_number = image.get("page_number")
    image_index = image.get("image_index")

    description = (
        f"Descrição mock da imagem {image_index} da página {page_number}. "
        "Esta imagem foi extraída de um PDF e futuramente será analisada por uma IA vision "
        "para descrever elementos visuais, botões, campos e telas exibidas."
    )

    return {
        "description": description,
        "description_status": "mock",
        "description_provider": "mock",
        "described_at": datetime.now(timezone.utc).isoformat(),
    }