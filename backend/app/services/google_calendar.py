from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from supabase import Client

from app.core.config import settings
from app.database.supabase import fetch_one_or_none

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_API = "https://www.googleapis.com/calendar/v3"
SCOPE = "https://www.googleapis.com/auth/calendar"


def configured() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret and settings.google_redirect_uri)


def authorization_url(state: str) -> str:
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    })


def exchange_code(code: str) -> dict:
    response = httpx.post(GOOGLE_TOKEN_URL, data={
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_redirect_uri,
        "grant_type": "authorization_code",
        "code": code,
    }, timeout=20)
    response.raise_for_status()
    return response.json()


def _access_token(admin: Client, user_id: str) -> str:
    row = fetch_one_or_none(admin.table("user_integrations").select("*").eq("user_id", user_id).eq("provider", "google_calendar"))
    if not row:
        raise RuntimeError("Google Calendar is not connected")
    expires = row.get("token_expires_at")
    if row.get("access_token") and expires and datetime.fromisoformat(expires.replace("Z", "+00:00")) > datetime.now().astimezone() + timedelta(minutes=2):
        return row["access_token"]
    response = httpx.post(GOOGLE_TOKEN_URL, data={
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "refresh_token": row.get("refresh_token"),
        "grant_type": "refresh_token",
    }, timeout=20)
    response.raise_for_status()
    token = response.json()
    expires_at = datetime.now().astimezone() + timedelta(seconds=token.get("expires_in", 3600))
    admin.table("user_integrations").update({"access_token": token["access_token"], "token_expires_at": expires_at.isoformat()}).eq("user_id", user_id).eq("provider", "google_calendar").execute()
    return token["access_token"]


def _event_payload(appointment: dict) -> dict:
    start = f"{appointment['appointment_date']}T{str(appointment['appointment_time'])[:8]}+07:00"
    end = (datetime.fromisoformat(start) + timedelta(hours=1)).isoformat()
    return {
        "summary": appointment["title"],
        "location": appointment.get("hospital") or "",
        "description": appointment.get("notes") or "สร้างโดย MedCare",
        "start": {"dateTime": start, "timeZone": "Asia/Bangkok"},
        "end": {"dateTime": end, "timeZone": "Asia/Bangkok"},
    }


def sync_event(admin: Client, user_id: str, appointment: dict) -> str:
    token = _access_token(admin, user_id)
    headers = {"Authorization": f"Bearer {token}"}
    link = fetch_one_or_none(admin.table("calendar_event_links").select("google_event_id").eq("user_id", user_id).eq("appointment_id", str(appointment["id"])))
    event_id = (link or {}).get("google_event_id") or appointment.get("google_event_id")
    if event_id:
        response = httpx.put(f"{GOOGLE_API}/calendars/primary/events/{event_id}", headers=headers, json=_event_payload(appointment), timeout=20)
    else:
        response = httpx.post(f"{GOOGLE_API}/calendars/primary/events", headers=headers, json=_event_payload(appointment), timeout=20)
    response.raise_for_status()
    event_id = response.json()["id"]
    admin.table("calendar_event_links").upsert({"user_id": user_id, "appointment_id": str(appointment["id"]), "google_event_id": event_id}, on_conflict="user_id,appointment_id").execute()
    return event_id


def linked_event_id(admin: Client, user_id: str, appointment_id: str) -> str | None:
    row = fetch_one_or_none(admin.table("calendar_event_links").select("google_event_id").eq("user_id", user_id).eq("appointment_id", str(appointment_id)))
    return row.get("google_event_id") if row else None


def delete_event(admin: Client, user_id: str, event_id: str) -> None:
    token = _access_token(admin, user_id)
    response = httpx.delete(f"{GOOGLE_API}/calendars/primary/events/{event_id}", headers={"Authorization": f"Bearer {token}"}, timeout=20)
    if response.status_code not in (204, 404, 410):
        response.raise_for_status()
    admin.table("calendar_event_links").delete().eq("user_id", user_id).eq("google_event_id", event_id).execute()
