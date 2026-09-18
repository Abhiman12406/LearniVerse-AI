"""Domain models for DSA missions and challenges."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChallengeOptionModel(BaseModel):
    id: str
    label: str
    text: str
    explanation: Optional[str] = None


class StackChallengeModel(BaseModel):
    id: str
    mission_id: str
    step_number: int
    total_steps: int
    title: str
    concept: str = "stack"
    difficulty: str = Field(..., description="easy | medium | hard")
    type: str = "multiple_choice"
    objective: str
    scenario: str
    code_snippet: Optional[List[str]] = None
    options: List[ChallengeOptionModel]
    correct_option_id: str
    hint: str
    feynman_analogy: str
    pedagogical_explanation: str
    simulated_stack_initial: Optional[List[int]] = None


class StackMissionModel(BaseModel):
    id: str
    title: str
    subtitle: str
    concept: str = "stack"
    difficulty: str = "easy"
    target_mastery: str = "70%+"
    description: str
    learning_objectives: List[str]
    challenges: List[StackChallengeModel]
