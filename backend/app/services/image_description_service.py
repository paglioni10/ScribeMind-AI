import base64
from datetime import datetime, timezone

from app.core.config import settings
from app.services.ai_client import get_ai_client


client = get_ai_client()


def _mock_description(image: dict) -> dict:
    page_number = image.get("page_number")
    image_index = image.get("image_index")

    description = (
        f"Imagem extraída de um documento PDF.\n\n"
        f"Localização da imagem:\n"
        f"- Página: {page_number}\n"
        f"- Índice da imagem na página: {image_index}\n\n"
        f"Descrição visual simulada:\n"
        f"Esta imagem provavelmente representa uma captura de tela, ilustração "
        f"ou etapa visual de um processo documentado.\n"
        f"Em uma integração futura com IA Vision, este campo deverá descrever "
        f"com precisão os elementos visuais, botões, menus e etapas do processo."
    )

    return {
        "description": description,
        "description_status": "mock",
        "description_provider": "mock",
        "described_at": datetime.now(timezone.utc).isoformat(),
    }


def _vision_description(image: dict) -> dict:
    image_bytes: bytes = image["image_bytes"]
    page_number = image.get("page_number")
    image_index = image.get("image_index")

    b64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = (
        f"Você está analisando uma imagem extraída da página {page_number} "
        f"(imagem {image_index}) de um documento corporativo.\n\n"
        "Descreva em português, de forma detalhada e objetiva:\n"
        "- O que aparece na imagem (tela, diagrama, foto, gráfico, etc.)\n"
        "- Elementos visíveis: botões, menus, campos, textos, ícones\n"
        "- Qual etapa ou ação o usuário deve executar, se aplicável\n"
        "- Informações relevantes para responder perguntas sobre o processo\n\n"
        "Seja específico e direto. Não use introduções genéricas.\n"
        "Responda em texto corrido e simples, em português. NÃO use formatação "
        "markdown: nada de asteriscos, **negrito**, títulos com # ou listas com "
        "marcadores. Se precisar enumerar, escreva em frases ou use traços simples."
    )

    response = client.chat.completions.create(
        model=settings.vision_model,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64}",
                            "detail": "high",
                        },
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
        max_tokens=600,
    )

    description = response.choices[0].message.content.strip()

    return {
        "description": description,
        "description_status": "completed",
        "description_provider": settings.vision_model,
        "described_at": datetime.now(timezone.utc).isoformat(),
    }


def generate_image_description(image: dict) -> dict:
    if settings.use_mock_ai:
        return _mock_description(image)

    return _vision_description(image)


# Mantém compatibilidade com imports antigos
def generate_mock_image_description(image: dict) -> dict:
    return _mock_description(image)
