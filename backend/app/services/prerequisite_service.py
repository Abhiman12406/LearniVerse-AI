"""Compatibility façade for Prerequisite Service.

Delegates authoritative readiness evaluation, graph traversal, and gap calculations
directly to the consolidated KnowledgeGraphService, eliminating duplicate dictionaries
and in-function circular imports.
"""

from typing import Any, Dict, List, Optional
from backend.app.services.knowledge_graph_service import (
    KnowledgeGraphService,
    PrerequisiteEvaluation,
    knowledge_graph_service,
)

# Re-export default curriculum rules dynamically from KnowledgeGraphService
PREREQUISITE_RULES: Dict[str, Dict[str, float]] = knowledge_graph_service.get_full_graph()


class PrerequisiteService:
    """Compatibility façade delegating directly to KnowledgeGraphService."""

    def __init__(self, service: Optional[KnowledgeGraphService] = None):
        self._kg = service or knowledge_graph_service

    def evaluate_concept(self, concept: str, mastery: Any) -> PrerequisiteEvaluation:
        """Evaluate readiness for a given target concept based on learner mastery."""
        return self._kg.evaluate_concept(concept, mastery)

    def evaluate_all(self, mastery: Any) -> Dict[str, PrerequisiteEvaluation]:
        """Evaluate all concepts in the prerequisite graph."""
        return self._kg.evaluate_all(mastery)

    def get_prerequisites(self, concept: str) -> Dict[str, float]:
        """Return dict of direct prerequisite concept thresholds for a given concept."""
        return self._kg.get_prerequisites(concept)

    def get_full_graph(self) -> Dict[str, Dict[str, float]]:
        """Return the complete curriculum prerequisite graph."""
        return self._kg.get_full_graph()

    def compute_gap(self, concept: str, current_mastery: float) -> float:
        """Calculate prerequisite gap Gap_c = max(0, tau_c - M_c) (§8)."""
        return self._kg.compute_gap(concept, current_mastery)

    def compute_priority(self, concept: str, current_mastery: float) -> float:
        """Calculate downstream weighted priority Priority_c = Gap_c * W_c (§8)."""
        return self._kg.compute_priority(concept, current_mastery)


prerequisite_service = PrerequisiteService()
