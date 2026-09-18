"""Interaction and Mastery Jump API endpoints implementing the BKT loop."""

from fastapi import APIRouter, HTTPException
from backend.app.models.interaction import (
    InteractionRequest,
    InteractionResponse,
    SimulateJumpRequest,
    SimulateJumpResponse,
)
from backend.app.services.bkt_service import bkt_service
from backend.app.services.learner_service import learner_service

router = APIRouter(prefix="/api", tags=["Interactions & BKT"])


@router.post("/interactions", response_model=InteractionResponse)
def record_interaction(req: InteractionRequest) -> InteractionResponse:
    """
    Receive student challenge answer, calculate Bayesian Knowledge Tracing (BKT) posterior,
    update authoritative learner profile and return updated world delta.
    """
    profile = learner_service.get_learner_profile(req.student_id)
    if not profile:
        profile = learner_service.get_active_learner_profile()
        req.student_id = profile.learner_id

    # Extract current concept mastery prior
    current_map = profile.mastery_map.model_dump()
    if req.concept not in current_map:
        raise HTTPException(status_code=400, detail=f"Unknown concept '{req.concept}'")

    prior_mastery = float(current_map[req.concept])

    # Compute posterior via BKT belief update
    posterior_mastery = bkt_service.compute_posterior(
        prior=prior_mastery,
        correct=req.correct,
        concept=req.concept,
        difficulty=req.difficulty,
    )

    # Persist updated mastery to learner profile and re-evaluate readiness
    updated_profile = learner_service.update_concept_mastery(
        learner_id=req.student_id,
        concept=req.concept,
        new_mastery=posterior_mastery,
    )

    # Check for prerequisite threshold crossing (e.g. 70% threshold for Stack -> Recursion)
    threshold_crossed = (prior_mastery < 0.70) and (posterior_mastery >= 0.70)
    unlocked_wing = "recursion_lab" if (req.concept == "stack" and threshold_crossed) else None

    # Fetch updated world state delta
    world_delta = learner_service.get_world_state(req.student_id)

    return InteractionResponse(
        student_id=req.student_id,
        concept=req.concept,
        question_id=req.question_id,
        correct=req.correct,
        prior_mastery=prior_mastery,
        posterior_mastery=posterior_mastery,
        delta=round(posterior_mastery - prior_mastery, 2),
        threshold_crossed=threshold_crossed,
        unlocked_wing=unlocked_wing,
        learner_profile=updated_profile,
        world_delta=world_delta,
    )


@router.post("/simulate-mastery-jump", response_model=SimulateJumpResponse)
def simulate_mastery_jump(req: SimulateJumpRequest) -> SimulateJumpResponse:
    """
    Accelerate learner mastery to target value (e.g. 38% -> 74% for Stack) in a single call
    for live demonstration and judging presentations.
    """
    profile = learner_service.get_learner_profile(req.learner_id)
    if not profile:
        profile = learner_service.get_active_learner_profile()
        req.learner_id = profile.learner_id

    current_map = profile.mastery_map.model_dump()
    prior_mastery = float(current_map.get(req.concept, 0.38))

    # Update concept mastery directly
    updated_profile = learner_service.update_concept_mastery(
        learner_id=req.learner_id,
        concept=req.concept,
        new_mastery=req.target_mastery,
    )

    threshold_crossed = (prior_mastery < 0.70) and (req.target_mastery >= 0.70)
    unlocked_wing = "recursion_lab" if (req.concept == "stack" and threshold_crossed) else None
    world_state = learner_service.get_world_state(req.learner_id)

    return SimulateJumpResponse(
        learner_id=req.learner_id,
        concept=req.concept,
        prior_mastery=prior_mastery,
        posterior_mastery=req.target_mastery,
        threshold_crossed=threshold_crossed,
        unlocked_wing=unlocked_wing,
        learner_profile=updated_profile,
        world_state=world_state,
    )
