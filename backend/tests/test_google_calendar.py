from app.services.google_calendar import SCOPE, _event_payload, authorization_url


def appointment():
    return {
        "id": "appointment-123",
        "title": "ตรวจติดตามอาการ",
        "hospital": "โรงพยาบาลตัวอย่าง",
        "appointment_date": "2026-07-20",
        "appointment_time": "09:30:00",
        "notes": "นำผลเลือดไปด้วย",
    }


def test_oauth_requests_only_calendar_events_scope():
    url = authorization_url("safe-state")

    assert SCOPE == "https://www.googleapis.com/auth/calendar.events"
    assert "calendar.events" in url
    assert "state=safe-state" in url


def test_event_payload_has_bangkok_timezone_reminders_and_dedup_key():
    payload = _event_payload(appointment())

    assert payload["summary"] == appointment()["title"]
    assert payload["start"]["timeZone"] == "Asia/Bangkok"
    assert payload["end"]["timeZone"] == "Asia/Bangkok"
    assert [item["minutes"] for item in payload["reminders"]["overrides"]] == [1440, 4320]
    assert payload["extendedProperties"]["private"]["medcareAppointmentId"] == "appointment-123"
    assert "Medication Management" in payload["description"]
