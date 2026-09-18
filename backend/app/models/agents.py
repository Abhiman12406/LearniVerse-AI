"""Pydantic models for 5-Agent LangGraph Deliberation Pipeline conforming to AGENTS.md."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentTraceItem(BaseModel):
    """Execution trace entry for a single agent step in the deliberation pipeline."""
    agent_name: str = Field(..., description="Name of the executing agent")
    stage: str = Field(..., description="Pipeline stage identifier")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 timestamp of step execution",
    )
    duration_ms: float = Field(default=0.0, description="Execution duration in milliseconds")
    status: str = Field(default="SUCCESS", description="SUCCESS | CERTIFIED | OVERRULED | FALLBACK")
    input_summary: Dict[str, Any] = Field(default_factory=dict, description="Summary of input context")
    output_summary: Dict[str, Any] = Field(default_factory=dict, description="Summary of agent output")
    reasoning: str = Field(default="", description="Detailed pedagogical reasoning or audit log")


class PlannerProposal(BaseModel):
    """Proposal synthesized by the Planner Agent prior to deterministic guardrail validation."""
    action: str = Field(..., description="Pedagogical action: LEARN | PRACTICE | REMEDIATE | CHALLENGE | REVIEW")
    concept: str = Field(..., description="Target DSA concept: array | linked_list | stack | recursion | tree")
    difficulty: str = Field(default="medium", description="Challenge difficulty: easy | medium | hard")
    reason: str = Field(..., description="Pedagogical rationale behind the proposed action")
    mode: str = Field(default="deterministic_fallback", description="gemini | deterministic_fallback")


class ValidationResult(BaseModel):
    """Outcome of the Validator Agent deterministic DAG guardrail verification."""
    guardrail_status: str = Field(..., description="CERTIFIED | OVERRULED")
    certified: bool = Field(..., description="True if compliant with prerequisite DAG thresholds")
    enforced_action: str = Field(..., description="Final certified or overruled action")
    enforced_concept: str = Field(..., description="Final certified or overruled concept")
    enforced_difficulty: str = Field(..., description="Final difficulty level")
    justification: str = Field(..., description="Mathematical or policy reason for certification or overrule")
    checked_prerequisite: Optional[str] = Field(None, description="Prerequisite concept evaluated, if any")
    required_threshold: Optional[float] = Field(None, description="Required mastery threshold, if any")
    current_mastery: Optional[float] = Field(None, description="Learner's current mastery on required concept")


class WorldInstructions(BaseModel):
    """Structured environment commands produced by the Game Agent."""
    wing_barriers: Dict[str, Dict[str, Any]] = Field(
        ..., description="Access status ('accessible' | 'sealed') and reason per Wing"
    )
    recommended_station: str = Field(..., description="Target station ID (e.g. stack_lab)")
    conduits_target_wing: str = Field(..., description="Wing toward which floor Conduits pulse")
    active_mission: Dict[str, Any] = Field(..., description="Assigned mission specification")
    mentor_guidance: Dict[str, Any] = Field(..., description="AI Mentor dialog, greeting, and Feynman analogy")


class FinalDecision(BaseModel):
    """Consolidated authoritative pedagogical decision."""
    action: str = Field(..., description="Final pedagogical action")
    concept: str = Field(..., description="Final target concept")
    difficulty: str = Field(..., description="Final challenge difficulty")
    reason: str = Field(..., description="Explanatory rationale")
    certified: bool = Field(..., description="Whether certified by deterministic guardrails")
    guardrail_status: str = Field(..., description="CERTIFIED | OVERRULED")
    overruled: bool = Field(default=False, description="True if Planner proposal was rejected and altered")
    overruling_reason: Optional[str] = Field(None, description="Explanation if overruled by guardrails")


class DeliberationRequest(BaseModel):
    """Request payload to initiate 5-agent deliberation."""
    student_id: str = Field(default="learner_b", description="Unique learner identifier")
    target_concept: Optional[str] = Field(None, description="Optional aspirational concept to evaluate")
    force_proposal: Optional[Dict[str, Any]] = Field(
        None, description="Optional manual planner proposal injection for testing guardrail overrules"
    )


class DeliberationResponse(BaseModel):
    """Complete response payload containing final decision, world commands, and execution traces."""
    student_id: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    llm_mode: str = Field(default="deterministic_fallback", description="gemini | deterministic_fallback")
    final_decision: FinalDecision
    world_instructions: WorldInstructions
    traces: List[AgentTraceItem] = Field(default_factory=list)
