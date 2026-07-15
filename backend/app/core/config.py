from functools import lru_cache
from urllib.parse import urlparse

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MedCare API"
    environment: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    frontend_origins: list[str] = Field(default=["http://localhost:3000"])
    frontend_origin_regex: str | None = None
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    supabase_auto_confirm_email: bool = False
    ocr_api_url: str = "http://127.0.0.1:8001"
    ocr_timeout_seconds: float = 120.0
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/integrations/google/callback"
    frontend_url: str = "http://localhost:3000"

    @model_validator(mode="after")
    def validate_supabase_settings(self):
        if self.environment != "test" and not all(
            [self.supabase_url, self.supabase_publishable_key, self.supabase_secret_key]
        ):
            raise ValueError("SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY are required")
        if self.environment == "production":
            if self.debug:
                raise ValueError("DEBUG must be false in production")
            if self.supabase_auto_confirm_email:
                raise ValueError("SUPABASE_AUTO_CONFIRM_EMAIL must be false in production")
            if not self.frontend_origins:
                raise ValueError("FRONTEND_ORIGINS must contain the production frontend URL")
            public_urls = [*self.frontend_origins, self.frontend_url, self.google_redirect_uri]
            for value in public_urls:
                parsed = urlparse(value)
                if parsed.scheme != "https" or parsed.hostname in {"localhost", "127.0.0.1"}:
                    raise ValueError(f"Production public URL must use HTTPS and cannot be localhost: {value}")
            if not self.google_client_id or not self.google_client_secret:
                raise ValueError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in production")
        return self

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
