from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import AdminClient, AuthUser, CurrentUser, require_role
from app.database.supabase import fetch_one_or_none
from app.models import RelationshipStatus, Role
from app.schemas.common import Message
from app.schemas.relationships import (
    RelationshipAction,
    RelationshipInvite,
    RelationshipPermissionUpdate,
    RelationshipRead,
)

router = APIRouter()
RELATIONSHIP_SELECT = "*,patient:profiles!patient_id(*),caregiver:profiles!caregiver_id(*)"
LEGACY_INVITATIONS_TABLE = "legacy_caregiver_invitations"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalized_role(value: Any) -> str:
    return str(value or "").strip().upper()


def _is_missing_legacy_invitations_table(exc: Exception) -> bool:
    """Identify PostgREST's missing-table response without hiding other failures."""
    code = str(getattr(exc, "code", ""))
    message = str(exc).lower()
    return code in {"PGRST205", "42P01"} or (
        LEGACY_INVITATIONS_TABLE in message
        and any(marker in message for marker in ("could not find", "does not exist", "schema cache"))
    )


def _list_optional_legacy_invitations(query) -> list[dict[str, Any]]:
    """Return no pending invites when the optional compatibility migration is absent."""
    try:
        return query.execute().data or []
    except Exception as exc:
        if _is_missing_legacy_invitations_table(exc):
            return []
        raise


def _legacy_user_id(user: AuthUser) -> int:
    legacy_id = user.profile.get("database_id")
    if legacy_id is None:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลบัญชีผู้ใช้")
    return int(legacy_id)


def _legacy_user_read(record: dict[str, Any], role: Role | None = None) -> dict[str, Any]:
    created_at = record.get("created_at") or _now()
    role_value = role.value if role else _normalized_role(record.get("role"))
    if role_value not in {item.value for item in Role}:
        role_value = Role.PATIENT.value
    return {
        "id": str(record["id"]),
        "email": record.get("email") or "unknown@example.com",
        "name": record.get("username") or record.get("email") or "MedCare User",
        "role": role_value,
        "phone": None,
        "caregiver_name": None,
        "date_of_birth": None,
        "medical_conditions": None,
        "timezone": "Asia/Bangkok",
        "is_active": True,
        "created_at": created_at,
    }


def _legacy_relationship(
    patient_record: dict[str, Any],
    patient_user: dict[str, Any],
    caregiver_user: dict[str, Any],
    relationship_label: str | None = None,
    status_value: str = RelationshipStatus.APPROVED.value,
    invitation_id: str | int | None = None,
) -> dict[str, Any]:
    return {
        "id": f"legacy-invite-{invitation_id}" if invitation_id is not None else f"legacy-{patient_record['id']}-{caregiver_user['id']}",
        "patient_id": str(patient_record["id"]),
        "caregiver_id": str(caregiver_user["id"]),
        "relationship_label": relationship_label,
        "status": status_value,
        "can_edit_medication": True,
        "can_edit_appointment": True,
        "can_view_history": True,
        "created_at": patient_record.get("created_at") or _now(),
        "patient": _legacy_user_read(patient_user, Role.PATIENT),
        "caregiver": _legacy_user_read(caregiver_user, Role.CAREGIVER),
    }


def _find_legacy_caregiver(admin, email: str) -> dict[str, Any]:
    caregiver = fetch_one_or_none(
        admin.table("Users").select("*").ilike("email", email.strip().lower())
    )
    if not caregiver:
        raise HTTPException(
            status_code=404,
            detail="ไม่พบบัญชีผู้ดูแลจากอีเมลนี้ กรุณาให้ผู้ดูแลสมัครบัญชีบทบาทผู้ดูแลก่อน",
        )
    if _normalized_role(caregiver.get("role")) != Role.CAREGIVER.value:
        raise HTTPException(
            status_code=409,
            detail="พบอีเมลนี้แล้ว แต่บัญชีนี้ยังไม่ใช่บทบาทผู้ดูแล กรุณาใช้อีเมลของบัญชีผู้ดูแล",
        )
    return caregiver


def _patient_record_from_user(admin, patient_user: dict[str, Any]) -> dict[str, Any]:
    response = (
        admin.table("Patients")
        .select("*")
        .eq("user_id", patient_user["id"])
        .limit(1)
        .execute()
    )
    if response.data:
        return response.data[0]
    return {
        "id": patient_user["id"],
        "user_id": patient_user["id"],
        "patient_name": patient_user.get("username") or patient_user.get("email"),
        "created_at": patient_user.get("created_at") or _now(),
    }


def _legacy_invitation_relationship(
    admin,
    invitation: dict[str, Any],
    patient_user: dict[str, Any] | None = None,
    caregiver_user: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if patient_user is None:
        patient_user = fetch_one_or_none(
            admin.table("Users").select("*").eq("id", invitation["patient_user_id"])
        )
        if not patient_user:
            raise HTTPException(status_code=404, detail="Patient account not found")

    if caregiver_user is None:
        caregiver_user = fetch_one_or_none(
            admin.table("Users").select("*").eq("id", invitation["caregiver_user_id"])
        )
        if not caregiver_user:
            raise HTTPException(status_code=404, detail="Caregiver account not found")

    return _legacy_relationship(
        _patient_record_from_user(admin, patient_user),
        patient_user,
        caregiver_user,
        invitation.get("relationship_label"),
        invitation.get("status") or RelationshipStatus.PENDING.value,
        invitation.get("id"),
    )


def _list_legacy_relationships(admin, current_user: AuthUser) -> list[dict[str, Any]]:
    legacy_user_id = _legacy_user_id(current_user)
    if current_user.role == Role.PATIENT:
        invitation_query = (
            admin.table(LEGACY_INVITATIONS_TABLE)
            .select("*")
            .eq("patient_user_id", legacy_user_id)
            .in_("status", ["pending", "declined"])
            .order("created_at", desc=True)
        )
        invitations = [
            _legacy_invitation_relationship(
                admin,
                invitation,
                current_user.profile | {"id": legacy_user_id, "username": current_user.profile.get("name")},
            )
            for invitation in _list_optional_legacy_invitations(invitation_query)
        ]

        patient_response = (
            admin.table("Patients")
            .select("*")
            .eq("user_id", legacy_user_id)
            .limit(1)
            .execute()
        )
        if not patient_response.data or not patient_response.data[0].get("caregiver_id"):
            return invitations
        patient_record = patient_response.data[0]
        caregiver_user = fetch_one_or_none(
            admin.table("Users").select("*").eq("id", patient_record["caregiver_id"])
        )
        if not caregiver_user:
            return invitations
        return invitations + [
            _legacy_relationship(
                patient_record,
                current_user.profile | {"id": legacy_user_id, "username": current_user.profile.get("name")},
                caregiver_user,
            )
        ]

    if current_user.role == Role.CAREGIVER:
        invitation_query = (
            admin.table(LEGACY_INVITATIONS_TABLE)
            .select("*")
            .eq("caregiver_user_id", legacy_user_id)
            .eq("status", "pending")
            .order("created_at", desc=True)
        )
        relationships = [
            _legacy_invitation_relationship(
                admin,
                invitation,
                caregiver_user=current_user.profile | {"id": legacy_user_id, "username": current_user.profile.get("name")},
            )
            for invitation in _list_optional_legacy_invitations(invitation_query)
        ]

        patient_response = (
            admin.table("Patients")
            .select("*")
            .eq("caregiver_id", legacy_user_id)
            .execute()
        )
        for patient_record in patient_response.data or []:
            patient_user = fetch_one_or_none(
                admin.table("Users").select("*").eq("id", patient_record["user_id"])
            )
            if patient_user:
                relationships.append(
                    _legacy_relationship(
                        patient_record,
                        patient_user,
                        current_user.profile | {"id": legacy_user_id, "username": current_user.profile.get("name")},
                    )
                )
        return relationships

    return []


def find_caregiver_profile_id(admin, email: str) -> str:
    normalized_email = email.strip().lower()
    profile = fetch_one_or_none(
        admin.table("profiles").select("id,email,role").ilike("email", normalized_email)
    )
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="ไม่พบบัญชีผู้ดูแลจากอีเมลนี้ กรุณาให้ผู้ดูแลสมัครบัญชีบทบาทผู้ดูแลก่อน",
        )

    if profile.get("role") != Role.CAREGIVER.value:
        raise HTTPException(
            status_code=409,
            detail="พบอีเมลนี้แล้ว แต่บัญชีนี้ยังไม่ใช่บทบาทผู้ดูแล กรุณาใช้อีเมลของบัญชีผู้ดูแล",
        )

    return profile["id"]


def get_or_404(admin, relationship_id: str) -> dict:
    relationship = fetch_one_or_none(
        admin.table("caregiver_relationships")
        .select(RELATIONSHIP_SELECT)
        .eq("id", relationship_id)
    )
    if not relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")
    return relationship


@router.get("", response_model=list[RelationshipRead])
def list_relationships(admin: AdminClient, current_user: CurrentUser):
    if current_user.profile.get("database_table") == "Users":
        return _list_legacy_relationships(admin, current_user)

    query = admin.table("caregiver_relationships").select(RELATIONSHIP_SELECT)
    if current_user.role == Role.PATIENT:
        query = query.eq("patient_id", current_user.id)
    elif current_user.role == Role.CAREGIVER:
        query = query.eq("caregiver_id", current_user.id)
    return query.order("created_at", desc=True).execute().data or []


@router.post("/invite", response_model=RelationshipRead, status_code=status.HTTP_201_CREATED)
def invite_caregiver(
    payload: RelationshipInvite,
    admin: AdminClient,
    patient: AuthUser = Depends(require_role(Role.PATIENT)),
):
    if patient.profile.get("database_table") == "Users":
        legacy_patient_user_id = _legacy_user_id(patient)
        caregiver = _find_legacy_caregiver(admin, str(payload.caregiver_email))
        invitations_supported = True
        try:
            existing_invitation = (
                admin.table("legacy_caregiver_invitations")
                .select("id")
                .eq("patient_user_id", legacy_patient_user_id)
                .eq("caregiver_user_id", caregiver["id"])
                .in_("status", ["pending", "approved"])
                .execute()
            )
        except Exception as exc:
            if not _is_missing_legacy_invitations_table(exc):
                raise
            invitations_supported = False
            existing_invitation = None
        if existing_invitation and existing_invitation.data:
            raise HTTPException(status_code=409, detail="มีคำเชิญหรือการผูกผู้ดูแลนี้อยู่แล้ว")

        patient_response = (
            admin.table("Patients")
            .select("*")
            .eq("user_id", legacy_patient_user_id)
            .limit(1)
            .execute()
        )
        if patient_response.data and patient_response.data[0].get("caregiver_id") == caregiver["id"]:
            raise HTTPException(status_code=409, detail="มีการผูกผู้ดูแลนี้อยู่แล้ว")
        if patient_response.data and patient_response.data[0].get("caregiver_id"):
            raise HTTPException(
                status_code=409,
                detail="บัญชีนี้มีผู้ดูแลผูกไว้อยู่แล้ว กรุณายกเลิกผู้ดูแลเดิมก่อน",
            )

        if not invitations_supported:
            if not patient_response.data:
                raise HTTPException(status_code=404, detail="ไม่พบข้อมูลผู้ป่วยสำหรับบัญชีนี้")
            updated = (
                admin.table("Patients")
                .update({"caregiver_id": caregiver["id"]})
                .eq("id", patient_response.data[0]["id"])
                .execute()
            )
            if not updated.data:
                raise HTTPException(status_code=502, detail="ไม่สามารถผูกผู้ดูแลได้")
            return _legacy_relationship(
                updated.data[0],
                patient.profile | {"id": legacy_patient_user_id, "username": patient.profile.get("name")},
                caregiver,
                relationship_label=payload.relationship_label,
                status_value=RelationshipStatus.APPROVED.value,
            )

        created = (
            admin.table("legacy_caregiver_invitations")
            .insert(
                {
                    "patient_user_id": legacy_patient_user_id,
                    "caregiver_user_id": caregiver["id"],
                    "relationship_label": payload.relationship_label,
                    "status": RelationshipStatus.PENDING.value,
                    "can_edit_medication": payload.can_edit_medication,
                    "can_edit_appointment": payload.can_edit_appointment,
                    "can_view_history": payload.can_view_history,
                }
            )
            .execute()
        )
        if not created.data:
            raise HTTPException(status_code=502, detail="ไม่สามารถส่งคำเชิญได้")

        return _legacy_invitation_relationship(
            admin,
            created.data[0],
            patient.profile | {"id": legacy_patient_user_id, "username": patient.profile.get("name")},
            caregiver,
        )

    caregiver_id = find_caregiver_profile_id(admin, str(payload.caregiver_email))
    existing = (
        admin.table("caregiver_relationships")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("caregiver_id", caregiver_id)
        .in_("status", ["pending", "approved"])
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="มีคำเชิญหรือการผูกผู้ดูแลนี้อยู่แล้ว")
    data = payload.model_dump(exclude={"caregiver_email"}, mode="json") | {
        "patient_id": patient.id,
        "caregiver_id": caregiver_id,
    }
    created = admin.table("caregiver_relationships").insert(data).execute().data[0]
    return get_or_404(admin, created["id"])


@router.post("/{relationship_id}/respond", response_model=RelationshipRead)
def respond_to_invitation(
    relationship_id: str,
    payload: RelationshipAction,
    admin: AdminClient,
    caregiver: AuthUser = Depends(require_role(Role.CAREGIVER)),
):
    if relationship_id.startswith("legacy-invite-"):
        invitation_id = relationship_id.removeprefix("legacy-invite-")
        invitation = fetch_one_or_none(
            admin.table("legacy_caregiver_invitations").select("*").eq("id", invitation_id)
        )
        if not invitation:
            raise HTTPException(status_code=404, detail="Relationship not found")
        if int(invitation["caregiver_user_id"]) != _legacy_user_id(caregiver):
            raise HTTPException(status_code=403, detail="Invitation does not belong to you")
        if invitation["status"] != RelationshipStatus.PENDING.value:
            raise HTTPException(status_code=409, detail="Invitation has already been answered")

        if payload.action == "accept":
            patient_response = (
                admin.table("Patients")
                .select("*")
                .eq("user_id", invitation["patient_user_id"])
                .limit(1)
                .execute()
            )
            if patient_response.data:
                patient_record = patient_response.data[0]
                existing_caregiver = patient_record.get("caregiver_id")
                if existing_caregiver and int(existing_caregiver) != int(invitation["caregiver_user_id"]):
                    raise HTTPException(status_code=409, detail="ผู้ป่วยมีผู้ดูแลคนอื่นผูกไว้อยู่แล้ว")
                admin.table("Patients").update({"caregiver_id": invitation["caregiver_user_id"]}).eq("id", patient_record["id"]).execute()
            else:
                patient_user = fetch_one_or_none(
                    admin.table("Users").select("*").eq("id", invitation["patient_user_id"])
                )
                if not patient_user:
                    raise HTTPException(status_code=404, detail="Patient account not found")
                admin.table("Patients").insert(
                    {
                        "patient_name": patient_user.get("username") or patient_user.get("email"),
                        "user_id": invitation["patient_user_id"],
                        "caregiver_id": invitation["caregiver_user_id"],
                    }
                ).execute()

        new_status = RelationshipStatus.APPROVED.value if payload.action == "accept" else RelationshipStatus.DECLINED.value
        updated_response = (
            admin.table("legacy_caregiver_invitations")
            .update({"status": new_status, "updated_at": _now()})
            .eq("id", invitation_id)
            .execute()
        )
        updated_invitation = updated_response.data[0] if updated_response.data else invitation | {"status": new_status}

        return _legacy_invitation_relationship(
            admin,
            updated_invitation,
            caregiver_user=caregiver.profile | {"id": _legacy_user_id(caregiver), "username": caregiver.profile.get("name")},
        )

    item = get_or_404(admin, relationship_id)
    if item["caregiver_id"] != caregiver.id:
        raise HTTPException(status_code=403, detail="Invitation does not belong to you")
    if item["status"] != RelationshipStatus.PENDING.value:
        raise HTTPException(status_code=409, detail="Invitation has already been answered")
    new_status = "approved" if payload.action == "accept" else "declined"
    admin.table("caregiver_relationships").update({"status": new_status}).eq(
        "id", relationship_id
    ).execute()
    return get_or_404(admin, relationship_id)


@router.patch("/{relationship_id}/permissions", response_model=RelationshipRead)
def update_permissions(
    relationship_id: str,
    payload: RelationshipPermissionUpdate,
    admin: AdminClient,
    patient: AuthUser = Depends(require_role(Role.PATIENT)),
):
    item = get_or_404(admin, relationship_id)
    if item["patient_id"] != patient.id:
        raise HTTPException(status_code=403, detail="Relationship does not belong to you")
    admin.table("caregiver_relationships").update(
        payload.model_dump(exclude_unset=True, mode="json")
    ).eq("id", relationship_id).execute()
    return get_or_404(admin, relationship_id)


@router.delete("/{relationship_id}", response_model=Message)
def revoke_relationship(relationship_id: str, admin: AdminClient, current_user: CurrentUser):
    if relationship_id.startswith("legacy-invite-"):
        invitation_id = relationship_id.removeprefix("legacy-invite-")
        invitation = fetch_one_or_none(
            admin.table("legacy_caregiver_invitations").select("*").eq("id", invitation_id)
        )
        if not invitation:
            raise HTTPException(status_code=404, detail="Relationship not found")
        legacy_user_id = _legacy_user_id(current_user)
        if current_user.role == Role.PATIENT and int(invitation["patient_user_id"]) != legacy_user_id:
            raise HTTPException(status_code=403, detail="Relationship does not belong to you")
        if current_user.role == Role.CAREGIVER and int(invitation["caregiver_user_id"]) != legacy_user_id:
            raise HTTPException(status_code=403, detail="Relationship does not belong to you")
        admin.table("legacy_caregiver_invitations").update({"status": "revoked", "updated_at": _now()}).eq("id", invitation_id).execute()
        return Message(message="Care relationship revoked")

    if relationship_id.startswith("legacy-"):
        parts = relationship_id.split("-")
        if len(parts) != 3:
            raise HTTPException(status_code=404, detail="Relationship not found")
        patient_record_id, caregiver_id = parts[1], parts[2]
        query = admin.table("Patients").update({"caregiver_id": None}).eq("id", patient_record_id)
        if current_user.role == Role.PATIENT:
            query = query.eq("user_id", _legacy_user_id(current_user))
        elif current_user.role == Role.CAREGIVER:
            query = query.eq("caregiver_id", _legacy_user_id(current_user))
        elif current_user.role != Role.ADMIN:
            raise HTTPException(status_code=403, detail="Relationship does not belong to you")
        response = query.eq("caregiver_id", caregiver_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Relationship not found")
        return Message(message="Care relationship revoked")

    item = get_or_404(admin, relationship_id)
    if current_user.id not in (item["patient_id"], item["caregiver_id"]) and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Relationship does not belong to you")
    admin.table("caregiver_relationships").update({"status": "revoked"}).eq(
        "id", relationship_id
    ).execute()
    return Message(message="Care relationship revoked")
