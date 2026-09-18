"""Automated tests for BKT Bayesian Knowledge Tracing Engine and Interaction Endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.bkt_service import bkt_service
from backend.app.services.learner_service import learner_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_profiles():
    """Ensure clean learner profiles before each test."""
    learner_service.reset_profiles()


class TestBKTEngineMath:
    """Mathematical validation of the BKT Bayesian update and transition formulas."""

    def test_mathematical_bounds(self):
        """Verify mastery probabilities are strictly bounded within [0.01, 0.99]."""
        for prior in [0.0, 0.01, 0.5, 0.99, 1.0]:
            post_corr = bkt_service.compute_posterior(prior=prior, correct=True)
            post_inc = bkt_service.compute_posterior(prior=prior, correct=False)

            assert 0.01 <= post_corr <= 0.99
            assert 0.01 <= post_inc <= 0.99

    def test_monotonic_increase_on_correct_streak(self):
        """Verify consecutive correct responses monotonically increase mastery belief."""
        mastery = 0.38  # Learner B baseline stack mastery
        streak_history = [mastery]

        for _ in range(3):
            mastery = bkt_service.compute_posterior(
                prior=mastery, correct=True, concept="stack", difficulty="medium"
            )
            streak_history.append(mastery)

        # Verify each step strictly increases
        for i in range(len(streak_history) - 1):
            assert streak_history[i + 1] > streak_history[i]

        # Verify 3 consecutive correct answers cross the 0.70 prerequisite threshold
        assert streak_history[-1] >= 0.70

    def test_slip_adjustment_on_incorrect(self):
        """Verify incorrect response attenuates mastery belief appropriately."""
        prior = 0.65
        posterior = bkt_service.compute_posterior(
            prior=prior, correct=False, concept="stack", difficulty="medium"
        )
        assert posterior < prior

    def test_guess_discounting_across_difficulties(self):
        """Verify hard questions yield higher belief updates than easy questions on correct answers."""
        prior = 0.40
        post_easy = bkt_service.compute_posterior(
            prior=prior, correct=True, concept="stack", difficulty="easy"
        )
        post_hard = bkt_service.compute_posterior(
            prior=prior, correct=True, concept="stack", difficulty="hard"
        )

        assert post_hard >= post_easy


class TestInteractionAPI:
    """Integration test suite for POST /api/interactions and POST /api/simulate-mastery-jump."""

    def test_record_interaction_correct_updates_mastery(self):
        """Verify submitting a correct challenge answer runs BKT and updates learner state."""
        payload = {
            "student_id": "learner_b",
            "concept": "stack",
            "question_id": "stack_lifo_order",
            "correct": True,
            "response_time_ms": 3500,
            "difficulty": "easy",
        }

        response = client.post("/api/interactions", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["student_id"] == "learner_b"
        assert data["concept"] == "stack"
        assert data["correct"] is True
        assert data["prior_mastery"] == 0.38
        assert data["posterior_mastery"] > 0.38
        assert data["delta"] > 0

        # With 1 answer, threshold (0.70) is not yet crossed
        assert data["threshold_crossed"] is False
        assert data["unlocked_wing"] is None

        # Verify profile mastery map was updated
        assert data["learner_profile"]["mastery_map"]["stack"] == data["posterior_mastery"]

    def test_consecutive_interactions_unlock_recursion_lab(self):
        """Verify 3 consecutive correct interactions cross 70% threshold and unlock Recursion Lab."""
        # Initial check: Recursion Lab is sealed
        world_init = client.get("/api/world/state").json()
        assert world_init["wings"]["recursion_lab"]["status"] == "sealed"

        # 3 consecutive correct answers
        last_response = None
        for qid in ["q1", "q2", "q3"]:
            res = client.post(
                "/api/interactions",
                json={
                    "student_id": "learner_b",
                    "concept": "stack",
                    "question_id": qid,
                    "correct": True,
                    "difficulty": "medium",
                },
            )
            assert res.status_code == 200
            last_response = res.json()

        assert last_response["posterior_mastery"] >= 0.70
        assert last_response["threshold_crossed"] is True
        assert last_response["unlocked_wing"] == "recursion_lab"

        # Verify world delta now has Recursion Lab accessible
        world_delta = last_response["world_delta"]
        assert world_delta["wings"]["recursion_lab"]["status"] == "accessible"
        assert world_delta["conduits_target_wing"] == "recursion_lab"

    def test_simulate_mastery_jump_endpoint(self):
        """Verify 1-click mastery jump immediately accelerates Stack to 74% and unlocks Recursion."""
        res = client.post(
            "/api/simulate-mastery-jump",
            json={
                "learner_id": "learner_b",
                "concept": "stack",
                "target_mastery": 0.74,
            },
        )
        assert res.status_code == 200
        data = res.json()

        assert data["learner_id"] == "learner_b"
        assert data["concept"] == "stack"
        assert data["prior_mastery"] == 0.38
        assert data["posterior_mastery"] == 0.74
        assert data["threshold_crossed"] is True
        assert data["unlocked_wing"] == "recursion_lab"

        # World state verification
        world = data["world_state"]
        assert world["wings"]["recursion_lab"]["status"] == "accessible"
        assert world["conduits_target_wing"] == "recursion_lab"
        assert data["learner_profile"]["recommended_station"] == "recursion_lab"
