"""Unit tests for the consolidated KnowledgeGraphService and Prerequisite façade.

Conforms to codebase-design principles: "Depth is leverage at the interface."
Verifies authoritative dynamic evaluation, DAG traversal, and compatibility façade.
"""

import pytest
from backend.app.models.learner import MasteryMap
from backend.app.services.knowledge_graph_service import (
    KnowledgeGraphService,
    PrerequisiteEvaluation,
    knowledge_graph_service,
)
from backend.app.services.prerequisite_service import (
    PREREQUISITE_RULES,
    prerequisite_service,
)


class TestConsolidatedKnowledgeGraph:
    def test_evaluate_concept_sealed_when_prerequisite_not_met(self):
        """Recursion requires Stack >= 70%. When Stack is 38%, concept is sealed."""
        mastery = MasteryMap(
            array=0.90,
            linked_list=0.70,
            stack=0.38,
            recursion=0.20,
            tree=0.10,
        )

        evaluation = knowledge_graph_service.evaluate_concept("recursion", mastery)

        assert isinstance(evaluation, PrerequisiteEvaluation)
        assert evaluation.concept == "recursion"
        assert evaluation.is_ready is False
        assert evaluation.status == "sealed"
        assert evaluation.missing_prerequisite == "stack"
        assert evaluation.required_threshold == 0.70
        assert evaluation.current_mastery == 0.38
        assert "Requires Stack ≥ 70%" in evaluation.reason

    def test_evaluate_concept_accessible_when_prerequisite_satisfied(self):
        """Recursion requires Stack >= 70%. When Stack is 75%, concept is accessible."""
        mastery = MasteryMap(
            array=0.90,
            linked_list=0.70,
            stack=0.75,
            recursion=0.20,
            tree=0.10,
        )

        evaluation = knowledge_graph_service.evaluate_concept("recursion", mastery)

        assert evaluation.concept == "recursion"
        assert evaluation.is_ready is True
        assert evaluation.status == "accessible"
        assert evaluation.missing_prerequisite is None
        assert evaluation.reason is None

    def test_evaluate_concept_with_plain_dict(self):
        """evaluate_concept accepts plain dict in addition to MasteryMap model."""
        mastery_dict = {
            "array": 0.90,
            "linked_list": 0.40,  # Stack requires Linked List >= 50%
            "stack": 0.38,
        }

        evaluation = knowledge_graph_service.evaluate_concept("stack", mastery_dict)

        assert evaluation.concept == "stack"
        assert evaluation.is_ready is False
        assert evaluation.status == "sealed"
        assert evaluation.missing_prerequisite == "linked_list"
        assert evaluation.required_threshold == 0.50

    def test_evaluate_all_returns_full_curriculum(self):
        """evaluate_all returns evaluations for all 5 concepts in topological order."""
        mastery = MasteryMap(
            array=0.90,
            linked_list=0.70,
            stack=0.38,
            recursion=0.20,
            tree=0.10,
        )

        all_evals = knowledge_graph_service.evaluate_all(mastery)

        assert len(all_evals) == 5
        assert "array" in all_evals
        assert "linked_list" in all_evals
        assert "stack" in all_evals
        assert "recursion" in all_evals
        assert "tree" in all_evals

        assert all_evals["array"].is_ready is True
        assert all_evals["linked_list"].is_ready is True
        assert all_evals["stack"].is_ready is True
        assert all_evals["recursion"].is_ready is False
        assert all_evals["tree"].is_ready is False

    def test_is_eligible_delegates_to_evaluate_concept(self):
        """is_eligible returns 4-tuple matching evaluate_concept output."""
        mastery_dict = {"array": 0.90, "linked_list": 0.70, "stack": 0.38}
        is_ready, blocking, thresh, cur = knowledge_graph_service.is_eligible(
            "recursion", mastery_dict
        )

        assert is_ready is False
        assert blocking == "stack"
        assert thresh == 0.70
        assert cur == 0.38

    def test_prerequisite_service_façade_parity(self):
        """PrerequisiteService compatibility façade produces identical results."""
        mastery = MasteryMap(
            array=0.90,
            linked_list=0.70,
            stack=0.38,
            recursion=0.20,
            tree=0.10,
        )

        eval_kg = knowledge_graph_service.evaluate_concept("recursion", mastery)
        eval_façade = prerequisite_service.evaluate_concept("recursion", mastery)

        assert eval_kg.model_dump() == eval_façade.model_dump()
        assert PREREQUISITE_RULES["recursion"]["stack"] == 0.70
        assert prerequisite_service.compute_gap("stack", 0.38) == knowledge_graph_service.compute_gap("stack", 0.38)
        assert prerequisite_service.compute_priority("stack", 0.38) == knowledge_graph_service.compute_priority("stack", 0.38)
