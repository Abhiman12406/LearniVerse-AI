"""Tests for AI Diagnostic Assessment Service & Endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.assessment import (
    DiagnosticAssessmentResponse,
    DiagnosticSubmissionRequest,
    DiagnosticSubmissionResponse,
)
from backend.app.services.diagnostic_service import (
    CURATED_OFFLINE_QUESTIONS,
    diagnostic_service,
)
from backend.app.services.learner_service import learner_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_learner_state():
    """Reset profiles before each diagnostic test."""
    learner_service.reset_profiles()


def test_offline_question_bank_structure():

    """Verify curated question bank has exactly 5 questions matching the DAG topological order."""
    assert len(CURATED_OFFLINE_QUESTIONS) == 5
    concepts = [q.concept for q in CURATED_OFFLINE_QUESTIONS]
    assert concepts == ["array", "linked_list", "stack", "recursion", "tree"]

    for q in CURATED_OFFLINE_QUESTIONS:
        assert q.id.startswith("diag_")
        assert len(q.options) == 4
        option_ids = [opt.id for opt in q.options]
        assert q.correct_option_id in option_ids
        assert len(q.title) > 5
        assert len(q.scenario) > 20
        assert q.code_snippet is not None and len(q.code_snippet) >= 1
        assert len(q.hint) > 10
        assert len(q.feynman_analogy) > 10
        assert len(q.pedagogical_objective) > 10


def test_generate_assessment_offline_fallback():
    """Verify generate_assessment produces a valid 5-question assessment."""
    resp: DiagnosticAssessmentResponse = diagnostic_service.generate_assessment(force_refresh=False)
    assert resp.assessment_id.startswith("diag_sess_")
    assert len(resp.questions) == 5
    assert resp.generated_by in ["offline_curated", "gemini"]
    assert resp.concepts == ["array", "linked_list", "stack", "recursion", "tree"]


def test_evaluate_submission_full_score():
    """Verify submission of all correct options yields 100% score."""
    assessment = diagnostic_service.generate_assessment()
    answers = {q.id: q.correct_option_id for q in assessment.questions}

    sub_req = DiagnosticSubmissionRequest(
        student_id="learner_a",
        assessment_id=assessment.assessment_id,
        answers=answers,
        time_taken_ms=45000,
    )
    result: DiagnosticSubmissionResponse = diagnostic_service.evaluate_submission(sub_req)

    assert result.total_questions == 5
    assert result.answered_count == 5
    assert result.correct_count == 5
    assert result.score_percentage == 100.0
    assert result.status == "evaluated"
    assert all(result.concept_breakdown.values())
    assert all(r.is_correct for r in result.reviews)


def test_evaluate_submission_partial_learner_b():
    """Verify partial answers correctly reflect concept breakdown."""
    assessment = diagnostic_service.generate_assessment()
    # Array and Linked List correct, Stack, Recursion, Tree wrong
    answers = {
        "diag_arr_01": "opt_arr_01_a",
        "diag_ll_01": "opt_ll_01_a",
        "diag_stk_01": "opt_stk_01_b",  # incorrect
        "diag_rec_01": "opt_rec_01_b",  # incorrect
        "diag_tree_01": "opt_tree_01_c",  # incorrect
    }

    sub_req = DiagnosticSubmissionRequest(
        student_id="learner_b",
        assessment_id=assessment.assessment_id,
        answers=answers,
        time_taken_ms=32000,
    )
    result = diagnostic_service.evaluate_submission(sub_req)

    assert result.correct_count == 2
    assert result.score_percentage == 40.0
    assert result.concept_breakdown["array"] is True
    assert result.concept_breakdown["linked_list"] is True
    assert result.concept_breakdown["stack"] is False
    assert result.concept_breakdown["recursion"] is False
    assert result.concept_breakdown["tree"] is False


def test_evaluate_submission_empty():
    """Verify submitting empty answers handles reviews gracefully."""
    sub_req = DiagnosticSubmissionRequest(
        student_id="guest_learner",
        assessment_id="diag_empty_test",
        answers={},
    )
    result = diagnostic_service.evaluate_submission(sub_req)
    assert result.correct_count == 0
    assert result.answered_count == 0
    assert result.score_percentage == 0.0
    assert len(result.reviews) == 5
    for r in result.reviews:
        assert r.is_correct is False
        assert "Correct answer was" in r.explanation


def test_api_get_diagnostic_assessment():
    """Test HTTP GET /api/assessment/diagnostic."""
    response = client.get("/api/assessment/diagnostic")
    assert response.status_code == 200
    data = response.json()
    assert "assessment_id" in data
    assert len(data["questions"]) == 5
    assert data["concepts"] == ["array", "linked_list", "stack", "recursion", "tree"]

    first_q = data["questions"][0]
    assert first_q["concept"] == "array"
    assert len(first_q["options"]) == 4


def test_api_post_diagnostic_submission():
    """Test HTTP POST /api/assessment/submit."""
    get_resp = client.get("/api/assessment/diagnostic")
    assessment_id = get_resp.json()["assessment_id"]

    payload = {
        "student_id": "learner_b",
        "assessment_id": assessment_id,
        "answers": {
            "diag_arr_01": "opt_arr_01_a",
            "diag_ll_01": "opt_ll_01_a",
        },
        "time_taken_ms": 25000,
    }

    submit_resp = client.post("/api/assessment/submit", json=payload)
    assert submit_resp.status_code == 200
    res_data = submit_resp.json()
    assert res_data["assessment_id"] == assessment_id
    assert res_data["total_questions"] == 5
    assert res_data["answered_count"] == 2
    assert res_data["correct_count"] == 2
    assert res_data["score_percentage"] == 40.0
    assert len(res_data["reviews"]) == 5
    assert "bkt_updates" in res_data
    assert len(res_data["bkt_updates"]) == 5
    assert "barrier_recalculations" in res_data
    assert "learner_profile" in res_data
    assert "world_state" in res_data


def test_evaluate_submission_executes_bkt_updates():
    """Verify each of the 5 answers executes a 2-step BKT belief update for its corresponding node."""
    assessment = diagnostic_service.generate_assessment()
    # Array correct, Linked list correct, Stack incorrect, Recursion incorrect, Tree correct
    answers = {
        "diag_arr_01": "opt_arr_01_a",
        "diag_ll_01": "opt_ll_01_a",
        "diag_stk_01": "opt_stk_01_b",
        "diag_rec_01": "opt_rec_01_b",
        "diag_tree_01": "opt_tree_01_a",
    }

    sub_req = DiagnosticSubmissionRequest(
        student_id="learner_b",
        assessment_id=assessment.assessment_id,
        answers=answers,
    )
    result = diagnostic_service.evaluate_submission(sub_req)

    assert len(result.bkt_updates) == 5
    concept_to_bkt = {u.concept: u for u in result.bkt_updates}

    # Verify Array (correct answer -> positive delta)
    arr_bkt = concept_to_bkt["array"]
    assert arr_bkt.is_correct is True
    assert arr_bkt.posterior_mastery >= arr_bkt.prior_mastery
    assert arr_bkt.delta >= 0.0

    # Verify Stack (incorrect answer -> lower or slip-bounded delta)
    stk_bkt = concept_to_bkt["stack"]
    assert stk_bkt.is_correct is False
    assert stk_bkt.posterior_mastery <= stk_bkt.prior_mastery
    assert stk_bkt.delta <= 0.0

    # Verify delta arithmetic
    for u in result.bkt_updates:
        assert round(u.posterior_mastery - u.prior_mastery, 2) == u.delta
        assert u.classification in ["HIGH", "MEDIUM", "LOW", "UNCERTAIN"]
        assert u.barrier_status in ["accessible", "sealed"]


def test_evaluate_submission_atomically_updates_learner_profile():
    """Verify active student profile is atomically updated with new mastery probabilities, IRT estimates, and classification tiers."""
    assessment = diagnostic_service.generate_assessment()
    answers = {
        "diag_arr_01": "opt_arr_01_a",
        "diag_ll_01": "opt_ll_01_a",
        "diag_stk_01": "opt_stk_01_a",  # correct
        "diag_rec_01": "opt_rec_01_a",  # correct
        "diag_tree_01": "opt_tree_01_a",  # correct
    }

    sub_req = DiagnosticSubmissionRequest(
        student_id="learner_b",
        assessment_id=assessment.assessment_id,
        answers=answers,
    )
    result = diagnostic_service.evaluate_submission(sub_req)

    profile_in_store = learner_service.get_learner_profile("learner_b")
    assert result.learner_profile is not None
    assert profile_in_store is not None

    # Check mastery map persistence
    for c in ["array", "linked_list", "stack", "recursion", "tree"]:
        assert getattr(profile_in_store.mastery_map, c) == getattr(result.learner_profile.mastery_map, c)
        assert c in profile_in_store.ability_irt
        assert c in profile_in_store.mastery_classification


def test_evaluate_submission_prerequisite_barrier_sealed_learner_b():
    """Verify Recursion Wing remains sealed when Stack mastery < 70%."""
    assessment = diagnostic_service.generate_assessment()
    # Stack answered incorrectly for learner_b (prior 38%)
    answers = {
        "diag_arr_01": "opt_arr_01_a",
        "diag_ll_01": "opt_ll_01_a",
        "diag_stk_01": "opt_stk_01_b",  # Incorrect
        "diag_rec_01": "opt_rec_01_b",
        "diag_tree_01": "opt_tree_01_c",
    }

    sub_req = DiagnosticSubmissionRequest(
        student_id="learner_b",
        assessment_id=assessment.assessment_id,
        answers=answers,
    )
    result = diagnostic_service.evaluate_submission(sub_req)

    assert "recursion_lab" in result.barrier_recalculations
    rec_barrier = result.barrier_recalculations["recursion_lab"]
    assert rec_barrier.status == "sealed"
    assert rec_barrier.is_ready is False
    assert rec_barrier.is_sealed is True
    assert rec_barrier.dissolved is False
    assert "Stack" in (rec_barrier.reason or "")
    assert result.threshold_crossed is False
    assert result.unlocked_wing is None


def test_evaluate_submission_prerequisite_barrier_dissolves_when_stack_mastered():
    """Verify Recursion Wing barrier dynamically dissolves when Stack crosses 70% threshold."""
    # Pre-set Stack mastery to 68% so a correct answer pushes it past 70%
    learner_service.update_concept_mastery("learner_b", "stack", 0.68)
    world_before = learner_service.get_world_state("learner_b")
    assert world_before.wings["recursion_lab"].status == "sealed"

    assessment = diagnostic_service.generate_assessment()
    answers = {
        "diag_arr_01": "opt_arr_01_a",
        "diag_ll_01": "opt_ll_01_a",
        "diag_stk_01": "opt_stk_01_a",  # Correct Stack answer pushes mastery >= 70%
        "diag_rec_01": "opt_rec_01_a",
        "diag_tree_01": "opt_tree_01_a",
    }

    sub_req = DiagnosticSubmissionRequest(
        student_id="learner_b",
        assessment_id=assessment.assessment_id,
        answers=answers,
    )
    result = diagnostic_service.evaluate_submission(sub_req)

    rec_barrier = result.barrier_recalculations["recursion_lab"]
    assert rec_barrier.status == "accessible"
    assert rec_barrier.is_ready is True
    assert rec_barrier.was_sealed is True
    assert rec_barrier.dissolved is True
    assert result.threshold_crossed is True
    assert result.unlocked_wing == "recursion_lab"

