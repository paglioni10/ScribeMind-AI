from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ScribeMind AI"
    environment: str = "development"

    supabase_url: str
    supabase_key: str
    # Service role key — usada para operações administrativas (criar org,
    # membros, ignorar RLS). Se vazia, cai de volta para supabase_key.
    supabase_service_key: str = ""

    # ─── Provider de IA (compatível com OpenAI) ───────────────────────────
    # Padrão: Google Gemini (free tier) via endpoint compatível com OpenAI.
    # Para usar OpenAI, basta apontar ai_base_url para a OpenAI e usar a key dela.
    # Para Ollama local: ai_base_url="http://localhost:11434/v1".
    ai_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    ai_api_key: str = ""
    # Fallback para compatibilidade com .env antigo
    openai_api_key: str = ""

    chat_model: str = "gemini-2.5-flash-lite"
    vision_model: str = "gemini-2.5-flash-lite"
    embedding_model: str = "gemini-embedding-001"
    embedding_dim: int = 768

    # Mantido como fallback / seed. Com multiusuário, o org_id vem do usuário.
    default_organization_id: str = ""
    use_mock_ai: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def resolved_ai_key(self) -> str:
        return self.ai_api_key or self.openai_api_key


settings = Settings()
