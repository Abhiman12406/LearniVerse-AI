import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';

describe('BKT Bayesian Knowledge Tracing & Interaction Loop', () => {
  beforeEach(async () => {
    // Reset to default baseline state (Learner B, Stack = 0.38)
    await useClassroomStore.getState().resetWorldSeed();
  });

  it('initializes Learner B with 38% Stack Mastery and sealed Recursion wing', () => {
    const { learner, worldState, lastMasteryDelta, isThresholdCrossed } = useClassroomStore.getState();

    expect(learner?.learner_id).toBe('learner_b');
    expect(learner?.mastery_map.stack).toBe(0.38);
    expect(worldState?.wings.recursion_lab.status).toBe('sealed');
    expect(isThresholdCrossed).toBe(false);
    expect(lastMasteryDelta.stack).toBeUndefined();
  });

  it('updates mastery belief upon answering question correctly', async () => {
    const store = useClassroomStore.getState();

    // Select correct option for challenge 1 ('opt_lifo_correct' -> D, C, B, A)
    store.setChallengeAnswer('stack_lifo_order', 'opt_lifo_correct');
    await store.submitChallengeAnswer('stack_lifo_order');

    const updated = useClassroomStore.getState();
    const stackMastery = updated.learner?.mastery_map.stack ?? 0;

    // Posterior update should be strictly greater than 0.38
    expect(stackMastery).toBeGreaterThan(0.38);
    expect(stackMastery).toBeCloseTo(0.53, 1);

    // Delta should be positive and recorded in lastMasteryDelta
    const delta = updated.lastMasteryDelta.stack;
    expect(delta).toBeDefined();
    expect(delta?.delta).toBeGreaterThan(0);
    expect(delta?.newMastery).toBe(stackMastery);
    expect(delta?.oldMastery).toBe(0.38);
  });

  it('decreases mastery belief upon answering question incorrectly', async () => {
    const store = useClassroomStore.getState();

    // Select incorrect option for challenge 1 ('opt_fifo' -> A, B, C, D)
    store.setChallengeAnswer('stack_lifo_order', 'opt_fifo');
    await store.submitChallengeAnswer('stack_lifo_order');

    const updated = useClassroomStore.getState();
    const stackMastery = updated.learner?.mastery_map.stack ?? 0;

    // Posterior update should be strictly less than 0.38
    expect(stackMastery).toBeLessThan(0.38);

    const delta = updated.lastMasteryDelta.stack;
    expect(delta).toBeDefined();
    expect(delta?.delta).toBeLessThan(0);
    expect(delta?.newMastery).toBe(stackMastery);
    expect(delta?.oldMastery).toBe(0.38);
  });

  it('reaches 70% threshold in 3 consecutive correct answers and unlocks Recursion Lab', async () => {
    const store = useClassroomStore.getState();

    // Step 1: Challenge 1 correct ('opt_lifo_correct')
    store.setChallengeAnswer('stack_lifo_order', 'opt_lifo_correct');
    await store.submitChallengeAnswer('stack_lifo_order');
    let state = useClassroomStore.getState();
    expect(state.learner?.mastery_map.stack).toBeCloseTo(0.53, 1);
    expect(state.isThresholdCrossed).toBe(false);
    expect(state.worldState?.wings.recursion_lab.status).toBe('sealed');

    // Step 2: Challenge 2 correct ('opt_trace_correct')
    store.setChallengeAnswer('stack_push_pop_trace', 'opt_trace_correct');
    await store.submitChallengeAnswer('stack_push_pop_trace');
    state = useClassroomStore.getState();
    expect(state.learner?.mastery_map.stack).toBeCloseTo(0.67, 1);
    expect(state.isThresholdCrossed).toBe(false);
    expect(state.worldState?.wings.recursion_lab.status).toBe('sealed');

    // Step 3: Challenge 3 correct ('opt_underflow_correct')
    store.setChallengeAnswer('stack_overflow_underflow', 'opt_underflow_correct');
    await store.submitChallengeAnswer('stack_overflow_underflow');
    state = useClassroomStore.getState();

    // 3rd correct answer pushes Stack mastery past 70%
    const finalStackMastery = state.learner?.mastery_map.stack ?? 0;
    expect(finalStackMastery).toBeGreaterThanOrEqual(0.70);

    // Dynamic classroom adaptation triggers
    expect(state.isThresholdCrossed).toBe(true);
    expect(state.unlockedWingId).toBe('recursion_lab');
    expect(state.worldState?.wings.recursion_lab.status).toBe('accessible');
    expect(state.worldState?.conduits_target_wing).toBe('recursion_lab');
  });

  it('supports 1-Click Pitch Acceleration Demo Jump (38% -> 74%)', async () => {
    const { simulateMasteryJump } = useClassroomStore.getState();

    await simulateMasteryJump('learner_b', 'stack', 0.74);

    const state = useClassroomStore.getState();
    const stackMastery = state.learner?.mastery_map.stack ?? 0;

    expect(stackMastery).toBeGreaterThanOrEqual(0.70);
    expect(stackMastery).toBeCloseTo(0.74, 1);
    expect(state.isThresholdCrossed).toBe(true);
    expect(state.unlockedWingId).toBe('recursion_lab');
    expect(state.worldState?.wings.recursion_lab.status).toBe('accessible');
    expect(state.worldState?.wings.recursion_lab.reason).toBeNull();
    expect(state.worldState?.conduits_target_wing).toBe('recursion_lab');
  });

  it('clears threshold flags and resets mastery on resetWorldSeed()', async () => {
    const store = useClassroomStore.getState();

    // Simulate jump to unlock
    await store.simulateMasteryJump('learner_b', 'stack', 0.74);
    expect(useClassroomStore.getState().isThresholdCrossed).toBe(true);

    // Reset seed
    await store.resetWorldSeed();
    const resetState = useClassroomStore.getState();

    expect(resetState.isThresholdCrossed).toBe(false);
    expect(resetState.unlockedWingId).toBeNull();
    expect(resetState.lastMasteryDelta).toEqual({});
    expect(resetState.learner?.mastery_map.stack).toBe(0.38);
    expect(resetState.worldState?.wings.recursion_lab.status).toBe('sealed');
  });
});
