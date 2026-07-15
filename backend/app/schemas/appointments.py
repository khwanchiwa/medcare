from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AppointmentStatus


class AppointmentBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    hospital: str | None = Field(default=None, max_length=200)
    appointment_date: date
    appointment_time: time
    notes: str | None = None
    status: AppointmentStatus = AppointmentStatus.UPCOMING


class AppointmentCreate(AppointmentBase):
    patient_id: str | None = None


class AppointmentUpdate(BaseModel):
    title: str | None = None
    hospital: str | None = None
    appointment_date: date | None = None
    appointment_time: time | None = None
    notes: str | None = None
    status: AppointmentStatus | None = None


class AppointmentRead(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    google_event_id: str | None
    created_at: datetime
    updated_at: datetime
