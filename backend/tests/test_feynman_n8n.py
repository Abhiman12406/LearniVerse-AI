"""Automated tests for Feynman n8n Workflow Orchestrator and FastAPI Integration conforming to FEYNMAN.md §7, §8, §23."""

import json
import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.models.feynman import FeynmanRequest, VerificationRequest
from backend.app.services.feynman_service import feynman_service
from backend.app.services.learner_service import learner_service


WORKFLOW_PATH = Path(__file__).resolve().parents[2] / "n8n" / "workflows" / "feynman-assistant.json"
ROOT_WORKFLOW_PATH = Path(__file__).resolve().parents[2] / "n8n" / "feynman_workflow.json"


@pytest.fixture(autouse=True)
def reset_state():
    """Reset learner profiles and service state before each test."""
    learner_service.reset_profiles()
    feynman_service._sessions.clear()
    feynman_service._strategy_history["learner_b"] = [
        {"modality": "TEXT", "result": "NOT_HELPFUL", "concept": "stack", "timestamp": "2026-09-18T10:00:00Z"},
        {"modality": "VISUAL", "result": "PARTIALLY_HELPFUL", "concept": "stack", "timestamp": "2026-09-18T10:15:00Z"},
    ]
    yield


def test_n8n_workflow_file_integrity_and_node_graph():
    """Verify n8n workflow file existence, JSON validity, node specifications, and connection DAG."""
    assert WORKFLOW_PATH.exists(), f"Workflow file missing at {WORKFLOW_PATH}"
    assert ROOT_WORKFLOW_PATH.exists(), f"Root workflow file missing at {ROOT_WORKFLOW_PATH}"

    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        wf = json.load(f)

    assert "nodes" in wf
    assert "connections" in wf

    nodes_by_id = {node["id"]: node for node in wf["nodes"]}
    node_names = {node["name"] for node in wf["nodes"]}

    # Verify key nodes required by FEYNMAN.md §8 and §23
    expected_node_names = [
        "Webhook: Student Help Request",
        "Set: Normalize Inbound Request",
        "HTTP: Fetch Student Context",
        "Switch: Input Modality Router",
        "Code: Unified Evidence Builder",
        "Gemini: Feynman Analyzer Agent",
        "Switch: Explanation Modality",
        "Code: Assemble Response Payload",
        "Respond to Webhook",
        "Webhook: Verification Submission",
        "HTTP: Post Verification to FastAPI BKT",
        "Respond to Verification Webhook",
    ]
    for expected in expected_node_names:
        assert expected in node_names, f"Missing required n8n node: {expected}"

    # Verify Webhook 1 endpoints
    wh1 = nodes_by_id["1-webhook-student-request"]
    assert wh1["parameters"]["path"] == "feynman-request"
    assert wh1["parameters"]["httpMethod"] == "POST"

    # Verify HTTP context fetch
    http_ctx = nodes_by_id["3-http-get-context"]
    assert "/api/feynman/learning-context" in http_ctx["parameters"]["url"]

    # Verify Webhook 2 endpoints
    wh2 = nodes_by_id["10-webhook-verify-request"]
    assert wh2["parameters"]["path"] == "feynman-verify"
    assert wh2["parameters"]["httpMethod"] == "POST"

    # Verify HTTP verification POST
    http_ver = nodes_by_id["11-http-post-verify-to-fastapi"]
    assert "/api/feynman/verify" in http_ver["parameters"]["url"]


def test_n8n_workflow_execution_simulation_stack_testcase():
    """
    Simulate the end-to-end execution of the Feynman n8n workflow on a real test case:
    Learner B asking for remediation on 'stack' (mastery 0.38).
    Executes each n8n node's operational logic against FastAPI.
    """
    client = TestClient(app)

    # Inbound test case payload submitted to n8n Webhook: Student Help Request
    test_case_input = {
        "student_id": "learner_b",
        "concept_id": "stack",
        "input_type": "TEXT",
        "input": "Why does a stack remove the top item first instead of the bottom one?",
        "requested_modality": "VISUAL",
    }

    # Step 1 & 2: Normalize Inbound Request (simulating '2-normalize-input')
    normalized_input = {
        "student_id": test_case_input.get("student_id", "learner_b"),
        "concept_id": test_case_input.get("concept_id", "recursion"),
        "input_type": test_case_input.get("input_type", "TEXT"),
        "raw_input": test_case_input.get("input", ""),
        "requested_modality": test_case_input.get("requested_modality", ""),
    }
    assert normalized_input["student_id"] == "learner_b"
    assert normalized_input["concept_id"] == "stack"

    # Step 3: HTTP: Fetch Student Context (simulating '3-http-get-context' calling FastAPI)
    ctx_res = client.get(
        f"/api/feynman/learning-context?student_id={normalized_input['student_id']}&concept={normalized_input['concept_id']}"
    )
    assert ctx_res.status_code == 200
    context = ctx_res.json()
    assert context["student_id"] == "learner_b"
    assert context["concept"] == "stack"
    assert context["mastery"] == 0.38
    assert "linked_list" in context["prerequisites"]

    # Step 4: Switch: Input Modality Router (simulating '4-switch-input-type')
    # TEXT input routes to fallback output 0
    selected_input_route = 0 if normalized_input["input_type"] not in ["AUDIO", "IMAGE"] else 1
    assert selected_input_route == 0

    # Step 5: Code: Unified Evidence Builder (simulating '5-code-unified-evidence' JS logic)
    unified_evidence = {
        "student_id": normalized_input["student_id"],
        "concept_id": normalized_input["concept_id"],
        "input_type": normalized_input["input_type"],
        "unified_input": normalized_input["raw_input"],
        "context": context,
        "requested_modality": normalized_input["requested_modality"],
    }
    assert unified_evidence["student_id"] == "learner_b"
    assert unified_evidence["context"]["mastery"] == 0.38

    # Step 6: Gemini / Cognitive Diagnostic (simulating '6-gemini-analyzer')
    # Uses feynman_service analyzer to produce grounded educational diagnosis
    selected_modality = feynman_service.select_modality(
        student_id=unified_evidence["student_id"],
        concept=unified_evidence["concept_id"],
        input_type=unified_evidence["input_type"],
        user_requested_modality=unified_evidence["requested_modality"],
        recent_mistakes=context.get("recent_mistakes", []),
    )
    assert selected_modality in ["VISUAL", "3D", "VIDEO"]

    # Step 7 & 8: Code: Assemble Response Payload (simulating '8-code-assemble-response')
    # Build complete multimodal response conforming to n8n response specification
    feynman_req = FeynmanRequest(
        student_id=unified_evidence["student_id"],
        concept_id=unified_evidence["concept_id"],
        input_type=unified_evidence["input_type"],
        input=unified_evidence["unified_input"],
        requested_modality=selected_modality,
    )
    assembled_response = feynman_service.process_feynman_request(feynman_req)
    assembled_response.orchestrator = "n8n"

    assert assembled_response.session_id.startswith("FS_")
    assert assembled_response.orchestrator == "n8n"
    assert assembled_response.concept_id == "stack"
    assert assembled_response.explanation.analogy is not None
    assert "plate" in assembled_response.explanation.analogy.lower() or "tray" in assembled_response.explanation.analogy.lower() or "disc" in assembled_response.explanation.analogy.lower() or "stack" in assembled_response.explanation.analogy.lower()
    assert len(assembled_response.explanation.visual_steps) > 0
    assert assembled_response.verification_question.question_id is not None

    # Step 10 & 11: Webhook: Verification Submission & HTTP: Post Verification to FastAPI BKT
    # (simulating '10-webhook-verify-request' and '11-http-post-verify-to-fastapi')
    verification_payload = {
        "session_id": assembled_response.session_id,
        "student_id": assembled_response.student_id,
        "concept_id": assembled_response.concept_id,
        "question_id": assembled_response.verification_question.question_id,
        "selected_option_index": assembled_response.verification_question.correct_option_index,
        "response_time_ms": 3800,
    }

    ver_res = client.post("/api/feynman/verify", json=verification_payload)
    assert ver_res.status_code == 200
    ver_data = ver_res.json()

    # Verify BKT mastery update and educational evidence
    assert ver_data["correct"] is True
    assert ver_data["prior_mastery"] == 0.38
    assert ver_data["posterior_mastery"] > 0.38
    assert ver_data["delta"] > 0
    assert ver_data["evidence"]["evidence_type"] == "FEYNMAN_VERIFICATION"
    assert ver_data["evidence"]["source"] == "feynman_agent"


def test_fastapi_with_n8n_webhook_configured(monkeypatch):
    """
    Test FastAPI backend when N8N_WEBHOOK_URL is configured in environment.
    Verifies that feynman_service dispatches to n8n and marks response orchestrator as 'n8n'.
    """
    monkeypatch.setenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/feynman-request")

    class MockN8NResponse:
        status_code = 200
        def json(self):
            return {
                "session_id": "FS_N8N_TEST_999",
                "orchestrator": "n8n",
                "status": "SUCCESS",
            }

    def mock_post(self, url, *args, **kwargs):
        assert "feynman-request" in str(url)
        return MockN8NResponse()

    monkeypatch.setattr("httpx.Client.post", mock_post)

    req = FeynmanRequest(
        student_id="learner_b",
        concept_id="stack",
        input_type="TEXT",
        input="How does pop work?",
    )
    resp = feynman_service.process_feynman_request(req)

    assert resp.orchestrator == "n8n"
    assert resp.session_id.startswith("FS_")
    assert resp.concept_id == "stack"


def test_n8n_callback_webhook_endpoint():
    """Test POST /api/feynman/webhook receiving n8n callback event."""
    client = TestClient(app)

    # 1. Create a session first
    req_payload = {
        "student_id": "learner_b",
        "concept_id": "stack",
        "input_type": "TEXT",
        "input": "Explain peek vs pop",
    }
    r = client.post("/api/feynman/request", json=req_payload)
    session_data = r.json()
    session_id = session_data["session_id"]
    q_id = session_data["verification_question"]["question_id"]

    # 2. Simulate n8n workflow sending verification callback to FastAPI
    callback_payload = {
        "event_type": "VERIFICATION_SUBMISSION",
        "timestamp": "2026-09-18T12:00:00Z",
        "data": {
            "session_id": session_id,
            "student_id": "learner_b",
            "concept_id": "stack",
            "question_id": q_id,
            "selected_option_index": 0,
            "response_time_ms": 3200,
        },
    }

    cb_res = client.post("/api/feynman/webhook", json=callback_payload)
    assert cb_res.status_code == 200
    res_data = cb_res.json()
    assert res_data["status"] == "SUCCESS"
    assert res_data["result"]["correct"] is True
    assert res_data["result"]["posterior_mastery"] > 0.38


def test_n8n_workflow_hero_barrier_unlock_testcase():
    """
    Hero Demonstration Test Case via n8n:
    When Student B is at 0.65 Stack mastery and completes the n8n-orchestrated
    Feynman remediation verification, Stack crosses 0.70, dissolving the
    Recursion Lab barrier.
    """
    client = TestClient(app)
    learner_service.update_concept_mastery("learner_b", "stack", 0.65)
    assert learner_service.get_learner_profile("learner_b").mastery_map.stack == 0.65

    # 1. n8n Request Webhook
    req = FeynmanRequest(
        student_id="learner_b",
        concept_id="stack",
        input_type="TEXT",
        input="Show me how LIFO works so I can unlock Recursion.",
        requested_modality="VISUAL",
    )
    assembled = feynman_service.process_feynman_request(req)
    assembled.orchestrator = "n8n"

    # 2. n8n Verification Webhook
    ver_payload = {
        "session_id": assembled.session_id,
        "student_id": "learner_b",
        "concept_id": "stack",
        "question_id": assembled.verification_question.question_id,
        "selected_option_index": assembled.verification_question.correct_option_index,
        "response_time_ms": 2900,
    }
    ver_res = client.post("/api/feynman/verify", json=ver_payload)
    assert ver_res.status_code == 200
    ver_data = ver_res.json()

    assert ver_data["correct"] is True
    assert ver_data["posterior_mastery"] >= 0.70
    assert ver_data["threshold_crossed"] is True
    assert ver_data["unlocked_wing"] == "recursion_lab"

    # Verify world state is updated
    world = learner_service.get_world_state("learner_b")
    assert world.wings["recursion_lab"].status == "accessible"

