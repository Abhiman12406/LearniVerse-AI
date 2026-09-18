"""Interaction and Mastery Jump API endpoints implementing the BKT loop.

Paper-thin HTTP adapter delegating all mathematical evidence updates, dynamic
Prerequisite Barrier dissolve detection, and agent deliberation to the deepened
Learner Evaluation Pipeline module.
"""

from fastapi import APIRouter
from backend.app.models.interaction import (
    InteractionRequest,
    InteractionResponse,
    SimulateJumpRequest,
    SimulateJumpResponse,
)
from backend.app.services.learner_evaluation_service import learner_evaluation_service

router = APIRouter(prefix="/api", tags=["Interactions & BKT"])


@router.post("/interactions", response_model=InteractionResponse)
def record_interaction(req: InteractionRequest) -> InteractionResponse:
    """Evidence-based learning interaction endpoint conforming to BACKEND_LOGIC.md and CONTEXT.md.

    Delegates full multi-stage evaluation to LearnerEvaluationPipeline.
    """
    return learner_evaluation_service.evaluate_challenge(req)


@router.post("/simulate-mastery-jump", response_model=SimulateJumpResponse)
def simulate_mastery_jump(req: SimulateJumpRequest) -> SimulateJumpResponse:
    """Accelerate learner mastery to target value in a single transaction for live judging.

    Delegates to LearnerEvaluationPipeline, sharing dynamic barrier dissolve and agent deliberation.
    """
    return learner_evaluation_service.simulate_mastery_jump(req)
