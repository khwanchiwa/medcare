import json
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from supabase import Client

from app.api.deps import AuthUser
from app.database.supabase import fetch_one_or_none
from app.models import Role


MEDICATION_SEPARATOR = "\n---MEDCARE_FREQUENCY---\n"
APPOINTMENT_PREFIX = "MEDCARE_JSON:"


def uses_legacy_schema(current_user: AuthUser) -> bool:
    return current_user.profile.get("database_table") == "Users"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _legacy_user_id(current_user: AuthUser) -> int:
    value = current_user.profile.get("database_id")
    if value is None:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลบัญชีผู้ใช้")
    return int(value)


def _resolve_legacy_target_user_id(admin: Client, current_user: AuthUser, target_user_id: str | int | None = None) -> int:
    if target_user_id is None or str(target_user_id) == current_user.id:
        target = _legacy_user_id(current_user)
    else:
        target = int(target_user_id)

    if current_user.role == Role.PATIENT and target == _legacy_user_id(current_user):
        return target

    if current_user.role == Role.CAREGIVER:
        linked = (
            admin.table("Patients")
            .select("id")
            .eq("user_id", target)
            .eq("caregiver_id", _legacy_user_id(current_user))
            .limit(1)
            .execute()
        )
        if linked.data:
            return target

    raise HTTPException(status_code=403, detail="Patient access denied")


def _legacy_patient_id(admin: Client, current_user: AuthUser) -> int | None:
    response = (
        admin.table("Patients")
        .select("id")
        .eq("user_id", _legacy_user_id(current_user))
        .limit(1)
        .execute()
    )
    return int(response.data[0]["id"]) if response.data else None


def _medication_from_legacy(record: dict[str, Any], current_user: AuthUser) -> dict[str, Any]:
    dosage_value = str(record.get("dosage_instr") or "ไม่ระบุ")
    if MEDICATION_SEPARATOR in dosage_value:
        dosage, stored_frequency = dosage_value.split(MEDICATION_SEPARATOR, 1)
        try:
            medication_meta = json.loads(stored_frequency)
            frequency = medication_meta.get("frequency") or "ไม่ระบุ"
            quantity = medication_meta.get("quantity") or "1 เม็ด"
            start_date = medication_meta.get("start_date")
            end_date = medication_meta.get("end_date")
            is_active = medication_meta.get("is_active", True)
        except (TypeError, ValueError):
            frequency, quantity, start_date, end_date, is_active = stored_frequency, "1 เม็ด", None, None, True
    else:
        dosage, frequency, quantity, start_date, end_date, is_active = dosage_value, "ไม่ระบุ", "1 เม็ด", None, None, True
    reminder_times = [
        value.strip()
        for value in str(record.get("med_time") or "").split(",")
        if value.strip()
    ]
    created_at = record.get("created_at") or _now()
    return {
        "id": str(record["id"]),
        "patient_id": str(record.get("user_id") or current_user.id),
        "name": record.get("med_name") or "ไม่ระบุชื่อยา",
        "dosage": dosage or "ไม่ระบุ",
        "quantity": quantity,
        "frequency": frequency or "ไม่ระบุ",
        "reminder_times": reminder_times,
        "instructions": record.get("warning"),
        "start_date": start_date,
        "end_date": end_date,
        "is_active": is_active,
        "created_at": created_at,
        "updated_at": created_at,
    }


def legacy_medication_is_active(record: dict[str, Any]) -> bool:
    dosage_value = str(record.get("dosage_instr") or "")
    if MEDICATION_SEPARATOR not in dosage_value:
        return True
    try:
        metadata = json.loads(dosage_value.split(MEDICATION_SEPARATOR, 1)[1])
        return bool(metadata.get("is_active", True))
    except (TypeError, ValueError):
        return True


def list_legacy_medications(admin: Client, current_user: AuthUser, target_user_id: str | int | None = None) -> list[dict[str, Any]]:
    owner_user_id = _resolve_legacy_target_user_id(admin, current_user, target_user_id)
    response = (
        admin.table("Medicine")
        .select("*")
        .eq("user_id", owner_user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [_medication_from_legacy(record, current_user) for record in response.data]


def get_legacy_medication(admin: Client, current_user: AuthUser, medication_id: str) -> dict[str, Any]:
    record = fetch_one_or_none(admin.table("Medicine").select("*").eq("id", medication_id))
    if not record:
        raise HTTPException(status_code=404, detail="ไม่พบรายการยา")
    _resolve_legacy_target_user_id(admin, current_user, record.get("user_id"))
    return _medication_from_legacy(record, current_user)


def create_legacy_medication(admin: Client, current_user: AuthUser, data: dict[str, Any], target_user_id: str | int | None = None) -> dict[str, Any]:
    owner_user_id = _resolve_legacy_target_user_id(admin, current_user, target_user_id)
    payload = {
        "med_name": data["name"],
        "dosage_instr": f'{data["dosage"]}{MEDICATION_SEPARATOR}' + json.dumps({"frequency": data["frequency"], "quantity": data.get("quantity") or "1 เม็ด", "start_date": data.get("start_date"), "end_date": data.get("end_date"), "is_active": data.get("is_active", True)}, ensure_ascii=False),
        "warning": data.get("instructions"),
        "med_time": ", ".join(data.get("reminder_times") or []),
        "user_id": owner_user_id,
    }
    patient_id = _legacy_patient_id(admin, current_user) if owner_user_id == _legacy_user_id(current_user) else None
    if patient_id is None:
        patient = (
            admin.table("Patients")
            .select("id")
            .eq("user_id", owner_user_id)
            .limit(1)
            .execute()
        )
        patient_id = int(patient.data[0]["id"]) if patient.data else None
    if patient_id is not None:
        payload["patient_id"] = patient_id
    response = admin.table("Medicine").insert(payload).execute()
    if not response.data:
        raise HTTPException(status_code=502, detail="ไม่สามารถบันทึกรายการยาได้")
    return _medication_from_legacy(response.data[0], current_user)


def update_legacy_medication(admin: Client, current_user: AuthUser, medication_id: str, data: dict[str, Any]) -> dict[str, Any]:
    current = get_legacy_medication(admin, current_user, medication_id)
    owner_user_id = int(current["patient_id"])
    merged = current | data
    payload = {
        "med_name": merged["name"],
        "dosage_instr": f'{merged["dosage"]}{MEDICATION_SEPARATOR}' + json.dumps({"frequency": merged["frequency"], "quantity": merged.get("quantity") or "1 เม็ด", "start_date": merged.get("start_date"), "end_date": merged.get("end_date"), "is_active": merged.get("is_active", True)}, ensure_ascii=False),
        "warning": merged.get("instructions"),
        "med_time": ", ".join(merged.get("reminder_times") or []),
    }
    response = (
        admin.table("Medicine")
        .update(payload)
        .eq("id", medication_id)
        .eq("user_id", owner_user_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="ไม่พบรายการยา")
    return _medication_from_legacy(response.data[0], current_user)


def delete_legacy_medication(admin: Client, current_user: AuthUser, medication_id: str) -> None:
    current = get_legacy_medication(admin, current_user, medication_id)
    admin.table("Medicine").delete().eq("id", medication_id).eq("user_id", int(current["patient_id"])).execute()


def parse_legacy_appointment_instruction(raw_instruction: str | None) -> tuple[str, str | None, str | None]:
    raw_instruction = str(raw_instruction or "")
    title = "นัดหมาย"
    hospital = None
    notes = raw_instruction or None
    if raw_instruction.startswith(APPOINTMENT_PREFIX):
        try:
            stored = json.loads(raw_instruction[len(APPOINTMENT_PREFIX) :])
            title = stored.get("title") or title
            hospital = stored.get("hospital") or None
            notes = stored.get("notes") or None
        except (TypeError, ValueError):
            pass
    return title, hospital, notes


def _appointment_from_legacy(record: dict[str, Any], current_user: AuthUser) -> dict[str, Any]:
    title, hospital, notes = parse_legacy_appointment_instruction(record.get("app_instr"))
    created_at = record.get("created_at") or _now()
    return {
        "id": str(record["id"]),
        "patient_id": str(record.get("user_id") or current_user.id),
        "title": title,
        "hospital": hospital,
        "appointment_date": record["app_date"],
        "appointment_time": record["app_time"],
        "notes": notes,
        "status": "upcoming",
        "google_event_id": None,
        "created_at": created_at,
        "updated_at": created_at,
    }


def list_legacy_appointments(admin: Client, current_user: AuthUser, target_user_id: str | int | None = None) -> list[dict[str, Any]]:
    owner_user_id = _resolve_legacy_target_user_id(admin, current_user, target_user_id)
    response = (
        admin.table("Appointment")
        .select("*")
        .eq("user_id", owner_user_id)
        .order("app_date")
        .execute()
    )
    appointments = [_appointment_from_legacy(record, current_user) for record in response.data]
    appointment_ids = [item["id"] for item in appointments]
    if appointment_ids:
        try:
            links = admin.table("calendar_event_links").select("appointment_id,google_event_id").in_("appointment_id", appointment_ids).execute().data or []
            event_ids = {str(item["appointment_id"]): item.get("google_event_id") for item in links}
            for appointment in appointments:
                appointment["google_event_id"] = event_ids.get(appointment["id"])
        except Exception:
            pass
    return appointments


def get_legacy_appointment(admin: Client, current_user: AuthUser, appointment_id: str) -> dict[str, Any]:
    record = fetch_one_or_none(admin.table("Appointment").select("*").eq("id", appointment_id))
    if not record:
        raise HTTPException(status_code=404, detail="ไม่พบนัดหมาย")
    _resolve_legacy_target_user_id(admin, current_user, record.get("user_id"))
    appointment = _appointment_from_legacy(record, current_user)
    try:
        link = fetch_one_or_none(admin.table("calendar_event_links").select("google_event_id").eq("appointment_id", appointment_id))
        appointment["google_event_id"] = (link or {}).get("google_event_id")
    except Exception:
        pass
    return appointment


def _appointment_payload(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "app_date": str(data["appointment_date"]),
        "app_time": str(data["appointment_time"]),
        "app_instr": APPOINTMENT_PREFIX
        + json.dumps(
            {"title": data["title"], "hospital": data.get("hospital"), "notes": data.get("notes")},
            ensure_ascii=False,
        ),
    }


def create_legacy_appointment(admin: Client, current_user: AuthUser, data: dict[str, Any], target_user_id: str | int | None = None) -> dict[str, Any]:
    owner_user_id = _resolve_legacy_target_user_id(admin, current_user, target_user_id)
    payload = _appointment_payload(data) | {"user_id": owner_user_id}
    patient_id = _legacy_patient_id(admin, current_user) if owner_user_id == _legacy_user_id(current_user) else None
    if patient_id is None:
        patient = (
            admin.table("Patients")
            .select("id")
            .eq("user_id", owner_user_id)
            .limit(1)
            .execute()
        )
        patient_id = int(patient.data[0]["id"]) if patient.data else None
    if patient_id is not None:
        payload["patient_id"] = patient_id
    response = admin.table("Appointment").insert(payload).execute()
    if not response.data:
        raise HTTPException(status_code=502, detail="ไม่สามารถบันทึกนัดหมายได้")
    return _appointment_from_legacy(response.data[0], current_user)


def update_legacy_appointment(admin: Client, current_user: AuthUser, appointment_id: str, data: dict[str, Any]) -> dict[str, Any]:
    current = get_legacy_appointment(admin, current_user, appointment_id)
    owner_user_id = int(current["patient_id"])
    merged = current | data
    response = (
        admin.table("Appointment")
        .update(_appointment_payload(merged))
        .eq("id", appointment_id)
        .eq("user_id", owner_user_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="ไม่พบนัดหมาย")
    return _appointment_from_legacy(response.data[0], current_user)


def delete_legacy_appointment(admin: Client, current_user: AuthUser, appointment_id: str) -> None:
    current = get_legacy_appointment(admin, current_user, appointment_id)
    admin.table("Appointment").delete().eq("id", appointment_id).eq("user_id", int(current["patient_id"])).execute()
