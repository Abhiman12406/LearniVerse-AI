"""Tests for Issue 03: LangGraph Agent Deliberation Post-Diagnostic Evaluation."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.assessment import (
    DiagnosticSubmissionRequest,
    DiagnosticSubmissionResponse,
)
from backend.app.services.diagnostic_service import diagnostic_service
from backend.app.services.learner_service import learner_service
from backend.app.agents.coordinator import agent_coordinator

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
    """Reset learner state and cached deliberations before each test."""
    learner_service.reset_profiles()
    agent_coordinator.clear_cache()


def test_diagnostic_submission_triggers_5_agent_deliberation():
    """Verify diagnostic evaluation triggers the 5-Agent LangGraph Deliberation pipeline."""
    assessment = diagnostic_service.generate_assessment()
    answers = {
        "diag_arr_01": "opt_arr_01_a",
        "diag_ll_01": "opt_ll_01_a",
        "diag_stk_01": "opt_stk_01_b",  # Incorrect Stack -> weak stack
        "diag_rec_01": "opt_rec_01_b",
        "diag_tree_01": "opt_tree_01_c",
    }

    sub_req = DiagnosticSubmissionRequest(
        student_id="learner_b",
        assessment_id=assessment.assessment_id,
        answers=answers,
    )
    result: DiagnosticSubmissionResponse = diagnostic_service.evaluate_submission(sub_req)

    assert result.deliberation is not None
    delib = result.deliberation

    # Verify 5 Agent traces are present and sequentially ordered
    agent_names = [t.agent_name for t in delib.traces]
    assert "Context Agent" in agent_names
    assert "Diagnostic Agent" in agent_names
    assert "Planner Agent" in agent_names
    assert "Validator Agent" in agent_names
    assert "Game Agent" in agent_names
    assert len(delib.traces) == 5

    # Verify Final Decision & Rationale
    assert delib.final_decision is not None
    assert delib.final_decision.action in ["REMEDIATE", "LEARN", "PRACTICE", "CHALLENGE"]
    assert len(delib.final_decision.reason) > 10

    # Verify World Instructions
    assert delib.world_instructions is not None
    assert delib.world_instructions.recommended_station in [
        "stack_lab", "array_station", "linked_list_lab", "recursion_lab", "tree_lab"
    ]
    assert "active_mission" in delib.world_instructions.model_dump()
    assert "wing_barriers" in delib.world_instructions.model_dump()


def test_planner_validator_enforce_prerequisite_guardrails_for_weak_stack():
    """Verify Planner and Validator agents enforce prerequisite constraints on low Stack mastery."""
    assessment = diagnostic_service.generate_assessment()
    answers = {
        "diag_arr_01": "opt_arr_01_a",
        "diag_ll_01": "opt_ll_01_a",
        "diag_stk_01": "opt_stk_01_b",  # Incorrect
        "diag_rec_01": "opt_rec_01_b",
        "diag_tree_01": "opt_tree_01_c",
    }

    sub_req = DiagnosticSubmissionRequest(
        student_id="learner_b",
        assessment_id=assessment.assessment_id,
        answers=answers,
    )
    result = diagnostic_service.evaluate_submission(sub_req)
    delib = result.deliberation

    # When Stack is weak (< 70%), student must be assigned to Stack Lab with REMEDIATE action
    assert delib.final_decision.action == "REMEDIATE"
    assert delib.final_decision.concept == "stack"
    assert delib.final_decision.difficulty == "easy"
    assert delib.final_decision.certified is True
    assert delib.world_instructions.recommended_station == "stack_lab"

    # Recursion Wing must remain sealed in world instructions
    assert delib.world_instructions.wing_barriers["recursion_lab"]["status"] == "sealed"


def test_deliberation_cached_and_inspectable_in_telemetry_drawer():
    """Verify post-diagnostic deliberation is stored in agent coordinator cache for Telemetry Drawer."""
    assessment = diagnostic_service.generate_assessment()
    answers = {
        "diag_arr_01": "opt_arr_01_a",
        "diag_ll_01": "opt_ll_01_a",
        "diag_stk_01": "opt_stk_01_b",
        "diag_rec_01": "opt_rec_01_b",
        "diag_tree_01": "opt_tree_01_c",
    }

    sub_req = DiagnosticSubmissionRequest(
        student_id="learner_b",
        assessment_id=assessment.assessment_id,
        answers=answers,
    )
    result = diagnostic_service.evaluate_submission(sub_req)

    # Fetch cached deliberation via HTTP GET endpoint consumed by Telemetry Drawer
    response = client.get("/api/agents/latest/learner_b")
    assert response.status_code == 200
    data = response.json()

    assert data["student_id"] == "learner_b"
    assert data["final_decision"]["concept"] == result.deliberation.final_decision.concept
    assert data["final_decision"]["action"] == result.deliberation.final_decision.action
    assert len(data["traces"]) == 5


def test_api_submit_endpoint_returns_deliberation_payload():
    """Verify HTTP POST /api/assessment/submit payload includes full deliberation."""
    get_resp = client.get("/api/assessment/diagnostic")
    assessment_id = get_resp.json()["assessment_id"]

    payload = {
        "student_id": "learner_b",
        "assessment_id": assessment_id,
        "answers": {
            "diag_arr_01": "opt_arr_01_a",
            "diag_ll_01": "opt_ll_01_a",
            "diag_stk_01": "opt_stk_01_a",  # correct Stack answer
            "diag_rec_01": "opt_rec_01_a",
            "diag_tree_01": "opt_tree_01_a",
        },
    }

    submit_resp = client.post("/api/assessment/submit", json=payload)
    assert submit_resp.status_code == 200
    res_data = submit_resp.json()

    assert "deliberation" in res_data
    delib = res_data["deliberation"]
    assert "final_decision" in delib
    assert "world_instructions" in delib
    assert "traces" in delib
    assert len(delib["traces"]) == 5
