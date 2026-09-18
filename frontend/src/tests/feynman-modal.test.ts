import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { FeynmanResponse, VerificationResponse } from '../types/feynman';

describe('Feynman Multimodal Adaptive Explanation Subsystem', () => {
  beforeEach(() => {
    useClassroomStore.setState({
      isFeynmanOpen: false,
      feynmanConcept: 'recursion',
      feynmanActivityId: null,
      feynmanLoading: false,
      feynmanResponse: null,
      feynmanVerificationResult: null,
      feynmanActiveModality: 'VISUAL',
      feynmanError: null,
    });
    vi.restoreAllMocks();
  });

  it('manages modal open and close state transitions correctly', () => {
    const { openFeynman, closeFeynman } = useClassroomStore.getState();
    expect(useClassroomStore.getState().isFeynmanOpen).toBe(false);

    openFeynman('stack', 'stack_lab');
    expect(useClassroomStore.getState().isFeynmanOpen).toBe(true);
    expect(useClassroomStore.getState().feynmanConcept).toBe('stack');
    expect(useClassroomStore.getState().feynmanActivityId).toBe('stack_lab');

    closeFeynman();
    expect(useClassroomStore.getState().isFeynmanOpen).toBe(false);
  });

  it('switches between multimodal explanation modalities', () => {
    const { setFeynmanModality } = useClassroomStore.getState();
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('VISUAL');

    setFeynmanModality('TEXT');
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('TEXT');

    setFeynmanModality('VOICE');
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('VOICE');

    setFeynmanModality('VIDEO');
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('VIDEO');

    setFeynmanModality('3D');
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('3D');
  });

  it('handles explanation request and populates multimodal response payload', async () => {
    const mockFeynmanResponse: FeynmanResponse = {
      session_id: 'FS_TEST123',
      student_id: 'learner_b',
      concept_id: 'recursion',
      input_type: 'TEXT',
      unified_input: 'Explain the call stack',
      decision: {
        decision_id: 'FD_001',
        concept_id: 'recursion',
        problem: 'call_stack_unwinding',
        modality: 'VISUAL',
        difficulty: 'BEGINNER',
        learning_objective: 'understand_call_stack_frames',
        reason: 'Visual diagram suitable for process sequence',
        understood: ['function_calls'],
        gaps: ['call_stack_frames'],
        misconceptions: [],
        confidence: 0.92,
      },
      explanation: {
        title: 'Demystifying Recursion',
        modality: 'VISUAL',
        analogy: 'Russian nesting dolls on a table',
        detailed_explanation: 'Functions pause and push frames onto the stack.',
        code_or_trace: 'def f(n): ...',
        visual_steps: [
          {
            step_number: 1,
            title: 'Initial Call',
            description: 'factorial(4) pauses',
            visual_state: { depth: 1 },
          },
        ],
        voice_script: 'Think of Russian nesting dolls.',
        video_timeline: [
          {
            timestamp_sec: 0,
            caption: 'Intro',
            frame_type: 'animation',
            visual_data: {},
          },
        ],
      },
      verification_question: {
        question_id: 'VQ_001',
        prompt: 'What happens to the parent frame during recursion?',
        options: ['It stays paused on the Call Stack', 'It gets deleted'],
        correct_option_index: 0,
        explanation: 'The parent pauses until the child returns.',
        tested_skill: 'call_stack_frames',
      },
      strategy_history: [],
      orchestrator: 'builtin_engine',
      llm_mode: 'deterministic_fallback',
      timestamp: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFeynmanResponse,
    });

    const { requestFeynmanExplanation } = useClassroomStore.getState();
    await requestFeynmanExplanation('Why does recursion pause?');

    const state = useClassroomStore.getState();
    expect(state.feynmanLoading).toBe(false);
    expect(state.feynmanResponse).not.toBeNull();
    expect(state.feynmanResponse?.session_id).toBe('FS_TEST123');
    expect(state.feynmanResponse?.explanation.analogy).toContain('nesting dolls');
    expect(state.feynmanActiveModality).toBe('VISUAL');
  });

  it('submits verification answer and updates BKT mastery delta in store', async () => {
    // Populate session
    useClassroomStore.setState({
      feynmanResponse: {
        session_id: 'FS_TEST123',
        student_id: 'learner_b',
        concept_id: 'stack',
        input_type: 'TEXT',
        unified_input: 'Explain LIFO',
        decision: {} as any,
        explanation: {} as any,
        verification_question: {
          question_id: 'VQ_STACK_01',
          prompt: 'Which disc is popped first?',
          options: ['Top disc', 'Bottom disc'],
          correct_option_index: 0,
          explanation: 'LIFO order.',
          tested_skill: 'lifo',
        },
        strategy_history: [],
        orchestrator: 'builtin_engine',
        llm_mode: 'deterministic_fallback',
        timestamp: new Date().toISOString(),
      },
    });

    const mockVerificationResponse: VerificationResponse = {
      session_id: 'FS_TEST123',
      student_id: 'learner_b',
      concept_id: 'stack',
      correct: true,
      feedback: 'Correct understanding demonstrated!',
      evidence: {
        evidence_id: 'LE_999',
        student_id: 'learner_b',
        concept_id: 'stack',
        source: 'feynman_agent',
        evidence_type: 'FEYNMAN_VERIFICATION',
        skill: 'lifo',
        correct: true,
        confidence: 0.92,
        response_time_ms: 4000,
        timestamp: new Date().toISOString(),
      },
      prior_mastery: 0.38,
      posterior_mastery: 0.51,
      delta: 0.13,
      threshold_crossed: false,
      unlocked_wing: null,
      learner_profile: {
        learner_id: 'learner_b',
        mastery_map: { array: 0.9, linked_list: 0.7, stack: 0.51, recursion: 0.2, tree: 0.1 },
      },
      world_delta: {},
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockVerificationResponse,
    });

    const { submitFeynmanVerification } = useClassroomStore.getState();
    const res = await submitFeynmanVerification('VQ_STACK_01', 0);

    expect(res).not.toBeNull();
    expect(res?.correct).toBe(true);

    const state = useClassroomStore.getState();
    expect(state.feynmanVerificationResult?.correct).toBe(true);
    expect(state.lastMasteryDelta['stack']?.delta).toBe(0.13);
    expect(state.lastMasteryDelta['stack']?.newMastery).toBe(0.51);
  });

  it('transcribes voice audio using Groq Whisper Speech-to-Text API', async () => {
    const mockTranscribeResponse = {
      transcript: 'Why does recursion pause on the call stack?',
      provider: 'groq_whisper',
      model: 'whisper-large-v3',
      success: true,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTranscribeResponse,
    });

    const fakeBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
    const { transcribeAudioWithGroq } = useClassroomStore.getState();

    const text = await transcribeAudioWithGroq(fakeBlob);
    expect(text).toBe('Why does recursion pause on the call stack?');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/feynman/transcribe',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
