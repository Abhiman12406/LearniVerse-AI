"""Domain models for Learner and Classroom World state conforming to CONTEXT.md."""

from typing import Any, Dict, List, Optional
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
    ability_irt: Dict[str, float] = Field(default_factory=lambda: {"array": 0.0, "linked_list": 0.0, "stack": 0.0, "recursion": 0.0, "tree": 0.0}, description="2PL IRT ability estimate θ in [-4, 4] (§4)")
    confidence_map: Dict[str, float] = Field(default_factory=lambda: {"array": 0.8, "linked_list": 0.7, "stack": 0.4, "recursion": 0.3, "tree": 0.2}, description="Confidence estimate C_c = 1 - exp(-n/κ) in [0, 1] (§7)")
    dimensions_map: Dict[str, Dict[str, float]] = Field(default_factory=dict, description="Multi-dimensional mastery streams (§6)")
    sm2_records: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="SuperMemo-2 spaced repetition state (§15)")
    mastery_classification: Dict[str, str] = Field(default_factory=lambda: {"array": "HIGH", "linked_list": "MEDIUM", "stack": "LOW", "recursion": "LOW", "tree": "UNCERTAIN"}, description="HIGH | MEDIUM | LOW | UNCERTAIN (§16)")
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


class UpdateMasteryRequest(BaseModel):
    learner_id: Optional[str] = None
    concept: str
    mastery: float = Field(..., ge=0.0, le=1.0)


class SimulateJumpRequest(BaseModel):
    learner_id: Optional[str] = "learner_b"
    target_stack: float = Field(default=0.75, ge=0.0, le=1.0)
