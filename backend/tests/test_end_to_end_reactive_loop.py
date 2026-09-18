"""
End-to-End Reactive Loop & Hero Pitch Demonstration Integration Tests.

Validates the complete reactive interaction loop, latency benchmarks (< 200ms),
BKT belief updates, 5-agent deliberation, deterministic guardrail certification,
and dynamic world adaptation.
"""

import time
import pytest
from fastapi.testclient import TestClient
from backend.app.agents.coordinator import agent_coordinator
from backend.app.main import app
from backend.app.services.learner_service import learner_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_classroom():
    """Ensure each test starts with a clean baseline state."""
    learner_service.reset_profiles()
    agent_coordinator.clear_cache()
    yield
    learner_service.reset_profiles()
    agent_coordinator.clear_cache()


class TestEndToEndReactiveLoop:
    def test_full_reactive_loop_under_200ms(self):
        """
        Validates the complete interaction cycle:
        Challenge answer -> API interaction -> BKT posterior update -> 5-agent deliberation
        -> guardrail certification -> world delta adaptation.
        Must complete in < 200ms.
        """
        # Step 1: Verify baseline Learner B state
        learner_service.switch_learner("learner_b")
        initial_world = client.get("/api/world/state").json()
        assert initial_world["wings"]["recursion_lab"]["status"] == "sealed"
        assert initial_world["wings"]["stack_lab"]["status"] == "accessible"
        assert initial_world["conduits_target_wing"] == "stack_lab"

        # Step 2: Answer question correctly and measure latency
        start_time = time.perf_counter()
        resp = client.post(
            "/api/interactions",
            json={
                "student_id": "learner_b",
                "concept": "stack",
                "question_id": "stack_lifo_order",
                "correct": True,
                "difficulty": "medium",
            },
        )
        latency_ms = (time.perf_counter() - start_time) * 1000

        assert resp.status_code == 200
        assert latency_ms < 200.0, f"Reactive latency {latency_ms:.2f}ms exceeds 200ms threshold!"

        data = resp.json()

        # Step 3: Verify BKT belief transition
        assert data["concept"] == "stack"
        assert data["prior_mastery"] == 0.38
        assert data["posterior_mastery"] > 0.38
        assert data["delta"] > 0
        assert data["threshold_crossed"] is False
        assert data["unlocked_wing"] is None

        # Step 4: Verify 5-agent deliberation trace returned synchronously
        assert "deliberation" in data
        delib = data["deliberation"]
        assert len(delib["traces"]) == 5
        agent_names = [t["agent_name"] for t in delib["traces"]]
        assert agent_names == [
            "Context Agent",
            "Diagnostic Agent",
            "Planner Agent",
            "Validator Agent",
            "Game Agent",
        ]

        # Step 5: Verify Validator Agent certified remediation for Stack
        validator_trace = next(t for t in delib["traces"] if t["agent_name"] == "Validator Agent")
        assert validator_trace["status"] == "CERTIFIED"
        assert delib["final_decision"]["concept"] == "stack"
        assert delib["final_decision"]["action"] == "REMEDIATE"
        assert delib["world_instructions"]["conduits_target_wing"] == "stack_lab"

    def test_90_second_hero_pitch_mastery_jump_flow(self):
        """
        Validates the complete 90-second hero pitch sequence:
        1. Learner B gap (38% Stack, Recursion sealed)
        2. Single click mastery jump to 74%
        3. Threshold crossed >= 70%
        4. Validator Agent certifies advanced Recursion readiness
        5. World state unlocks Recursion Lab barrier
        6. Clean reset restores demonstration baseline
        """
        # 1. Initialize Learner B
        learner_service.switch_learner("learner_b")
        profile = client.get("/api/learner/profile").json()
        assert profile["mastery_map"]["stack"] == 0.38
        assert profile["learning_state"]["status"] == "remediation_required"

        # 2. Simulate Mastery Jump (38% -> 74%)
        start_time = time.perf_counter()
        jump_res = client.post(
            "/api/simulate-mastery-jump",
            json={
                "learner_id": "learner_b",
                "concept": "stack",
                "target_mastery": 0.74,
            },
        )
        latency_ms = (time.perf_counter() - start_time) * 1000

        assert jump_res.status_code == 200
        assert latency_ms < 200.0, f"Jump latency {latency_ms:.2f}ms exceeds 200ms threshold!"

        jump_data = jump_res.json()

        # 3. Assert threshold crossing and wing unlock
        assert jump_data["prior_mastery"] == 0.38
        assert jump_data["posterior_mastery"] == 0.74
        assert jump_data["threshold_crossed"] is True
        assert jump_data["unlocked_wing"] == "recursion_lab"

        # 4. Assert 5-agent deliberation certified Recursion readiness
        delib = jump_data["deliberation"]
        assert delib is not None
        assert delib["final_decision"]["concept"] == "recursion"
        assert delib["final_decision"]["guardrail_status"] == "CERTIFIED"
        assert delib["final_decision"]["certified"] is True

        # 5. Assert authoritative world state update
        world = jump_data["world_state"]
        assert world["wings"]["recursion_lab"]["status"] == "accessible"
        assert world["wings"]["recursion_lab"]["reason"] is None
        assert world["conduits_target_wing"] == "recursion_lab"

        # 6. Verify Reset restores clean demo conditions
        reset_res = client.post("/api/learner/reset")
        assert reset_res.status_code == 200
        reset_profile = reset_res.json()
        assert reset_profile["mastery_map"]["stack"] == 0.38
        assert reset_profile["learning_state"]["status"] == "remediation_required"

        reset_world = client.get("/api/world/state").json()
        assert reset_world["wings"]["recursion_lab"]["status"] == "sealed"
        assert reset_world["conduits_target_wing"] == "stack_lab"

    def test_multi_step_consecutive_challenges_dissolve_barrier(self):
        """
        Validates that answering 3 consecutive challenges correctly brings Stack
        mastery past 70% and dynamically adapts the world environment.
        """
        learner_service.switch_learner("learner_b")

        # Answer 1: 0.38 -> 0.53
        r1 = client.post(
            "/api/interactions",
            json={
                "student_id": "learner_b",
                "concept": "stack",
                "question_id": "stack_ch1",
                "correct": True,
                "difficulty": "medium",
            },
        ).json()
        assert r1["threshold_crossed"] is False
        assert r1["posterior_mastery"] == pytest.approx(0.53, abs=0.03)

        # Answer 2: 0.53 -> 0.67
        r2 = client.post(
            "/api/interactions",
            json={
                "student_id": "learner_b",
                "concept": "stack",
                "question_id": "stack_ch2",
                "correct": True,
                "difficulty": "medium",
            },
        ).json()
        assert r2["threshold_crossed"] is False
        assert r2["posterior_mastery"] == pytest.approx(0.67, abs=0.03)

        # Answer 3: 0.67 -> >= 0.70 (Crossing the prerequisite threshold)
        r3 = client.post(
            "/api/interactions",
            json={
                "student_id": "learner_b",
                "concept": "stack",
                "question_id": "stack_ch3",
                "correct": True,
                "difficulty": "medium",
            },
        ).json()
        assert r3["threshold_crossed"] is True
        assert r3["unlocked_wing"] == "recursion_lab"
        assert r3["posterior_mastery"] >= 0.70
        assert r3["world_delta"]["wings"]["recursion_lab"]["status"] == "accessible"
        assert r3["world_delta"]["conduits_target_wing"] == "recursion_lab"
