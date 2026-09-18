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


class DiagnosticAnswerReview(BaseModel):
    question_id: str
    concept: str
    selected_option_id: Optional[str]
    correct_option_id: str
    is_correct: bool
    explanation: str
    title: str


class DiagnosticSubmissionResponse(BaseModel):
    assessment_id: str
    student_id: str
    total_questions: int
    answered_count: int
    correct_count: int
    score_percentage: float
    reviews: List[DiagnosticAnswerReview]
    concept_breakdown: Dict[str, bool]
    status: str = Field(default="evaluated", description="Status: evaluated")
    evaluation_timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Evaluation timestamp",
    )
