from typing import Any

from supabase import Client


class NotificationRepository:
    def __init__(self, client: Client):
        self.client = client

    def active_line_integrations(self) -> list[dict[str, Any]]:
        response = self.client.table("user_integrations").select(
            "user_id,external_user_id,metadata"
        ).eq("provider", "line").eq("connection_status", "connected").execute()
        return response.data or []

    def preferences(self, user_id: str) -> dict[str, Any]:
        response = self.client.table("notification_preferences").select("*").eq(
            "user_id", user_id
        ).maybe_single().execute()
        return (response.data if response else None) or {
            "user_id": user_id, "medication_lead_minutes": 0,
            "appointment_lead_minutes": [1440, 120], "line_enabled": True,
        }

    def profile(self, user_id: str) -> dict[str, Any] | None:
        response = self.client.table("profiles").select("id,timezone").eq(
            "id", user_id
        ).maybe_single().execute()
        return response.data if response else None

    def medications(self, user_id: str) -> list[dict[str, Any]]:
        response = self.client.table("medications").select("*").eq(
            "patient_id", user_id
        ).eq("is_active", True).execute()
        return response.data or []

    def appointments(self, user_id: str) -> list[dict[str, Any]]:
        response = self.client.table("appointments").select("*").eq(
            "patient_id", user_id
        ).eq("status", "upcoming").execute()
        return response.data or []

    def claim(self, payload: dict[str, Any]) -> dict[str, Any] | None:
        try:
            response = self.client.table("notification_delivery_logs").insert(payload).execute()
            return (response.data or [None])[0]
        except Exception as exc:
            if "duplicate" in str(exc).lower() or "23505" in str(exc):
                return None
            raise

    def finish(self, log_id: str, payload: dict[str, Any]) -> None:
        self.client.table("notification_delivery_logs").update(payload).eq("id", log_id).execute()
