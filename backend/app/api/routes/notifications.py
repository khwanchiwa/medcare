from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.api.deps import AdminClient, CurrentUser
from app.repositories.base import SupabaseRepository
from app.schemas.common import Message
from app.schemas.notifications import (
    NotificationDeliveryRead, NotificationPreferences, NotificationRead,
)

router = APIRouter()


@router.get("/preferences", response_model=NotificationPreferences)
def get_preferences(admin: AdminClient, current_user: CurrentUser) -> dict:
    response = admin.table("notification_preferences").select("*").eq(
        "user_id", current_user.id
    ).maybe_single().execute()
    return (response.data if response else None) or {
        "medication_lead_minutes": 0,
        "appointment_lead_minutes": [1440, 120],
        "line_enabled": True,
    }


@router.put("/preferences", response_model=NotificationPreferences)
def update_preferences(
    payload: NotificationPreferences, admin: AdminClient, current_user: CurrentUser,
) -> dict:
    if any(value < 0 or value > 43200 for value in payload.appointment_lead_minutes):
        raise HTTPException(status_code=422, detail="เวลาแจ้งเตือนนัดหมายต้องอยู่ระหว่าง 0 ถึง 30 วัน")
    response = admin.table("notification_preferences").upsert({
        "user_id": current_user.id, **payload.model_dump(),
    }, on_conflict="user_id").execute()
    if not response.data:
        raise HTTPException(status_code=502, detail="บันทึกการตั้งค่าการแจ้งเตือนไม่สำเร็จ")
    return response.data[0]


@router.get("/delivery-history", response_model=list[NotificationDeliveryRead])
def delivery_history(admin: AdminClient, current_user: CurrentUser) -> list[dict]:
    response = admin.table("notification_delivery_logs").select(
        "id,user_id,notification_type,reference_id,scheduled_at,sent_at,status,error_message,created_at"
    ).eq("user_id", current_user.id).order("created_at", desc=True).limit(100).execute()
    return response.data or []


@router.get("", response_model=list[NotificationRead])
def list_notifications(admin: AdminClient, current_user: CurrentUser, unread_only: bool = False):
    query = admin.table("notifications").select("*").eq("user_id", current_user.id)
    if unread_only:
        query = query.is_("read_at", "null")
    return query.order("created_at", desc=True).execute().data or []


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_read(notification_id: str, admin: AdminClient, current_user: CurrentUser):
    repository = SupabaseRepository(admin, "notifications")
    notification = repository.get(notification_id)
    if notification["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Notification does not belong to you")
    return repository.update(notification_id, {"read_at": datetime.now(timezone.utc).isoformat()})


@router.post("/read-all", response_model=Message)
def mark_all_read(admin: AdminClient, current_user: CurrentUser):
    now = datetime.now(timezone.utc).isoformat()
    response = (
        admin.table("notifications")
        .update({"read_at": now})
        .eq("user_id", current_user.id)
        .is_("read_at", "null")
        .execute()
    )
    return Message(message=f"Marked {len(response.data or [])} notifications as read")
