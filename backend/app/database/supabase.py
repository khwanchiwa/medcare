from supabase import Client, ClientOptions, create_client

from app.core.config import settings


def create_public_client() -> Client:
    """Create an isolated Auth client; do not share mutable Auth sessions globally."""
    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )


def create_admin_client() -> Client:
    """Create a backend-only client that can bypass RLS.

    Every route using this client must perform its own authorization check first.
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_secret_key,
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )
