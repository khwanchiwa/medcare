import base64
import hashlib
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException
from supabase import Client

from app.core.config import settings
from app.repositories.google_calendar import GoogleCalendarRepository

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"
GOOGLE_API = "https://www.googleapis.com/calendar/v3"
SCOPE = "https://www.googleapis.com/auth/calendar.events"
TIMEZONE = "Asia/Bangkok"
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SyncResult:
    created: int = 0
    updated: int = 0
    deleted: int = 0
    unchanged: int = 0
    failed: int = 0


class GoogleCalendarError(Exception):
    def __init__(self, message: str, *, reconnect: bool = False) -> None:
        super().__init__(message)
        self.reconnect = reconnect


def configured() -> bool:
    return bool(
        settings.google_client_id
        and settings.google_client_secret
        and settings.google_redirect_uri
        and settings.google_token_encryption_key
    )


def authorization_url(state: str) -> str:
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "false",
        "state": state,
    })


def _cipher() -> Fernet:
    try:
        return Fernet(settings.google_token_encryption_key.encode())
    except (ValueError, TypeError) as exc:
        raise GoogleCalendarError("การตั้งค่าความปลอดภัยของ Google Calendar ไม่ถูกต้อง") from exc


def _encrypt(value: str) -> str:
    return _cipher().encrypt(value.encode()).decode()


def _decrypt(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return _cipher().decrypt(value.encode()).decode()
    except InvalidToken as exc:
        raise GoogleCalendarError("ข้อมูลเชื่อมต่อไม่ถูกต้อง กรุณาเชื่อมต่อ Google Calendar ใหม่", reconnect=True) from exc


def _email_from_id_token(id_token: str | None) -> str | None:
    """Read the informational email claim from Google's directly-issued token response."""
    if not id_token:
        return None
    try:
        payload = id_token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        claim = json.loads(base64.urlsafe_b64decode(payload))
        return claim.get("email") if claim.get("email_verified") else None
    except (IndexError, ValueError, json.JSONDecodeError):
        return None


async def exchange_code(code: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
            "code": code,
        })
    if response.is_error:
        logger.warning("Google authorization-code exchange failed status=%s", response.status_code)
        raise GoogleCalendarError("เชื่อมต่อ Google Calendar ไม่สำเร็จ กรุณาลองใหม่")
    return response.json()


def save_tokens(admin: Client, user_id: str, token: dict[str, Any]) -> None:
    repository = GoogleCalendarRepository(admin)
    existing = repository.integration(user_id) or {}
    refresh_token = token.get("refresh_token")
    encrypted_refresh = _encrypt(refresh_token) if refresh_token else existing.get("refresh_token")
    if not encrypted_refresh:
        raise GoogleCalendarError("Google ไม่ได้ส่ง Refresh Token กรุณายกเลิกสิทธิ์เดิมแล้วเชื่อมต่อใหม่")
    expires = datetime.now(timezone.utc) + timedelta(seconds=int(token.get("expires_in", 3600)))
    repository.save_integration(user_id, {
        "access_token": _encrypt(token["access_token"]),
        "refresh_token": encrypted_refresh,
        "token_expires_at": expires.isoformat(),
        "external_email": _email_from_id_token(token.get("id_token")) or existing.get("external_email"),
        "calendar_id": existing.get("calendar_id") or "primary",
        "connection_status": "connected",
        "connected_at": datetime.now(timezone.utc).isoformat(),
    })


async def _access_token(admin: Client, user_id: str) -> str:
    repository = GoogleCalendarRepository(admin)
    row = repository.integration(user_id)
    if not row or row.get("connection_status") != "connected":
        raise GoogleCalendarError("ยังไม่ได้เชื่อมต่อ Google Calendar")
    expires = row.get("token_expires_at")
    if row.get("access_token") and expires:
        expiry = datetime.fromisoformat(expires.replace("Z", "+00:00"))
        if expiry > datetime.now(timezone.utc) + timedelta(minutes=2):
            token = _decrypt(row["access_token"])
            if token:
                return token
    refresh_token = _decrypt(row.get("refresh_token"))
    if not refresh_token:
        repository.update_integration(user_id, {"connection_status": "reconnect_required"})
        raise GoogleCalendarError("สิทธิ์ Google Calendar หมดอายุ กรุณาเชื่อมต่อใหม่", reconnect=True)
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            })
    except httpx.RequestError as exc:
        raise GoogleCalendarError("ติดต่อ Google ไม่ได้ กรุณาลองใหม่ภายหลัง") from exc
    if response.is_error:
        repository.update_integration(user_id, {"connection_status": "reconnect_required"})
        logger.warning("Google token refresh failed user_id=%s status=%s", user_id, response.status_code)
        raise GoogleCalendarError("สิทธิ์ Google Calendar หมดอายุ กรุณาเชื่อมต่อใหม่", reconnect=True)
    token = response.json()
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(token.get("expires_in", 3600)))
    repository.update_integration(user_id, {
        "access_token": _encrypt(token["access_token"]),
        "token_expires_at": expires_at.isoformat(),
        "connection_status": "connected",
    })
    return token["access_token"]


def _event_payload(appointment: dict[str, Any]) -> dict[str, Any]:
    time_value = str(appointment["appointment_time"])[:8]
    start = f'{appointment["appointment_date"]}T{time_value}+07:00'
    end = (datetime.fromisoformat(start) + timedelta(hours=1)).isoformat()
    notes = appointment.get("notes") or "-"
    description = (
        f'เวลาที่นัด: {time_value[:5]} น.\n'
        f'วันที่นัด: {appointment["appointment_date"]}\n'
        f'ข้อปฏิบัติก่อนพบแพทย์: {notes}\n\n'
        "สร้างจากระบบ Medication Management"
    )
    return {
        "summary": appointment["title"],
        "location": appointment.get("hospital") or "",
        "description": description,
        "start": {"dateTime": start, "timeZone": TIMEZONE},
        "end": {"dateTime": end, "timeZone": TIMEZONE},
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 1440},
                {"method": "popup", "minutes": 4320},
            ],
        },
        "extendedProperties": {
            "private": {"medcareAppointmentId": str(appointment["id"])}
        },
    }


def _payload_hash(appointment: dict[str, Any]) -> str:
    canonical = json.dumps(_event_payload(appointment), sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical.encode()).hexdigest()


def _remote_matches(remote: dict[str, Any], expected: dict[str, Any]) -> bool:
    """Compare only fields owned by MedCare; Google adds many server-managed fields."""
    keys = ("summary", "location", "description", "start", "end", "reminders", "extendedProperties")
    return all(remote.get(key) == expected.get(key) for key in keys)


async def _google_request(
    method: str, path: str, token: str, *, json_body: dict[str, Any] | None = None,
    params: dict[str, str] | None = None,
) -> httpx.Response:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.request(
                method, f"{GOOGLE_API}{path}",
                headers={"Authorization": f"Bearer {token}"}, json=json_body, params=params,
            )
    except httpx.RequestError as exc:
        raise GoogleCalendarError("ติดต่อ Google Calendar ไม่ได้ กรุณาลองใหม่ภายหลัง") from exc
    if response.status_code in (401, 403):
        raise GoogleCalendarError("Google Calendar ปฏิเสธสิทธิ์ กรุณาเชื่อมต่อใหม่", reconnect=True)
    if response.status_code >= 400 and response.status_code not in (404, 410):
        logger.warning("Google Calendar API failed method=%s path=%s status=%s", method, path, response.status_code)
        raise GoogleCalendarError("Google Calendar ทำงานไม่สำเร็จ กรุณาลองใหม่")
    return response


async def _find_existing(token: str, calendar_id: str, appointment: dict[str, Any]) -> str | None:
    response = await _google_request(
        "GET", f"/calendars/{calendar_id}/events", token,
        params={"privateExtendedProperty": f'medcareAppointmentId={appointment["id"]}', "maxResults": "2"},
    )
    items = response.json().get("items", [])
    return items[0].get("id") if items else None


async def sync_event(admin: Client, user_id: str, appointment: dict[str, Any]) -> tuple[str, str]:
    repository = GoogleCalendarRepository(admin)
    integration = repository.integration(user_id)
    if not integration or integration.get("connection_status") != "connected":
        raise GoogleCalendarError("ยังไม่ได้เชื่อมต่อ Google Calendar")
    token = await _access_token(admin, user_id)
    calendar_id = integration.get("calendar_id") or "primary"
    link = repository.link(user_id, str(appointment["id"]))
    event_id = (link or {}).get("google_event_id") or appointment.get("google_event_id")
    payload_hash = _payload_hash(appointment)
    if link and link.get("payload_hash") == payload_hash and event_id:
        existing = await _google_request(
            "GET", f"/calendars/{calendar_id}/events/{event_id}", token
        )
        if existing.status_code not in (404, 410) and _remote_matches(existing.json(), _event_payload(appointment)):
            return event_id, "unchanged"
        if existing.status_code in (404, 410):
            event_id = None
    action = "updated" if event_id else "created"
    if event_id:
        response = await _google_request(
            "PUT", f"/calendars/{calendar_id}/events/{event_id}", token,
            json_body=_event_payload(appointment),
        )
        if response.status_code in (404, 410):
            event_id = None
    if not event_id:
        event_id = await _find_existing(token, calendar_id, appointment)
        action = "updated" if event_id else "created"
        if event_id:
            response = await _google_request(
                "PUT", f"/calendars/{calendar_id}/events/{event_id}", token,
                json_body=_event_payload(appointment),
            )
        else:
            response = await _google_request(
                "POST", f"/calendars/{calendar_id}/events", token,
                json_body=_event_payload(appointment),
            )
    event_id = response.json()["id"]
    repository.save_link(user_id, str(appointment["id"]), {
        "google_event_id": event_id,
        "google_calendar_id": calendar_id,
        "payload_hash": payload_hash,
        "sync_status": "synced",
        "sync_error": None,
        "last_synced_at": datetime.now(timezone.utc).isoformat(),
    })
    return event_id, action


def linked_event_id(admin: Client, user_id: str, appointment_id: str) -> str | None:
    row = GoogleCalendarRepository(admin).link(user_id, appointment_id)
    return row.get("google_event_id") if row else None


async def delete_event(admin: Client, user_id: str, event_id: str, appointment_id: str | None = None) -> None:
    repository = GoogleCalendarRepository(admin)
    integration = repository.integration(user_id)
    if not integration:
        return
    token = await _access_token(admin, user_id)
    calendar_id = integration.get("calendar_id") or "primary"
    await _google_request("DELETE", f"/calendars/{calendar_id}/events/{event_id}", token)
    if appointment_id:
        repository.delete_link(user_id, appointment_id)


async def sync_all(admin: Client, user_id: str) -> SyncResult:
    repository = GoogleCalendarRepository(admin)
    # Fail fast with a reconnect-friendly error instead of returning one failure per appointment.
    await _access_token(admin, user_id)
    appointments = repository.appointments(user_id)
    appointment_ids = {str(item["id"]) for item in appointments}
    counts = {"created": 0, "updated": 0, "deleted": 0, "unchanged": 0, "failed": 0}
    for appointment in appointments:
        try:
            event_id, action = await sync_event(admin, user_id, appointment)
            counts[action] += 1
            if appointment.get("google_event_id") != event_id:
                repository._execute(
                    admin.table("appointments").update({"google_event_id": event_id}).eq("id", appointment["id"])
                )
        except GoogleCalendarError as exc:
            counts["failed"] += 1
            logger.warning("Appointment sync failed user_id=%s appointment_id=%s error=%s", user_id, appointment["id"], exc)
    for link in repository.links(user_id):
        if link["appointment_id"] not in appointment_ids:
            try:
                await delete_event(admin, user_id, link["google_event_id"], link["appointment_id"])
                counts["deleted"] += 1
            except GoogleCalendarError as exc:
                counts["failed"] += 1
                logger.warning("Orphan event deletion failed user_id=%s appointment_id=%s error=%s", user_id, link["appointment_id"], exc)
    repository.update_integration(user_id, {"last_sync_at": datetime.now(timezone.utc).isoformat()})
    return SyncResult(**counts)


async def disconnect(admin: Client, user_id: str) -> None:
    repository = GoogleCalendarRepository(admin)
    row = repository.integration(user_id)
    token = _decrypt((row or {}).get("refresh_token")) or _decrypt((row or {}).get("access_token"))
    if token:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(GOOGLE_REVOKE_URL, data={"token": token})
        except httpx.RequestError:
            logger.warning("Google token revocation network failure user_id=%s", user_id)
    repository.delete_integration(user_id)


def as_http_error(exc: GoogleCalendarError) -> HTTPException:
    return HTTPException(status_code=409 if exc.reconnect else 502, detail=str(exc))
