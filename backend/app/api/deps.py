from dataclasses import dataclass
from typing import Annotated, Literal

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.database.supabase import create_admin_client, create_public_client, fetch_one_or_none
from app.models import Role
from app.services.profiles import get_profile


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str
    profile: dict
    access_token: str = ""

    @property
    def role(self) -> Role:
        return Role(self.profile["role"])


AdminClient = Annotated[Client, Depends(create_admin_client)]
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    admin: AdminClient,
) -> AuthUser:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired Supabase access token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        auth_user = create_public_client().auth.get_user(credentials.credentials).user
    except Exception:
        raise unauthorized from None
    if auth_user is None or auth_user.email is None:
        raise unauthorized
    profile = get_profile(admin, auth_user)
    if not profile or not profile.get("is_active", True):
        raise unauthorized
    return AuthUser(
        id=str(auth_user.id),
        email=auth_user.email,
        profile=profile,
        access_token=credentials.credentials,
    )


CurrentUser = Annotated[AuthUser, Depends(get_current_user)]


def require_role(*roles: Role):
    def dependency(current_user: CurrentUser) -> AuthUser:
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return current_user

    return dependency


def require_patient_access(
    admin: Client,
    current_user: AuthUser,
    patient_id: str,
    permission: Literal["view", "medication", "appointment", "history"] = "view",
) -> None:
    if current_user.role == Role.ADMIN:
        return
    if current_user.role == Role.PATIENT and current_user.id == patient_id:
        return
    if current_user.role != Role.CAREGIVER:
        raise HTTPException(status_code=403, detail="Patient access denied")

    relationship = fetch_one_or_none(
        admin.table("caregiver_relationships")
        .select("can_edit_medication,can_edit_appointment,can_view_history")
        .eq("patient_id", patient_id)
        .eq("caregiver_id", current_user.id)
        .eq("status", "approved")
    )
    if not relationship:
        raise HTTPException(status_code=403, detail="Patient access denied")
    allowed = {
        "view": True,
        "medication": relationship["can_edit_medication"],
        "appointment": relationship["can_edit_appointment"],
        "history": relationship["can_view_history"],
    }[permission]
    if not allowed:
        raise HTTPException(status_code=403, detail=f"Missing {permission} permission")
