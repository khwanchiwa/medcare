from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import LogStatus


class MedicationBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    dosage: str = Field(min_length=1, max_length=100)
    quantity: str = Field(default="1 เม็ด", min_length=1, max_length=100)
    frequency: str = Field(min_length=1, max_length=100)
    reminder_times: list[str] = Field(default_factory=list)
    instructions: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool = True


class MedicationCreate(MedicationBase):
    patient_id: str | None = None


class MedicationUpdate(BaseModel):
    name: str | None = None
    dosage: str | None = None
    quantity: str | None = None
    frequency: str | None = None
    reminder_times: list[str] | None = None
    instructions: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class MedicationRead(MedicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime


class MedicationCheckIn(BaseModel):
    scheduled_at: datetime
    taken_at: datetime | None = None
    status: LogStatus = LogStatus.TAKEN
    note: str | None = None


class MedicationLogRead(MedicationCheckIn):
    model_config = ConfigDict(from_attributes=True)

    id: str
    medication_id: str
    patient_id: str
    created_at: datetime
