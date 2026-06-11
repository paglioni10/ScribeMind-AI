from app.core.config import settings
from app.services.ai_client import get_ai_client


client = get_ai_client()


def generate_embedding(text: str) -> list[float]:
    if settings.use_mock_ai:
        # Vetor falso com a dimensão configurada, só para o Supabase aceitar o formato.
        return [0.0] * settings.embedding_dim

    cleaned_text = text.replace("\n", " ").strip()

    # dimensions força a saída para a dimensão do banco (gemini-embedding-001
    # gera 3072 por padrão; o Supabase espera embedding_dim).
    response = client.embeddings.create(
        model=settings.embedding_model,
        input=cleaned_text,
        dimensions=settings.embedding_dim,
    )

    return response.data[0].embedding
