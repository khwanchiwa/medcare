import logging
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException
from supabase import Client

from app.core.config import settings
from app.database.supabase import fetch_one_or_none

logger = logging.getLogger(__name__)
LINE_API = "https://api.line.me"


@dataclass(frozen=True)
class LineProfile:
    user_id: str
    display_name: str
    picture_url: str | None = None


class LineError(Exception):
    def __init__(self, message: str, *, reconnect: bool = False):
        super().__init__(message)
        self.reconnect = reconnect


def configured() -> bool:
    return all((settings.line_login_channel_id, settings.line_login_channel_secret,
                settings.line_messaging_access_token))


def authorization_url(state: str, nonce: str) -> str:
    query = urlencode({
        "response_type": "code", "client_id": settings.line_login_channel_id,
        "redirect_uri": settings.line_redirect_uri, "state": state,
        "scope": "profile openid", "nonce": nonce, "bot_prompt": "normal",
    })
    return f"https://access.line.me/oauth2/v2.1/authorize?{query}"


async def exchange_and_verify(code: str, nonce: str) -> LineProfile:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            token_response = await client.post(f"{LINE_API}/oauth2/v2.1/token", data={
                "grant_type": "authorization_code", "code": code,
                "redirect_uri": settings.line_redirect_uri,
                "client_id": settings.line_login_channel_id,
                "client_secret": settings.line_login_channel_secret,
            })
            token_response.raise_for_status()
            token = token_response.json()
            verify_response = await client.post(f"{LINE_API}/oauth2/v2.1/verify", data={
                "id_token": token["id_token"], "client_id": settings.line_login_channel_id,
                "nonce": nonce,
            })
            verify_response.raise_for_status()
            claims: dict[str, Any] = verify_response.json()
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        logger.warning("LINE Login exchange failed error=%s", type(exc).__name__)
        raise LineError("ไม่สามารถยืนยันบัญชี LINE ได้ กรุณาลองใหม่อีกครั้ง") from exc
    subject = str(claims.get("sub", ""))
    if len(subject) != 33 or not subject.startswith("U"):
        raise LineError("LINE User ID ไม่ถูกต้อง กรุณาเชื่อมต่อใหม่")
    return LineProfile(subject, str(claims.get("name") or "LINE user"), claims.get("picture"))


async def push_text(line_user_id: str, message: str) -> None:
    if len(line_user_id) != 33 or not line_user_id.startswith("U"):
        raise LineError("LINE User ID ไม่ถูกต้อง", reconnect=True)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{LINE_API}/v2/bot/message/push",
                headers={
                    "Authorization": f"Bearer {settings.line_messaging_access_token}",
                    "Content-Type": "application/json",
                },
                json={"to": line_user_id, "messages": [{"type": "text", "text": message}]},
            )
    except httpx.RequestError as exc:
        raise LineError("ไม่สามารถเชื่อมต่อ LINE Messaging API ได้") from exc
    if response.status_code in (401, 403):
        raise LineError("LINE Messaging API access token ไม่ถูกต้องหรือหมดอายุ")
    if response.is_error:
        logger.warning("LINE push failed status=%s body=%s", response.status_code, response.text[:500])
        raise LineError("LINE ไม่สามารถส่งข้อความได้ กรุณาตรวจสอบว่าได้เพิ่ม Official Account เป็นเพื่อนแล้ว")


def integration_for(client: Client, user_id: str) -> dict[str, Any] | None:
    return fetch_one_or_none(client.table("user_integrations").select(
        "external_user_id,metadata,connected_at,updated_at,connection_status"
    ).eq("user_id", user_id).eq("provider", "line"))


def as_http_error(exc: LineError) -> HTTPException:
    return HTTPException(status_code=409 if exc.reconnect else 502, detail=str(exc))
