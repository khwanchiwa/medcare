from fastapi import APIRouter
from fastapi.testclient import TestClient

from app.main import app


def test_unhandled_exception_returns_safe_500_response():
    router = APIRouter()

    @router.get("/_test/unhandled-error")
    def raise_unhandled_error():
        raise RuntimeError("sensitive failure detail")

    app.include_router(router)
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get(
            "/_test/unhandled-error", headers={"Origin": "http://localhost:3000"}
        )

    assert response.status_code == 500
    assert response.json()["detail"] == "Internal server error"
    assert "sensitive failure detail" not in response.text
    assert response.json()["request_id"]
    assert response.headers["x-request-id"]
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
