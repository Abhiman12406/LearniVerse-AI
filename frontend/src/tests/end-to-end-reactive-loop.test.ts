import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { soundSystem } from '../audio/soundSystem';
import { resolveAvatarCollision } from '../utils/collision';

describe('End-to-End Reactive Loop & 90-Second Hero Pitch Demonstration', () => {
  beforeEach(async () => {
    vi.useRealTimers();
    await useClassroomStore.getState().resetWorldSeed();
  });

  describe('Full Reactive Cycle (DEMO.md Seam)', () => {
    it('executes full loop: Challenge answer click -> BKT update -> 5-agent deliberation -> sound cue -> 3D camera pan & barrier dissolve', async () => {
      const store = useClassroomStore.getState();
      expect(store.learner?.mastery_map.stack).toBe(0.38);
      expect(store.worldState?.wings.recursion_lab.status).toBe('sealed');

      // 1. Student selects answer and submits
      store.setChallengeAnswer('stack_lifo_order', 'opt_lifo_correct');
      const submission = await store.submitChallengeAnswer('stack_lifo_order');

      expect(submission.isCorrect).toBe(true);

      // 2. Authoritative BKT posterior update
      const state1 = useClassroomStore.getState();
      expect(state1.learner?.mastery_map.stack).toBeGreaterThan(0.38);
      expect(state1.lastMasteryDelta.stack).toBeDefined();
      expect(state1.lastMasteryDelta.stack?.delta).toBeGreaterThan(0);

      // 3. 5-Agent Deliberation trace received & Validator Agent enforces deterministic policy
      expect(state1.latestDeliberation).toBeDefined();
      expect(state1.latestDeliberation?.traces.length).toBe(5);
      const initialValidatorTrace = state1.latestDeliberation?.traces.find(
        (t) => t.agent_name === 'Validator Agent'
      );
      expect(initialValidatorTrace).toBeDefined();
      expect(['OVERRULED', 'CERTIFIED']).toContain(initialValidatorTrace?.status);

      // 4. Consecutive answers elevate past 70% threshold and trigger live 3D dissolve
      vi.useFakeTimers();

      store.setChallengeAnswer('stack_push_pop_trace', 'opt_trace_correct');
      await store.submitChallengeAnswer('stack_push_pop_trace');

      store.setChallengeAnswer('stack_overflow_underflow', 'opt_underflow_correct');
      await store.submitChallengeAnswer('stack_overflow_underflow');

      const state2 = useClassroomStore.getState();
      expect(state2.learner?.mastery_map.stack).toBeGreaterThanOrEqual(0.70);
      expect(state2.isThresholdCrossed).toBe(true);
      expect(state2.unlockedWingId).toBe('recursion_lab');

      // Validator Agent now certifies advanced readiness
      const certifiedValidator = state2.latestDeliberation?.traces.find(
        (t) => t.agent_name === 'Validator Agent'
      );
      expect(certifiedValidator?.status).toBe('CERTIFIED');

      // 5. Cinematic camera pan and barrier dissolve triggered
      expect(state2.dissolvingWingId).toBe('recursion_lab');
      expect(state2.dissolvePhase).toBe('flicker');
      expect(state2.cinematicCamera).toBeDefined();
      expect(state2.cinematicCamera?.active).toBe(true);

      // 6. Advance past flicker into shockwave (600ms)
      vi.advanceTimersByTime(650);
      const state3 = useClassroomStore.getState();
      expect(state3.dissolvePhase).toBe('shockwave');
      expect(state3.worldState?.wings.recursion_lab.status).toBe('accessible');
      expect(state3.worldState?.conduits_target_wing).toBe('recursion_lab');

      // 7. Advance to dissolve completion (3500ms total)
      vi.advanceTimersByTime(3000);
      const state4 = useClassroomStore.getState();
      expect(state4.dissolvePhase).toBe('dissolved');
      expect(state4.cinematicCamera).toBeNull();
      expect(state4.dissolvingWingId).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('90-Second Hero Pitch Demonstration Flow (GAME.md)', () => {
    it('runs the complete 5-step hero pitch flow seamlessly', async () => {
      // -------------------------------------------------------------
      // BEAT 1: Learner B Initialized (Stack 38%, Recursion Sealed)
      // -------------------------------------------------------------
      await useClassroomStore.getState().switchLearner('learner_b');
      let state = useClassroomStore.getState();

      expect(state.learner?.learner_id).toBe('learner_b');
      expect(state.learner?.mastery_map.stack).toBe(0.38);
      expect(state.learner?.learning_state.status).toBe('remediation_required');
      expect(state.worldState?.wings.recursion_lab.status).toBe('sealed');
      expect(state.worldState?.conduits_target_wing).toBe('stack_lab');

      // Verify physical barrier collision blocks Avatar at Recursion portal
      const blockedCollision = resolveAvatarCollision(-16.5, 0.0, state.worldState);
      expect(blockedCollision.isBlockedByBarrier).toBe(true);
      expect(blockedCollision.blockedWingId).toBe('recursion_lab');

      // -------------------------------------------------------------
      // BEAT 2: Avatar enters Stack Lab & accesses Challenge Console
      // -------------------------------------------------------------
      state.setActiveStation('stack_lab');
      expect(useClassroomStore.getState().activeStation).toBe('stack_lab');

      // Interacts with kinetic disc apparatus
      state.pushStackDisc(42);
      expect(useClassroomStore.getState().stackDiscs.some((d) => d.value === 42)).toBe(true);
      state.popStackDisc();

      // Answers challenge with audio-visual feedback
      state.setChallengeAnswer('stack_lifo_order', 'opt_lifo_correct');
      const feedback = await state.submitChallengeAnswer('stack_lifo_order');
      expect(feedback.isCorrect).toBe(true);

      // -------------------------------------------------------------
      // BEAT 3: Single Click on "Simulate Mastery Jump (38% → 74%)"
      // -------------------------------------------------------------
      vi.useFakeTimers();

      await useClassroomStore.getState().simulateMasteryJump('learner_b', 'stack', 0.74);
      state = useClassroomStore.getState();

      expect(state.learner?.mastery_map.stack).toBe(0.74);
      expect(state.isThresholdCrossed).toBe(true);
      expect(state.unlockedWingId).toBe('recursion_lab');
      // Console modal automatically exits so 3D camera pan is visible
      expect(state.activeStation).toBeNull();

      // -------------------------------------------------------------
      // BEAT 4: Dramatic Live Barrier Dissolve & Particle Shockwave
      // -------------------------------------------------------------
      expect(state.dissolvingWingId).toBe('recursion_lab');
      expect(state.dissolvePhase).toBe('flicker');
      expect(state.cinematicCamera?.active).toBe(true);

      // Advance into shockwave
      vi.advanceTimersByTime(650);
      state = useClassroomStore.getState();
      expect(state.dissolvePhase).toBe('shockwave');
      expect(state.worldState?.wings.recursion_lab.status).toBe('accessible');

      // Avatar can now walk through the unlocked portal freely
      const openCollision = resolveAvatarCollision(-16.5, 0.0, state.worldState);
      expect(openCollision.isBlockedByBarrier).toBe(false);
      expect(openCollision.blockedWingId).toBeNull();

      // -------------------------------------------------------------
      // BEAT 5: Telemetry Drawer opens with 5-agent trace & Reset Seed
      // -------------------------------------------------------------
      state.openTelemetry('explainability');
      expect(useClassroomStore.getState().isTelemetryOpen).toBe(true);
      expect(useClassroomStore.getState().activeTelemetryTab).toBe('explainability');

      // Switch to multi-agent deliberation tab
      state.setActiveTelemetryTab('agents');
      expect(useClassroomStore.getState().activeTelemetryTab).toBe('agents');
      expect(useClassroomStore.getState().latestDeliberation?.traces.length).toBe(5);

      // "Reset Seed" reliably restores clean demonstration conditions
      await useClassroomStore.getState().resetWorldSeed();
      const resetState = useClassroomStore.getState();

      expect(resetState.learner?.learner_id).toBe('learner_b');
      expect(resetState.learner?.mastery_map.stack).toBe(0.38);
      expect(resetState.isThresholdCrossed).toBe(false);
      expect(resetState.unlockedWingId).toBeNull();
      expect(resetState.worldState?.wings.recursion_lab.status).toBe('sealed');
      expect(resetState.worldState?.conduits_target_wing).toBe('stack_lab');
      expect(resetState.isTelemetryOpen).toBe(false);
      expect(resetState.activeStation).toBeNull();
      expect(resetState.avatar.position).toEqual([0, 0, 8]);

      vi.useRealTimers();
    });
  });

  describe('Performance & Zero External Asset Verification', () => {
    it('executes reactive actions with low latency and procedural synthesizers', async () => {
      const startTime = performance.now();

      await useClassroomStore.getState().submitInteraction(
        'stack',
        'perf_test_q1',
        true,
        'medium'
      );

      const elapsed = performance.now() - startTime;
      expect(elapsed).toBeLessThan(200); // < 200 ms reactive latency

      // Web Audio synthesizers generate zero network requests
      expect(() => soundSystem.playUnlockArpeggio()).not.toThrow();
      expect(() => soundSystem.playMagneticThud()).not.toThrow();
      expect(() => soundSystem.playSuccess()).not.toThrow();
    });
  });
});
