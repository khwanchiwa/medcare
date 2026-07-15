from datetime import datetime
from pydantic import BaseModel


class IntegrationStatus(BaseModel):
    configured: bool
    connected: bool
    connected_at: datetime | None = None
    connect_url: str | None = None


class GoogleAuthUrl(BaseModel):
    url: str


class ActionResult(BaseModel):
    message: str
