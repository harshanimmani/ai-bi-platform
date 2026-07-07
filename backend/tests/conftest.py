import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    """
    Fixture providing a TestClient for FastAPI application testing.
    """
    with TestClient(app) as test_client:
        yield test_client
