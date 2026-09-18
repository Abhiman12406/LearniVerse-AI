"""Agents and Deliberation API router conforming to AGENTS.md and CONTEXT.md."""

from typing import Optional
from fastapi import APIRouter, HTTPException
from backend.app.agents.coordinator import agent_coordinator
from backend.app.models.agents import DeliberationRequest, DeliberationResponse
from backend.app.services.learner_service import learner_service

router = APIRouter(prefix="/api", tags=["Agents & Deliberation"])


@router.post("/agents/deliberate", response_model=DeliberationResponse)
def deliberate(req: DeliberationRequest) -> DeliberationResponse:
    """
    Execute the sequential 5-Agent LangGraph Deliberation Pipeline:
    Context Agent -> Diagnostic Agent -> Planner Agent -> Validator Agent -> Game Agent
    Returns structured execution traces, deterministic guardrail validation, and world commands.
    """
    profile = learner_service.get_learner_profile(req.student_id)
    if not profile:
        profile = learner_service.get_active_learner_profile()
        req.student_id = profile.learner_id

    return agent_coordinator.run_deliberation(
        student_id=req.student_id,
        target_concept=req.target_concept,
        force_proposal=req.force_proposal,
    )


@router.get("/agents/latest/{learner_id}", response_model=DeliberationResponse)
def get_latest_deliberation(learner_id: str) -> DeliberationResponse:
    """Retrieve the latest cached deliberation trace for a learner (used by Telemetry Drawer)."""
    profile = learner_service.get_learner_profile(learner_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Learner '{learner_id}' not found")

    return agent_coordinator.get_latest_deliberation(learner_id)


@router.post("/learning/next-action")
def get_next_learning_action(req: Optional[DeliberationRequest] = None):
    """
    Core AGENTS.md contract endpoint: determines next best pedagogical action for a learner.
    Enforces deterministic prerequisite guardrails and returns structured decision.
    """
    student_id = req.student_id if req else learner_service.get_active_learner_id()
    target_concept = req.target_concept if req else None
    force_proposal = req.force_proposal if req else None

    delib_resp = agent_coordinator.run_deliberation(
        student_id=student_id,
        target_concept=target_concept,
        force_proposal=force_proposal,
    )

    decision = delib_resp.final_decision
    return {
        "student_id": student_id,
        "action": decision.action,
        "concept": decision.concept,
        "difficulty": decision.difficulty,
        "reason": decision.reason,
        "certified": decision.certified,
        "guardrail_status": decision.guardrail_status,
        "overruled": decision.overruled,
        "overruling_reason": decision.overruling_reason,
        "recommended_station": delib_resp.world_instructions.recommended_station,
        "llm_mode": delib_resp.llm_mode,
        "traces_count": len(delib_resp.traces),
    }
