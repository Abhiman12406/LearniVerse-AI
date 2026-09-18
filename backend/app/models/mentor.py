"""Pydantic schemas for the AI Mentor Beacon and Feynman Guidance system."""

from typing import Dict, List, Optional
from pydantic import BaseModel


class FeynmanExplanation(BaseModel):
    """Feynman technique explanation structure linking concepts with analogies."""
    concept: str
    target_prerequisite_of: Optional[str] = None
    analogy: str
    conceptual_bridge: str
    hardware_software_context: str
    prerequisite_gap: Optional[str] = None


class MentorQuestion(BaseModel):
    """Interactive follow-up question and answer for deeper Feynman exploration."""
    id: str
    label: str
    answer: str


class MentorGuidanceResponse(BaseModel):
    """Complete contextual mentorship payload returned by the AI Mentor Beacon."""
    learner_id: str
    learner_name: str
    persona_type: str
    status: str  # "remediation_required" | "advanced_readiness"
    focus_concept: str
    recommended_station: str
    greeting: str
    diagnostic_summary: str
    feynman_explanation: FeynmanExplanation
    interactive_questions: List[MentorQuestion]
    action_recommendation: str


class AskQuestionRequest(BaseModel):
    """Request payload for querying specific mentor questions."""
    learner_id: Optional[str] = None
    question_id: str
