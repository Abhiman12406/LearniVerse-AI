"""Mentor API router delivering in-world AI Mentor guidance and Feynman explanations."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.models.mentor import (
    AskQuestionRequest,
    MentorGuidanceResponse,
    MentorQuestion,
)
from backend.app.services.mentor_service import mentor_service

router = APIRouter(prefix="/api/mentor", tags=["AI Mentor"])


@router.get("/guidance", response_model=MentorGuidanceResponse)
def get_mentor_guidance(
    learner_id: Optional[str] = Query(None, description="Optional target learner ID")
) -> MentorGuidanceResponse:
    """Retrieve personalized AI Mentor advice and Feynman conceptual explanations."""
    return mentor_service.get_guidance(learner_id)


@router.post("/ask", response_model=MentorQuestion)
def ask_mentor_question(req: AskQuestionRequest) -> MentorQuestion:
    """Ask the mentor a specific follow-up question regarding prerequisites and concepts."""
    answer = mentor_service.answer_question(req.question_id, req.learner_id)
    if not answer:
        raise HTTPException(
            status_code=404,
            detail=f"Question ID '{req.question_id}' not found for active learner profile",
        )
    return answer
