"""Test suite for AI Mentor Beacon and Feynman Guidance API."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.learner_service import learner_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
    """Reset learner profiles before each test."""
    learner_service.reset_profiles()


def test_get_mentor_guidance_for_remedial_learner():
    """Verify Learner B receives remedial Stack guidance and Feynman call-stack analogy."""
    learner_service.switch_learner("learner_b")
    response = client.get("/api/mentor/guidance")
    assert response.status_code == 200

    data = response.json()
    assert data["learner_id"] == "learner_b"
    assert data["status"] == "remediation_required"
    assert data["focus_concept"] == "stack"
    assert data["recommended_station"] == "stack_lab"

    # Verify Feynman Explanation
    feynman = data["feynman_explanation"]
    assert feynman["concept"] == "stack"
    assert feynman["target_prerequisite_of"] == "recursion"
    assert "tray" in feynman["analogy"].lower() or "cafeteria" in feynman["analogy"].lower()
    assert "call stack" in feynman["conceptual_bridge"].lower()
    assert "38%" in feynman["prerequisite_gap"] or "0.38" in feynman["prerequisite_gap"]

    # Verify interactive questions
    questions = data["interactive_questions"]
    assert len(questions) >= 2
    q_ids = [q["id"] for q in questions]
    assert "why_stack_first" in q_ids


def test_get_mentor_guidance_for_advanced_learner():
    """Verify Learner A receives advanced Recursion guidance with all prerequisites met."""
    response = client.get("/api/mentor/guidance?learner_id=learner_a")
    assert response.status_code == 200

    data = response.json()
    assert data["learner_id"] == "learner_a"
    assert data["status"] == "advanced_readiness"
    assert data["focus_concept"] == "recursion"
    assert data["recommended_station"] == "recursion_lab"

    feynman = data["feynman_explanation"]
    assert feynman["concept"] == "recursion"
    assert "matryoshka" in feynman["analogy"].lower() or "nesting" in feynman["analogy"].lower()
    assert feynman["prerequisite_gap"] is None


def test_ask_mentor_question():
    """Verify questioning the mentor yields direct contextual Feynman explanations."""
    learner_service.switch_learner("learner_b")
    payload = {"question_id": "why_stack_first"}
    response = client.post("/api/mentor/ask", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == "why_stack_first"
    assert "notebook" in data["answer"].lower() or "call stack" in data["answer"].lower()


def test_ask_invalid_question_returns_404():
    """Verify querying an invalid question ID returns a 404 HTTP error."""
    learner_service.switch_learner("learner_b")
    payload = {"question_id": "invalid_unknown_question"}
    response = client.post("/api/mentor/ask", json=payload)
    assert response.status_code == 404
