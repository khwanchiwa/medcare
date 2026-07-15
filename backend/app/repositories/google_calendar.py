from typing import Any

from fastapi import HTTPException
from supabase import Client

from app.database.supabase import fetch_one_or_none


class GoogleCalendarRepository:
    """Backend-only persistence for Google credentials and appointment links."""

    def __init__(self, client: Client) -> None:
        self.client = client

    def integration(self, user_id: str) -> dict[str, Any] | None:
        return fetch_one_or_none(
            self.client.table("user_integrations")
            .select("*")
            .eq("user_id", user_id)
            .eq("provider", "google_calendar")
        )

    def save_integration(self, user_id: str, values: dict[str, Any]) -> None:
        self._execute(
            self.client.table("user_integrations").upsert(
                {"user_id": user_id, "provider": "google_calendar", **values},
                on_conflict="user_id,provider",
            )
        )

    def update_integration(self, user_id: str, values: dict[str, Any]) -> None:
        self._execute(
            self.client.table("user_integrations")
            .update(values)
            .eq("user_id", user_id)
            .eq("provider", "google_calendar")
        )

    def delete_integration(self, user_id: str) -> None:
        self._execute(
            self.client.table("user_integrations")
            .delete()
            .eq("user_id", user_id)
            .eq("provider", "google_calendar")
        )

    def link(self, user_id: str, appointment_id: str) -> dict[str, Any] | None:
        return fetch_one_or_none(
            self.client.table("calendar_event_links")
            .select("*")
            .eq("user_id", user_id)
            .eq("appointment_id", appointment_id)
        )

    def links(self, user_id: str) -> list[dict[str, Any]]:
        response = self._execute(
            self.client.table("calendar_event_links").select("*").eq("user_id", user_id)
        )
        return response.data or []

    def save_link(self, user_id: str, appointment_id: str, values: dict[str, Any]) -> None:
        self._execute(
            self.client.table("calendar_event_links").upsert(
                {"user_id": user_id, "appointment_id": appointment_id, **values},
                on_conflict="user_id,appointment_id",
            )
        )

    def delete_link(self, user_id: str, appointment_id: str) -> None:
        self._execute(
            self.client.table("calendar_event_links")
            .delete()
            .eq("user_id", user_id)
            .eq("appointment_id", appointment_id)
        )

    def appointments(self, user_id: str) -> list[dict[str, Any]]:
        response = self._execute(
            self.client.table("appointments").select("*").eq("patient_id", user_id)
        )
        return response.data or []

    @staticmethod
    def _execute(query: Any) -> Any:
        try:
            return query.execute()
        except Exception as exc:
            raise HTTPException(status_code=502, detail="ไม่สามารถบันทึกข้อมูล Google Calendar ได้") from exc
