"""Automated tests for Feynman Multimodal Adaptive Explanation System conforming to FEYNMAN.md."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.models.feynman import (
    FeynmanRequest,
    VerificationRequest,
)
from backend.app.services.feynman_service import feynman_service
from backend.app.services.learner_service import learner_service


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


def test_get_learning_context():
    """Test retrieval of minimal structured student context conforming to FEYNMAN.md §12."""
    context = feynman_service.get_learning_context("learner_b", "recursion")
    assert context.student_id == "learner_b"
    assert context.concept == "recursion"
    assert "stack" in context.prerequisites
    assert context.prerequisites["stack"] == 0.38
    assert len(context.recent_mistakes) > 0
    assert any("Call Stack" in m for m in context.recent_mistakes)


def test_modality_selection_policy():
    """Test modality selection policy rules and strategy memory adaptation (§14, §27, §28)."""
    # Explicit user preference respected
    modality_explicit = feynman_service.select_modality(
        student_id="learner_b",
        concept="recursion",
        input_type="TEXT",
        user_requested_modality="3D",
        recent_mistakes=[],
    )
    assert modality_explicit == "3D"

    # Audio input triggers Voice
    modality_audio = feynman_service.select_modality(
        student_id="learner_b",
        concept="stack",
        input_type="AUDIO",
        user_requested_modality=None,
        recent_mistakes=[],
    )
    assert modality_audio == "VOICE"

    # Strategy memory check: learner_b already failed TEXT on stack, so policy upgrades to VISUAL/VIDEO
    modality_remedial = feynman_service.select_modality(
        student_id="learner_b",
        concept="stack",
        input_type="TEXT",
        user_requested_modality=None,
        recent_mistakes=[],
    )
    assert modality_remedial in ["VISUAL", "VIDEO"]


def test_process_feynman_request_recursion():
    """Test Feynman request processing for Recursion confusion."""
    req = FeynmanRequest(
        student_id="learner_b",
        concept_id="recursion",
        input_type="TEXT",
        input="I don't understand why the function keeps calling itself and pausing.",
    )
    resp = feynman_service.process_feynman_request(req)

    assert resp.session_id.startswith("FS_")
    assert resp.concept_id == "recursion"
    assert resp.decision.concept_id == "recursion"
    assert resp.decision.modality in ["VISUAL", "VIDEO", "3D", "TEXT", "VOICE"]

    # Verify multimodal explanation payload components
    assert resp.explanation.analogy is not None
    assert "doll" in resp.explanation.analogy.lower() or "stack" in resp.explanation.analogy.lower()
    assert len(resp.explanation.visual_steps) > 0
    assert len(resp.explanation.video_timeline) > 0
    assert resp.explanation.three_d_instruction is not None
    assert resp.explanation.three_d_instruction.zone == "recursion_lab"

    # Verify targeted verification question
    assert resp.verification_question.question_id is not None
    assert len(resp.verification_question.options) == 4
    assert resp.verification_question.correct_option_index == 0


def test_verification_and_bkt_mastery_pipeline():
    """Test end-to-end verification answer submission -> BKT update -> learning evidence loop."""
    # Start session on Stack
    req = FeynmanRequest(
        student_id="learner_b",
        concept_id="stack",
        input_type="TEXT",
        input="Why is the top element removed first instead of the bottom one?",
    )
    feynman_resp = feynman_service.process_feynman_request(req)
    session_id = feynman_resp.session_id

    prior_stack = learner_service.get_learner_profile("learner_b").mastery_map.stack
    assert prior_stack == 0.38

    # Submit correct verification answer
    ver_req = VerificationRequest(
        session_id=session_id,
        student_id="learner_b",
        concept_id="stack",
        question_id=feynman_resp.verification_question.question_id,
        selected_option_index=0,
        response_time_ms=5200,
    )
    ver_resp = feynman_service.verify_student_response(ver_req)

    assert ver_resp.correct is True
    assert ver_resp.evidence.evidence_type == "FEYNMAN_VERIFICATION"
    assert ver_resp.evidence.source == "feynman_agent"
    assert ver_resp.posterior_mastery > prior_stack

    # Check updated profile
    updated_profile = learner_service.get_learner_profile("learner_b")
    assert updated_profile.mastery_map.stack == ver_resp.posterior_mastery


def test_barrier_dissolution_via_feynman_verification():
    """
    Hero Pitch Test:
    When Student B completes remediation and crosses the 70% threshold,
    the laser barrier dissolves and Recursion Wing is unlocked!
    """
    # Seed Stack mastery just below threshold (e.g. 0.65)
    learner_service.update_concept_mastery("learner_b", "stack", 0.65)
    assert learner_service.get_learner_profile("learner_b").mastery_map.stack == 0.65

    # Request Feynman explanation and solve verification
    req = FeynmanRequest(student_id="learner_b", concept_id="stack", input_type="TEXT", input="Remediate LIFO")
    f_resp = feynman_service.process_feynman_request(req)

    ver_req = VerificationRequest(
        session_id=f_resp.session_id,
        student_id="learner_b",
        concept_id="stack",
        question_id=f_resp.verification_question.question_id,
        selected_option_index=0,
    )
    ver_resp = feynman_service.verify_student_response(ver_req)

    assert ver_resp.correct is True
    assert ver_resp.posterior_mastery >= 0.70
    assert ver_resp.threshold_crossed is True
    assert ver_resp.unlocked_wing == "recursion_lab"

    # World state must now report recursion_lab accessible!
    world = learner_service.get_world_state("learner_b")
    assert world.wings["recursion_lab"].status == "accessible"


def test_api_endpoints():
    """Verify all Feynman API endpoints using TestClient."""
    client = TestClient(app)

    # 1. POST /api/feynman/request
    req_payload = {
        "student_id": "learner_b",
        "concept_id": "recursion",
        "input_type": "TEXT",
        "input": "Explain the call stack.",
    }
    r = client.post("/api/feynman/request", json=req_payload)
    assert r.status_code == 200
    data = r.json()
    assert "session_id" in data
    assert "explanation" in data
    assert "verification_question" in data
    session_id = data["session_id"]

    # 2. GET /api/feynman/learning-context
    r_ctx = client.get("/api/feynman/learning-context?student_id=learner_b&concept=recursion")
    assert r_ctx.status_code == 200
    assert r_ctx.json()["concept"] == "recursion"

    # 3. POST /api/feynman/verify
    v_payload = {
        "session_id": session_id,
        "student_id": "learner_b",
        "concept_id": "recursion",
        "question_id": data["verification_question"]["question_id"],
        "selected_option_index": 0,
        "response_time_ms": 4000,
    }
    r_ver = client.post("/api/feynman/verify", json=v_payload)
    assert r_ver.status_code == 200
    v_data = r_ver.json()
    assert v_data["correct"] is True
    assert "evidence" in v_data

    # 4. GET /api/feynman/sessions/{student_id}
    r_sess = client.get("/api/feynman/sessions/learner_b")
    assert r_sess.status_code == 200
    assert len(r_sess.json()) >= 1

    # 5. GET /api/feynman/explainability/{session_id}
    r_exp = client.get(f"/api/feynman/explainability/{session_id}")
    assert r_exp.status_code == 200
    assert r_exp.json()["session_id"] == session_id


def test_groq_whisper_transcription_endpoint():
    """Test POST /api/feynman/transcribe using Groq Whisper model."""
    client = TestClient(app)
    import base64

    fake_audio = base64.b64encode(b"RIFFdummywavdata").decode("utf-8")
    payload = {
        "audio_base64": fake_audio,
        "audio_format": "webm",
        "language": "en",
    }
    r = client.post("/api/feynman/transcribe", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert "transcript" in data
    assert data["model"] == "whisper-large-v3"
    assert "groq_whisper" in data["provider"]


def test_groq_whisper_in_feynman_request():
    """Test voice input via audio_base64 in main Feynman request."""
    import base64
    fake_audio = base64.b64encode(b"RIFFdummyaudiobytes").decode("utf-8")
    req = FeynmanRequest(
        student_id="learner_b",
        concept_id="stack",
        input_type="VOICE",
        audio_base64=fake_audio,
    )
    resp = feynman_service.process_feynman_request(req)
    assert resp.session_id.startswith("FS_")
    assert "[Voice Input" in resp.unified_input
    assert resp.concept_id == "stack"


def test_groq_whisper_with_mocked_api_key(monkeypatch):
    """Test live Groq API dispatch with GROQ_API_KEY and mocked HTTP response."""
    monkeypatch.setenv("GROQ_API_KEY", "gsk_testmockkey12345")
    
    class MockResponse:
        status_code = 200
        def json(self):
            return {"text": "Why does a stack use LIFO instead of FIFO?"}

    def mock_post(*args, **kwargs):
        assert kwargs["headers"]["Authorization"] == "Bearer gsk_testmockkey12345"
        assert kwargs["data"]["model"] == "whisper-large-v3"
        return MockResponse()

    monkeypatch.setattr("httpx.Client.post", mock_post)

    result = feynman_service.transcribe_with_groq_whisper_sync(
        audio_bytes=b"dummybytes",
        audio_format="webm",
        language="en",
    )
    assert result.success is True
    assert result.transcript == "Why does a stack use LIFO instead of FIFO?"
    assert result.provider == "groq_whisper"
    assert result.model == "whisper-large-v3"
