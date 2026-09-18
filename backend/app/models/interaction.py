"""Domain models for interactions, BKT belief updates, and mastery jumps."""

from typing import Optional
from pydantic import BaseModel, Field
from backend.app.models.learner import LearnerProfile, WorldState


class InteractionRequest(BaseModel):
    student_id: str = Field(..., description="Unique learner identifier (e.g. learner_b)")
    concept: str = Field(..., description="Target concept being assessed (e.g. stack)")
    question_id: str = Field(..., description="Assessed question or challenge identifier")
    correct: bool = Field(..., description="Whether the response was correct")
    response_time_ms: Optional[int] = Field(None, description="Time taken to submit in milliseconds")
    difficulty: str = Field(default="medium", description="Question difficulty: easy | medium | hard")


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
    learner_profile: LearnerProfile
    world_delta: WorldState


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
