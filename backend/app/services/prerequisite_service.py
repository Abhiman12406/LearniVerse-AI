"""Deterministic Prerequisite Service conforming to AGENTS.md and CONTEXT.md.

Enforces pedagogical prerequisite constraints across the curriculum DAG:
Array -> Linked List -> Stack -> Recursion -> Tree
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from backend.app.models.learner import MasteryMap


class PrerequisiteRequirement(BaseModel):
    concept: str
    required_concept: str
    threshold: float


# Curriculum Prerequisite Knowledge Graph DAG
PREREQUISITE_RULES: Dict[str, Dict[str, float]] = {
    "array": {},
    "linked_list": {"array": 0.60},
    "stack": {"linked_list": 0.50},
    "recursion": {"stack": 0.70},
    "tree": {"recursion": 0.70},
}


class PrerequisiteEvaluation(BaseModel):
    concept: str
    status: str  # "accessible" | "sealed"
    is_ready: bool
    missing_prerequisite: Optional[str] = None
    required_threshold: Optional[float] = None
    current_mastery: Optional[float] = None
    reason: Optional[str] = None


class PrerequisiteService:
    """Evaluates learner readiness against prerequisite constraints."""

    def __init__(self, rules: Optional[Dict[str, Dict[str, float]]] = None):
        self._rules = rules or PREREQUISITE_RULES

    def evaluate_concept(self, concept: str, mastery: MasteryMap) -> PrerequisiteEvaluation:
        """Evaluate readiness for a given target concept based on learner mastery."""
        reqs = self._rules.get(concept, {})
        if not reqs:
            return PrerequisiteEvaluation(
                concept=concept,
                status="accessible",
                is_ready=True,
            )

        for req_concept, threshold in reqs.items():
            current_val = getattr(mastery, req_concept, 0.0)
            if current_val < threshold:
                req_title = req_concept.replace("_", " ").title()
                reason = (
                    f"Requires {req_title} ≥ {int(threshold * 100)}% | "
                    f"Current: {int(current_val * 100)}%"
                )
                return PrerequisiteEvaluation(
                    concept=concept,
                    status="sealed",
                    is_ready=False,
                    missing_prerequisite=req_concept,
                    required_threshold=threshold,
                    current_mastery=current_val,
                    reason=reason,
                )

        return PrerequisiteEvaluation(
            concept=concept,
            status="accessible",
            is_ready=True,
        )

    def evaluate_all(self, mastery: MasteryMap) -> Dict[str, PrerequisiteEvaluation]:
        """Evaluate all concepts in the prerequisite graph."""
        return {concept: self.evaluate_concept(concept, mastery) for concept in self._rules}

    def get_prerequisites(self, concept: str) -> Dict[str, float]:
        """Return dict of direct prerequisite concept thresholds for a given concept."""
        return self._rules.get(concept, {})

    def get_full_graph(self) -> Dict[str, Dict[str, float]]:
        """Return the complete curriculum prerequisite graph."""
        return self._rules

    def compute_gap(self, concept: str, current_mastery: float) -> float:
        """Calculate prerequisite gap Gap_c = max(0, tau_c - M_c) (§8)."""
        from backend.app.services.knowledge_graph_service import knowledge_graph_service
        return knowledge_graph_service.compute_gap(concept, current_mastery)

    def compute_priority(self, concept: str, current_mastery: float) -> float:
        """Calculate downstream weighted priority Priority_c = Gap_c * W_c (§8)."""
        from backend.app.services.knowledge_graph_service import knowledge_graph_service
        return knowledge_graph_service.compute_priority(concept, current_mastery)


prerequisite_service = PrerequisiteService()
