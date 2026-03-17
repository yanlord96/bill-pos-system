import json
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/billhouse"
    ALEMBIC_DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@db:5432/billhouse"
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000","http://localhost"]'
    JWT_SECRET_KEY: str = "bill-house-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.CORS_ORIGINS)

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
