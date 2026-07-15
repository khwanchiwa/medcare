from fastapi import APIRouter

from app.api.deps import AdminClient, CurrentUser
from app.schemas.users import UserRead, UserUpdate
from app.services.profiles import update_profile

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_me(current_user: CurrentUser) -> dict:
    return current_user.profile


@router.patch("/me", response_model=UserRead)
def update_me(payload: UserUpdate, current_user: CurrentUser, admin: AdminClient) -> dict:
    auth_user = type(
        "VerifiedAuthUser",
        (),
        {
            "id": current_user.id,
            "email": current_user.email,
            "user_metadata": {"role": current_user.role.value},
            "created_at": current_user.profile.get("created_at"),
        },
    )()
    return update_profile(
        admin, auth_user, payload.model_dump(exclude_unset=True, mode="json")
    )
