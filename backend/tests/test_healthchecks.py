"""Tests for production health check endpoints conforming to Render specification."""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify root status check."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_core_health_endpoint():
    """Verify /health endpoint responds 200 OK for platform-level load balancers."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Adaptive Virtual Classroom Core Architecture"


def test_feynman_health_endpoint():
    """Verify /api/feynman/health endpoint conforms to Render web service healthCheckPath."""
    response = client.get("/api/feynman/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "feynman"
    assert "timestamp" in data
