import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { soundSystem } from '../audio/soundSystem';
import { resolveAvatarCollision } from '../utils/collision';

describe('Procedural Web Audio & Live Barrier Dissolve', () => {
  beforeEach(() => {
    useClassroomStore.setState({
      dissolvingWingId: null,
      dissolvePhase: 'idle',
      cinematicCamera: null,
      avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
    });
  });

  describe('SoundSystem Procedural Synthesizers', () => {
    it('initializes and executes all sound cues without throwing errors', () => {
      expect(() => soundSystem.playPneumaticThud()).not.toThrow();
      expect(() => soundSystem.playCorrect()).not.toThrow();
      expect(() => soundSystem.playError()).not.toThrow();
      expect(() => soundSystem.playUnlockArpeggio()).not.toThrow();
      expect(() => soundSystem.playChirp()).not.toThrow();
      expect(() => soundSystem.playChime()).not.toThrow();
    });

    it('honors global mute toggle across all synthesized sound effects', () => {
      const initialMuted = soundSystem.getMuted();
      expect(initialMuted).toBe(false);

      // Toggle to muted
      const isMutedNow = soundSystem.toggleMute();
      expect(isMutedNow).toBe(true);
      expect(soundSystem.getMuted()).toBe(true);

      // Calls while muted should safely return early
      expect(() => {
        soundSystem.playPneumaticThud();
        soundSystem.playCorrect();
        soundSystem.playError();
        soundSystem.playUnlockArpeggio();
      }).not.toThrow();

      // Toggle back to unmuted
      soundSystem.toggleMute();
      expect(soundSystem.getMuted()).toBe(false);
    });
  });

  describe('Barrier Dissolution State Machine', () => {
    it('initiates flicker phase and cinematic camera framing upon dissolution trigger', () => {
      vi.useFakeTimers();

      const { triggerBarrierDissolve } = useClassroomStore.getState();
      triggerBarrierDissolve('recursion_lab');

      const state = useClassroomStore.getState();
      expect(state.dissolvingWingId).toBe('recursion_lab');
      expect(state.dissolvePhase).toBe('flicker');
      expect(state.cinematicCamera).toBeDefined();
      expect(state.cinematicCamera?.active).toBe(true);
      expect(state.cinematicCamera?.position[0]).toBe(-10.5);

      // Advance past flicker into shockwave (600ms)
      vi.advanceTimersByTime(650);
      const shockwaveState = useClassroomStore.getState();
      expect(shockwaveState.dissolvePhase).toBe('shockwave');
      expect(shockwaveState.worldState?.wings['recursion_lab'].status).toBe('accessible');

      // Advance to full completion (3500ms total)
      vi.advanceTimersByTime(3000);
      const finishedState = useClassroomStore.getState();
      expect(finishedState.dissolvePhase).toBe('dissolved');
      expect(finishedState.dissolvingWingId).toBeNull();
      expect(finishedState.cinematicCamera).toBeNull();

      vi.useRealTimers();
    });

    it('executes simulateMasteryJump, elevating Stack mastery to 75% and dissolving barrier', async () => {
      await useClassroomStore.getState().switchLearner('learner_b');
      expect(useClassroomStore.getState().learner?.mastery_map.stack).toBe(0.38);

      await useClassroomStore.getState().simulateMasteryJump();

      const learner = useClassroomStore.getState().learner;
      expect(learner?.mastery_map.stack).toBe(0.75);
      expect(learner?.learning_state.status).toBe('advanced');
      expect(learner?.learning_state.active_prerequisite_gap).toBeNull();
      expect(learner?.recommended_station).toBe('recursion_lab');

      const state = useClassroomStore.getState();
      expect(state.dissolvingWingId).toBe('recursion_lab');
      expect(state.dissolvePhase).toBe('flicker');
    });
  });

  describe('Physical Barrier Collision Deactivation', () => {
    it('blocks Avatar at 15.8 units when barrier is sealed, and permits free passage when accessible', () => {
      const world = useClassroomStore.getState().worldState;
      if (!world) return;

      // Recursion Lab is at azimuth 270 (X = -17.5, Z = 0)
      // Test position approaching the barrier along negative X axis
      const approachingX = -16.5;
      const approachingZ = 0.0;

      // 1. When sealed: Avatar must be blocked
      const sealedWorld = {
        ...world,
        wings: {
          ...world.wings,
          recursion_lab: { ...world.wings.recursion_lab, status: 'sealed' },
        },
      };
      const blockedResult = resolveAvatarCollision(approachingX, approachingZ, sealedWorld as any);
      expect(blockedResult.isBlockedByBarrier).toBe(true);
      expect(blockedResult.blockedWingId).toBe('recursion_lab');
      expect(blockedResult.x).toBeCloseTo(-15.8, 1); // Clamped to barrier distance

      // 2. When accessible (post-dissolution): Avatar passes freely through
      const accessibleWorld = {
        ...world,
        wings: {
          ...world.wings,
          recursion_lab: { ...world.wings.recursion_lab, status: 'accessible' },
        },
      };
      const openResult = resolveAvatarCollision(approachingX, approachingZ, accessibleWorld as any);
      expect(openResult.isBlockedByBarrier).toBe(false);
      expect(openResult.blockedWingId).toBeNull();
      expect(openResult.x).toBe(approachingX); // Not clamped
    });
  });
});
