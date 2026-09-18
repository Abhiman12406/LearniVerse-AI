"""Comprehensive unit and integration tests for Evidence-Based Backend Logic.

Conforms strictly to BACKEND_LOGIC.md:
- §2: Evidence Validity Gate (Rule A, Rule B)
- §3: 2-Step Bayesian Knowledge Tracing with Validity Weighting
- §4: 2PL Item Response Theory & Fisher Information Selection
- §5: NetworkX Curriculum Directed Acyclic Graph (DAG)
- §6, §7, §16: Multi-Dimensional Cognitive Streams, Confidence Saturation & 4-Tier Classification
- §8-§12: ZPD Gaussian-Gain Planning & POMDP Reward Formulation
- §13, §14: Evidence-Based Feynman Trigger Condition & Intervention Gain
- §15: SuperMemo-2 (SM-2) Spaced Repetition Scheduler
- §18: Network-Aware Modality Invariance
- §25: API Contracts & Parameters Inspection
"""

import math
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.models.evidence import NetworkContext, Sm2Record
from backend.app.services.bkt_service import bkt_service
from backend.app.services.config_service import config_service
from backend.app.services.evidence_gate_service import evidence_gate_service
from backend.app.services.feynman_service import feynman_service
from backend.app.services.irt_service import irt_service
from backend.app.services.knowledge_graph_service import knowledge_graph_service
from backend.app.services.learner_service import learner_service
from backend.app.services.multidimensional_mastery_service import multidimensional_mastery_service
from backend.app.services.network_delivery_service import network_delivery_service
from backend.app.services.sm2_service import sm2_service
from backend.app.services.zpd_planner_service import zpd_planner_service

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Evidence Validity Gate (§2)
# -----------------------------------------------------------------------------
class TestEvidenceValidityGate:
    def test_rule_a_timeout_does_not_penalize_mastery(self):
        """Rule A: Technical timeouts produce Vi = 0 and 0 effective mastery delta."""
        val = evidence_gate_service.evaluate_validity(
            evidence_type="COGNITIVE_ASSESSMENT",
            is_timeout=True,
            is_network_error=False,
        )
        assert val.valid is False
        assert val.validity_score == 0.0
        assert val.reason == "TECHNICAL_TIMEOUT_RULE_A"

        # Verify BKT delta is zero
        prior = 0.38
        posterior = bkt_service.compute_posterior(
            prior=prior,
            correct=False,
            concept="stack",
            validity_score=val.validity_score,
        )
        assert posterior == prior

    def test_rule_a_network_failure_is_neutral(self):
        """Rule A: Network errors produce Vi = 0."""
        val = evidence_gate_service.evaluate_validity(
            evidence_type="COGNITIVE_ASSESSMENT",
            is_timeout=False,
            is_network_error=True,
        )
        assert val.valid is False
        assert val.validity_score == 0.0

    def test_rule_b_exploratory_walk_is_not_mastery(self):
        """Rule B: Walking in the 3D world produces Vi = 0."""
        val = evidence_gate_service.evaluate_validity(
            evidence_type="EXPLORATORY_WALK",
            is_timeout=False,
            is_network_error=False,
        )
        assert val.valid is False
        assert val.validity_score == 0.0
        assert val.reason == "EXPLORATORY_BEHAVIOR_RULE_B"

    def test_valid_cognitive_outcome(self):
        """Legitimate question answer produces Vi = 1.0."""
        val = evidence_gate_service.evaluate_validity(
            evidence_type="COGNITIVE_ASSESSMENT",
            is_timeout=False,
            is_network_error=False,
            response_time_ms=5400,
        )
        assert val.valid is True
        assert val.validity_score == 1.0


# -----------------------------------------------------------------------------
# 2. 2-Step Bayesian Knowledge Tracing (§3)
# -----------------------------------------------------------------------------
class TestBKTService:
    def test_correct_response_increases_mastery(self):
        prior = 0.38
        post = bkt_service.compute_posterior(prior=prior, correct=True, concept="stack", difficulty="easy")
        assert post > prior

    def test_incorrect_response_decreases_mastery(self):
        prior = 0.50
        post = bkt_service.compute_posterior(prior=prior, correct=False, concept="stack", difficulty="medium")
        assert post < prior

    def test_concept_specific_parameters(self):
        params_stack = bkt_service.get_parameters("stack")
        params_array = bkt_service.get_parameters("array")
        assert params_stack.p_transit != params_array.p_transit or params_stack.p_guess != params_array.p_guess


# -----------------------------------------------------------------------------
# 3. 2PL Item Response Theory (IRT) (§4)
# -----------------------------------------------------------------------------
class TestIRTService:
    def test_probability_monotonicity(self):
        """Probability of correct answer increases monotonically with ability θ."""
        p_low = irt_service.probability_2pl(theta=-1.0, a=1.5, b=0.0)
        p_mid = irt_service.probability_2pl(theta=0.0, a=1.5, b=0.0)
        p_high = irt_service.probability_2pl(theta=1.0, a=1.5, b=0.0)
        assert 0.0 < p_low < p_mid < p_high < 1.0
        assert round(p_mid, 2) == 0.50

    def test_fisher_information_peaks_at_difficulty(self):
        """Fisher information I_i(θ) is maximal when learner ability matches item difficulty."""
        b_target = 0.5
        info_peak = irt_service.fisher_information(theta=0.5, a=1.6, b=b_target)
        info_off = irt_service.fisher_information(theta=-1.0, a=1.6, b=b_target)
        assert info_peak > info_off

    def test_adaptive_item_selection(self):
        """Selects item maximizing information at theta."""
        item = irt_service.select_item_max_information(theta=0.0, concept="stack")
        assert item.concept_id == "stack"
        assert item.item_id is not None

    def test_bounded_ability_estimation(self):
        """Ability θ_hat remains bounded in [-4.0, 4.0]."""
        responses = [(1.5, 0.0, True), (1.8, 0.5, True), (2.0, 1.0, True)]
        theta = irt_service.estimate_ability(responses, prior_theta=0.0)
        assert -4.0 <= theta <= 4.0
        assert theta > 0.0


# -----------------------------------------------------------------------------
# 4. NetworkX Curriculum DAG (§5, §8)
# -----------------------------------------------------------------------------
class TestKnowledgeGraphService:
    def test_curriculum_is_strict_dag(self):
        order = knowledge_graph_service.get_topological_sort()
        assert order == ["array", "linked_list", "stack", "recursion", "tree"]

    def test_downstream_dependency_weights(self):
        """Stack blocks recursion and tree, so W_stack > W_tree."""
        w_stack = knowledge_graph_service.get_downstream_weight("stack")
        w_tree = knowledge_graph_service.get_downstream_weight("tree")
        assert w_stack > w_tree
        assert w_stack >= 2.0
        assert w_tree == 1.0

    def test_prerequisite_eligibility(self):
        ready, blocking, req, cur = knowledge_graph_service.is_eligible(
            "recursion", {"array": 0.9, "linked_list": 0.7, "stack": 0.38}
        )
        assert ready is False
        assert blocking == "stack"
        assert req == 0.70
        assert cur == 0.38

    def test_remediation_priority_calculation(self):
        gap = knowledge_graph_service.compute_gap("stack", 0.38)
        assert round(gap, 2) == 0.32
        priority = knowledge_graph_service.compute_priority("stack", 0.38)
        assert priority > gap  # boosted by downstream weight


# -----------------------------------------------------------------------------
# 5. Multi-Dimensional Cognitive Streams & Confidence (§6, §7, §16)
# -----------------------------------------------------------------------------
class TestMultidimensionalMasteryService:
    def test_confidence_saturation(self):
        """C_c = 1 - exp(-n / kappa) grows with observation count."""
        multidimensional_mastery_service.reset_student("test_student")
        c1 = multidimensional_mastery_service.compute_confidence("test_student", "stack")
        for _ in range(5):
            multidimensional_mastery_service.record_observation("test_student", "stack", True)
        c2 = multidimensional_mastery_service.compute_confidence("test_student", "stack")
        assert c2 > c1

    def test_mastery_4_tier_classification(self):
        tier_high = multidimensional_mastery_service.classify_mastery(
            "learner_a", "recursion", 0.85, {"array": 0.9, "linked_list": 0.85, "stack": 0.85, "recursion": 0.85}
        )
        assert tier_high in ["HIGH", "MEDIUM"]

        tier_low = multidimensional_mastery_service.classify_mastery(
            "learner_b", "recursion", 0.20, {"stack": 0.38}
        )
        assert tier_low == "LOW"


# -----------------------------------------------------------------------------
# 6. ZPD Gaussian-Gain Planner (§8–§12)
# -----------------------------------------------------------------------------
class TestZpdPlannerService:
    def test_gaussian_zpd_factor(self):
        """ZPD factor is maximal (1.0) when item difficulty equals learner ability."""
        zpd_match = zpd_planner_service.calculate_zpd_factor(difficulty_b=0.5, theta=0.5)
        zpd_mismatch = zpd_planner_service.calculate_zpd_factor(difficulty_b=2.0, theta=-0.5)
        assert round(zpd_match, 2) == 1.0
        assert zpd_mismatch < 0.2

    def test_task_utility_and_selection(self):
        best_task, candidates = zpd_planner_service.select_optimal_task(
            concept="stack",
            mastery=0.38,
            theta=-0.6,
            eligible=False,
        )
        assert best_task is not None
        assert best_task.difficulty_b <= 0.0  # Remediation oriented
        assert len(candidates) > 1

    def test_pomdp_reward_formulation(self):
        reward = zpd_planner_service.compute_pomdp_reward(delta_m=0.15, transfer_gain=0.10, cost=0.10)
        assert reward > 0.0


# -----------------------------------------------------------------------------
# 7. SuperMemo-2 Spaced Repetition Scheduler (§15)
# -----------------------------------------------------------------------------
class TestSm2Service:
    def test_sm2_interval_progression(self):
        rec = sm2_service.create_initial_record("stack")
        assert rec.repetitions == 0

        # Review 1 with grade 5
        rec1 = sm2_service.update_schedule(rec, quality=5)
        assert rec1.repetitions == 1
        assert rec1.interval_days == 1

        # Review 2 with grade 5
        rec2 = sm2_service.update_schedule(rec1, quality=5)
        assert rec2.repetitions == 2
        assert rec2.interval_days == 6

        # Review 3 with grade 5
        rec3 = sm2_service.update_schedule(rec2, quality=5)
        assert rec3.repetitions == 3
        assert rec3.interval_days > 6

    def test_sm2_failure_resets_streak(self):
        rec = Sm2Record(concept_id="stack", easiness_factor=2.5, repetitions=4, interval_days=15)
        rec_failed = sm2_service.update_schedule(rec, quality=1)
        assert rec_failed.repetitions == 0
        assert rec_failed.interval_days == 1


# -----------------------------------------------------------------------------
# 8. Network-Aware Modality Delivery Invariance (§18)
# -----------------------------------------------------------------------------
class TestNetworkDeliveryService:
    def test_presentation_downgrade_under_poor_network(self):
        high_ctx = NetworkContext(bandwidth_class="GOOD_NETWORK", latency_ms=30.0, fps=60.0)
        low_ctx = NetworkContext(bandwidth_class="VERY_LOW_NETWORK", latency_ms=450.0, fps=15.0)

        high_deliv = network_delivery_service.select_modality(high_ctx)
        low_deliv = network_delivery_service.select_modality(low_ctx)

        assert high_deliv["modality"] == "FULL_3D"
        assert low_deliv["modality"] == "2D_STRUCTURED"
        assert low_deliv["educational_invariance"]["fairness_guaranteed"] is True


# -----------------------------------------------------------------------------
# 9. Feynman Technique Trigger Condition (§13)
# -----------------------------------------------------------------------------
class TestFeynmanTriggerCondition:
    def test_feynman_trigger_formula(self):
        res = feynman_service.evaluate_trigger_condition(
            student_id="learner_b",
            concept="stack",
            recent_errors=3,
            hints_used=2,
            misconception_detected=True,
        )
        assert res["trigger_score"] >= 0.60
        assert res["triggered"] is True


# -----------------------------------------------------------------------------
# 10. Curriculum REST Endpoints
# -----------------------------------------------------------------------------
class TestCurriculumEndpoints:
    def test_get_curriculum_dag(self):
        resp = client.get("/api/curriculum/dag")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_acyclic"] is True
        assert "stack" in data["topological_order"]
        assert data["downstream_weights"]["stack"] >= 2.0

    def test_get_adaptive_item(self):
        resp = client.get("/api/curriculum/adaptive-item?concept=stack&theta=0.0")
        assert resp.status_code == 200
        data = resp.json()
        assert data["selected_item"]["concept_id"] == "stack"
        assert data["fisher_information"] > 0.0

    def test_get_zpd_tasks(self):
        resp = client.get("/api/curriculum/zpd-tasks?concept=stack&student_id=learner_b")
        assert resp.status_code == 200
        data = resp.json()
        assert "optimal_task" in data
        assert len(data["candidate_tasks"]) > 0

    def test_get_review_schedule(self):
        resp = client.get("/api/curriculum/review-schedule/learner_b")
        assert resp.status_code == 200
        data = resp.json()
        assert "schedules" in data

    def test_get_feynman_trigger(self):
        resp = client.get("/api/curriculum/feynman-trigger?student_id=learner_b&concept=stack&recent_errors=3")
        assert resp.status_code == 200
        data = resp.json()
        assert "triggered" in data

    def test_post_delivery_config(self):
        payload = {
            "bandwidth_class": "GOOD_NETWORK",
            "latency_ms": 40.0,
            "fps": 60.0,
            "device_class": "desktop",
            "connection_stability": 0.99,
        }
        resp = client.post("/api/curriculum/delivery-config", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["modality"] == "FULL_3D"
