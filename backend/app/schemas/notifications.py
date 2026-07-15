from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationChannel


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    message: str
    channel: NotificationChannel
    scheduled_at: datetime | None
    sent_at: datetime | None
    read_at: datetime | None
    created_at: datetime
