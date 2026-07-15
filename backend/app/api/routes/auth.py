from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser
from app.core.config import settings
from app.database.supabase import create_admin_client, create_public_client
from app.models import Role
from app.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, RegisterRequest, TokenPair
from app.schemas.common import Message
from app.schemas.users import UserRead
from app.services.profiles import create_profile, get_profile

router = APIRouter()


def build_auth_response(auth_response, fallback: RegisterRequest | None = None) -> TokenPair:
    auth_user = auth_response.user
    if auth_user is None:
        raise HTTPException(status_code=502, detail="Supabase Auth did not return a user")
    profile = get_profile(create_admin_client(), auth_user)
    if profile is None:
        metadata = auth_user.user_metadata or {}
        profile = {
            "id": str(auth_user.id),
            "email": auth_user.email or (str(fallback.email) if fallback else ""),
            "name": metadata.get("name") or (fallback.name if fallback else ""),
            "role": metadata.get("role") or (fallback.role if fallback else Role.PATIENT),
            "timezone": metadata.get("timezone", "Asia/Bangkok"),
            "created_at": auth_user.created_at or datetime.now(timezone.utc),
        }
    session = auth_response.session
    return TokenPair(
        access_token=session.access_token if session else None,
        refresh_token=session.refresh_token if session else None,
        user=UserRead.model_validate(profile),
        email_confirmation_required=session is None,
    )


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> TokenPair:
    if payload.role == Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin accounts cannot self-register")
    try:
        metadata = {
            "name": payload.name,
            "role": payload.role.value,
            "phone": payload.phone,
            "timezone": payload.timezone,
        }
        if settings.supabase_auto_confirm_email:
            admin = create_admin_client()
            created = admin.auth.admin.create_user(
                {
                    "email": str(payload.email).lower(),
                    "password": payload.password,
                    "email_confirm": True,
                    "user_metadata": metadata,
                }
            )
            if created.user is None:
                raise HTTPException(status_code=502, detail="Supabase Auth did not return a user")
            create_profile(admin, created.user, payload.name, payload.role)
            signed_in = create_public_client().auth.sign_in_with_password(
                {"email": str(payload.email).lower(), "password": payload.password}
            )
            return build_auth_response(signed_in, payload)

        response = create_public_client().auth.sign_up(
            {
                "email": str(payload.email).lower(),
                "password": payload.password,
                "options": {"data": metadata},
            }
        )
        if response.user is None:
            raise HTTPException(status_code=502, detail="Supabase Auth did not return a user")
        create_profile(create_admin_client(), response.user, payload.name, payload.role)
        return build_auth_response(response, payload)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest) -> TokenPair:
    try:
        response = create_public_client().auth.sign_in_with_password(
            {"email": str(payload.email).lower(), "password": payload.password}
        )
        return build_auth_response(response)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Incorrect email or password") from None


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest) -> TokenPair:
    try:
        response = create_public_client().auth.refresh_session(payload.refresh_token)
        return build_auth_response(response)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from None


@router.post("/logout", response_model=Message)
def logout(payload: LogoutRequest, current_user: CurrentUser) -> Message:
    try:
        client = create_public_client()
        client.auth.set_session(current_user.access_token, payload.refresh_token)
        client.auth.sign_out({"scope": "local"})
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to revoke Supabase session") from None
    return Message(message="Logged out")
