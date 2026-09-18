import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';

describe('Dual-Layer Glassmorphic Challenge Console & Stack DSA Missions', () => {
  beforeEach(async () => {
    // Reset to clean initial seed
    await useClassroomStore.getState().resetWorldSeed();
  });

  it('initializes with default Stack Lab diagnostic mission containing 4 curated challenges', () => {
    const { stackMission, activeChallengeIndex } = useClassroomStore.getState();

    expect(stackMission.id).toBe('stack_diagnostic_mission');
    expect(stackMission.concept).toBe('stack');
    expect(stackMission.challenges).toHaveLength(4);
    expect(activeChallengeIndex).toBe(0);

    // Verify Challenge 1: LIFO sequence
    const c1 = stackMission.challenges[0];
    expect(c1.id).toBe('stack_lifo_order');
    expect(c1.difficulty).toBe('easy');
    expect(c1.correctOptionId).toBe('opt_lifo_correct');
    expect(c1.options).toHaveLength(4);

    // Verify Challenge 2: Interleaved trace
    const c2 = stackMission.challenges[1];
    expect(c2.id).toBe('stack_push_pop_trace');
    expect(c2.difficulty).toBe('medium');
    expect(c2.correctOptionId).toBe('opt_trace_correct');

    // Verify Challenge 3: Capacity Overflow / Underflow
    const c3 = stackMission.challenges[2];
    expect(c3.id).toBe('stack_overflow_underflow');
    expect(c3.correctOptionId).toBe('opt_underflow_correct');

    // Verify Challenge 4: Call Stack & Nested Syntax
    const c4 = stackMission.challenges[3];
    expect(c4.id).toBe('stack_bracket_balance');
    expect(c4.difficulty).toBe('hard');
    expect(c4.correctOptionId).toBe('opt_bracket_correct');
  });

  it('activates and deactivates console modal state via activeStation', () => {
    const { setActiveStation } = useClassroomStore.getState();

    expect(useClassroomStore.getState().activeStation).toBeNull();

    // Engaging with Stack Station opens console
    setActiveStation('stack_lab');
    expect(useClassroomStore.getState().activeStation).toBe('stack_lab');

    // Pressing ESC / closing modal clears activeStation
    setActiveStation(null);
    expect(useClassroomStore.getState().activeStation).toBeNull();
  });

  it('handles option selection and immediate state tracking', () => {
    const { setChallengeAnswer, stackMission } = useClassroomStore.getState();
    const c1 = stackMission.challenges[0];

    expect(useClassroomStore.getState().selectedAnswers[c1.id]).toBeUndefined();

    // Select option A (opt_lifo_correct)
    setChallengeAnswer(c1.id, 'opt_lifo_correct');
    expect(useClassroomStore.getState().selectedAnswers[c1.id]).toBe('opt_lifo_correct');

    // Switch selection to option B (opt_fifo)
    setChallengeAnswer(c1.id, 'opt_fifo');
    expect(useClassroomStore.getState().selectedAnswers[c1.id]).toBe('opt_fifo');
  });

  it('validates incorrect answer submission with explanation feedback', () => {
    const { setChallengeAnswer, submitChallengeAnswer, stackMission } = useClassroomStore.getState();
    const c1 = stackMission.challenges[0];

    // Select incorrect option B (FIFO)
    setChallengeAnswer(c1.id, 'opt_fifo');
    const result = submitChallengeAnswer(c1.id);

    expect(result.isCorrect).toBe(false);
    expect(result.explanation).toContain('FIFO (First-In, First-Out)');

    const record = useClassroomStore.getState().submittedAnswers[c1.id];
    expect(record).toBeDefined();
    expect(record.isCorrect).toBe(false);
  });

  it('validates correct answer submission with positive pedagogical confirmation', () => {
    const { setChallengeAnswer, submitChallengeAnswer, stackMission } = useClassroomStore.getState();
    const c1 = stackMission.challenges[0];

    // Select correct option A (LIFO)
    setChallengeAnswer(c1.id, 'opt_lifo_correct');
    const result = submitChallengeAnswer(c1.id);

    expect(result.isCorrect).toBe(true);
    expect(result.explanation).toContain('Correct!');

    const record = useClassroomStore.getState().submittedAnswers[c1.id];
    expect(record.isCorrect).toBe(true);
  });

  it('synchronizes manual testing controls [PUSH] and [POP] with 3D apparatus', () => {
    const { pushStackDisc, popStackDisc } = useClassroomStore.getState();

    // Initial discs: 3
    expect(useClassroomStore.getState().stackDiscs).toHaveLength(3);

    // Push disc (e.g. 50)
    pushStackDisc(50);
    let discs = useClassroomStore.getState().stackDiscs;
    expect(discs).toHaveLength(4);
    expect(discs[discs.length - 1].value).toBe(50);

    // Pop disc
    popStackDisc();
    discs = useClassroomStore.getState().stackDiscs;
    expect(discs).toHaveLength(3);
    expect(discs[discs.length - 1].value).toBe(42);
  });

  it('stages challenge initial disc state onto the 3D apparatus via loadChallengeOntoApparatus', () => {
    const { loadChallengeOntoApparatus } = useClassroomStore.getState();

    // Stage Challenge 2 initial trace state: [15, 45, 75]
    loadChallengeOntoApparatus('stack_push_pop_trace');
    const discs = useClassroomStore.getState().stackDiscs;

    expect(discs).toHaveLength(3);
    expect(discs[0].value).toBe(15);
    expect(discs[1].value).toBe(45);
    expect(discs[2].value).toBe(75);
  });

  it('supports pagination forward and backward through challenges', () => {
    const { nextChallenge, prevChallenge, setActiveChallengeIndex } = useClassroomStore.getState();

    expect(useClassroomStore.getState().activeChallengeIndex).toBe(0);

    nextChallenge();
    expect(useClassroomStore.getState().activeChallengeIndex).toBe(1);

    nextChallenge();
    expect(useClassroomStore.getState().activeChallengeIndex).toBe(2);

    prevChallenge();
    expect(useClassroomStore.getState().activeChallengeIndex).toBe(1);

    setActiveChallengeIndex(3);
    expect(useClassroomStore.getState().activeChallengeIndex).toBe(3);

    // Bounded at last challenge
    nextChallenge();
    expect(useClassroomStore.getState().activeChallengeIndex).toBe(3);
  });

  it('clears challenge progress upon world seed reset', async () => {
    const { setChallengeAnswer, submitChallengeAnswer, resetWorldSeed, stackMission } =
      useClassroomStore.getState();
    const c1 = stackMission.challenges[0];

    setChallengeAnswer(c1.id, 'opt_lifo_correct');
    submitChallengeAnswer(c1.id);

    expect(useClassroomStore.getState().submittedAnswers[c1.id]).toBeDefined();

    await resetWorldSeed();

    expect(useClassroomStore.getState().activeChallengeIndex).toBe(0);
    expect(useClassroomStore.getState().selectedAnswers).toEqual({});
    expect(useClassroomStore.getState().submittedAnswers).toEqual({});
  });
});
