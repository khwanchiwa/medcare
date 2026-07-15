def test_vercel_frontend_origin_is_allowed(client):
    response = client.options(
        "/health",
        headers={
            "Origin": "https://medcare-example-team.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "https://medcare-example-team.vercel.app"
    )


def test_unrelated_vercel_origin_is_rejected(client):
    response = client.options(
        "/health",
        headers={
            "Origin": "https://unrelated-project.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert "access-control-allow-origin" not in response.headers
