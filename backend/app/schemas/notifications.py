from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

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


class NotificationPreferences(BaseModel):
    medication_lead_minutes: int = Field(ge=0, le=1440)
    appointment_lead_minutes: list[int] = Field(min_length=1, max_length=10)
    line_enabled: bool = True


class NotificationDeliveryRead(BaseModel):
    id: str
    user_id: str
    notification_type: str
    reference_id: str
    scheduled_at: datetime
    sent_at: datetime | None
    status: str
    error_message: str | None
    created_at: datetime
