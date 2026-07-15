import pytest
from fastapi import HTTPException

from app.api.deps import AuthUser, require_patient_access


class Response:
    def __init__(self, data):
        self.data = data


class Query:
    def __init__(self, data):
        self.data = data

    def select(self, *_):
        return self

    def eq(self, *_):
        return self

    def maybe_single(self):
        return self

    def execute(self):
        # Match supabase-py: maybe_single().execute() returns None when no row is found.
        return None if self.data is None else Response(self.data)


class Admin:
    def __init__(self, relationship):
        self.relationship = relationship

    def table(self, _):
        return Query(self.relationship)


def user(user_id: str, role: str) -> AuthUser:
    return AuthUser(id=user_id, email="user@example.com", profile={"role": role})


def test_patient_can_access_own_data_without_relationship():
    require_patient_access(Admin(None), user("patient-1", "PATIENT"), "patient-1", "medication")


def test_unrelated_caregiver_is_denied():
    with pytest.raises(HTTPException) as error:
        require_patient_access(Admin(None), user("caregiver-1", "CAREGIVER"), "patient-1")
    assert error.value.status_code == 403


def test_caregiver_permission_is_checked_per_domain():
    relationship = {
        "can_edit_medication": True,
        "can_edit_appointment": False,
        "can_view_history": True,
    }
    caregiver = user("caregiver-1", "CAREGIVER")

    require_patient_access(Admin(relationship), caregiver, "patient-1", "medication")
    with pytest.raises(HTTPException):
        require_patient_access(Admin(relationship), caregiver, "patient-1", "appointment")
