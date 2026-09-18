"""Learner Evaluation Pipeline: Authoritative mathematical & diagnostic evaluation module.

Conforms strictly to CONTEXT.md, AGENTS.md, and BACKEND_LOGIC.md:
- §2.2: Technical anomaly filtering via Evidence Validity Gate
- §3.0: 2-Step Bayesian Knowledge Tracing with validity scaling
- §4.0: 2PL Item Response Theory (IRT) ability estimation θ
- §6.0, §7.0, §16.0: Multi-dimensional cognitive scoring, confidence, and 4-tier classification
- §15.0: SuperMemo-2 (SM-2) spaced repetition schedule update
- §5.1, §8.0: Dynamic Prerequisite Barrier dissolve detection across Knowledge Graph
- §17.0: Synchronous 5-Agent LangGraph deliberation and world instruction synchronization
"""

from typing import Dict, List, Optional
from fastapi import HTTPException

from backend.app.agents.coordinator import agent_coordinator
from backend.app.models.evidence import Sm2Record
from backend.app.models.interaction import (
    InteractionRequest,
    InteractionResponse,
    SimulateJumpRequest,
    SimulateJumpResponse,
)
from backend.app.models.learner import MasteryMap
from backend.app.services.bkt_service import bkt_service
from backend.app.services.evidence_gate_service import evidence_gate_service
from backend.app.services.irt_service import irt_service
from backend.app.services.learner_service import WING_DEFINITIONS, learner_service
from backend.app.services.multidimensional_mastery_service import multidimensional_mastery_service
from backend.app.services.prerequisite_service import prerequisite_service
from backend.app.services.sm2_service import sm2_service
from backend.app.services.render_logger import log_interaction_event


class LearnerEvaluationPipeline:
    """Deep module encapsulating the complete Learner Evaluation Pipeline behind a clean interface."""

    def evaluate_challenge(self, req: InteractionRequest) -> InteractionResponse:
        """
        Execute the authoritative 7-stage learning evaluation pipeline for a Challenge interaction:
        1. Evaluate Evidence Validity Gate (§2.2).
        2. Compute 2-Step BKT belief update with validity scaling (§3.0).
        3. Estimate 2PL IRT ability theta (§4.0).
        4. Record multi-dimensional cognitive observation & update confidence (§6, §7, §16).
        5. Update SM-2 spaced repetition decay schedule (§15.0).
        6. Persist atomic learner evidence & evaluate dynamic Prerequisite Barrier dissolve.
        7. Run 5-agent LangGraph deliberation for world synchronization.
        """
        profile = learner_service.get_learner_profile(req.student_id)
        if not profile:
            profile = learner_service.get_active_learner_profile()
            req.student_id = profile.learner_id

        current_map = profile.mastery_map.model_dump()
        if req.concept not in current_map:
            raise HTTPException(status_code=400, detail=f"Unknown concept '{req.concept}'")

        prior_mastery = float(current_map[req.concept])

        # Record prior barrier accessibility states across all Wings for dynamic dissolve detection
        prior_wing_status: Dict[str, str] = {
            wid: prerequisite_service.evaluate_concept(meta["concept"], profile.mastery_map).status
            for wid, meta in WING_DEFINITIONS.items()
        }

        # 1. Evidence Validity Gate (§2.2)
        validity_eval = evidence_gate_service.evaluate_validity(
            evidence_type=req.evidence_type,
            is_timeout=req.is_timeout,
            is_network_error=req.is_network_error,
            response_time_ms=req.response_time_ms,
            fps=req.fps,
            latency_ms=req.network_latency_ms,
        )

        # 2. 2-Step Bayesian Knowledge Tracing with Validity Factor (§3.0)
        posterior_mastery = bkt_service.compute_posterior(
            prior=prior_mastery,
            correct=req.correct,
            concept=req.concept,
            difficulty=req.difficulty,
            validity=validity_eval.validity_score,
        )

        # 3. 2PL IRT Ability Estimation (§4.0)
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

        # 5. SuperMemo-2 Spaced Repetition (§15.0)
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

        # 7. Dynamic Prerequisite Barrier Dissolve Evaluation
        posterior_wing_status: Dict[str, str] = {
            wid: prerequisite_service.evaluate_concept(meta["concept"], updated_profile.mastery_map).status
            for wid, meta in WING_DEFINITIONS.items()
        }

        dissolved_wings: List[str] = [
            wid
            for wid in WING_DEFINITIONS
            if prior_wing_status.get(wid) == "sealed" and posterior_wing_status.get(wid) == "accessible"
        ]

        # Explicit concept-level threshold crossing check for backward compatibility
        threshold_crossed = bool(dissolved_wings) or (prior_mastery < 0.70 and posterior_mastery >= 0.70)
        unlocked_wing = (
            dissolved_wings[0]
            if dissolved_wings
            else ("recursion_lab" if (req.concept == "stack" and threshold_crossed) else None)
        )

        # Fetch updated world state delta
        world_delta = learner_service.get_world_state(req.student_id)

        # Stream BKT interaction event to Render live logs
        log_interaction_event(
            student_id=req.student_id,
            concept=req.concept,
            question_id=req.question_id,
            correct=req.correct,
            prior_mastery=prior_mastery,
            posterior_mastery=posterior_mastery,
            threshold_crossed=threshold_crossed,
        )

        # 8. Run 5-agent deliberation workflow
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

    def simulate_mastery_jump(self, req: SimulateJumpRequest) -> SimulateJumpResponse:
        """
        Accelerate learner mastery to target value (e.g. 38% -> 74% for Stack) in a single transaction,
        reusing dynamic Prerequisite Barrier dissolve detection and Agent Deliberation.
        """
        profile = learner_service.get_learner_profile(req.learner_id)
        if not profile:
            profile = learner_service.get_active_learner_profile()
            req.learner_id = profile.learner_id

        current_map = profile.mastery_map.model_dump()
        prior_mastery = float(current_map.get(req.concept, 0.38))

        # Record prior barrier accessibility states across all Wings
        prior_wing_status: Dict[str, str] = {
            wid: prerequisite_service.evaluate_concept(meta["concept"], profile.mastery_map).status
            for wid, meta in WING_DEFINITIONS.items()
        }

        # Update concept mastery directly
        updated_profile = learner_service.update_concept_mastery(
            learner_id=req.learner_id,
            concept=req.concept,
            new_mastery=req.target_mastery,
        )

        # Record posterior barrier accessibility states across all Wings
        posterior_wing_status: Dict[str, str] = {
            wid: prerequisite_service.evaluate_concept(meta["concept"], updated_profile.mastery_map).status
            for wid, meta in WING_DEFINITIONS.items()
        }

        dissolved_wings: List[str] = [
            wid
            for wid in WING_DEFINITIONS
            if prior_wing_status.get(wid) == "sealed" and posterior_wing_status.get(wid) == "accessible"
        ]

        threshold_crossed = bool(dissolved_wings) or (prior_mastery < 0.70 and req.target_mastery >= 0.70)
        unlocked_wing = (
            dissolved_wings[0]
            if dissolved_wings
            else ("recursion_lab" if (req.concept == "stack" and threshold_crossed) else None)
        )

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


learner_evaluation_service = LearnerEvaluationPipeline()
