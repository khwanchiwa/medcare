from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.api.deps import AdminClient, CurrentUser
from app.repositories.base import SupabaseRepository
from app.schemas.common import Message
from app.schemas.notifications import NotificationRead

router = APIRouter()


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
