"""Domain models for AI Diagnostic Assessment, questions, and evaluation."""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class DiagnosticOption(BaseModel):
    id: str = Field(..., description="Unique option identifier (e.g. opt_arr_01_a)")
    label: str = Field(..., description="Option letter: A, B, C, or D")
    text: str = Field(..., description="Text content of the option")
    explanation: str = Field(..., description="Pedagogical explanation of why this option is correct or incorrect")


class DiagnosticQuestion(BaseModel):
    id: str = Field(..., description="Unique question identifier (e.g. diag_arr_01)")
    concept: str = Field(..., description="Curriculum concept: array | linked_list | stack | recursion | tree")
    concept_title: str = Field(..., description="Human-readable concept title")
    difficulty: str = Field(default="medium", description="Question difficulty: easy | medium | hard")
    title: str = Field(..., description="Concise question title")
    scenario: str = Field(..., description="Narrative problem scenario")
    code_snippet: Optional[List[str]] = Field(default=None, description="Formatted code snippet lines")
    options: List[DiagnosticOption] = Field(..., description="Exactly 4 multiple choice options")
    correct_option_id: str = Field(..., description="ID of the correct option")
    hint: str = Field(..., description="Pedagogical hint")
    feynman_analogy: str = Field(..., description="Real-world intuition/analogy")
    pedagogical_objective: str = Field(..., description="Target knowledge evaluation objective")


class DiagnosticAssessmentResponse(BaseModel):
    assessment_id: str = Field(..., description="Unique assessment session identifier")
    title: str = Field(default="Adaptive Virtual Campus Diagnostic Assessment", description="Assessment title")
    description: str = Field(
        default="Baseline cognitive diagnostic across the Data Structures curriculum DAG.",
        description="Assessment description",
    )
    concepts: List[str] = Field(
        default_factory=lambda: ["array", "linked_list", "stack", "recursion", "tree"],
        description="Concepts covered in curriculum order",
    )
    questions: List[DiagnosticQuestion] = Field(..., description="5 diagnostic questions in DAG topological order")
    generated_by: str = Field(default="offline_curated", description="Source: gemini | offline_curated")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Generation timestamp",
    )


class DiagnosticSubmissionRequest(BaseModel):
    student_id: str = Field(default="learner_b", description="Learner ID submitting the diagnostic")
    assessment_id: str = Field(..., description="Assessment ID being submitted")
    answers: Dict[str, str] = Field(..., description="Map of question_id to selected option_id")
    time_taken_ms: Optional[int] = Field(None, description="Total time taken to complete the test in ms")


from backend.app.models.learner import LearnerProfile, WorldState


class DiagnosticAnswerReview(BaseModel):
    question_id: str
    concept: str
    selected_option_id: Optional[str]
    correct_option_id: str
    is_correct: bool
    explanation: str
    title: str


class DiagnosticBktDelta(BaseModel):
    concept: str = Field(..., description="Curriculum concept: array | linked_list | stack | recursion | tree")
    concept_title: str = Field(..., description="Human-readable concept title")
    prior_mastery: float = Field(..., description="Prior mastery belief P(L_{t-1}) in [0, 1]")
    posterior_mastery: float = Field(..., description="Posterior mastery belief P(L_t) in [0, 1]")
    delta: float = Field(..., description="Mastery delta ΔM = P(L_t) - P(L_{t-1})")
    is_correct: bool = Field(..., description="Whether the diagnostic question was answered correctly")
    irt_ability: float = Field(default=0.0, description="Estimated 2PL IRT ability theta in [-4, 4]")
    confidence: float = Field(default=0.5, description="Confidence estimate in [0, 1]")
    classification: str = Field(default="MEDIUM", description="Classification tier: HIGH | MEDIUM | LOW | UNCERTAIN")
    barrier_status: str = Field(default="accessible", description="Corresponding wing barrier status: accessible | sealed")
    barrier_reason: Optional[str] = Field(None, description="Barrier lock explanation if sealed")


class BarrierRecalculationDetail(BaseModel):
    wing_id: str = Field(..., description="Wing identifier: array_station | linked_list_lab | stack_lab | recursion_lab | tree_lab")
    name: str = Field(..., description="Wing human-readable name")
    concept: str = Field(..., description="Wing curriculum concept")
    status: str = Field(..., description="Current status: accessible | sealed")
    is_ready: bool = Field(..., description="Whether prerequisite threshold constraints are satisfied")
    was_sealed: bool = Field(default=False, description="Whether wing was sealed prior to evaluation")
    is_sealed: bool = Field(default=False, description="Whether wing is sealed after evaluation")
    dissolved: bool = Field(default=False, description="True if wing transitioned from sealed to accessible")
    reason: Optional[str] = Field(None, description="Prerequisite threshold explanation")
    required_mastery: Optional[Dict[str, float]] = Field(None, description="Threshold requirements")


class DiagnosticSubmissionResponse(BaseModel):
    assessment_id: str
    student_id: str
    total_questions: int
    answered_count: int
    correct_count: int
    score_percentage: float
    reviews: List[DiagnosticAnswerReview]
    concept_breakdown: Dict[str, bool]
    bkt_updates: List[DiagnosticBktDelta] = Field(default_factory=list, description="BKT belief update deltas per concept")
    barrier_recalculations: Dict[str, BarrierRecalculationDetail] = Field(default_factory=dict, description="Recalculated barrier states per wing")
    learner_profile: Optional[LearnerProfile] = Field(None, description="Updated authoritative learner profile")
    world_state: Optional[WorldState] = Field(None, description="Updated virtual classroom world state")
    threshold_crossed: bool = Field(default=False, description="Whether any prerequisite threshold was crossed")
    unlocked_wing: Optional[str] = Field(None, description="ID of newly unlocked wing if barrier dissolved")
    status: str = Field(default="evaluated", description="Status: evaluated")
    evaluation_timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Evaluation timestamp",
    )

