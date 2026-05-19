"""Application settings, loaded once from environment / .env file.

Import the `settings` singleton anywhere you need configuration:

    from app.config import settings
    print(settings.database_url)
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Default to SQLite for zero-install local dev. Override with Postgres
    # by setting DATABASE_URL in your .env when you're ready to scale up.
    database_url: str = "sqlite:///./dotball.db"
    redis_url: str = "redis://localhost:6379/0"

    cricbuzz_api_key: str = ""
    rapidapi_key: str = ""
    sportradar_api_key: str = ""

    jwt_secret: str = "change-me"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()