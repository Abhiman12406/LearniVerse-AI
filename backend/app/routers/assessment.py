"""AI Diagnostic Assessment API Router.

Serves 5-question baseline assessments across the Data Structures curriculum graph
(Array, Linked List, Stack, Recursion, Tree) generated via Gemini AI with resilient
curated offline question bank fallback, and handles submission evaluation.
"""

from fastapi import APIRouter, Query
from backend.app.models.assessment import (
    DiagnosticAssessmentResponse,
    DiagnosticSubmissionRequest,
    DiagnosticSubmissionResponse,
)
from backend.app.services.diagnostic_service import diagnostic_service

router = APIRouter(prefix="/api/assessment", tags=["AI Diagnostic Assessment"])


@router.get("/diagnostic", response_model=DiagnosticAssessmentResponse)
def get_diagnostic_assessment(
    force_refresh: bool = Query(
        False, description="Attempt dynamic regeneration via Gemini AI instead of default curated bank"
    )
) -> DiagnosticAssessmentResponse:
    """Generate or retrieve a 5-question diagnostic assessment across Array, Linked List, Stack, Recursion, Tree."""
    return diagnostic_service.generate_assessment(force_refresh=force_refresh)


@router.post("/submit", response_model=DiagnosticSubmissionResponse)
def submit_diagnostic_assessment(
    req: DiagnosticSubmissionRequest,
) -> DiagnosticSubmissionResponse:
    """Submit learner answers for the 5 diagnostic questions and receive evaluation scores and reviews."""
    return diagnostic_service.evaluate_submission(req)
