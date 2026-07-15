import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse

from app.api.deps import AdminClient, CurrentUser
from app.core.config import settings
from app.database.supabase import fetch_one_or_none
from app.repositories.google_calendar import GoogleCalendarRepository
from app.schemas.integrations import (
    ActionResult, CalendarSyncResult, GoogleAuthUrl, IntegrationStatus,
    LineAuthUrl, LineIntegrationStatus,
)
from app.services import google_calendar, line_messaging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/google/status", response_model=IntegrationStatus)
def google_status(admin: AdminClient, current_user: CurrentUser) -> dict:
    row = GoogleCalendarRepository(admin).integration(current_user.id)
    connection_status = (row or {}).get("connection_status")
    return {
        "configured": google_calendar.configured(),
        "connected": connection_status == "connected",
        "reconnect_required": connection_status == "reconnect_required",
        "google_email": (row or {}).get("external_email"),
        "google_calendar_id": (row or {}).get("calendar_id"),
        "last_sync": (row or {}).get("last_sync_at"),
        "connected_at": (row or {}).get("connected_at"),
    }


@router.post("/google/auth-url", response_model=GoogleAuthUrl)
def google_auth_url(admin: AdminClient, current_user: CurrentUser) -> dict[str, str]:
    if not google_calendar.configured():
        raise google_calendar.as_http_error(google_calendar.GoogleCalendarError("ยังไม่ได้ตั้งค่า Google OAuth บนเซิร์ฟเวอร์"))
    state = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    admin.table("integration_link_codes").delete().eq("user_id", current_user.id).eq("provider", "google_calendar").execute()
    admin.table("integration_link_codes").insert({
        "user_id": current_user.id, "provider": "google_calendar", "code": state,
        "expires_at": expires.isoformat(),
    }).execute()
    return {"url": google_calendar.authorization_url(state)}


@router.get("/google/callback", include_in_schema=False)
async def google_callback(
    admin: AdminClient,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
) -> RedirectResponse:
    if error:
        return RedirectResponse(f"{settings.frontend_url}/patient/integrations/google-calendar?google=cancelled")
    if not code or not state:
        return RedirectResponse(f"{settings.frontend_url}/patient/integrations/google-calendar?google=invalid_callback")
    match = fetch_one_or_none(admin.table("integration_link_codes").select("*").eq("provider", "google_calendar").eq("code", state))
    if not match or datetime.fromisoformat(match["expires_at"].replace("Z", "+00:00")) <= datetime.now(timezone.utc):
        return RedirectResponse(f"{settings.frontend_url}/patient/integrations/google-calendar?google=invalid_state")
    admin.table("integration_link_codes").delete().eq("id", match["id"]).execute()
    try:
        token = await google_calendar.exchange_code(code)
        google_calendar.save_tokens(admin, match["user_id"], token)
    except google_calendar.GoogleCalendarError as exc:
        logger.warning("Google OAuth callback failed user_id=%s error=%s", match["user_id"], exc)
        return RedirectResponse(f"{settings.frontend_url}/patient/integrations/google-calendar?google=failed")
    return RedirectResponse(f"{settings.frontend_url}/patient/integrations/google-calendar?google=connected")


@router.post("/google/sync", response_model=CalendarSyncResult)
async def sync_google(admin: AdminClient, current_user: CurrentUser) -> dict:
    try:
        result = await google_calendar.sync_all(admin, current_user.id)
    except google_calendar.GoogleCalendarError as exc:
        raise google_calendar.as_http_error(exc) from exc
    return {"message": "ซิงค์ Google Calendar เรียบร้อย", **result.__dict__}


@router.delete("/google", response_model=ActionResult)
async def disconnect_google(admin: AdminClient, current_user: CurrentUser) -> dict[str, str]:
    await google_calendar.disconnect(admin, current_user.id)
    return {"message": "ยกเลิกการเชื่อมต่อ Google Calendar แล้ว"}


@router.get("/line/status", response_model=LineIntegrationStatus)
def line_status(admin: AdminClient, current_user: CurrentUser) -> dict:
    row = line_messaging.integration_for(admin, current_user.id)
    metadata = (row or {}).get("metadata") or {}
    return {
        "configured": line_messaging.configured(), "connected": bool(row),
        "display_name": metadata.get("displayName"), "picture_url": metadata.get("pictureUrl"),
        "connected_at": (row or {}).get("connected_at"), "updated_at": (row or {}).get("updated_at"),
    }


@router.post("/line/auth-url", response_model=LineAuthUrl)
def line_auth_url(admin: AdminClient, current_user: CurrentUser) -> dict[str, str]:
    if not line_messaging.configured():
        raise HTTPException(status_code=503, detail="ยังไม่ได้ตั้งค่า LINE บนเซิร์ฟเวอร์")
    state, nonce = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    admin.table("integration_link_codes").delete().eq("user_id", current_user.id).eq("provider", "line").execute()
    admin.table("integration_link_codes").insert({
        "user_id": current_user.id, "provider": "line", "code": state,
        "nonce": nonce, "expires_at": expires.isoformat(),
    }).execute()
    return {"url": line_messaging.authorization_url(state, nonce)}


@router.get("/line/callback", include_in_schema=False)
async def line_callback(
    admin: AdminClient,
    code: str | None = Query(default=None), state: str | None = Query(default=None),
    error: str | None = Query(default=None),
) -> RedirectResponse:
    redirect = f"{settings.frontend_url}/patient/integrations"
    if error:
        return RedirectResponse(f"{redirect}?line=cancelled")
    if not code or not state:
        return RedirectResponse(f"{redirect}?line=invalid_callback")
    match = fetch_one_or_none(admin.table("integration_link_codes").select("*").eq("provider", "line").eq("code", state))
    if not match or datetime.fromisoformat(match["expires_at"].replace("Z", "+00:00")) <= datetime.now(timezone.utc):
        return RedirectResponse(f"{redirect}?line=invalid_state")
    admin.table("integration_link_codes").delete().eq("id", match["id"]).execute()
    try:
        profile = await line_messaging.exchange_and_verify(code, str(match.get("nonce") or ""))
        now = datetime.now(timezone.utc).isoformat()
        admin.table("user_integrations").upsert({
            "user_id": match["user_id"], "provider": "line",
            "external_user_id": profile.user_id, "connection_status": "connected",
            "metadata": {"displayName": profile.display_name, "pictureUrl": profile.picture_url,
                         "lineConnected": True},
            "connected_at": now,
        }, on_conflict="user_id,provider").execute()
    except line_messaging.LineError as exc:
        logger.warning("LINE callback failed user_id=%s error=%s", match["user_id"], exc)
        return RedirectResponse(f"{redirect}?line=failed")
    return RedirectResponse(f"{redirect}?line=connected")


@router.delete("/line", response_model=ActionResult)
def disconnect_line(admin: AdminClient, current_user: CurrentUser) -> dict[str, str]:
    admin.table("user_integrations").delete().eq("user_id", current_user.id).eq("provider", "line").execute()
    return {"message": "ยกเลิกการเชื่อมต่อ LINE แล้ว"}
