"""Evidence and mathematical models conforming to BACKEND_LOGIC.md.

Covers:
- Evidence Validity Gate (§2)
- Multi-dimensional Mastery streams (§6)
- ZPD Candidate Tasks (§9, §10, §11)
- SM-2 Spaced Repetition Record (§15)
- Network-Aware Context (§18)
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class EvidenceType(str, Enum):
    COGNITIVE_ASSESSMENT = "COGNITIVE_ASSESSMENT"
    FEYNMAN_VERIFICATION = "FEYNMAN_VERIFICATION"
    LAB_MANIPULATION = "LAB_MANIPULATION"
    EXPLORATORY_WALK = "EXPLORATORY_WALK"
    TECHNICAL_TELEMETRY = "TECHNICAL_TELEMETRY"
    HINT_USAGE = "HINT_USAGE"


class EvidenceValidity(BaseModel):
    """Result of Evidence Validity Gate (§2.2)."""
    valid: bool = Field(..., description="Whether event contains valid learning evidence")
    validity_score: float = Field(default=1.0, ge=0.0, le=1.0, description="V_i factor in [0, 1]")
    reason: str = Field(default="VALID_COGNITIVE_OUTCOME", description="Explanation of validity rating")
    is_technical_telemetry: bool = Field(default=False, description="True if purely network/device context")


class CognitiveDimensionScores(BaseModel):
    """Multi-dimensional performance breakdown for a concept (§6)."""
    recall: float = Field(default=0.50, ge=0.0, le=1.0, description="Memory retrieval score")
    understanding: float = Field(default=0.50, ge=0.0, le=1.0, description="Conceptual explanation score")
    application: float = Field(default=0.50, ge=0.0, le=1.0, description="Direct procedural implementation score")
    problem_solving: float = Field(default=0.50, ge=0.0, le=1.0, description="Synthesis & novel troubleshooting score")
    transfer: float = Field(default=0.40, ge=0.0, le=1.0, description="Cross-domain / out-of-context mastery")
    retention: float = Field(default=0.50, ge=0.0, le=1.0, description="Long-term persistence score")


class NetworkContext(BaseModel):
    """Client network & hardware context (§18)."""
    bandwidth_class: str = Field(default="GOOD_NETWORK", description="GOOD_NETWORK | LIMITED_NETWORK | VERY_LOW_NETWORK")
    latency_ms: float = Field(default=45.0, description="Round-trip network latency")
    fps: float = Field(default=60.0, description="Client frame rate")
    device_class: str = Field(default="desktop", description="desktop | mobile | tablet")
    connection_stability: float = Field(default=0.98, ge=0.0, le=1.0)


class ItemParameter(BaseModel):
    """2PL Item Response Theory (IRT) Item Parameters (§4)."""
    item_id: str
    concept_id: str
    a_discrimination: float = Field(default=1.20, ge=0.1, le=4.0, description="Item discrimination parameter a_i")
    b_difficulty: float = Field(default=0.0, ge=-4.0, le=4.0, description="Item difficulty parameter b_i")
    dimension: str = Field(default="understanding", description="Target cognitive dimension")


class CandidateTask(BaseModel):
    """Educational activity evaluated by ZPD Gaussian-gain planner (§9, §10, §11)."""
    task_id: str
    task_type: str = Field(..., description="quiz | feynman | 3d_mission | trace | worked_example | transfer")
    concept_id: str
    difficulty_b: float = Field(default=0.0, description="Difficulty on IRT scale [-4, 4]")
    expected_gain: float = Field(default=0.15, description="Raw expected mastery increase ΔM_c(a)")
    zpd_factor: float = Field(default=1.0, description="Gaussian ZPD factor exp(-(d - θ)^2 / (2σ^2))")
    prerequisite_weight: float = Field(default=1.0, description="W_c downstream dependency weight")
    cost: float = Field(default=0.10, description="Cognitive or temporal intervention cost")
    utility: float = Field(default=0.0, description="Net task utility Utility(a, c)")
    reason: str = Field(default="", description="Planner pedagogical rationale")


class Sm2Record(BaseModel):
    """SuperMemo-2 spaced repetition state for a concept (§15)."""
    concept_id: str
    easiness_factor: float = Field(default=2.50, ge=1.30, description="Easiness factor EF >= 1.3")
    repetitions: int = Field(default=0, ge=0, description="Consecutive successful reviews")
    interval_days: int = Field(default=1, ge=1, description="Interval until next review")
    last_reviewed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    next_review_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
