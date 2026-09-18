"""Automated tests for Missions and Stack Challenges API endpoints."""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_stack_mission():
    """Verify GET /api/missions/stack returns curated stack mission and challenges."""
    response = client.get("/api/missions/stack")
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == "stack_diagnostic_mission"
    assert data["concept"] == "stack"
    assert "Stack Lab Diagnostic Mission" in data["title"]
    assert len(data["challenges"]) == 4

    # Verify first challenge is LIFO order
    c1 = data["challenges"][0]
    assert c1["id"] == "stack_lifo_order"
    assert c1["difficulty"] == "easy"
    assert c1["correct_option_id"] == "opt_lifo_correct"
    assert len(c1["options"]) == 4

    # Verify second challenge is interleaved trace
    c2 = data["challenges"][1]
    assert c2["id"] == "stack_push_pop_trace"
    assert c2["difficulty"] == "medium"
    assert c2["correct_option_id"] == "opt_trace_correct"


def test_get_mission_by_id():
    """Verify GET /api/missions/{mission_id} retrieves mission or returns 404."""
    res = client.get("/api/missions/stack_diagnostic_mission")
    assert res.status_code == 200
    assert res.json()["id"] == "stack_diagnostic_mission"

    res_404 = client.get("/api/missions/unknown_mission_xyz")
    assert res_404.status_code == 404
