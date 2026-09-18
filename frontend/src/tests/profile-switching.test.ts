import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { getMasteryColor, getMasteryStatus } from '../utils/mastery';

describe('Learner Profile Switching and 3D State Synchronization', () => {
  beforeEach(async () => {
    // Reset to default Learner B state before each test
    await useClassroomStore.getState().resetWorldSeed();
  });

  it('initializes with Learner B having remedial Stack mastery and sealed Recursion Wing', () => {
    const { learner, worldState } = useClassroomStore.getState();

    expect(learner).toBeDefined();
    expect(learner?.learner_id).toBe('learner_b');
    expect(learner?.learning_state.status).toBe('remediation_required');
    expect(learner?.mastery_map.stack).toBe(0.38);
    expect(learner?.mastery_map.recursion).toBe(0.20);

    // 3D Knowledge Graph node color for Stack must be crimson alert
    expect(getMasteryColor(learner!.mastery_map.stack)).toBe('#ff0055');
    expect(getMasteryStatus(learner!.mastery_map.stack)).toBe('novice');

    // World state verification
    expect(worldState?.wings.recursion_lab.status).toBe('sealed');
    expect(worldState?.wings.recursion_lab.reason).toContain('Requires Stack ≥ 70%');
    expect(worldState?.conduits_target_wing).toBe('stack_lab');
  });

  it('switches instantly to Learner A updating mastery, 3D colors, and unlocking Recursion Wing', async () => {
    const { switchLearner } = useClassroomStore.getState();

    // Perform profile switch
    await switchLearner('learner_a');

    const { learner, worldState } = useClassroomStore.getState();

    expect(learner?.learner_id).toBe('learner_a');
    expect(learner?.name).toContain('Elena Vance');
    expect(learner?.learning_state.status).toBe('advanced');

    // Mastery vector must reflect Learner A's high competencies
    expect(learner?.mastery_map.stack).toBe(0.84);
    expect(learner?.mastery_map.recursion).toBe(0.72);
    expect(learner?.mastery_map.array).toBe(0.92);

    // 3D Knowledge Graph node colors must now glow emerald for Stack and Recursion
    expect(getMasteryColor(learner!.mastery_map.stack)).toBe('#00ff88');
    expect(getMasteryStatus(learner!.mastery_map.stack)).toBe('mastered');

    expect(getMasteryColor(learner!.mastery_map.recursion)).toBe('#00ff88');
    expect(getMasteryStatus(learner!.mastery_map.recursion)).toBe('mastered');

    // Tree mastery (65%) should map to amber developing
    expect(getMasteryColor(learner!.mastery_map.tree)).toBe('#ffb700');
    expect(getMasteryStatus(learner!.mastery_map.tree)).toBe('developing');

    // World state: Recursion Wing is now accessible and guidance conduit points to recursion_lab
    expect(worldState?.wings.recursion_lab.status).toBe('accessible');
    expect(worldState?.conduits_target_wing).toBe('recursion_lab');
  });

  it('switches back to Learner B and restores sealed barriers and crimson node colors', async () => {
    const { switchLearner } = useClassroomStore.getState();

    // Switch to A then back to B
    await switchLearner('learner_a');
    expect(useClassroomStore.getState().learner?.learner_id).toBe('learner_a');

    await switchLearner('learner_b');
    const { learner, worldState } = useClassroomStore.getState();

    expect(learner?.learner_id).toBe('learner_b');
    expect(learner?.mastery_map.stack).toBe(0.38);
    expect(getMasteryColor(learner!.mastery_map.stack)).toBe('#ff0055');

    expect(worldState?.wings.recursion_lab.status).toBe('sealed');
    expect(worldState?.conduits_target_wing).toBe('stack_lab');
  });
});
