import os

os.environ["ENVIRONMENT"] = "test"
# Keep tests hermetic: env vars beat any local backend/.env values.
os.environ["FRONTEND_ORIGIN_REGEX"] = r"^https://medcare(?:-[a-z0-9-]+)?\.vercel\.app$"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
