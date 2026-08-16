"""Central configuration via Pydantic Settings."""

from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from env."""

    model_config = SettingsConfigDict(
        # Load from monorepo root .env first, then backend-app/local.env
        env_file=("../.env", "local.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── App ──
    ENVIRONMENT: str = "local"
    SECRET_KEY: str = "change-me-in-production"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5174"]
    API_V1_STR: str = "/api/v1"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Auth bootstrap (B0 seed — see context/backend-plans/B0-auth-and-core-schema.md) ──
    BOOTSTRAP_ADMIN_EMAIL: str = "admin@scalebrandslab.demo"
    BOOTSTRAP_ADMIN_PASSWORD: str = "change-me-local-only"
    BOOTSTRAP_ADMIN_DISPLAY_NAME: str = "Studio Admin"
    SEED_DEMO_USERS: bool = True
    # Local-only visual regression catalog: one stable batch per workflow stage.
    SEED_VISUAL_REVIEW_SCENARIOS: bool = False

    # ── Postgres ──
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "myapp"
    # Managed Postgres (Neon, etc.) requires TLS; local Docker Postgres doesn't
    # have it configured, so this defaults off and prod sets it explicitly.
    POSTGRES_SSL: bool = False

    # ── Redis ──
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str | None = None

    # ── GCP (optional) ──
    GCP_PROJECT_ID: str | None = None
    GCP_SECRET_NAME: str | None = None

    # ── Google Drive (service account for live manifest fetch) ──
    GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: str | None = None

    # ── Private object storage (AWS S3 or an S3-compatible provider) ──
    OBJECT_STORAGE_BUCKET: str | None = None
    OBJECT_STORAGE_REGION: str = "ap-south-1"
    OBJECT_STORAGE_ENDPOINT_URL: str | None = None
    OBJECT_STORAGE_ACCESS_KEY_ID: str | None = None
    OBJECT_STORAGE_SECRET_ACCESS_KEY: str | None = None
    OBJECT_STORAGE_SESSION_TOKEN: str | None = None
    OBJECT_STORAGE_PRESIGN_SECONDS: int = 900
    OBJECT_STORAGE_MAX_UPLOAD_BYTES: int = 5 * 1024 * 1024 * 1024

    @property
    def DATABASE_URL(self) -> str:
        url = (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        return f"{url}?ssl=require" if self.POSTGRES_SSL else url

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            import json

            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else [v]
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        if isinstance(v, list):
            return v
        return ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()


config = get_settings()
