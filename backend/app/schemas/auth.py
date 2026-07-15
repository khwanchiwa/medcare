from pydantic import BaseModel, EmailStr, Field

from app.models.enums import Role
from app.schemas.users import UserRead


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    name: str = Field(min_length=1, max_length=150)
    role: Role
    phone: str | None = None
    timezone: str = "Asia/Bangkok"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: UserRead
    email_confirmation_required: bool = False
