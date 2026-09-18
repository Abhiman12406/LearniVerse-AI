"""Domain models for interactions, BKT belief updates, and mastery jumps."""

from typing import Optional
from pydantic import BaseModel, Field
from backend.app.models.agents import DeliberationResponse
from backend.app.models.learner import LearnerProfile, WorldState


class InteractionRequest(BaseModel):
    student_id: str = Field(..., description="Unique learner identifier (e.g. learner_b)")
    concept: str = Field(..., description="Target concept being assessed (e.g. stack)")
    question_id: str = Field(..., description="Assessed question or challenge identifier")
    correct: bool = Field(..., description="Whether the response was correct")
    response_time_ms: Optional[int] = Field(None, description="Time taken to submit in milliseconds")
    difficulty: str = Field(default="medium", description="Question difficulty: easy | medium | hard")
    is_timeout: bool = Field(default=False, description="Technical timeout flag (§2.2 Rule A)")
    is_network_error: bool = Field(default=False, description="Network or delivery failure flag (§2.2)")
    network_latency_ms: Optional[float] = Field(None, description="Telemetry latency")
    fps: Optional[float] = Field(None, description="Client frame rate telemetry")
    evidence_type: str = Field(default="COGNITIVE_ASSESSMENT", description="Category of interaction (§2.1)")


class InteractionResponse(BaseModel):
    student_id: str
    concept: str
    question_id: str
    correct: bool
    prior_mastery: float
    posterior_mastery: float
    delta: float
    threshold_crossed: bool
    unlocked_wing: Optional[str] = None
    validity_score: float = Field(default=1.0, description="Evidence validity factor V_i in [0, 1] (§2.2)")
    evidence_valid: bool = Field(default=True, description="Whether event generated valid cognitive evidence")
    irt_ability: Optional[float] = Field(None, description="Updated 2PL IRT ability estimate θ (§4)")
    confidence: Optional[float] = Field(None, description="Confidence in estimate C_c in [0, 1] (§7)")
    classification: Optional[str] = Field(None, description="Mastery tier: HIGH | MEDIUM | LOW | UNCERTAIN (§16)")
    sm2_next_review: Optional[str] = Field(None, description="ISO timestamp for SM-2 spaced review (§15)")
    learner_profile: LearnerProfile
    world_delta: WorldState
    deliberation: Optional[DeliberationResponse] = None


class SimulateJumpRequest(BaseModel):
    learner_id: str = Field(default="learner_b", description="Learner ID to accelerate")
    concept: str = Field(default="stack", description="Concept to accelerate (e.g. stack)")
    target_mastery: float = Field(default=0.74, ge=0.0, le=1.0, description="Target mastery probability")


class SimulateJumpResponse(BaseModel):
    learner_id: str
    concept: str
    prior_mastery: float
    posterior_mastery: float
    threshold_crossed: bool
    unlocked_wing: Optional[str] = None
    learner_profile: LearnerProfile
    world_state: WorldState
    deliberation: Optional[DeliberationResponse] = None
