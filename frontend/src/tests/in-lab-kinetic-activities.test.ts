import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { soundSystem } from '../audio/soundSystem';
import { resolveAvatarCollision } from '../utils/collision';
import { STACK_MISSION } from '../data/stackChallenges';

describe('Issue 04: In-Lab Kinetic Activities with Live Mastery Sync', () => {
  beforeEach(async () => {
    vi.useRealTimers();
    await useClassroomStore.getState().resetWorldSeed();
  });

  describe('1. LangGraph Mission Display, Objectives, & Challenge Steps', () => {
    it('displays the LangGraph-assigned mission metadata, planner rationale, and learning objectives', () => {
      const state = useClassroomStore.getState();
      const delib = state.latestDeliberation;

      expect(delib).toBeDefined();
      expect(delib?.world_instructions.active_mission).toBeDefined();
      expect(delib?.world_instructions.active_mission.title).toContain('Stack');
      expect(delib?.final_decision.reason).toContain('Stack');

      // Verify mission learning objectives
      expect(STACK_MISSION.learningObjectives).toHaveLength(4);
      expect(STACK_MISSION.learningObjectives[0]).toBe('Master Last-In, First-Out (LIFO) extraction order');
      expect(STACK_MISSION.learningObjectives[1]).toBe('Trace interleaved PUSH and POP memory transitions');
      expect(STACK_MISSION.learningObjectives[2]).toBe('Understand Capacity Overflow and Underflow boundary conditions');
      expect(STACK_MISSION.learningObjectives[3]).toBe('Bridge stack manipulation directly to Call Stack activation records');

      // Verify all 4 challenge steps are present and structured
      expect(STACK_MISSION.challenges).toHaveLength(4);
      expect(STACK_MISSION.challenges.map((c) => c.stepNumber)).toEqual([1, 2, 3, 4]);
    });

    it('supports seamless step-by-step challenge navigation across all mission steps', () => {
      const store = useClassroomStore.getState();
      expect(useClassroomStore.getState().activeChallengeIndex).toBe(0);

      store.nextChallenge();
      expect(useClassroomStore.getState().activeChallengeIndex).toBe(1);

      store.nextChallenge();
      expect(useClassroomStore.getState().activeChallengeIndex).toBe(2);

      store.nextChallenge();
      expect(useClassroomStore.getState().activeChallengeIndex).toBe(3);

      // Boundary check: should not advance past last challenge
      store.nextChallenge();
      expect(useClassroomStore.getState().activeChallengeIndex).toBe(3);

      store.prevChallenge();
      expect(useClassroomStore.getState().activeChallengeIndex).toBe(2);

      store.setActiveChallengeIndex(0);
      expect(useClassroomStore.getState().activeChallengeIndex).toBe(0);
    });
  });

  describe('2. Kinetic 3D Apparatus Manipulation & Visual Feedback', () => {
    it('manipulates 3D apparatus when submitting answers with real-time visual feedback', async () => {
      const store = useClassroomStore.getState();
      store.setActiveStation('stack_lab');

      // Stage initial discs
      store.loadChallengeOntoApparatus('stack_lifo_order');
      const initialCount = useClassroomStore.getState().stackDiscs.length;
      expect(initialCount).toBe(4);

      // Step 1: Answering stack_lifo_order pops the top disc to demonstrate LIFO extraction
      store.setChallengeAnswer('stack_lifo_order', 'opt_lifo_correct');
      const result1 = await store.submitChallengeAnswer('stack_lifo_order');

      expect(result1.isCorrect).toBe(true);
      expect(useClassroomStore.getState().stackDiscs.length).toBe(initialCount - 1);
      expect(useClassroomStore.getState().toastMessage).toContain('Popped top disc');
    });

    it('executes interleaved push/pop trace on 3D apparatus for step 2', async () => {
      const store = useClassroomStore.getState();
      store.setActiveStation('stack_lab');

      store.setChallengeAnswer('stack_push_pop_trace', 'opt_trace_correct');
      const result = await store.submitChallengeAnswer('stack_push_pop_trace');

      expect(result.isCorrect).toBe(true);
      expect(useClassroomStore.getState().toastMessage).toContain('interleaved PUSH & POP trace');
    });

    it('demonstrates capacity overflow guard on 3D apparatus for step 3', async () => {
      const store = useClassroomStore.getState();
      store.setActiveStation('stack_lab');

      store.setChallengeAnswer('stack_overflow_underflow', 'opt_underflow_correct');
      const result = await store.submitChallengeAnswer('stack_overflow_underflow');

      expect(result.isCorrect).toBe(true);
      expect(useClassroomStore.getState().toastMessage).toContain('buffer capacity');
    });

    it('stages nested call-stack frames on 3D apparatus for step 4', async () => {
      const store = useClassroomStore.getState();
      store.setActiveStation('stack_lab');

      store.setChallengeAnswer('stack_bracket_balance', 'opt_bracket_correct');
      const result = await store.submitChallengeAnswer('stack_bracket_balance');

      expect(result.isCorrect).toBe(true);
      expect(useClassroomStore.getState().toastMessage).toContain('call-stack activation frames');
    });

    it('provides audio-visual warning feedback upon incorrect invariant violation', async () => {
      const store = useClassroomStore.getState();
      store.setActiveStation('stack_lab');

      // Select incorrect FIFO answer on stack
      store.setChallengeAnswer('stack_lifo_order', 'opt_fifo');
      const result = await store.submitChallengeAnswer('stack_lifo_order');

      expect(result.isCorrect).toBe(false);
      expect(useClassroomStore.getState().toastMessage).toContain('Invariant Violation');
      expect(useClassroomStore.getState().submittedAnswers['stack_lifo_order'].isCorrect).toBe(false);
    });
  });

  describe('3. Real-Time Bayesian Knowledge Tracing (BKT) Sync', () => {
    it('computes immediate BKT posterior delta upon answering each challenge step', async () => {
      const store = useClassroomStore.getState();
      const initialMastery = store.learner?.mastery_map.stack ?? 0.38;

      store.setChallengeAnswer('stack_lifo_order', 'opt_lifo_correct');
      await store.submitChallengeAnswer('stack_lifo_order');

      const state = useClassroomStore.getState();
      const updatedMastery = state.learner?.mastery_map.stack;
      expect(updatedMastery).toBeGreaterThan(initialMastery);

      // Verify BKT delta tracking
      const delta = state.lastMasteryDelta.stack;
      expect(delta).toBeDefined();
      expect(delta?.oldMastery).toBe(initialMastery);
      expect(delta?.newMastery).toBe(updatedMastery);
      expect(delta?.delta).toBeGreaterThan(0);

      // Verify full mathematical parameters logged in latestBktTrace
      const bktTrace = state.latestBktTrace;
      expect(bktTrace).not.toBeNull();
      expect(bktTrace?.concept).toBe('stack');
      expect(bktTrace?.prior).toBe(initialMastery);
      expect(bktTrace?.posterior).toBe(updatedMastery);
      expect(bktTrace?.p_transit).toBe(0.05);
      expect(bktTrace?.numerator).toBeDefined();
      expect(bktTrace?.denominator).toBeDefined();
    });
  });

  describe('4. Dynamic 70% Prerequisite Barrier Dissolution Sequence', () => {
    it('triggers cinematic barrier dissolve sequence and sound effects when crossing 70% threshold', async () => {
      vi.useFakeTimers();

      const store = useClassroomStore.getState();
      expect(store.learner?.mastery_map.stack).toBe(0.38);
      expect(store.worldState?.wings.recursion_lab.status).toBe('sealed');

      // Execute sequential correct challenge answers that elevate mastery past 70%
      store.setChallengeAnswer('stack_lifo_order', 'opt_lifo_correct');
      await store.submitChallengeAnswer('stack_lifo_order');

      store.setChallengeAnswer('stack_push_pop_trace', 'opt_trace_correct');
      await store.submitChallengeAnswer('stack_push_pop_trace');

      store.setChallengeAnswer('stack_overflow_underflow', 'opt_underflow_correct');
      await store.submitChallengeAnswer('stack_overflow_underflow');

      const statePostAnswers = useClassroomStore.getState();
      expect(statePostAnswers.learner?.mastery_map.stack).toBeGreaterThanOrEqual(0.70);
      expect(statePostAnswers.isThresholdCrossed).toBe(true);
      expect(statePostAnswers.unlockedWingId).toBe('recursion_lab');

      // 1. Console closes to reveal 3D cinematic camera
      expect(statePostAnswers.activeStation).toBeNull();

      // 2. Dissolution phase initiates with flicker and cinematic camera framing
      expect(statePostAnswers.dissolvingWingId).toBe('recursion_lab');
      expect(statePostAnswers.dissolvePhase).toBe('flicker');
      expect(statePostAnswers.cinematicCamera?.active).toBe(true);
      expect(statePostAnswers.cinematicCamera?.position).toEqual([-10.5, 3.6, 0.0]);

      // 3. Advance to explosive particle shockwave (600ms)
      vi.advanceTimersByTime(650);
      const stateShockwave = useClassroomStore.getState();
      expect(stateShockwave.dissolvePhase).toBe('shockwave');
      expect(stateShockwave.worldState?.wings.recursion_lab.status).toBe('accessible');
      expect(stateShockwave.worldState?.conduits_target_wing).toBe('recursion_lab');

      // 4. Advance to full completion (3500ms)
      vi.advanceTimersByTime(3000);
      const stateComplete = useClassroomStore.getState();
      expect(stateComplete.dissolvePhase).toBe('dissolved');
      expect(stateComplete.dissolvingWingId).toBeNull();
      expect(stateComplete.cinematicCamera).toBeNull();

      // 5. Verify physical barrier deactivation allowing avatar entry
      const collisionResult = resolveAvatarCollision(-16.5, 0.0, stateComplete.worldState);
      expect(collisionResult.isBlockedByBarrier).toBe(false);
      expect(collisionResult.blockedWingId).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('5. Telemetry Drawer Trace Inspection & Explainability', () => {
    it('streams updated 5-agent deliberation traces into the Telemetry Drawer', async () => {
      const store = useClassroomStore.getState();

      // Answer challenge to trigger deliberation sync
      store.setChallengeAnswer('stack_lifo_order', 'opt_lifo_correct');
      await store.submitChallengeAnswer('stack_lifo_order');

      // Open Telemetry Drawer
      store.openTelemetry('agents');
      const state = useClassroomStore.getState();

      expect(state.isTelemetryOpen).toBe(true);
      expect(state.activeTelemetryTab).toBe('agents');

      const delib = state.latestDeliberation;
      expect(delib).not.toBeNull();
      expect(delib?.traces).toHaveLength(5);

      const agentNames = delib?.traces.map((t) => t.agent_name);
      expect(agentNames).toContain('Context Agent');
      expect(agentNames).toContain('Diagnostic Agent');
      expect(agentNames).toContain('Planner Agent');
      expect(agentNames).toContain('Validator Agent');
      expect(agentNames).toContain('Game Agent');

      // Verify math tab inspection
      store.setActiveTelemetryTab('math');
      expect(useClassroomStore.getState().activeTelemetryTab).toBe('math');
      expect(useClassroomStore.getState().latestBktTrace).not.toBeNull();
    });
  });
});
