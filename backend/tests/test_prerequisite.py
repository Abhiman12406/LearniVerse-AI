"""Automated tests verifying Prerequisite Knowledge Graph model and barrier evaluation."""

import pytest
from backend.app.models.learner import MasteryMap
from backend.app.services.prerequisite_service import prerequisite_service
from backend.app.services.learner_service import learner_service


def test_prerequisite_evaluation_learner_b():
    """Verify Learner B has prerequisite gap for Recursion Lab when Stack < 0.70."""
    mastery_b = MasteryMap(
        array=0.90,
        linked_list=0.70,
        stack=0.38,
        recursion=0.20,
        tree=0.10,
    )

    eval_recursion = prerequisite_service.evaluate_concept("recursion", mastery_b)
    assert not eval_recursion.is_ready
    assert eval_recursion.status == "sealed"
    assert eval_recursion.missing_prerequisite == "stack"
    assert eval_recursion.required_threshold == 0.70
    assert eval_recursion.current_mastery == 0.38
    assert "Requires Stack ≥ 70%" in eval_recursion.reason
    assert "Current: 38%" in eval_recursion.reason


def test_prerequisite_evaluation_learner_a():
    """Verify Learner A has satisfied prerequisite for Recursion Lab when Stack >= 0.70."""
    mastery_a = MasteryMap(
        array=0.92,
        linked_list=0.88,
        stack=0.84,
        recursion=0.72,
        tree=0.65,
    )

    eval_recursion = prerequisite_service.evaluate_concept("recursion", mastery_a)
    assert eval_recursion.is_ready
    assert eval_recursion.status == "accessible"
    assert eval_recursion.missing_prerequisite is None
    assert eval_recursion.reason is None


def test_prerequisite_boundary_threshold():
    """Verify threshold boundary condition at exactly 0.70."""
    # Just below threshold: 0.6999
    mastery_below = MasteryMap(stack=0.699)
    res_below = prerequisite_service.evaluate_concept("recursion", mastery_below)
    assert res_below.status == "sealed"

    # Exactly at threshold: 0.70
    mastery_exact = MasteryMap(stack=0.70)
    res_exact = prerequisite_service.evaluate_concept("recursion", mastery_exact)
    assert res_exact.status == "accessible"


def test_world_state_barrier_integration():
    """Verify learner_service produces sealed barrier with diagnostic reason for learner_b."""
    learner_service.reset_profiles()
    world_b = learner_service.get_world_state("learner_b")
    assert world_b.wings["recursion_lab"].status == "sealed"
    assert "Requires Stack ≥ 70%" in world_b.wings["recursion_lab"].reason
    assert "Current: 38%" in world_b.wings["recursion_lab"].reason

    world_a = learner_service.get_world_state("learner_a")
    assert world_a.wings["recursion_lab"].status == "accessible"
    assert world_a.wings["recursion_lab"].reason is None
