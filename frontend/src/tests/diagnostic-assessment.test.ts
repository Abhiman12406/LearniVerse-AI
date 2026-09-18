import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { DEFAULT_DIAGNOSTIC_ASSESSMENT } from '../data/diagnosticQuestions';

describe('AI Diagnostic Assessment Delivery & Store', () => {
  beforeEach(() => {
    const store = useClassroomStore.getState();
    store.closeDiagnostic();
    store.resetDiagnosticAssessment();
  });

  it('verifies the curated question bank contains 5 questions across the curriculum DAG', () => {
    expect(DEFAULT_DIAGNOSTIC_ASSESSMENT.questions).toHaveLength(5);
    const concepts = DEFAULT_DIAGNOSTIC_ASSESSMENT.questions.map((q) => q.concept);
    expect(concepts).toEqual(['array', 'linked_list', 'stack', 'recursion', 'tree']);

    DEFAULT_DIAGNOSTIC_ASSESSMENT.questions.forEach((q) => {
      expect(q.id).toMatch(/^diag_/);
      expect(q.options).toHaveLength(4);
      expect(q.title.length).toBeGreaterThan(5);
      expect(q.scenario.length).toBeGreaterThan(20);
      expect(q.code_snippet).toBeDefined();
      expect(q.hint.length).toBeGreaterThan(10);
      expect(q.feynman_analogy.length).toBeGreaterThan(10);
      const optIds = q.options.map((o) => o.id);
      expect(optIds).toContain(q.correct_option_id);
    });
  });

  it('opens and closes the diagnostic assessment modal via store actions', () => {
    const store = useClassroomStore.getState();
    expect(store.isDiagnosticOpen).toBe(false);

    store.openDiagnostic();
    expect(useClassroomStore.getState().isDiagnosticOpen).toBe(true);

    store.closeDiagnostic();
    expect(useClassroomStore.getState().isDiagnosticOpen).toBe(false);
  });

  it('updates answer selections and advances stepper index', () => {
    const store = useClassroomStore.getState();
    store.openDiagnostic();

    // Select option for Question 1 (Array)
    store.setDiagnosticAnswer('diag_arr_01', 'opt_arr_01_a');
    expect(useClassroomStore.getState().diagnosticAnswers['diag_arr_01']).toBe('opt_arr_01_a');

    // Advance to Question 2 (Linked List)
    store.setDiagnosticIndex(1);
    expect(useClassroomStore.getState().diagnosticCurrentIndex).toBe(1);

    // Select option for Question 2
    store.setDiagnosticAnswer('diag_ll_01', 'opt_ll_01_a');
    expect(useClassroomStore.getState().diagnosticAnswers['diag_ll_01']).toBe('opt_ll_01_a');
  });

  it('submits assessment and transitions cleanly into evaluation state', async () => {
    const store = useClassroomStore.getState();
    store.openDiagnostic();

    // Fill answers for all 5 questions
    store.setDiagnosticAnswer('diag_arr_01', 'opt_arr_01_a'); // Correct
    store.setDiagnosticAnswer('diag_ll_01', 'opt_ll_01_a'); // Correct
    store.setDiagnosticAnswer('diag_stk_01', 'opt_stk_01_b'); // Incorrect
    store.setDiagnosticAnswer('diag_rec_01', 'opt_rec_01_b'); // Incorrect
    store.setDiagnosticAnswer('diag_tree_01', 'opt_tree_01_a'); // Correct

    await store.submitDiagnosticAssessment();

    const state = useClassroomStore.getState();
    expect(state.diagnosticSubmitted).toBe(true);
    expect(state.diagnosticResult).not.toBeNull();

    if (state.diagnosticResult) {
      expect(state.diagnosticResult.total_questions).toBe(5);
      expect(state.diagnosticResult.answered_count).toBe(5);
      expect(state.diagnosticResult.correct_count).toBe(3);
      expect(state.diagnosticResult.score_percentage).toBe(60);
      expect(state.diagnosticResult.concept_breakdown.array).toBe(true);
      expect(state.diagnosticResult.concept_breakdown.linked_list).toBe(true);
      expect(state.diagnosticResult.concept_breakdown.stack).toBe(false);
      expect(state.diagnosticResult.concept_breakdown.recursion).toBe(false);
      expect(state.diagnosticResult.concept_breakdown.tree).toBe(true);
      expect(state.diagnosticResult.reviews).toHaveLength(5);
      expect(state.diagnosticResult.bkt_updates).toBeDefined();
      expect(state.diagnosticResult.bkt_updates).toHaveLength(5);

      const bktMap = (state.diagnosticResult.bkt_updates || []).reduce(
        (acc, u) => ({ ...acc, [u.concept]: u }),
        {} as Record<string, any>
      );

      // Array was correct -> positive delta
      expect(bktMap.array.is_correct).toBe(true);
      expect(bktMap.array.delta).toBeGreaterThanOrEqual(0);

      // Stack was incorrect -> delta <= 0
      expect(bktMap.stack.is_correct).toBe(false);
      expect(bktMap.stack.delta).toBeLessThanOrEqual(0);

      // Check barrier recalculation
      expect(state.diagnosticResult.barrier_recalculations).toBeDefined();
      expect(state.diagnosticResult.barrier_recalculations?.recursion_lab).toBeDefined();
      expect(state.diagnosticResult.barrier_recalculations?.recursion_lab.status).toBe('sealed');
      expect(state.diagnosticResult.barrier_recalculations?.recursion_lab.reason).toContain('Stack');

      // Check store learner profile updated
      expect(state.learner).not.toBeNull();
      expect(state.learner?.mastery_map.array).toBe(bktMap.array.posterior_mastery);
      expect(state.learner?.mastery_map.stack).toBe(bktMap.stack.posterior_mastery);
    }
  });

  it('dissolves Recursion Wing barrier when Stack mastery reaches 70%', async () => {
    const store = useClassroomStore.getState();
    store.openDiagnostic();

    // Pre-set learner stack mastery close to threshold
    if (store.learner) {
      useClassroomStore.setState({
        learner: {
          ...store.learner,
          mastery_map: {
            ...store.learner.mastery_map,
            stack: 0.68,
          },
        },
      });
    }

    // Submit with Stack correct (opt_stk_01_a is correct)
    store.setDiagnosticAnswer('diag_arr_01', 'opt_arr_01_a');
    store.setDiagnosticAnswer('diag_ll_01', 'opt_ll_01_a');
    store.setDiagnosticAnswer('diag_stk_01', 'opt_stk_01_a'); // Correct -> pushes stack >= 70%
    store.setDiagnosticAnswer('diag_rec_01', 'opt_rec_01_a');
    store.setDiagnosticAnswer('diag_tree_01', 'opt_tree_01_a');

    await store.submitDiagnosticAssessment();

    const state = useClassroomStore.getState();
    expect(state.diagnosticResult?.threshold_crossed).toBe(true);
    expect(state.diagnosticResult?.unlocked_wing).toBe('recursion_lab');
    expect(state.diagnosticResult?.barrier_recalculations?.recursion_lab.status).toBe('accessible');
    expect(state.diagnosticResult?.barrier_recalculations?.recursion_lab.dissolved).toBe(true);
    expect(state.worldState?.wings.recursion_lab.status).toBe('accessible');
  });

  it('resets diagnostic assessment progress cleanly upon retake', async () => {
    const store = useClassroomStore.getState();
    store.openDiagnostic();
    store.setDiagnosticAnswer('diag_arr_01', 'opt_arr_01_a');
    store.setDiagnosticIndex(2);

    await store.submitDiagnosticAssessment();
    expect(useClassroomStore.getState().diagnosticSubmitted).toBe(true);

    store.resetDiagnosticAssessment();
    const state = useClassroomStore.getState();
    expect(state.diagnosticSubmitted).toBe(false);
    expect(state.diagnosticResult).toBeNull();
    expect(state.diagnosticAnswers).toEqual({});
    expect(state.diagnosticCurrentIndex).toBe(0);
  });
});

