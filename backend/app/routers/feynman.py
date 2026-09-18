"""Feynman Agent API router conforming to FEYNMAN.md specification."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.models.feynman import (
    FeynmanRequest,
    FeynmanResponse,
    LearnerContextResponse,
    TranscribeRequest,
    TranscribeResponse,
    VerificationRequest,
    VerificationResponse,
)
from backend.app.services.feynman_service import feynman_service

router = APIRouter(prefix="/api/feynman", tags=["Feynman Multimodal Agent"])


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_voice_input(req: TranscribeRequest) -> TranscribeResponse:
    """
    Transcribe student spoken audio query using Groq Whisper (model: whisper-large-v3).
    Powered by GROQ_API_KEY with resilient offline/simulated fallback.
    """
    return await feynman_service.transcribe_audio(req)


@router.post("/request", response_model=FeynmanResponse)
def request_feynman_explanation(req: FeynmanRequest) -> FeynmanResponse:
    """
    Main Feynman Agent entrypoint.
    Receives student struggle query, determines gap and optimal modality (Text, Visual, Voice, Video, 3D),
    and returns a tailored Feynman explanation + targeted verification question.
    """
    return feynman_service.process_feynman_request(req)


@router.get("/learning-context", response_model=LearnerContextResponse)
def get_learning_context(
    student_id: str = Query(default="learner_b", description="Student ID"),
    concept: str = Query(default="recursion", description="Target DSA concept"),
) -> LearnerContextResponse:
    """
    Retrieve minimal structured student context conforming to FEYNMAN.md §12.
    Used by n8n workflow and internal agents to ground explanations in active learner state.
    """
    return feynman_service.get_learning_context(student_id=student_id, concept=concept)


@router.post("/verify", response_model=VerificationResponse)
def verify_student_response(req: VerificationRequest) -> VerificationResponse:
    """
    Evaluate student's answer to the Feynman verification question.
    Generates structured Learning Evidence, computes BKT posterior mastery,
    updates authoritative learner state, checks prerequisite thresholds, and triggers replanning.
    """
    return feynman_service.verify_student_response(req)


@router.get("/sessions/{student_id}")
def get_student_sessions(student_id: str) -> List[Dict[str, Any]]:
    """Retrieve history of Feynman interactions and strategy memory for a student (§28)."""
    return feynman_service.get_sessions(student_id)


@router.get("/explainability/{session_id}")
def get_session_explainability(session_id: str) -> Dict[str, Any]:
    """
    Retrieve full explainability and observability trace for a Feynman interaction (§31).
    Explains why a specific modality was chosen and provides before/after learner states.
    """
    data = feynman_service.get_explainability(session_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    return data


@router.post("/webhook")
def receive_n8n_callback(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Webhook endpoint to receive callbacks from an external n8n workflow (§8).
    Accepts n8n workflow execution events and routes them into the learning loop.
    """
    # If n8n provides verification payload, route to verification
    if payload.get("event_type") == "VERIFICATION_SUBMISSION":
        ver_req = VerificationRequest(**payload.get("data", {}))
        resp = feynman_service.verify_student_response(ver_req)
        return {"status": "SUCCESS", "result": resp.model_dump()}

    return {"status": "ACKNOWLEDGED", "received_at": payload.get("timestamp")}
