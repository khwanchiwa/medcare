from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import Role


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    name: str
    role: Role
    phone: str | None = None
    caregiver_name: str | None = None
    date_of_birth: date | None = None
    medical_conditions: str | None = None
    timezone: str = "Asia/Bangkok"
    is_active: bool = True
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    phone: str | None = None
    date_of_birth: date | None = None
    medical_conditions: str | None = None
    timezone: str | None = None
