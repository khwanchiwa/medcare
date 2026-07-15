from datetime import date

from fastapi import APIRouter, Depends

from app.api.deps import AdminClient, AuthUser, require_role
from app.models import Role
from app.services.legacy_health import legacy_medication_is_active, parse_legacy_appointment_instruction

router = APIRouter()


@router.get("/patient")
def patient_dashboard(
    admin: AdminClient, patient: AuthUser = Depends(require_role(Role.PATIENT))
):
    medications = (
        admin.table("medications")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("is_active", True)
        .execute()
        .data
        or []
    )
    taken_logs = (
        admin.table("medication_logs")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("status", "taken")
        .execute()
        .data
        or []
    )
    appointments = (
        admin.table("appointments")
        .select("*")
        .eq("patient_id", patient.id)
        .gte("appointment_date", date.today().isoformat())
        .order("appointment_date")
        .limit(5)
        .execute()
        .data
        or []
    )
    return {
        "active_medications": len(medications),
        "taken_logs": len(taken_logs),
        "upcoming_appointments": appointments,
    }


@router.get("/caregiver")
def caregiver_dashboard(
    admin: AdminClient, caregiver: AuthUser = Depends(require_role(Role.CAREGIVER))
):
    if caregiver.profile.get("database_table") == "Users":
        legacy_caregiver_id = caregiver.profile.get("database_id")
        patient_records = (
            admin.table("Patients")
            .select("*")
            .eq("caregiver_id", legacy_caregiver_id)
            .execute()
            .data
            or []
        )
        patient_user_ids = [item["user_id"] for item in patient_records if item.get("user_id")]
        patient_users = []
        medications = []
        appointments = []
        if patient_user_ids:
            patient_users = (
                admin.table("Users")
                .select("id,email,username,created_at")
                .in_("id", patient_user_ids)
                .execute()
                .data
                or []
            )
            medications = (
                admin.table("Medicine")
                .select("id,user_id,dosage_instr")
                .in_("user_id", patient_user_ids)
                .execute()
                .data
                or []
            )
            appointments = (
                admin.table("Appointment")
                .select("id,user_id,app_date,app_time,app_instr")
                .gte("app_date", date.today().isoformat())
                .in_("user_id", patient_user_ids)
                .order("app_date")
                .execute()
                .data
                or []
            )

        users_by_id = {item["id"]: item for item in patient_users}
        summaries = []
        for patient_record in patient_records:
            user_id = patient_record.get("user_id")
            user = users_by_id.get(user_id)
            if not user:
                continue
            patient_appointments = [item for item in appointments if item["user_id"] == user_id]
            patient_medications = [item for item in medications if item["user_id"] == user_id]
            next_appointment = patient_appointments[0] if patient_appointments else None
            next_appointment_title = (
                parse_legacy_appointment_instruction(next_appointment.get("app_instr"))[0]
                if next_appointment
                else None
            )
            summaries.append(
                {
                    "id": str(user_id),
                    "name": user.get("username") or patient_record.get("patient_name") or user.get("email"),
                    "email": user.get("email"),
                    "condition": "",
                    "active_medications": len([item for item in patient_medications if legacy_medication_is_active(item)]),
                    "taken_medications": len([item for item in patient_medications if not legacy_medication_is_active(item)]),
                    "missed_dose_alerts": 0,
                    "upcoming_appointments": len(patient_appointments),
                    "next_appointment": (
                        {
                            "id": str(next_appointment["id"]),
                            "title": next_appointment_title,
                            "appointment_date": next_appointment.get("app_date"),
                            "appointment_time": str(next_appointment.get("app_time")),
                            "status": "upcoming",
                        }
                        if next_appointment
                        else None
                    ),
                }
            )

        return {
            "patients": summaries,
            "patient_count": len(summaries),
            "missed_dose_alerts": 0,
            "active_medications": len([item for item in medications if legacy_medication_is_active(item)]),
            "taken_medications": len([item for item in medications if not legacy_medication_is_active(item)]),
            "upcoming_appointments": len(appointments),
        }

    relationships = (
        admin.table("caregiver_relationships")
        .select("patient:profiles!patient_id(id,email,name,medical_conditions,date_of_birth,timezone)")
        .eq("caregiver_id", caregiver.id)
        .eq("status", "approved")
        .execute()
        .data
        or []
    )
    patients = [item["patient"] for item in relationships]
    patient_ids = [item["id"] for item in patients]

    medications = []
    missed = []
    appointments = []
    if patient_ids:
        medications = (
            admin.table("medications")
            .select("id,patient_id,is_active")
            .in_("patient_id", patient_ids)
            .execute()
            .data
            or []
        )
        missed = (
            admin.table("medication_logs")
            .select("id,patient_id")
            .eq("status", "missed")
            .in_("patient_id", patient_ids)
            .execute()
            .data
            or []
        )
        appointments = (
            admin.table("appointments")
            .select("id,patient_id,title,appointment_date,appointment_time,status")
            .gte("appointment_date", date.today().isoformat())
            .neq("status", "cancelled")
            .in_("patient_id", patient_ids)
            .order("appointment_date")
            .execute()
            .data
            or []
        )

    summaries = []
    for patient in patients:
        patient_id = patient["id"]
        patient_appointments = [item for item in appointments if item["patient_id"] == patient_id]
        next_appointment = patient_appointments[0] if patient_appointments else None
        summaries.append(
            {
                "id": patient_id,
                "name": patient["name"],
                "email": patient["email"],
                "condition": patient.get("medical_conditions") or "ยังไม่ได้บันทึกโรคประจำตัว",
                "active_medications": len([item for item in medications if item["patient_id"] == patient_id and item.get("is_active", True)]),
                "taken_medications": len([item for item in medications if item["patient_id"] == patient_id and not item.get("is_active", True)]),
                "missed_dose_alerts": len([item for item in missed if item["patient_id"] == patient_id]),
                "upcoming_appointments": len(patient_appointments),
                "next_appointment": next_appointment,
            }
        )

    return {
        "patients": summaries,
        "patient_count": len(patients),
        "missed_dose_alerts": len(missed or []),
        "active_medications": len([item for item in medications if item.get("is_active", True)]),
        "taken_medications": len([item for item in medications if not item.get("is_active", True)]),
        "upcoming_appointments": len(appointments or []),
    }
