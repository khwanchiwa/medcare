from enum import StrEnum


class Role(StrEnum):
    PATIENT = "PATIENT"
    CAREGIVER = "CAREGIVER"
    ADMIN = "ADMIN"


class RelationshipStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"
    REVOKED = "revoked"


class LogStatus(StrEnum):
    PENDING = "pending"
    TAKEN = "taken"
    MISSED = "missed"


class AppointmentStatus(StrEnum):
    UPCOMING = "upcoming"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class NotificationChannel(StrEnum):
    IN_APP = "in_app"
    LINE = "line"
    GOOGLE_CALENDAR = "google_calendar"
