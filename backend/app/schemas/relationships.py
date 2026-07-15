from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import RelationshipStatus
from app.schemas.users import UserRead


class RelationshipInvite(BaseModel):
    caregiver_email: EmailStr
    relationship_label: str | None = None
    can_edit_medication: bool = False
    can_edit_appointment: bool = False
    can_view_history: bool = True


class RelationshipPermissionUpdate(BaseModel):
    can_edit_medication: bool | None = None
    can_edit_appointment: bool | None = None
    can_view_history: bool | None = None


class RelationshipAction(BaseModel):
    action: str = Field(pattern="^(accept|decline)$")


class RelationshipRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    caregiver_id: str
    relationship_label: str | None
    status: RelationshipStatus
    can_edit_medication: bool
    can_edit_appointment: bool
    can_view_history: bool
    created_at: datetime
    patient: UserRead
    caregiver: UserRead
