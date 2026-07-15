from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from supabase import Client

from app.models import Role

AUTH_PASSWORD_MARKER = "MANAGED_BY_SUPABASE_AUTH"


def _profile_from_users(record: dict[str, Any], auth_user: Any) -> dict[str, Any]:
    metadata = auth_user.user_metadata or {}
    role_value = str(record.get("role") or metadata.get("role") or Role.PATIENT.value).upper()
    if role_value not in {role.value for role in Role}:
        role_value = Role.PATIENT.value
    return {
        "id": str(auth_user.id),
        "email": auth_user.email or record.get("email", ""),
        "name": record.get("username") or metadata.get("name") or "MedCare User",
        "role": role_value,
        "phone": None,
        "caregiver_name": None,
        "date_of_birth": None,
        "medical_conditions": None,
        "timezone": metadata.get("timezone", "Asia/Bangkok"),
        "is_active": True,
        "created_at": record.get("created_at") or auth_user.created_at or datetime.now(timezone.utc),
        "database_id": record.get("id"),
        "database_table": "Users",
    }


def _with_legacy_caregiver(admin: Client, profile: dict[str, Any]) -> dict[str, Any]:
    """Attach the caregiver name from the existing Patients -> Users relationship."""
    if profile.get("role") != Role.PATIENT.value or not profile.get("database_id"):
        return profile
    try:
        patients = (
            admin.table("Patients")
            .select("caregiver_id")
            .eq("user_id", profile["database_id"])
            .limit(1)
            .execute()
        )
        caregiver_id = patients.data[0].get("caregiver_id") if patients.data else None
        if not caregiver_id:
            return profile
        caregiver = (
            admin.table("Users")
            .select("username,email")
            .eq("id", caregiver_id)
            .maybe_single()
            .execute()
        )
        if caregiver and caregiver.data:
            profile["caregiver_name"] = (
                caregiver.data.get("username") or caregiver.data.get("email")
            )
    except Exception:
        # A missing patient record means this account has no linked caregiver yet.
        pass
    return profile


def get_profile(admin: Client, auth_user: Any) -> dict[str, Any] | None:
    """Load either the normalized schema or the existing MedCare Users schema."""
    try:
        response = (
            admin.table("profiles")
            .select("*")
            .eq("id", str(auth_user.id))
            .maybe_single()
            .execute()
        )
        if response and response.data:
            return response.data | {"database_table": "profiles"}
    except Exception:
        pass

    if not auth_user.email:
        return None
    try:
        response = (
            admin.table("Users")
            .select("*")
            .eq("auth_user_id", str(auth_user.id))
            .maybe_single()
            .execute()
        )
        if response and response.data:
            return _with_legacy_caregiver(
                admin, _profile_from_users(response.data, auth_user)
            )
    except Exception:
        # Compatibility with the original schema before auth_user_id is added.
        pass
    response = (
        admin.table("Users")
        .select("*")
        .eq("email", auth_user.email.lower())
        .maybe_single()
        .execute()
    )
    return (
        _with_legacy_caregiver(admin, _profile_from_users(response.data, auth_user))
        if response and response.data
        else None
    )


def create_profile(admin: Client, auth_user: Any, name: str, role: Role) -> dict[str, Any]:
    if not auth_user.email:
        raise HTTPException(status_code=502, detail="Supabase Auth did not return an email")
    existing = get_profile(admin, auth_user)
    if existing:
        return existing

    # The existing Users.password column is required. Store only a marker; the real
    # password is owned and hashed by Supabase Auth and is never copied here.
    payload = {
        "auth_user_id": str(auth_user.id),
        "email": auth_user.email.lower(),
        "username": name,
        "role": role.value,
    }
    try:
        response = admin.table("Users").insert(payload).execute()
    except Exception:
        # Original schema compatibility: password is required and auth_user_id
        # does not exist yet. This marker is not a password or credential.
        payload.pop("auth_user_id")
        payload["password"] = AUTH_PASSWORD_MARKER
        response = admin.table("Users").insert(payload).execute()
    if not response.data:
        raise HTTPException(status_code=502, detail="Unable to create user profile")
    return _profile_from_users(response.data[0], auth_user)


def update_profile(admin: Client, auth_user: Any, payload: dict[str, Any]) -> dict[str, Any]:
    current = get_profile(admin, auth_user)
    if not current:
        raise HTTPException(status_code=404, detail="User profile not found")
    if current.get("database_table") == "profiles":
        response = admin.table("profiles").update(payload).eq("id", str(auth_user.id)).execute()
        return response.data[0] | {"database_table": "profiles"}

    supported: dict[str, Any] = {}
    if "name" in payload:
        supported["username"] = payload["name"]
    if supported:
        admin.table("Users").update(supported).eq("id", current["database_id"]).execute()
    return get_profile(admin, auth_user) or current
