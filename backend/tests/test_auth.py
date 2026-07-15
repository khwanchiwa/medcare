def test_admin_cannot_self_register(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "password": "safe-password",
            "name": "Admin",
            "role": "ADMIN",
        },
    )

    assert response.status_code == 403


def test_register_requires_valid_role(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "password": "safe-password",
            "name": "User",
            "role": "UNKNOWN",
        },
    )

    assert response.status_code == 422
