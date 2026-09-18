import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';

describe('Slide-Out Telemetry Drawer & Explainability Inspector (Issue 09)', () => {
  beforeEach(async () => {
    // Reset to default baseline state (Learner B, drawer closed)
    await useClassroomStore.getState().resetWorldSeed();
    useClassroomStore.setState({
      isTelemetryOpen: false,
      activeTelemetryTab: 'explainability',
    });
  });

  describe('Drawer State & Navigation', () => {
    it('initializes with drawer closed and explainability tab active', () => {
      const state = useClassroomStore.getState();
      expect(state.isTelemetryOpen).toBe(false);
      expect(state.activeTelemetryTab).toBe('explainability');
      expect(state.latestDeliberation).toBeDefined();
      expect(state.latestBktTrace).toBeDefined();
    });

    it('toggles telemetry drawer open and closed', () => {
      const store = useClassroomStore.getState();

      store.toggleTelemetry();
      expect(useClassroomStore.getState().isTelemetryOpen).toBe(true);

      store.toggleTelemetry();
      expect(useClassroomStore.getState().isTelemetryOpen).toBe(false);
    });

    it('opens drawer to a specific tab and closes cleanly', () => {
      const store = useClassroomStore.getState();

      store.openTelemetry('bkt');
      expect(useClassroomStore.getState().isTelemetryOpen).toBe(true);
      expect(useClassroomStore.getState().activeTelemetryTab).toBe('bkt');

      store.setActiveTelemetryTab('agents');
      expect(useClassroomStore.getState().activeTelemetryTab).toBe('agents');

      store.closeTelemetry();
      expect(useClassroomStore.getState().isTelemetryOpen).toBe(false);
    });
  });

  describe('Multi-Agent Trace View', () => {
    it('contains all 5 agents in the sequential deliberation pipeline trace', () => {
      const { latestDeliberation } = useClassroomStore.getState();
      expect(latestDeliberation).not.toBeNull();
      const traces = latestDeliberation!.traces;

      expect(traces).toHaveLength(5);
      expect(traces[0].agent_name).toBe('Context Agent');
      expect(traces[1].agent_name).toBe('Diagnostic Agent');
      expect(traces[2].agent_name).toBe('Planner Agent');
      expect(traces[3].agent_name).toBe('Validator Agent');
      expect(traces[4].agent_name).toBe('Game Agent');
    });

    it('includes status badges, timestamps, duration, and structured reasoning for each agent', () => {
      const traces = useClassroomStore.getState().latestDeliberation!.traces;

      traces.forEach((trace) => {
        expect(trace.agent_name).toBeDefined();
        expect(trace.stage).toBeDefined();
        expect(trace.duration_ms).toBeGreaterThan(0);
        expect(new Date(trace.timestamp).getTime()).not.toBeNaN();
        expect(trace.input_summary).toBeTypeOf('object');
        expect(trace.output_summary).toBeTypeOf('object');
        expect(trace.reasoning.length).toBeGreaterThan(10);
      });
    });

    it('flags Validator Agent as OVERRULED for Learner B', () => {
      const traces = useClassroomStore.getState().latestDeliberation!.traces;
      const validatorTrace = traces.find((t) => t.agent_name === 'Validator Agent');

      expect(validatorTrace).toBeDefined();
      expect(validatorTrace?.status).toBe('OVERRULED');
      expect(validatorTrace?.reasoning).toContain('Deterministic Guardrail Overrule');
      expect(validatorTrace?.reasoning).toContain('requires Stack ≥ 70%');
    });

    it('flags Validator Agent as CERTIFIED for Learner A', async () => {
      await useClassroomStore.getState().switchLearner('learner_a');
      const traces = useClassroomStore.getState().latestDeliberation!.traces;
      const validatorTrace = traces.find((t) => t.agent_name === 'Validator Agent');

      expect(validatorTrace).toBeDefined();
      expect(validatorTrace?.status).toBe('CERTIFIED');
      expect(validatorTrace?.reasoning).toContain('Certified');
    });
  });

  describe('Why This Decision? Explainability Card', () => {
    it('articulates deterministic guardrail policy overrule for Learner B', () => {
      const { latestDeliberation, learner } = useClassroomStore.getState();
      const decision = latestDeliberation!.final_decision;

      expect(decision.guardrail_status).toBe('OVERRULED');
      expect(decision.overruled).toBe(true);
      expect(decision.certified).toBe(false);
      expect(decision.action).toBe('REMEDIATE');
      expect(decision.concept).toBe('stack');
      expect(decision.difficulty).toBe('easy');
      expect(decision.reason).toContain('Stack ≥ 70%');
      expect(decision.overruling_reason).toContain('Current mastery is only 38%');

      // Recommended station and world instructions must target Stack Lab
      expect(latestDeliberation!.world_instructions.recommended_station).toBe('stack_lab');
      expect(latestDeliberation!.world_instructions.conduits_target_wing).toBe('stack_lab');
      expect(learner?.recommended_station).toBe('stack_lab');
    });

    it('articulates deterministic certification for Learner A to access Recursion Lab', async () => {
      await useClassroomStore.getState().switchLearner('learner_a');
      const { latestDeliberation, learner } = useClassroomStore.getState();
      const decision = latestDeliberation!.final_decision;

      expect(decision.guardrail_status).toBe('CERTIFIED');
      expect(decision.overruled).toBe(false);
      expect(decision.certified).toBe(true);
      expect(decision.action).toBe('PRACTICE');
      expect(decision.concept).toBe('recursion');
      expect(decision.difficulty).toBe('hard');

      expect(latestDeliberation!.world_instructions.recommended_station).toBe('recursion_lab');
      expect(latestDeliberation!.world_instructions.conduits_target_wing).toBe('recursion_lab');
      expect(learner?.recommended_station).toBe('recursion_lab');
    });
  });

  describe('BKT Mathematics Inspector', () => {
    it('records initial BKT belief trace for Learner B with correct parameters', () => {
      const { latestBktTrace } = useClassroomStore.getState();

      expect(latestBktTrace).toBeDefined();
      expect(latestBktTrace?.concept).toBe('stack');
      expect(latestBktTrace?.prior).toBe(0.38);
      expect(latestBktTrace?.p_slip).toBe(0.11);
      expect(latestBktTrace?.p_transit).toBe(0.05);
      expect(latestBktTrace?.p_obs).toBeGreaterThan(0);
      expect(latestBktTrace?.posterior).toBeGreaterThan(0.38);
    });

    it('updates BKT calculation step-by-step when answering question correctly', async () => {
      const store = useClassroomStore.getState();
      await store.submitInteraction('stack', 'q_telemetry_test', true, 'easy');

      const updated = useClassroomStore.getState();
      const bkt = updated.latestBktTrace;

      expect(bkt).toBeDefined();
      expect(bkt?.correct).toBe(true);
      expect(bkt?.prior).toBe(0.38);
      expect(bkt?.p_slip).toBe(0.11);
      expect(bkt?.p_guess).toBe(0.60);
      expect(bkt?.p_transit).toBe(0.05);

      // Numerator: 0.38 * (1 - 0.11) = 0.3382
      expect(bkt?.numerator).toBeCloseTo(0.3382, 3);
      // Denominator: 0.3382 + (1 - 0.38) * 0.60 = 0.3382 + 0.372 = 0.7102
      expect(bkt?.denominator).toBeCloseTo(0.7102, 3);

      expect(bkt?.p_obs).toBeCloseTo(0.476, 2);
      expect(bkt?.posterior).toBeGreaterThan(bkt!.prior);
      expect(bkt?.delta).toBeGreaterThan(0);
    });

    it('updates BKT calculation step-by-step when answering question incorrectly', async () => {
      const store = useClassroomStore.getState();
      await store.submitInteraction('stack', 'q_telemetry_wrong', false, 'easy');

      const updated = useClassroomStore.getState();
      const bkt = updated.latestBktTrace;

      expect(bkt).toBeDefined();
      expect(bkt?.correct).toBe(false);
      expect(bkt?.prior).toBe(0.38);

      // Numerator: 0.38 * 0.11 = 0.0418
      expect(bkt?.numerator).toBeCloseTo(0.0418, 3);
      // Denominator: 0.0418 + (1 - 0.38) * (1 - 0.60) = 0.0418 + 0.248 = 0.2898
      expect(bkt?.denominator).toBeCloseTo(0.2898, 3);

      expect(bkt?.delta).toBeLessThan(0);
    });
  });

  describe('Real-Time Store Subscriptions & Accelerations', () => {
    it('updates deliberation and BKT trace synchronously upon profile switch', async () => {
      const store = useClassroomStore.getState();

      await store.switchLearner('learner_a');
      const stateA = useClassroomStore.getState();
      expect(stateA.learner?.learner_id).toBe('learner_a');
      expect(stateA.latestDeliberation?.student_id).toBe('learner_a');
      expect(stateA.latestDeliberation?.final_decision.guardrail_status).toBe('CERTIFIED');
      expect(stateA.latestBktTrace?.prior).toBe(0.84);

      await store.switchLearner('learner_b');
      const stateB = useClassroomStore.getState();
      expect(stateB.learner?.learner_id).toBe('learner_b');
      expect(stateB.latestDeliberation?.student_id).toBe('learner_b');
      expect(stateB.latestDeliberation?.final_decision.guardrail_status).toBe('OVERRULED');
      expect(stateB.latestBktTrace?.prior).toBe(0.38);
    });

    it('transitions decision from OVERRULED to CERTIFIED on simulated mastery jump to 75%', async () => {
      const store = useClassroomStore.getState();
      expect(store.latestDeliberation?.final_decision.guardrail_status).toBe('OVERRULED');

      await store.simulateMasteryJump('learner_b', 'stack', 0.75);

      const updated = useClassroomStore.getState();
      expect(updated.learner?.mastery_map.stack).toBe(0.75);
      expect(updated.isThresholdCrossed).toBe(true);
      expect(updated.latestDeliberation?.final_decision.guardrail_status).toBe('CERTIFIED');
      expect(updated.latestBktTrace?.posterior).toBe(0.75);
      expect(updated.latestBktTrace?.threshold_crossed).toBe(true);
    });
  });
});
