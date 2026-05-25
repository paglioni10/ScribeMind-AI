from datetime import datetime, timezone


def generate_mock_image_description(image: dict) -> dict:
    page_number = image.get("page_number")
    image_index = image.get("image_index")

    description = f"""
Imagem extraída de um documento PDF.

Localização da imagem:
- Página: {page_number}
- Índice da imagem na página: {image_index}

Descrição visual simulada:
Esta imagem provavelmente representa uma captura de tela, ilustração ou etapa visual de um processo documentado.
Em uma integração futura com IA Vision, este campo deverá descrever com precisão:
- quais elementos aparecem na tela;
- quais botões, menus ou campos estão visíveis;
- onde o usuário deve clicar;
- qual etapa do processo a imagem representa.

Status:
Descrição gerada em modo mock, sem análise visual real.
""".strip()

    return {
        "description": description,
        "description_status": "mock",
        "description_provider": "mock",
        "described_at": datetime.now(timezone.utc).isoformat(),
    }