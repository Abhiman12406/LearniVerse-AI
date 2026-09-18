import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { resolveAvatarCollision } from '../utils/collision';

describe('Stack Lab Apparatus & Conduit Guidance System', () => {
  beforeEach(async () => {
    // Reset to initial clean demonstration seed
    await useClassroomStore.getState().resetWorldSeed();
  });

  it('directs floor conduits to Stack Lab when Learner B is active', () => {
    const { learner, worldState } = useClassroomStore.getState();

    expect(learner?.learner_id).toBe('learner_b');
    // Learner B has Stack deficiency, so floor conduits must pulse toward stack_lab
    expect(worldState?.conduits_target_wing).toBe('stack_lab');
    expect(learner?.recommended_station).toBe('stack_lab');
  });

  it('updates conduit guidance to Recursion Lab when switching to Learner A', async () => {
    const { switchLearner } = useClassroomStore.getState();

    await switchLearner('learner_a');
    const { learner, worldState } = useClassroomStore.getState();

    expect(learner?.learner_id).toBe('learner_a');
    expect(worldState?.conduits_target_wing).toBe('recursion_lab');
    expect(learner?.recommended_station).toBe('recursion_lab');
  });

  it('initializes Stack Apparatus with default educational numeric discs', () => {
    const { stackDiscs } = useClassroomStore.getState();

    expect(stackDiscs).toHaveLength(3);
    expect(stackDiscs[0].value).toBe(10);
    expect(stackDiscs[1].value).toBe(25);
    expect(stackDiscs[2].value).toBe(42);
  });

  it('executes LIFO push operation with spring disc allocation', () => {
    const { pushStackDisc } = useClassroomStore.getState();

    pushStackDisc(99);
    const { stackDiscs } = useClassroomStore.getState();

    expect(stackDiscs).toHaveLength(4);
    // Top element must be the newly pushed 99
    expect(stackDiscs[stackDiscs.length - 1].value).toBe(99);
  });

  it('executes LIFO pop operation removing top element in strict LIFO order', () => {
    const { pushStackDisc, popStackDisc } = useClassroomStore.getState();

    pushStackDisc(77);
    expect(useClassroomStore.getState().stackDiscs).toHaveLength(4);

    popStackDisc();
    const { stackDiscs } = useClassroomStore.getState();

    expect(stackDiscs).toHaveLength(3);
    // Top element returns to 42
    expect(stackDiscs[stackDiscs.length - 1].value).toBe(42);
  });

  it('enforces capacity overflow constraint at 6 discs maximum', () => {
    const { pushStackDisc } = useClassroomStore.getState();

    // Push until capacity is reached
    pushStackDisc(50); // 4
    pushStackDisc(60); // 5
    pushStackDisc(70); // 6
    expect(useClassroomStore.getState().stackDiscs).toHaveLength(6);

    // 7th push must be rejected by overflow guard
    pushStackDisc(80);
    expect(useClassroomStore.getState().stackDiscs).toHaveLength(6);
  });

  it('enforces underflow constraint on empty stack', () => {
    const { popStackDisc } = useClassroomStore.getState();

    // Pop all discs
    popStackDisc();
    popStackDisc();
    popStackDisc();
    expect(useClassroomStore.getState().stackDiscs).toHaveLength(0);

    // Pop on empty stack should not produce negative length or throw
    popStackDisc();
    expect(useClassroomStore.getState().stackDiscs).toHaveLength(0);
  });

  it('activates and deactivates cinematic station console mode', () => {
    const { setActiveStation } = useClassroomStore.getState();

    expect(useClassroomStore.getState().activeStation).toBeNull();

    setActiveStation('stack_lab');
    expect(useClassroomStore.getState().activeStation).toBe('stack_lab');

    setActiveStation(null);
    expect(useClassroomStore.getState().activeStation).toBeNull();
  });

  it('permits Avatar movement through Stack Lab archway into the chamber platform', () => {
    const { worldState } = useClassroomStore.getState();

    // Stack Lab archway is at azimuth 150 deg (sin=0.5, cos=-0.866)
    // Center at radius 21.0 in radial sector
    const angleRad = (150 * Math.PI) / 180;
    const testX = Math.sin(angleRad) * 21.0;
    const testZ = -Math.cos(angleRad) * 21.0;

    const result = resolveAvatarCollision(testX, testZ, worldState);

    // Because Stack Lab is accessible, Avatar is allowed past the 17.2 atrium boundary into the chamber
    expect(result.isBlockedByBarrier).toBe(false);
    expect(result.blockedWingId).toBeNull();
    expect(result.x).toBeCloseTo(testX, 1);
    expect(result.z).toBeCloseTo(testZ, 1);
  });
});
