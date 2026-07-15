import logging

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AdminClient, CurrentUser, require_patient_access
from app.models import Role
from app.repositories.base import SupabaseRepository
from app.schemas.appointments import AppointmentCreate, AppointmentRead, AppointmentUpdate
from app.schemas.common import Message
from app.services.google_calendar import GoogleCalendarError, delete_event, linked_event_id, sync_event
from app.services.legacy_health import (
    create_legacy_appointment,
    delete_legacy_appointment,
    get_legacy_appointment,
    list_legacy_appointments,
    update_legacy_appointment,
    uses_legacy_schema,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def resolve_patient_id(current_user: CurrentUser, requested_id: str | None) -> str:
    if requested_id:
        return requested_id
    if current_user.role != Role.PATIENT:
        raise HTTPException(status_code=422, detail="patient_id is required")
    return current_user.id


@router.get("", response_model=list[AppointmentRead])
def list_appointments(
    admin: AdminClient,
    current_user: CurrentUser,
    patient_id: str | None = Query(default=None),
):
    target_id = resolve_patient_id(current_user, patient_id)
    if uses_legacy_schema(current_user):
        return list_legacy_appointments(admin, current_user, target_id)
    require_patient_access(admin, current_user, target_id)
    return SupabaseRepository(admin, "appointments").list_by(
        "patient_id", target_id, "appointment_date"
    )


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def create_appointment(payload: AppointmentCreate, admin: AdminClient, current_user: CurrentUser):
    target_id = resolve_patient_id(current_user, payload.patient_id)
    if uses_legacy_schema(current_user):
        data = payload.model_dump(exclude={"patient_id"}, mode="json")
        appointment = create_legacy_appointment(admin, current_user, data, target_id)
        try:
            await sync_event(admin, target_id, appointment)
        except GoogleCalendarError as exc:
            logger.info("Google sync skipped after create appointment_id=%s reason=%s", appointment["id"], exc)
        return appointment
    require_patient_access(admin, current_user, target_id, "appointment")
    data = payload.model_dump(exclude={"patient_id"}, mode="json") | {"patient_id": target_id}
    appointment = SupabaseRepository(admin, "appointments").create(data)
    try:
        event_id, _ = await sync_event(admin, str(appointment["patient_id"]), appointment)
        appointment = SupabaseRepository(admin, "appointments").update(appointment["id"], {"google_event_id": event_id})
    except GoogleCalendarError as exc:
        logger.info("Google sync skipped after create appointment_id=%s reason=%s", appointment["id"], exc)
    return appointment


@router.get("/{appointment_id}", response_model=AppointmentRead)
def get_appointment(appointment_id: str, admin: AdminClient, current_user: CurrentUser):
    if uses_legacy_schema(current_user):
        return get_legacy_appointment(admin, current_user, appointment_id)
    appointment = SupabaseRepository(admin, "appointments").get(appointment_id)
    require_patient_access(admin, current_user, appointment["patient_id"])
    return appointment


@router.post("/{appointment_id}/sync-google", response_model=AppointmentRead)
async def sync_appointment_google(appointment_id: str, admin: AdminClient, current_user: CurrentUser):
    try:
        if uses_legacy_schema(current_user):
            appointment = get_legacy_appointment(admin, current_user, appointment_id)
            event_id, _ = await sync_event(admin, str(appointment["patient_id"]), appointment)
            appointment["google_event_id"] = event_id
            return appointment
        repository = SupabaseRepository(admin, "appointments")
        appointment = repository.get(appointment_id)
        require_patient_access(admin, current_user, appointment["patient_id"], "appointment")
        event_id, _ = await sync_event(admin, str(appointment["patient_id"]), appointment)
        return repository.update(appointment_id, {"google_event_id": event_id})
    except GoogleCalendarError as exc:
        raise HTTPException(status_code=409 if exc.reconnect else 502, detail=str(exc)) from exc


@router.patch("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdate,
    admin: AdminClient,
    current_user: CurrentUser,
):
    if uses_legacy_schema(current_user):
        appointment = update_legacy_appointment(
            admin,
            current_user,
            appointment_id,
            payload.model_dump(exclude_unset=True, mode="json"),
        )
        try:
            await sync_event(admin, str(appointment["patient_id"]), appointment)
        except GoogleCalendarError as exc:
            logger.info("Google sync skipped after update appointment_id=%s reason=%s", appointment_id, exc)
        return appointment
    repository = SupabaseRepository(admin, "appointments")
    appointment = repository.get(appointment_id)
    require_patient_access(admin, current_user, appointment["patient_id"], "appointment")
    updated = repository.update(appointment_id, payload.model_dump(exclude_unset=True, mode="json"))
    try:
        event_id, _ = await sync_event(admin, str(updated["patient_id"]), updated)
        if event_id != updated.get("google_event_id"):
            updated = repository.update(appointment_id, {"google_event_id": event_id})
    except GoogleCalendarError as exc:
        logger.info("Google sync skipped after update appointment_id=%s reason=%s", appointment_id, exc)
    return updated


@router.delete("/{appointment_id}", response_model=Message)
async def delete_appointment(appointment_id: str, admin: AdminClient, current_user: CurrentUser):
    if uses_legacy_schema(current_user):
        event_id = linked_event_id(admin, current_user.id, appointment_id)
        if event_id:
            try:
                await delete_event(admin, current_user.id, event_id, appointment_id)
            except GoogleCalendarError as exc:
                logger.warning("Google delete deferred appointment_id=%s reason=%s", appointment_id, exc)
        delete_legacy_appointment(admin, current_user, appointment_id)
        return Message(message="Appointment deleted")
    repository = SupabaseRepository(admin, "appointments")
    appointment = repository.get(appointment_id)
    require_patient_access(admin, current_user, appointment["patient_id"], "appointment")
    event_id = appointment.get("google_event_id") or linked_event_id(admin, str(appointment["patient_id"]), appointment_id)
    if event_id:
        try:
            await delete_event(admin, str(appointment["patient_id"]), event_id, appointment_id)
        except GoogleCalendarError as exc:
            logger.warning("Google delete deferred appointment_id=%s reason=%s", appointment_id, exc)
    repository.delete(appointment_id)
    return Message(message="Appointment deleted")
