from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AdminClient, CurrentUser, require_patient_access
from app.models import Role
from app.repositories.base import SupabaseRepository
from app.schemas.common import Message
from app.schemas.medications import (
    MedicationCheckIn,
    MedicationCreate,
    MedicationLogRead,
    MedicationRead,
    MedicationUpdate,
)
from app.services.legacy_health import (
    create_legacy_medication,
    delete_legacy_medication,
    get_legacy_medication,
    list_legacy_medications,
    update_legacy_medication,
    uses_legacy_schema,
)

router = APIRouter()


def resolve_patient_id(current_user: CurrentUser, requested_id: str | None) -> str:
    if requested_id:
        return requested_id
    if current_user.role != Role.PATIENT:
        raise HTTPException(status_code=422, detail="patient_id is required")
    return current_user.id


@router.get("", response_model=list[MedicationRead])
def list_medications(
    admin: AdminClient,
    current_user: CurrentUser,
    patient_id: str | None = Query(default=None),
):
    target_id = resolve_patient_id(current_user, patient_id)
    if uses_legacy_schema(current_user):
        return list_legacy_medications(admin, current_user, target_id)
    require_patient_access(admin, current_user, target_id)
    return SupabaseRepository(admin, "medications").list_by("patient_id", target_id, "name")


@router.post("", response_model=MedicationRead, status_code=status.HTTP_201_CREATED)
def create_medication(payload: MedicationCreate, admin: AdminClient, current_user: CurrentUser):
    target_id = resolve_patient_id(current_user, payload.patient_id)
    if uses_legacy_schema(current_user):
        data = payload.model_dump(exclude={"patient_id"}, mode="json")
        medication = create_legacy_medication(admin, current_user, data, target_id)
        return medication
    require_patient_access(admin, current_user, target_id, "medication")
    data = payload.model_dump(exclude={"patient_id"}, mode="json") | {"patient_id": target_id}
    medication = SupabaseRepository(admin, "medications").create(data)
    return medication


@router.get("/logs", response_model=list[MedicationLogRead])
def list_logs(
    admin: AdminClient,
    current_user: CurrentUser,
    patient_id: str | None = Query(default=None),
):
    target_id = resolve_patient_id(current_user, patient_id)
    require_patient_access(admin, current_user, target_id, "history")
    return SupabaseRepository(admin, "medication_logs").list_by("patient_id", target_id, "scheduled_at")


@router.get("/{medication_id}", response_model=MedicationRead)
def get_medication(medication_id: str, admin: AdminClient, current_user: CurrentUser):
    if uses_legacy_schema(current_user):
        return get_legacy_medication(admin, current_user, medication_id)
    medication = SupabaseRepository(admin, "medications").get(medication_id)
    require_patient_access(admin, current_user, medication["patient_id"])
    return medication


@router.patch("/{medication_id}", response_model=MedicationRead)
def update_medication(
    medication_id: str,
    payload: MedicationUpdate,
    admin: AdminClient,
    current_user: CurrentUser,
):
    if uses_legacy_schema(current_user):
        medication = update_legacy_medication(
            admin,
            current_user,
            medication_id,
            payload.model_dump(exclude_unset=True, mode="json"),
        )
        return medication
    repository = SupabaseRepository(admin, "medications")
    medication = repository.get(medication_id)
    require_patient_access(admin, current_user, medication["patient_id"], "medication")
    updated = repository.update(medication_id, payload.model_dump(exclude_unset=True, mode="json"))
    return updated


@router.delete("/{medication_id}", response_model=Message)
def delete_medication(medication_id: str, admin: AdminClient, current_user: CurrentUser):
    if uses_legacy_schema(current_user):
        delete_legacy_medication(admin, current_user, medication_id)
        return Message(message="Medication deleted")
    repository = SupabaseRepository(admin, "medications")
    medication = repository.get(medication_id)
    require_patient_access(admin, current_user, medication["patient_id"], "medication")
    repository.delete(medication_id)
    return Message(message="Medication deleted")


@router.post("/{medication_id}/check-in", response_model=MedicationLogRead, status_code=201)
def check_in(
    medication_id: str,
    payload: MedicationCheckIn,
    admin: AdminClient,
    current_user: CurrentUser,
):
    medication = SupabaseRepository(admin, "medications").get(medication_id)
    require_patient_access(admin, current_user, medication["patient_id"], "medication")
    data = payload.model_dump(mode="json")
    if data["status"] == "taken" and data["taken_at"] is None:
        data["taken_at"] = datetime.now(timezone.utc).isoformat()
    data.update({"medication_id": medication_id, "patient_id": medication["patient_id"]})
    return SupabaseRepository(admin, "medication_logs").create(data)
