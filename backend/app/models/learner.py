"""Domain models for Learner and Classroom World state conforming to CONTEXT.md."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class MasteryMap(BaseModel):
    array: float = Field(default=0.5, ge=0.0, le=1.0)
    linked_list: float = Field(default=0.5, ge=0.0, le=1.0)
    stack: float = Field(default=0.5, ge=0.0, le=1.0)
    recursion: float = Field(default=0.5, ge=0.0, le=1.0)
    tree: float = Field(default=0.5, ge=0.0, le=1.0)


class LearningState(BaseModel):
    status: str = Field(..., description="E.g., remediation_required, advanced, progressing")
    summary: str = Field(..., description="High-level pedagogical diagnostic summary")
    primary_focus_concept: str = Field(..., description="Active concept needing practice or challenge")
    active_prerequisite_gap: Optional[str] = Field(None, description="Current concept with an unsatisfied prerequisite")


class LearnerProfile(BaseModel):
    learner_id: str = Field(..., description="Unique authoritative identifier for the Learner")
    name: str = Field(..., description="Learner display name")
    persona_type: str = Field(..., description="Learner A (Advanced) or Learner B (Remedial)")
    learning_state: LearningState
    mastery_map: MasteryMap
    active_wing: str = Field(default="atrium", description="Current spatial Wing or Atrium location")
    recommended_station: str = Field(..., description="Target station recommended by the learning policy")


class WingInfo(BaseModel):
    wing_id: str
    name: str
    concept: str
    status: str = Field(..., description="accessible | sealed")
    azimuth_deg: float
    coordinates: List[float] = Field(..., description="[x, y, z] target entrance coordinates")
    required_mastery: Optional[Dict[str, float]] = None
    reason: Optional[str] = None


class WorldState(BaseModel):
    active_learner_id: str
    atrium_radius: float = 18.0
    wings: Dict[str, WingInfo]
    conduits_target_wing: str = Field(..., description="Wing toward which floor Conduits actively pulse")


class SwitchLearnerRequest(BaseModel):
    learner_id: str
