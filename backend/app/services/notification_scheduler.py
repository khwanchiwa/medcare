import hashlib
import logging
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone, tzinfo
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from supabase import Client

from app.repositories.notifications import NotificationRepository
from app.services.line_messaging import LineError, push_text

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ScheduledNotification:
    user_id: str
    notification_type: str
    reference_id: str
    scheduled_at: datetime
    version: str
    message: str

    @property
    def dedup_key(self) -> str:
        value = "|".join((self.notification_type, self.reference_id,
                          self.scheduled_at.isoformat(), self.version))
        return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _timezone(name: str | None) -> tzinfo:
    try:
        return ZoneInfo(name or "Asia/Bangkok")
    except ZoneInfoNotFoundError:
        logger.warning("Invalid profile timezone=%s; using Asia/Bangkok", name)
        # Windows containers may not ship an IANA database. Bangkok has no DST,
        # so UTC+7 is a safe fallback while tzdata remains an explicit dependency.
        return timezone(timedelta(hours=7), name="Asia/Bangkok")


def _parse_time(value: str) -> time | None:
    try:
        return time.fromisoformat(value.strip())
    except (TypeError, ValueError, AttributeError):
        return None


def medication_message(item: dict[str, Any], event_at: datetime) -> str:
    return (
        "💊 แจ้งเตือนการรับประทานยา\n\nถึงเวลารับประทานยาแล้ว\n\n"
        f"ชื่อยา : {item['name']} {item['dosage']}\n\n"
        f"จำนวนที่ทาน : {item.get('quantity') or 'ตามแพทย์สั่ง'}\n\n"
        f"ความถี่ในการทาน : {item['frequency']}\n\n"
        f"เวลา : {event_at:%H:%M} น.\n\nขอให้รับประทานยาให้ตรงเวลานะครับ"
    )


def appointment_message(item: dict[str, Any], event_at: datetime) -> str:
    thai_date = event_at.strftime("%d/%m/%Y")
    return (
        "📅 แจ้งเตือนนัดหมาย\n\n"
        f"คุณมีนัด: {item['title']}\n\nวันที่ : {thai_date}\n\n"
        f"เวลา : {event_at:%H:%M} น.\n\n"
        f"ข้อปฏิบัติก่อนพบแพทย์ : {item.get('notes') or 'ไม่มี'}\n\n"
        "กรุณาเดินทางล่วงหน้าเพื่อความสะดวก"
    )


def due_notifications(
    repository: NotificationRepository, user_id: str, now: datetime, window_minutes: int = 5
) -> list[ScheduledNotification]:
    profile = repository.profile(user_id)
    if not profile:
        return []
    tz = _timezone(profile.get("timezone"))
    local_now = now.astimezone(tz)
    preferences = repository.preferences(user_id)
    if not preferences.get("line_enabled", True):
        return []
    window_start = now - timedelta(minutes=window_minutes)
    due: list[ScheduledNotification] = []

    medication_lead = int(preferences.get("medication_lead_minutes", 0))
    for item in repository.medications(user_id):
        start = date.fromisoformat(item["start_date"]) if item.get("start_date") else None
        end = date.fromisoformat(item["end_date"]) if item.get("end_date") else None
        for day_delta in (-1, 0, 1):
            day = local_now.date() + timedelta(days=day_delta)
            if (start and day < start) or (end and day > end):
                continue
            for raw_time in item.get("reminder_times") or []:
                parsed = _parse_time(raw_time)
                if parsed is None:
                    logger.warning("Invalid medication schedule medication_id=%s value=%r", item["id"], raw_time)
                    continue
                event_at = datetime.combine(day, parsed, tzinfo=tz)
                scheduled = (event_at - timedelta(minutes=medication_lead)).astimezone(timezone.utc)
                if window_start < scheduled <= now:
                    due.append(ScheduledNotification(
                        user_id, "medication", str(item["id"]), scheduled,
                        str(item.get("updated_at") or item.get("created_at")),
                        medication_message(item, event_at),
                    ))

    leads = [int(value) for value in preferences.get("appointment_lead_minutes", [1440, 120])]
    for item in repository.appointments(user_id):
        parsed = _parse_time(item.get("appointment_time"))
        if parsed is None:
            logger.warning("Invalid appointment schedule appointment_id=%s", item["id"])
            continue
        event_at = datetime.combine(date.fromisoformat(item["appointment_date"]), parsed, tzinfo=tz)
        for lead in leads:
            scheduled = (event_at - timedelta(minutes=lead)).astimezone(timezone.utc)
            if window_start < scheduled <= now:
                due.append(ScheduledNotification(
                    user_id, "appointment", str(item["id"]), scheduled,
                    f"{item.get('updated_at') or item.get('created_at')}:{lead}",
                    appointment_message(item, event_at),
                ))
    return due


async def run(client: Client, now: datetime | None = None) -> dict[str, int]:
    repository = NotificationRepository(client)
    run_at = now or datetime.now(timezone.utc)
    counts = {"processed": 0, "sent": 0, "failed": 0, "duplicates": 0}
    for integration in repository.active_line_integrations():
        user_id = str(integration["user_id"])
        for notification in due_notifications(repository, user_id, run_at):
            counts["processed"] += 1
            log = repository.claim({
                "user_id": user_id, "notification_type": notification.notification_type,
                "reference_id": notification.reference_id,
                "scheduled_at": notification.scheduled_at.isoformat(),
                "status": "processing", "dedup_key": notification.dedup_key,
            })
            if not log:
                counts["duplicates"] += 1
                continue
            try:
                await push_text(str(integration.get("external_user_id") or ""), notification.message)
                sent_at = datetime.now(timezone.utc).isoformat()
                repository.finish(log["id"], {"status": "sent", "sent_at": sent_at})
                client.table("notifications").insert({
                    "user_id": user_id,
                    "title": "แจ้งเตือนการรับประทานยา" if notification.notification_type == "medication" else "แจ้งเตือนนัดหมาย",
                    "message": notification.message, "channel": "line",
                    "scheduled_at": notification.scheduled_at.isoformat(), "sent_at": sent_at,
                }).execute()
                counts["sent"] += 1
            except Exception as exc:
                error = str(exc) if isinstance(exc, LineError) else "เกิดข้อผิดพลาดภายในขณะส่งข้อความ"
                logger.exception("Notification delivery failed user_id=%s type=%s reference_id=%s",
                                 user_id, notification.notification_type, notification.reference_id)
                repository.finish(log["id"], {"status": "failed", "error_message": error[:1000]})
                counts["failed"] += 1
    return counts
