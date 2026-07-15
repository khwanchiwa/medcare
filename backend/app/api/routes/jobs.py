import hmac
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException

from app.api.deps import AdminClient
from app.core.config import settings
from app.services.notification_scheduler import run

router = APIRouter()


@router.post("/notifications/run")
async def run_notifications(
    admin: AdminClient,
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, int]:
    expected = f"Bearer {settings.scheduler_secret}"
    if not settings.scheduler_secret or not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Scheduler authentication failed")
    return await run(admin)
