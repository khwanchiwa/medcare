import pytest
from fastapi import HTTPException

from app.database.supabase import fetch_one_or_none
from app.repositories.base import SupabaseRepository


class Response:
    def __init__(self, data):
        self.data = data


class Query:
    """Match supabase-py: maybe_single().execute() returns None when no row is found."""

    def __init__(self, data):
        self.data = data

    def select(self, *_):
        return self

    def eq(self, *_):
        return self

    def maybe_single(self):
        return self

    def execute(self):
        return None if self.data is None else Response(self.data)


class Client:
    def __init__(self, data):
        self.data = data

    def table(self, _):
        return Query(self.data)


def test_get_missing_row_returns_404_not_500():
    repository = SupabaseRepository(Client(None), "medications")
    with pytest.raises(HTTPException) as error:
        repository.get("missing-id")
    assert error.value.status_code == 404


def test_get_existing_row_returns_data():
    repository = SupabaseRepository(Client({"id": "med-1"}), "medications")
    assert repository.get("med-1") == {"id": "med-1"}


def test_fetch_one_or_none_handles_missing_row():
    assert fetch_one_or_none(Query(None)) is None
    assert fetch_one_or_none(Query({"id": "row-1"})) == {"id": "row-1"}
