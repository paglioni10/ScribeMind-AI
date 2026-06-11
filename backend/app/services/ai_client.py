from openai import OpenAI

from app.core.config import settings


def get_ai_client() -> OpenAI:
    """
    Client compatível com OpenAI apontando para o provider configurado
    (Gemini por padrão, mas pode ser OpenAI ou Ollama via .env).
    """
    return OpenAI(
        api_key=settings.resolved_ai_key,
        base_url=settings.ai_base_url,
    )
