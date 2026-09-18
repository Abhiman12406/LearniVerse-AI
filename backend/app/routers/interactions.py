"""Interaction and Mastery Jump API endpoints implementing the BKT loop."""

from fastapi import APIRouter, HTTPException
from backend.app.agents.coordinator import agent_coordinator
from backend.app.models.interaction import (
    InteractionRequest,
    InteractionResponse,
    SimulateJumpRequest,
    SimulateJumpResponse,
)
from backend.app.models.evidence import Sm2Record
from backend.app.services.bkt_service import bkt_service
from backend.app.services.evidence_gate_service import evidence_gate_service
from backend.app.services.irt_service import irt_service
from backend.app.services.learner_service import learner_service
from backend.app.services.multidimensional_mastery_service import multidimensional_mastery_service
from backend.app.services.sm2_service import sm2_service

router = APIRouter(prefix="/api", tags=["Interactions & BKT"])


@router.post("/interactions", response_model=InteractionResponse)
def record_interaction(req: InteractionRequest) -> InteractionResponse:
    """
    Evidence-based learning interaction endpoint conforming to BACKEND_LOGIC.md:
    1. Evaluates Evidence Validity Gate (§2) - decouples technical errors from learning evidence.
    2. Calculates 2-Step BKT belief update with validity scaling (§3).
    3. Updates 2PL Item Response Theory (IRT) ability estimate θ (§4).
    4. Records multi-dimensional cognitive dimension observation & updates confidence (§6, §7).
    5. Updates SuperMemo-2 (SM-2) spaced repetition schedule (§15).
    6. Re-evaluates curriculum DAG barriers & runs 5-agent deliberation workflow (§5, §17).
    """
    profile = learner_service.get_learner_profile(req.student_id)
    if not profile:
        profile = learner_service.get_active_learner_profile()
        req.student_id = profile.learner_id

    # 1. Evidence Validity Gate (§2.2)
    validity_eval = evidence_gate_service.evaluate_validity(
        evidence_type=req.evidence_type,
        is_timeout=req.is_timeout,
        is_network_error=req.is_network_error,
        response_time_ms=req.response_time_ms,
        fps=req.fps,
        latency_ms=req.network_latency_ms,
    )

    current_map = profile.mastery_map.model_dump()
    if req.concept not in current_map:
        raise HTTPException(status_code=400, detail=f"Unknown concept '{req.concept}'")

    prior_mastery = float(current_map[req.concept])

    # 2. 2-Step Bayesian Knowledge Tracing with Validity Factor (§3)
    posterior_mastery = bkt_service.compute_posterior(
        prior=prior_mastery,
        correct=req.correct,
        concept=req.concept,
        difficulty=req.difficulty,
        validity=validity_eval.validity_score,
    )

    # 3. 2PL IRT Ability Estimation (§4)
    if validity_eval.valid:
        irt_service.record_response(
            student_id=req.student_id,
            concept=req.concept,
            item_id=req.question_id,
            correct=req.correct,
            difficulty_level=req.difficulty,
        )
        theta = irt_service.estimate_ability(req.student_id, req.concept)
    else:
        theta = profile.ability_irt.get(req.concept, 0.0)

    # 4. Multi-Dimensional Cognitive Stream & Confidence (§6, §7, §16)
    if validity_eval.valid:
        dim_target = "application" if req.difficulty == "hard" else "understanding"
        multidimensional_mastery_service.record_observation(
            student_id=req.student_id,
            concept=req.concept,
            correct=req.correct,
            dimension=dim_target,
        )

    confidence = multidimensional_mastery_service.compute_confidence(req.student_id, req.concept)
    classification = multidimensional_mastery_service.classify_mastery(
        req.student_id, req.concept, posterior_mastery, current_map
    )
    dim_scores = multidimensional_mastery_service.compute_dimensions(req.student_id, req.concept).model_dump()

    # 5. SuperMemo-2 Spaced Repetition (§15)
    existing_sm2_raw = profile.sm2_records.get(req.concept)
    if existing_sm2_raw:
        sm2_rec = Sm2Record(**existing_sm2_raw)
    else:
        sm2_rec = sm2_service.create_initial_record(req.concept)

    q_score = sm2_service.map_performance_to_quality(
        correct=req.correct,
        response_time_ms=float(req.response_time_ms or 5000),
        validity=validity_eval.validity_score,
    )
    updated_sm2 = sm2_service.update_schedule(sm2_rec, q_score)

    # 6. Update Learner State Atomically
    updated_profile = learner_service.update_learner_evidence(
        learner_id=req.student_id,
        concept=req.concept,
        new_mastery=posterior_mastery,
        theta=theta,
        confidence=confidence,
        classification=classification,
        dimension_scores=dim_scores,
        sm2_record=updated_sm2.model_dump(),
    )

    # 7. Check Prerequisite Threshold Crossing (e.g. 70% threshold for Stack -> Recursion)
    threshold_crossed = (prior_mastery < 0.70) and (posterior_mastery >= 0.70)
    unlocked_wing = "recursion_lab" if (req.concept == "stack" and threshold_crossed) else None

    # Fetch updated world state delta
    world_delta = learner_service.get_world_state(req.student_id)

    # Run 5-agent deliberation workflow
    deliberation_resp = agent_coordinator.run_deliberation(
        student_id=req.student_id,
    )

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
        validity_score=validity_eval.validity_score,
        evidence_valid=validity_eval.valid,
        irt_ability=theta,
        confidence=confidence,
        classification=classification,
        sm2_next_review=updated_sm2.next_review_at,
        learner_profile=updated_profile,
        world_delta=world_delta,
        deliberation=deliberation_resp,
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

    # Run 5-agent deliberation to update world instructions and traces
    deliberation_resp = agent_coordinator.run_deliberation(
        student_id=req.learner_id,
    )

    return SimulateJumpResponse(
        learner_id=req.learner_id,
        concept=req.concept,
        prior_mastery=prior_mastery,
        posterior_mastery=req.target_mastery,
        threshold_crossed=threshold_crossed,
        unlocked_wing=unlocked_wing,
        learner_profile=updated_profile,
        world_state=world_state,
        deliberation=deliberation_resp,
    )
