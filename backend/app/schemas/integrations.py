from datetime import datetime
from pydantic import BaseModel


class IntegrationStatus(BaseModel):
    configured: bool
    connected: bool
    reconnect_required: bool = False
    google_email: str | None = None
    google_calendar_id: str | None = None
    last_sync: datetime | None = None
    connected_at: datetime | None = None


class GoogleAuthUrl(BaseModel):
    url: str


class ActionResult(BaseModel):
    message: str


class CalendarSyncResult(BaseModel):
    message: str
    created: int
    updated: int
    deleted: int
    unchanged: int
    failed: int


class LineIntegrationStatus(BaseModel):
    configured: bool
    connected: bool
    display_name: str | None = None
    picture_url: str | None = None
    connected_at: datetime | None = None
    updated_at: datetime | None = None


class LineAuthUrl(BaseModel):
    url: str
