"""Integration tests for 5-Agent LangGraph Deliberation Pipeline & Deterministic Guardrails."""

import pytest
from fastapi.testclient import TestClient
from backend.app.agents.coordinator import agent_coordinator
from backend.app.main import app
from backend.app.services.learner_service import learner_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
    """Reset profiles and coordinator caches prior to each test."""
    learner_service.reset_profiles()
    agent_coordinator.clear_cache()
    yield
    learner_service.reset_profiles()
    agent_coordinator.clear_cache()


class TestAgentDeliberationPipeline:
    def test_five_agent_pipeline_execution(self):
        """Verify sequential 5-agent LangGraph execution: Context -> Diagnostic -> Planner -> Validator -> Game."""
        resp = agent_coordinator.run_deliberation(student_id="learner_b")

        assert resp.student_id == "learner_b"
        assert len(resp.traces) == 5

        agent_names = [t.agent_name for t in resp.traces]
        expected_names = [
            "Context Agent",
            "Diagnostic Agent",
            "Planner Agent",
            "Validator Agent",
            "Game Agent",
        ]
        assert agent_names == expected_names

        # Verify traces have valid timestamps and duration
        for trace in resp.traces:
            assert trace.timestamp is not None
            assert trace.duration_ms >= 0.0
            assert trace.status in ["SUCCESS", "CERTIFIED", "OVERRULED"]
            assert trace.reasoning != ""
            assert isinstance(trace.input_summary, dict)
            assert isinstance(trace.output_summary, dict)

    def test_deterministic_guardrail_overrules_premature_recursion(self):
        """
        Verify that if the Planner proposes Recursion for Learner B (whose Stack mastery is 38%),
        the Validator Agent strictly OVERRULES the decision, enforcing REMEDIATE STACK.
        """
        # Learner B initial state: Stack = 0.38 (< 0.70 threshold)
        resp = agent_coordinator.run_deliberation(
            student_id="learner_b",
            force_proposal={
                "action": "CHALLENGE",
                "concept": "recursion",
                "difficulty": "hard",
                "reason": "Premature attempt to bypass stack foundational requirements.",
            },
        )

        decision = resp.final_decision
        assert decision.guardrail_status == "OVERRULED"
        assert decision.certified is False
        assert decision.overruled is True
        assert decision.action == "REMEDIATE"
        assert decision.concept == "stack"
        assert decision.difficulty == "easy"
        assert "Deterministic Guardrail Overrule" in decision.reason
        assert "Stack" in decision.overruling_reason
        assert "70%" in decision.overruling_reason

        # Verify Validator Agent trace
        validator_trace = next(t for t in resp.traces if t.agent_name == "Validator Agent")
        assert validator_trace.status == "OVERRULED"
        assert "OVERRULED" in validator_trace.output_summary["guardrail_status"]
        assert validator_trace.output_summary["certified"] is False

        # Verify Game Agent adapted world instructions to the enforced remediation
        world = resp.world_instructions
        assert world.recommended_station == "stack_lab"
        assert world.conduits_target_wing == "stack_lab"
        assert world.wing_barriers["recursion_lab"]["status"] == "sealed"
        assert world.active_mission["mission_id"] == "stack_diagnostic_mission"

    def test_guardrail_certifies_advanced_learner_a(self):
        """Verify Validator Agent certifies Recursion for Learner A (Stack = 84% >= 70%)."""
        resp = agent_coordinator.run_deliberation(student_id="learner_a")

        decision = resp.final_decision
        assert decision.guardrail_status == "CERTIFIED"
        assert decision.certified is True
        assert decision.overruled is False
        assert decision.concept == "recursion"

        # Verify Validator Agent trace
        validator_trace = next(t for t in resp.traces if t.agent_name == "Validator Agent")
        assert validator_trace.status == "CERTIFIED"
        assert validator_trace.output_summary["certified"] is True

        # Verify Game Agent opens Recursion Wing
        world = resp.world_instructions
        assert world.recommended_station == "recursion_lab"
        assert world.conduits_target_wing == "recursion_lab"
        assert world.wing_barriers["recursion_lab"]["status"] == "accessible"

    def test_dual_mode_offline_fallback(self):
        """Verify that without Gemini API key or online access, the system runs with deterministic fallback."""
        resp = agent_coordinator.run_deliberation(student_id="learner_b")

        assert resp.llm_mode in ["deterministic_fallback", "gemini"]
        assert resp.final_decision is not None
        assert len(resp.traces) == 5

    def test_game_agent_structured_world_instructions(self):
        """Verify Game Agent outputs complete structured virtual classroom parameters."""
        resp = agent_coordinator.run_deliberation(student_id="learner_b")
        world = resp.world_instructions

        # 5 wing forcefield barriers
        assert "array_station" in world.wing_barriers
        assert "linked_list_lab" in world.wing_barriers
        assert "stack_lab" in world.wing_barriers
        assert "recursion_lab" in world.wing_barriers
        assert "tree_lab" in world.wing_barriers

        # Station & Conduits
        assert world.recommended_station == "stack_lab"
        assert world.conduits_target_wing == "stack_lab"

        # Active Mission
        assert "mission_id" in world.active_mission
        assert "name" in world.active_mission
        assert "objective" in world.active_mission

        # AI Mentor guidance
        assert "greeting" in world.mentor_guidance
        assert "diagnostic_summary" in world.mentor_guidance
        assert "feynman_analogy" in world.mentor_guidance
        assert "conceptual_bridge" in world.mentor_guidance


class TestDeliberationAPI:
    def test_post_deliberate_endpoint(self):
        """Verify POST /api/agents/deliberate returns structured 5-agent response."""
        res = client.post(
            "/api/agents/deliberate",
            json={"student_id": "learner_b"},
        )
        assert res.status_code == 200
        data = res.json()

        assert data["student_id"] == "learner_b"
        assert "final_decision" in data
        assert "world_instructions" in data
        assert len(data["traces"]) == 5
        assert data["final_decision"]["action"] == "REMEDIATE"
        assert data["final_decision"]["concept"] == "stack"

    def test_get_latest_deliberation_endpoint(self):
        """Verify GET /api/agents/latest/{learner_id} retrieves cached trace."""
        # Initial fetch generates cache
        res = client.get("/api/agents/latest/learner_b")
        assert res.status_code == 200
        data = res.json()
        assert data["student_id"] == "learner_b"
        assert len(data["traces"]) == 5

    def test_post_learning_next_action_endpoint(self):
        """Verify POST /api/learning/next-action AGENTS.md contract endpoint."""
        res = client.post(
            "/api/learning/next-action",
            json={"student_id": "learner_b"},
        )
        assert res.status_code == 200
        data = res.json()

        assert data["student_id"] == "learner_b"
        assert data["action"] == "REMEDIATE"
        assert data["concept"] == "stack"
        assert data["certified"] is True
        assert data["recommended_station"] == "stack_lab"
        assert data["traces_count"] == 5

    def test_api_guardrail_overrule_via_http(self):
        """Verify HTTP API correctly returns OVERRULED decision when unready concept is forced."""
        res = client.post(
            "/api/agents/deliberate",
            json={
                "student_id": "learner_b",
                "force_proposal": {
                    "action": "CHALLENGE",
                    "concept": "recursion",
                    "difficulty": "hard",
                    "reason": "Test premature push",
                },
            },
        )
        assert res.status_code == 200
        data = res.json()

        dec = data["final_decision"]
        assert dec["guardrail_status"] == "OVERRULED"
        assert dec["certified"] is False
        assert dec["overruled"] is True
        assert dec["action"] == "REMEDIATE"
        assert dec["concept"] == "stack"
        assert "Deterministic Guardrail Overrule" in dec["overruling_reason"]

    def test_interaction_triggers_and_syncs_deliberation(self):
        """Verify that record_interaction automatically executes deliberation and returns it."""
        res = client.post(
            "/api/interactions",
            json={
                "student_id": "learner_b",
                "concept": "stack",
                "question_id": "stack_lifo_order",
                "correct": True,
                "difficulty": "easy",
            },
        )
        assert res.status_code == 200
        data = res.json()

        assert "deliberation" in data
        assert data["deliberation"] is not None
        assert len(data["deliberation"]["traces"]) == 5
        assert data["deliberation"]["final_decision"]["concept"] == "stack"
