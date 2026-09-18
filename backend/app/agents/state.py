"""LangGraph state representation for the 5-Agent Deliberation Pipeline."""

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class AgentState(TypedDict, total=False):
    """Shared state dictionary passed sequentially through all 5 deliberation nodes."""
    student_id: str
    target_concept: Optional[str]
    learner_profile: Optional[Dict[str, Any]]
    mastery_map: Optional[Dict[str, float]]
    prerequisite_graph: Optional[Dict[str, Dict[str, float]]]
    diagnostic_evaluation: Optional[Dict[str, Any]]
    planner_proposal: Optional[Dict[str, Any]]
    validation_result: Optional[Dict[str, Any]]
    final_decision: Optional[Dict[str, Any]]
    world_instructions: Optional[Dict[str, Any]]
    traces: List[Dict[str, Any]]
    llm_mode: str
    error: Optional[str]
    force_proposal: Optional[Dict[str, Any]]
