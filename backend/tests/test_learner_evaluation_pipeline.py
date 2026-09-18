"""Unit & integration test suite for the LearnerEvaluationPipeline deep module.

Conforms to codebase-design principles: "The interface is the test surface."
Exercises the deepened module directly through its public interface and via HTTP endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException

from backend.app.main import app
from backend.app.models.interaction import InteractionRequest, SimulateJumpRequest
from backend.app.services.learner_service import learner_service
from backend.app.services.learner_evaluation_service import learner_evaluation_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_learner_state():
    """Reset learner profiles before each test."""
    learner_service.reset_profiles()


class TestLearnerEvaluationPipeline:
    def test_evaluate_challenge_valid_evidence(self):
        """Valid challenge answer produces positive BKT delta, IRT theta, and synchronous deliberation."""
        req = InteractionRequest(
            student_id="learner_b",
            concept="stack",
            question_id="test_q_01",
            correct=True,
            difficulty="medium",
            response_time_ms=4500,
            fps=60.0,
            network_latency_ms=25.0,
        )

        res = learner_evaluation_service.evaluate_challenge(req)

        assert res.student_id == "learner_b"
        assert res.concept == "stack"
        assert res.evidence_valid is True
        assert res.validity_score == 1.0
        assert res.posterior_mastery > res.prior_mastery
        assert res.delta > 0
        assert res.irt_ability is not None
        assert res.confidence is not None
        assert res.sm2_next_review is not None
        assert res.learner_profile.mastery_map.stack == res.posterior_mastery
        assert res.deliberation is not None
        assert len(res.deliberation.traces) >= 5

    def test_evaluate_challenge_technical_anomaly_filtering(self):
        """Technical timeouts are filtered by Validity Gate: zero BKT penalty, Vi=0.0."""
        req = InteractionRequest(
            student_id="learner_b",
            concept="stack",
            question_id="test_q_timeout",
            correct=False,
            is_timeout=True,
            response_time_ms=30000,
        )

        res = learner_evaluation_service.evaluate_challenge(req)

        assert res.evidence_valid is False
        assert res.validity_score == 0.0
        # Under Rule A, posterior equals prior (no false-failure penalty)
        assert res.posterior_mastery == res.prior_mastery
        assert res.delta == 0.0

    def test_dynamic_barrier_dissolve_stack_to_recursion(self):
        """Elevating Stack across the 70% threshold dynamically dissolves Recursion Barrier."""
        # Set Stack mastery just below threshold at 68%
        learner_service.update_concept_mastery("learner_b", "stack", 0.68)
        world_before = learner_service.get_world_state("learner_b")
        assert world_before.wings["recursion_lab"].status == "sealed"

        # Correct answer elevates Stack above 70%
        req = InteractionRequest(
            student_id="learner_b",
            concept="stack",
            question_id="test_q_stack_dissolve",
            correct=True,
            difficulty="hard",
            response_time_ms=3000,
        )

        res = learner_evaluation_service.evaluate_challenge(req)

        assert res.posterior_mastery >= 0.70
        assert res.threshold_crossed is True
        assert res.unlocked_wing == "recursion_lab"
        assert res.world_delta.wings["recursion_lab"].status == "accessible"

    def test_dynamic_barrier_dissolve_linked_list_to_stack(self):
        """Elevating Linked List across the 50% threshold dynamically dissolves Stack Barrier."""
        # Set Linked List mastery to 40% (Stack requires Linked List >= 50%)
        learner_service.update_concept_mastery("learner_b", "linked_list", 0.40)
        world_before = learner_service.get_world_state("learner_b")
        assert world_before.wings["stack_lab"].status == "sealed"

        # Correct answer elevates Linked List above 50%
        req = InteractionRequest(
            student_id="learner_b",
            concept="linked_list",
            question_id="test_q_ll_dissolve",
            correct=True,
            difficulty="easy",
            response_time_ms=2500,
        )

        res = learner_evaluation_service.evaluate_challenge(req)

        assert res.posterior_mastery >= 0.50
        assert res.threshold_crossed is True
        assert res.unlocked_wing == "stack_lab"
        assert res.world_delta.wings["stack_lab"].status == "accessible"

    def test_simulate_mastery_jump_pipeline(self):
        """Simulate mastery jump shares the exact same dynamic barrier dissolve and deliberation logic."""
        req = SimulateJumpRequest(
            learner_id="learner_b",
            concept="stack",
            target_mastery=0.78,
        )

        res = learner_evaluation_service.simulate_mastery_jump(req)

        assert res.learner_id == "learner_b"
        assert res.posterior_mastery == 0.78
        assert res.threshold_crossed is True
        assert res.unlocked_wing == "recursion_lab"
        assert res.world_state.wings["recursion_lab"].status == "accessible"
        assert res.deliberation is not None

    def test_unknown_concept_raises_400(self):
        """Unknown concept raises HTTP 400 error."""
        req = InteractionRequest(
            student_id="learner_b",
            concept="nonexistent_concept",
            question_id="q_invalid",
            correct=True,
        )

        with pytest.raises(HTTPException) as exc_info:
            learner_evaluation_service.evaluate_challenge(req)

        assert exc_info.value.status_code == 400
        assert "Unknown concept" in exc_info.value.detail


class TestInteractionsRouterAdapter:
    def test_post_interaction_endpoint(self):
        """Verify POST /api/interactions calls the pipeline and returns full contract."""
        payload = {
            "student_id": "learner_b",
            "concept": "stack",
            "question_id": "q_http_test",
            "correct": True,
            "difficulty": "medium",
            "response_time_ms": 3500,
            "evidence_type": "challenge_console",
        }

        resp = client.post("/api/interactions", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["student_id"] == "learner_b"
        assert data["concept"] == "stack"
        assert data["posterior_mastery"] > data["prior_mastery"]
        assert "deliberation" in data
        assert "world_delta" in data

    def test_post_simulate_mastery_jump_endpoint(self):
        """Verify POST /api/simulate-mastery-jump calls the pipeline and returns full contract."""
        payload = {
            "learner_id": "learner_b",
            "concept": "stack",
            "target_mastery": 0.85,
        }

        resp = client.post("/api/simulate-mastery-jump", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["learner_id"] == "learner_b"
        assert data["posterior_mastery"] == 0.85
        assert data["threshold_crossed"] is True
        assert data["unlocked_wing"] == "recursion_lab"
        assert data["world_state"]["wings"]["recursion_lab"]["status"] == "accessible"
