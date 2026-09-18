import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';

describe('Classroom Zustand Store', () => {
  beforeEach(() => {
    // Reset store state
    useClassroomStore.setState({
      isMuted: false,
      avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
    });
  });

  it('initializes with default Learner B profile', () => {
    const learner = useClassroomStore.getState().learner;
    expect(learner).toBeDefined();
    expect(learner?.learner_id).toBe('learner_b');
    expect(learner?.persona_type).toContain('Remedial');
    expect(learner?.mastery_map.stack).toBe(0.38);
  });

  it('toggles audio mute state properly', () => {
    const { isMuted, toggleAudioMute } = useClassroomStore.getState();
    expect(isMuted).toBe(false);

    toggleAudioMute();
    expect(useClassroomStore.getState().isMuted).toBe(true);

    toggleAudioMute();
    expect(useClassroomStore.getState().isMuted).toBe(false);
  });

  it('updates avatar spatial state', () => {
    const { setAvatarState } = useClassroomStore.getState();
    setAvatarState([3.5, 0.5, -2.0], 1.57, true);

    const updated = useClassroomStore.getState().avatar;
    expect(updated.position).toEqual([3.5, 0.5, -2.0]);
    expect(updated.rotation).toBeCloseTo(1.57);
    expect(updated.isMoving).toBe(true);
  });
});
