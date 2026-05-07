from openai import OpenAI

from app.core.config import settings


client = OpenAI(api_key=settings.openai_api_key)


def generate_embedding(text: str) -> list[float]:
    if settings.use_mock_ai:
        # Vetor falso com 1536 dimensões, só para o Supabase aceitar o formato.
        return [0.0] * 1536

    cleaned_text = text.replace("\n", " ").strip()

    response = client.embeddings.create(
        model=settings.embedding_model,
        input=cleaned_text,
    )

    return response.data[0].embedding