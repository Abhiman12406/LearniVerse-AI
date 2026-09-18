import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { resolveAvatarCollision, getArchwayCollisionBounds } from '../utils/collision';

describe('Prerequisite Barrier & Holographic Diagnostic Plaque', () => {
  beforeEach(async () => {
    // Reset to default baseline state (Learner B)
    await useClassroomStore.getState().resetWorldSeed();
  });

  it('marks Recursion Lab as sealed with diagnostic gap for Learner B', () => {
    const { learner, worldState } = useClassroomStore.getState();

    expect(learner?.learner_id).toBe('learner_b');
    expect(learner?.mastery_map.stack).toBe(0.38);

    const recursionWing = worldState?.wings.recursion_lab;
    expect(recursionWing).toBeDefined();
    expect(recursionWing?.status).toBe('sealed');
    expect(recursionWing?.required_mastery?.stack).toBe(0.70);
    expect(recursionWing?.reason).toContain('Requires Stack ≥ 70%');
    expect(recursionWing?.reason).toContain('Current: 38%');
  });

  it('unseals Recursion Lab when switching to Learner A', async () => {
    const { switchLearner } = useClassroomStore.getState();

    await switchLearner('learner_a');
    const { learner, worldState } = useClassroomStore.getState();

    expect(learner?.learner_id).toBe('learner_a');
    expect(learner?.mastery_map.stack).toBe(0.84);

    const recursionWing = worldState?.wings.recursion_lab;
    expect(recursionWing?.status).toBe('accessible');
    expect(recursionWing?.reason).toBeNull();
  });

  it('physically blocks Avatar movement through sealed Recursion Lab barrier for Learner B', () => {
    const { worldState } = useClassroomStore.getState();
    expect(worldState?.wings.recursion_lab.status).toBe('sealed');

    // Recursion Lab archway is at azimuth 270 deg (x = -17.5, z = 0)
    // Attempt to walk through barrier toward x = -17.0
    const attemptX = -17.0;
    const attemptZ = 0.0;

    const result = resolveAvatarCollision(attemptX, attemptZ, worldState);

    expect(result.isBlockedByBarrier).toBe(true);
    expect(result.blockedWingId).toBe('recursion_lab');
    // Clamped firmly to the barrier distance (15.8 units from center)
    expect(result.x).toBeCloseTo(-15.8, 1);
    expect(result.z).toBeCloseTo(0.0, 1);
  });

  it('allows Avatar movement freely through unsealed entrance when Learner A is active', async () => {
    const { switchLearner } = useClassroomStore.getState();
    await switchLearner('learner_a');
    const { worldState } = useClassroomStore.getState();

    expect(worldState?.wings.recursion_lab.status).toBe('accessible');

    // Attempt to walk through archway into the lab corridor at x = -17.5
    const attemptX = -17.5;
    const attemptZ = 0.0;

    const result = resolveAvatarCollision(attemptX, attemptZ, worldState);

    expect(result.isBlockedByBarrier).toBe(false);
    expect(result.blockedWingId).toBeNull();
    // Avatar is permitted past the 15.8 barrier plane
    expect(result.x).toBeCloseTo(-17.5, 1);
  });

  it('restores barrier obstruction immediately when switching back to Learner B', async () => {
    const { switchLearner } = useClassroomStore.getState();

    // Switch to A then back to B
    await switchLearner('learner_a');
    expect(useClassroomStore.getState().worldState?.wings.recursion_lab.status).toBe('accessible');

    await switchLearner('learner_b');
    const { worldState } = useClassroomStore.getState();

    expect(worldState?.wings.recursion_lab.status).toBe('sealed');

    // Avatar attempting to cross is blocked again
    const result = resolveAvatarCollision(-16.8, 0.2, worldState);
    expect(result.isBlockedByBarrier).toBe(true);
    expect(result.blockedWingId).toBe('recursion_lab');
    expect(result.x).toBeCloseTo(-15.8, 1);
  });

  it('calculates accurate collision bounds for all five archways', () => {
    const { worldState } = useClassroomStore.getState();
    const bounds = getArchwayCollisionBounds(worldState);

    expect(bounds).toHaveLength(5);
    const recursionBounds = bounds.find((b) => b.wingId === 'recursion_lab');
    expect(recursionBounds).toBeDefined();
    expect(recursionBounds?.isSealed).toBe(true);
    expect(recursionBounds?.azimuthDeg).toBe(270);
    expect(recursionBounds?.centerX).toBeCloseTo(-17.5, 1);
    expect(recursionBounds?.centerZ).toBeCloseTo(0, 1);
    expect(recursionBounds?.barrierDistance).toBe(15.8);
  });
});
