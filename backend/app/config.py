"""Application settings, loaded once from environment / .env file."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = "sqlite:///./dotball.db"
    redis_url: str = "redis://localhost:6379/0"

    # CricAPI key for live IPL data. Get a free key at https://cricapi.com.
    # We re-use the existing env var name for backward compat.
    cricbuzz_api_key: str = ""
    rapidapi_key: str = ""
    sportradar_api_key: str = ""

    # IMPORTANT: change this in production. JWT tokens are signed with it.
    jwt_secret: str = "dev-only-change-this-in-production-please-32chars-min"

    # Frontend origin for CORS — adjust if you deploy.
    frontend_origin: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()