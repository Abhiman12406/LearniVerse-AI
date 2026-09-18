"""Automated tests for Learner Profile and World State endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.learner_service import learner_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
    """Reset learner service profiles before each test."""
    learner_service.reset_profiles()


def test_root_health_check():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Adaptive Virtual Classroom" in data["system"]


def test_get_current_learner_profile_default():
    """Verify default learner profile loads as Learner B with valid fields."""
    response = client.get("/api/learner/profile")
    assert response.status_code == 200
    data = response.json()

    assert data["learner_id"] == "learner_b"
    assert "Alex Mercer" in data["name"]
    assert data["learning_state"]["status"] == "remediation_required"
    assert data["learning_state"]["primary_focus_concept"] == "stack"
    assert data["recommended_station"] == "stack_lab"

    # Verify BKT mastery values
    mastery = data["mastery_map"]
    assert mastery["stack"] == 0.38
    assert mastery["recursion"] == 0.20
    assert mastery["array"] == 0.90


def test_get_profile_by_id():
    """Verify fetching specific profiles by ID."""
    res_a = client.get("/api/learner/learner_a")
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["learner_id"] == "learner_a"
    assert "Elena Vance" in data_a["name"]
    assert data_a["learning_state"]["status"] == "advanced"

    res_404 = client.get("/api/learner/non_existent_learner")
    assert res_404.status_code == 404


def test_switch_learner_profile():
    """Verify switching active profile dynamically updates the active state."""
    # Switch to Learner A
    switch_res = client.post("/api/learner/switch", json={"learner_id": "learner_a"})
    assert switch_res.status_code == 200
    assert switch_res.json()["learner_id"] == "learner_a"

    # Subsequent call to /profile should return Learner A
    profile_res = client.get("/api/learner/profile")
    assert profile_res.status_code == 200
    data = profile_res.json()
    assert data["learner_id"] == "learner_a"
    assert data["mastery_map"]["stack"] == 0.84


def test_world_state_prerequisite_constraints():
    """Verify world state marks Wings accessible or sealed based on prerequisite mastery."""
    # With default Learner B (Stack: 0.38), Recursion Wing must be sealed
    res = client.get("/api/world/state")
    assert res.status_code == 200
    data = res.json()

    assert data["atrium_radius"] == 18.0
    wings = data["wings"]
    assert "recursion_lab" in wings
    assert wings["recursion_lab"]["status"] == "sealed"
    assert "Requires Stack ≥ 70%" in wings["recursion_lab"]["reason"]
    assert data["conduits_target_wing"] == "stack_lab"

    # Switch to Learner A (Stack: 0.84)
    client.post("/api/learner/switch", json={"learner_id": "learner_a"})
    res_a = client.get("/api/world/state")
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["wings"]["recursion_lab"]["status"] == "accessible"
    assert data_a["conduits_target_wing"] == "recursion_lab"
