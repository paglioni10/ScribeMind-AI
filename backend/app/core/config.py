from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ScribeMind AI"
    environment: str = "development"

    supabase_url: str
    supabase_key: str

    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"

    default_organization_id: str
    use_mock_ai: bool = False

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()