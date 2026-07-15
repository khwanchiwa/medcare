import secrets
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from app.api.deps import AdminClient, CurrentUser
from app.core.config import settings
from app.database.supabase import fetch_one_or_none
from app.schemas.integrations import ActionResult, GoogleAuthUrl, IntegrationStatus
from app.services import google_calendar

router = APIRouter()


@router.get("/google/status", response_model=IntegrationStatus)
def google_status(admin: AdminClient, current_user: CurrentUser):
    row = fetch_one_or_none(admin.table("user_integrations").select("connected_at").eq("user_id", current_user.id).eq("provider", "google_calendar"))
    return {"configured": google_calendar.configured(), "connected": bool(row), "connected_at": row.get("connected_at") if row else None}


@router.post("/google/auth-url", response_model=GoogleAuthUrl)
def google_auth_url(admin: AdminClient, current_user: CurrentUser):
    if not google_calendar.configured():
        raise HTTPException(status_code=503, detail="ยังไม่ได้ตั้งค่า Google OAuth")
    state = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    admin.table("integration_link_codes").delete().eq("user_id", current_user.id).eq("provider", "google_calendar").execute()
    admin.table("integration_link_codes").insert({"user_id": current_user.id, "provider": "google_calendar", "code": state, "expires_at": expires.isoformat()}).execute()
    return {"url": google_calendar.authorization_url(state)}


@router.get("/google/callback", include_in_schema=False)
def google_callback(code: str, state: str, admin: AdminClient):
    match = fetch_one_or_none(admin.table("integration_link_codes").select("*").eq("provider", "google_calendar").eq("code", state))
    if not match or datetime.fromisoformat(match["expires_at"].replace("Z", "+00:00")) <= datetime.now(timezone.utc):
        return RedirectResponse(f"{settings.frontend_url}/patient/integrations?google=invalid_state")
    try:
        token = google_calendar.exchange_code(code)
    except httpx.HTTPError:
        return RedirectResponse(f"{settings.frontend_url}/patient/integrations?google=failed")
    expires = datetime.now(timezone.utc) + timedelta(seconds=token.get("expires_in", 3600))
    existing = fetch_one_or_none(admin.table("user_integrations").select("refresh_token").eq("user_id", match["user_id"]).eq("provider", "google_calendar"))
    admin.table("user_integrations").upsert({"user_id": match["user_id"], "provider": "google_calendar", "access_token": token["access_token"], "refresh_token": token.get("refresh_token") or (existing or {}).get("refresh_token"), "token_expires_at": expires.isoformat(), "connected_at": datetime.now(timezone.utc).isoformat()}, on_conflict="user_id,provider").execute()
    admin.table("integration_link_codes").delete().eq("id", match["id"]).execute()
    return RedirectResponse(f"{settings.frontend_url}/patient/integrations?google=connected")


@router.delete("/google", response_model=ActionResult)
def disconnect_google(admin: AdminClient, current_user: CurrentUser):
    admin.table("user_integrations").delete().eq("user_id", current_user.id).eq("provider", "google_calendar").execute()
    return {"message": "ยกเลิกการเชื่อมต่อ Google Calendar แล้ว"}
