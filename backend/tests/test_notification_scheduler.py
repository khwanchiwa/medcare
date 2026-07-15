from datetime import datetime, timezone

from app.services.notification_scheduler import due_notifications


class FakeRepository:
    def profile(self, user_id: str):
        return {"id": user_id, "timezone": "Asia/Bangkok"}

    def preferences(self, user_id: str):
        return {
            "medication_lead_minutes": 15,
            "appointment_lead_minutes": [1440, 120],
            "line_enabled": True,
        }

    def medications(self, user_id: str):
        return [{
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "Paracetamol", "dosage": "500 mg", "quantity": "1 เม็ด",
            "frequency": "3 เวลา", "reminder_times": ["08:00", "12:00", "18:00"],
            "is_active": True, "updated_at": "2026-07-16T00:00:00+00:00",
        }]

    def appointments(self, user_id: str):
        return [{
            "id": "22222222-2222-2222-2222-222222222222", "title": "ตรวจหัวใจ",
            "appointment_date": "2026-07-17", "appointment_time": "09:30:00",
            "notes": None, "updated_at": "2026-07-16T00:00:00+00:00",
        }]


def test_medication_due_15_minutes_before_and_each_time_has_unique_key():
    repository = FakeRepository()
    # 07:45 Asia/Bangkok
    notifications = due_notifications(
        repository, "patient-1", datetime(2026, 7, 16, 0, 45, tzinfo=timezone.utc)
    )
    medication = [item for item in notifications if item.notification_type == "medication"]
    assert len(medication) == 1
    assert "08:00 น." in medication[0].message
    assert len(medication[0].dedup_key) == 64


def test_appointment_due_one_day_before_and_message_uses_database_notes():
    repository = FakeRepository()
    # Exactly one day before 09:30 Asia/Bangkok.
    notifications = due_notifications(
        repository, "patient-1", datetime(2026, 7, 16, 2, 30, tzinfo=timezone.utc)
    )
    appointment = [item for item in notifications if item.notification_type == "appointment"]
    assert len(appointment) == 1
    assert "ตรวจหัวใจ" in appointment[0].message
    assert "ข้อปฏิบัติก่อนพบแพทย์ : ไม่มี" in appointment[0].message


def test_reference_update_changes_dedup_key():
    repository = FakeRepository()
    now = datetime(2026, 7, 16, 0, 45, tzinfo=timezone.utc)
    first = due_notifications(repository, "patient-1", now)[0]
    original = repository.medications
    repository.medications = lambda user_id: [original(user_id)[0] | {
        "updated_at": "2026-07-16T00:01:00+00:00"
    }]
    changed = due_notifications(repository, "patient-1", now)[0]
    assert first.dedup_key != changed.dedup_key
