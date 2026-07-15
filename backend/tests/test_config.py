import pytest
from pydantic import ValidationError

from app.core.config import Settings


def production_settings(**overrides):
    values = {
        "environment": "production",
        "debug": False,
        "frontend_origins": ["https://app.example.com"],
        "frontend_url": "https://app.example.com",
        "google_redirect_uri": "https://api.example.com/api/v1/integrations/google/callback",
        "google_client_id": "client-id",
        "google_client_secret": "client-secret",
        "google_token_encryption_key": "ZHVtbXktdGVzdC1rZXktMDAwMDAwMDAwMDAwMDAwMDAwMDA=",
        "supabase_url": "https://example.supabase.co",
        "supabase_publishable_key": "publishable-key",
        "supabase_secret_key": "secret-key",
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


def test_production_settings_accept_secure_urls():
    settings = production_settings()

    assert settings.environment == "production"
    assert settings.debug is False


@pytest.mark.parametrize(
    ("override", "message"),
    [
        ({"debug": True}, "DEBUG must be false"),
        ({"frontend_url": "http://localhost:3000"}, "must use HTTPS"),
        ({"google_client_secret": ""}, "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"),
        ({"google_token_encryption_key": ""}, "GOOGLE_TOKEN_ENCRYPTION_KEY"),
        ({"supabase_auto_confirm_email": True}, "SUPABASE_AUTO_CONFIRM_EMAIL must be false"),
    ],
)
def test_production_settings_reject_unsafe_configuration(override, message):
    with pytest.raises(ValidationError, match=message):
        production_settings(**override)
