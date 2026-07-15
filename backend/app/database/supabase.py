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


def fetch_one_or_none(query):
    """Execute a filtered select expecting at most one row.

    supabase-py returns ``None`` (not a response object) from
    ``maybe_single().execute()`` when no row matches, so callers must never
    chain ``.data`` onto it directly.
    """
    response = query.maybe_single().execute()
    return response.data if response else None
