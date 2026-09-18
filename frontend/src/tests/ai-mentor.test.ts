import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';

describe('AI Mentor & Feynman Guidance Subsystem', () => {
  beforeEach(() => {
    // Reset store to known baseline
    useClassroomStore.setState({
      isMentorOpen: false,
      isNearMentor: false,
      avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
    });
  });

  it('manages dialogue open and close state transitions smoothly', () => {
    const { openMentor, closeMentor } = useClassroomStore.getState();
    expect(useClassroomStore.getState().isMentorOpen).toBe(false);

    openMentor();
    expect(useClassroomStore.getState().isMentorOpen).toBe(true);

    closeMentor();
    expect(useClassroomStore.getState().isMentorOpen).toBe(false);
  });

  it('correctly tracks proximity state when avatar approaches Central Dais beacon', () => {
    const { setIsNearMentor } = useClassroomStore.getState();
    expect(useClassroomStore.getState().isNearMentor).toBe(false);

    setIsNearMentor(true);
    expect(useClassroomStore.getState().isNearMentor).toBe(true);

    setIsNearMentor(false);
    expect(useClassroomStore.getState().isNearMentor).toBe(false);
  });

  it('calculates spatial Euclidean proximity to AI Mentor beacon at (2, 0.5, 2)', () => {
    const beaconPos: [number, number, number] = [2, 0.5, 2];
    const threshold = 3.2;

    const isWithinRange = (avatarPos: [number, number, number]): boolean => {
      const dist = Math.hypot(avatarPos[0] - beaconPos[0], avatarPos[2] - beaconPos[2]);
      return dist <= threshold;
    };

    // Avatar at spawn (0, 0, 8) -> dist = sqrt(2^2 + 6^2) ≈ 6.32
    expect(isWithinRange([0, 0, 8])).toBe(false);

    // Avatar on Dais step near beacon (2, 0.5, 3.5) -> dist = 1.5
    expect(isWithinRange([2, 0.5, 3.5])).toBe(true);

    // Avatar directly adjacent to beacon (1.5, 0.5, 1.8) -> dist ≈ 0.54
    expect(isWithinRange([1.5, 0.5, 1.8])).toBe(true);

    // Avatar out near Array Station (12, 0, -20) -> dist ≈ 24.16
    expect(isWithinRange([12, 0, -20])).toBe(false);
  });

  it('delivers tailored remedial Feynman guidance for Learner B', async () => {
    await useClassroomStore.getState().switchLearner('learner_b');
    const guidance = useClassroomStore.getState().mentorGuidance;

    expect(guidance).toBeDefined();
    expect(guidance?.learner_id).toBe('learner_b');
    expect(guidance?.status).toBe('remediation_required');
    expect(guidance?.focus_concept).toBe('stack');
    expect(guidance?.recommended_station).toBe('stack_lab');

    // Feynman explanation assertions
    const feynman = guidance?.feynman_explanation;
    expect(feynman?.concept).toBe('stack');
    expect(feynman?.target_prerequisite_of).toBe('recursion');
    expect(feynman?.analogy.toLowerCase()).toContain('tray');
    expect(feynman?.conceptual_bridge.toLowerCase()).toContain('call stack');
    expect(feynman?.prerequisite_gap).toContain('38%');

    // Interactive questions check
    const qIds = guidance?.interactive_questions.map((q) => q.id);
    expect(qIds).toContain('why_stack_first');
    expect(qIds).toContain('call_stack_unwind');
  });

  it('delivers tailored advanced readiness guidance for Learner A', async () => {
    await useClassroomStore.getState().switchLearner('learner_a');
    const guidance = useClassroomStore.getState().mentorGuidance;

    expect(guidance).toBeDefined();
    expect(guidance?.learner_id).toBe('learner_a');
    expect(guidance?.status).toBe('advanced_readiness');
    expect(guidance?.focus_concept).toBe('recursion');
    expect(guidance?.recommended_station).toBe('recursion_lab');

    // Feynman explanation assertions
    const feynman = guidance?.feynman_explanation;
    expect(feynman?.concept).toBe('recursion');
    expect(feynman?.analogy.toLowerCase()).toContain('matryoshka');
    expect(feynman?.prerequisite_gap).toBeNull();
  });
});
