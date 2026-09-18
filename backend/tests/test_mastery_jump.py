"""Test suite for live mastery jumps and barrier unlocking re-evaluations."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.learner_service import learner_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
    """Reset learner profiles before each test."""
    learner_service.reset_profiles()


def test_simulate_mastery_jump_unlocks_recursion_barrier():
    """Verify 1-click jump elevates Stack to 75% and unlocks Recursion Lab."""
    # Ensure starting in Learner B baseline
    learner_service.switch_learner("learner_b")
    initial_world = client.get("/api/world/state").json()
    assert initial_world["wings"]["recursion_lab"]["status"] == "sealed"

    # Trigger live 1-click mastery jump
    jump_res = client.post("/api/learner/simulate-jump", json={"target_stack": 0.75})
    assert jump_res.status_code == 200

    profile = jump_res.json()
    assert profile["mastery_map"]["stack"] == 0.75
    assert profile["learning_state"]["status"] == "advanced"
    assert profile["learning_state"]["active_prerequisite_gap"] is None
    assert profile["recommended_station"] == "recursion_lab"
    assert "dissolved" in profile["learning_state"]["summary"].lower()

    # Verify world state dynamically unlocks Recursion wing
    updated_world = client.get("/api/world/state").json()
    assert updated_world["wings"]["recursion_lab"]["status"] == "accessible"
    assert updated_world["wings"]["recursion_lab"]["reason"] is None


def test_update_concept_mastery_boundary():
    """Verify update_mastery respects threshold boundary at 0.70."""
    learner_service.switch_learner("learner_b")

    # 69% is below threshold -> still sealed
    res1 = client.post(
        "/api/learner/mastery/update",
        json={"concept": "stack", "mastery": 0.69},
    )
    assert res1.status_code == 200
    assert res1.json()["learning_state"]["status"] == "remediation_required"

    # 70% meets threshold -> unlocks
    res2 = client.post(
        "/api/learner/mastery/update",
        json={"concept": "stack", "mastery": 0.70},
    )
    assert res2.status_code == 200
    assert res2.json()["learning_state"]["status"] == "advanced"
