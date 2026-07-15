from app.api.deps import AuthUser
from app.api.routes.relationships import _list_legacy_relationships


class Response:
    def __init__(self, data):
        self.data = data


class MissingTableError(Exception):
    code = "PGRST205"


class Query:
    def __init__(self, table_name, rows):
        self.table_name = table_name
        self.rows = rows
        self.filters = []
        self.limit_count = None
        self.single = False

    def select(self, *_):
        return self

    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def in_(self, *_):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, count):
        self.limit_count = count
        return self

    def maybe_single(self):
        self.single = True
        return self

    def execute(self):
        if self.table_name == "legacy_caregiver_invitations":
            raise MissingTableError("table is missing from the schema cache")
        result = [
            row for row in self.rows
            if all(row.get(field) == value for field, value in self.filters)
        ]
        if self.single:
            return Response(result[0] if result else None)
        return Response(result[: self.limit_count] if self.limit_count else result)


class Admin:
    def __init__(self):
        self.tables = {
            "Patients": [{"id": 10, "user_id": 1, "caregiver_id": 2}],
            "Users": [
                {"id": 2, "email": "caregiver@example.com", "username": "Caregiver", "role": "CAREGIVER"}
            ],
        }

    def table(self, name):
        return Query(name, self.tables.get(name, []))


def test_legacy_relationship_list_still_works_without_invitations_migration():
    patient = AuthUser(
        id="auth-patient",
        email="patient@example.com",
        profile={
            "id": "auth-patient",
            "database_id": 1,
            "database_table": "Users",
            "email": "patient@example.com",
            "name": "Patient",
            "role": "PATIENT",
        },
    )

    relationships = _list_legacy_relationships(Admin(), patient)

    assert len(relationships) == 1
    assert relationships[0]["caregiver"]["email"] == "caregiver@example.com"
