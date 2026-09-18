import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { FeynmanResponse, VerificationResponse, ThreeDApparatusInstruction } from '../types/feynman';

describe('Issue 05: Multimodal Feynman Agent Demonstration & Verification', () => {
  beforeEach(async () => {
    // Reset world and Feynman state
    await useClassroomStore.getState().resetWorldSeed();
    useClassroomStore.setState({
      isFeynmanOpen: false,
      feynmanConcept: 'stack',
      feynmanActivityId: null,
      feynmanLoading: false,
      feynmanResponse: null,
      feynmanVerificationResult: null,
      feynmanActiveModality: 'VISUAL',
      feynmanKineticStatus: null,
      feynmanError: null,
    });
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SUCCESS CRITERIA 1: Ambient Intervention Banner on Challenge Miss
  // =========================================================
  it('1. triggers ambient intervention prompt when an in-lab challenge question is missed', async () => {
    const store = useClassroomStore.getState();

    // 1. Submit an INCORRECT option on Challenge 1 (LIFO order)
    store.setChallengeAnswer('stack_lifo_order', 'opt_lifo_wrong1');
    await store.submitChallengeAnswer('stack_lifo_order');

    const updatedState = useClassroomStore.getState();
    const submission = updatedState.submittedAnswers['stack_lifo_order'];

    expect(submission).toBeDefined();
    expect(submission.isCorrect).toBe(false);

    // 2. In response to the incorrect submission, invoke ambient help handler
    const currentChallenge = updatedState.stackMission.challenges[0];
    const struggleQuery = `I'm struggling with ${currentChallenge.title}: ${currentChallenge.scenario}. Can you explain with an easy analogy and diagram?`;

    // Mock the backend Feynman API
    const mockFeynmanResponse: FeynmanResponse = {
      session_id: 'FS_AMBIENT_001',
      student_id: 'learner_b',
      concept_id: 'stack',
      input_type: 'TEXT',
      unified_input: struggleQuery,
      decision: {
        decision_id: 'FD_AMB_1',
        concept_id: 'stack',
        problem: 'lifo_misconception',
        modality: 'VISUAL',
        difficulty: 'BEGINNER',
        learning_objective: 'understand_lifo_plate_analogy',
        reason: 'Ambient intervention triggered after missed in-lab challenge question',
        understood: [],
        gaps: ['lifo_retrieval'],
        misconceptions: ['fifo_confusion'],
        confidence: 0.95,
      },
      explanation: {
        title: 'The Cafeteria Tray Stack Metaphor',
        modality: 'VISUAL',
        analogy: 'Spring-loaded cafeteria trays: the last tray put on top is the only one you can grab first.',
        detailed_explanation: 'Elements in a stack are accessed strictly via LIFO (Last-In, First-Out).',
        code_or_trace: 'stack.push("A"); stack.push("B"); stack.pop(); // returns "B"',
        visual_steps: [
          { step_number: 1, title: 'Push Tray A', description: 'Base tray', visual_state: { height: 1 } },
          { step_number: 2, title: 'Push Tray B', description: 'Top tray', visual_state: { height: 2 } },
          { step_number: 3, title: 'Pop Tray B', description: 'Top tray removed first', visual_state: { height: 1 } },
        ],
        voice_script: 'Think of spring-loaded cafeteria trays.',
        video_timeline: [],
      },
      verification_question: {
        question_id: 'VQ_AMBIENT_01',
        prompt: 'If you push item X then item Y onto a stack, which item is retrieved first by pop()?',
        options: ['Item Y (the last item pushed)', 'Item X (the first item pushed)'],
        correct_option_index: 0,
        explanation: 'Item Y was pushed last, so in LIFO it is popped first.',
        tested_skill: 'lifo',
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

    // Student clicks the ambient intervention help button
    store.openFeynman('stack', currentChallenge.id, struggleQuery);
    await store.requestFeynmanExplanation(struggleQuery, 'TEXT', 'VISUAL');

    const stateAfterHelp = useClassroomStore.getState();
    expect(stateAfterHelp.isFeynmanOpen).toBe(true);
    expect(stateAfterHelp.feynmanConcept).toBe('stack');
    expect(stateAfterHelp.feynmanActivityId).toBe('stack_lifo_order');
    expect(stateAfterHelp.feynmanResponse).not.toBeNull();
    expect(stateAfterHelp.feynmanResponse?.decision.reason).toContain('Ambient intervention');

    // Also verify Recursion Lab ambient intervention trigger on StackOverflow
    store.triggerStackOverflowError();
    expect(useClassroomStore.getState().recursionStackOverflow).toBe(true);
  });

  // =========================================================================
  // SUCCESS CRITERIA 2: Explicit "Demonstrate Feynman Agent" Button
  // =========================================================
  it('2. provides explicit Demonstrate Feynman Agent trigger from HUD and all lab console headers', async () => {
    const mockFeynmanResponse: FeynmanResponse = {
      session_id: 'FS_DEMO_002',
      student_id: 'learner_b',
      concept_id: 'stack',
      input_type: 'TEXT',
      unified_input: 'Demonstrate Feynman Multimodal Adaptive Explanation for stack',
      decision: {
        decision_id: 'FD_DEMO_2',
        concept_id: 'stack',
        problem: 'demo_request',
        modality: 'VISUAL',
        difficulty: 'BEGINNER',
        learning_objective: 'mastery_reinforcement',
        reason: 'User explicitly triggered demonstration',
        understood: ['lifo'],
        gaps: [],
        misconceptions: [],
        confidence: 0.98,
      },
      explanation: {
        title: 'Stack Architecture Breakdown',
        modality: 'VISUAL',
        analogy: 'A vertical spring-loaded canister',
        detailed_explanation: 'All push and pop operations happen at the top of the stack.',
        code_or_trace: 'stack.push(val); val = stack.pop();',
        visual_steps: [],
        voice_script: 'Welcome to the Feynman demonstration.',
        video_timeline: [],
      },
      verification_question: {
        question_id: 'VQ_DEMO_02',
        prompt: 'Where do push and pop operations occur in a stack?',
        options: ['Only at the top', 'At both ends', 'Random index'],
        correct_option_index: 0,
        explanation: 'Stacks restrict operations to the top element.',
        tested_skill: 'stack_top',
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

    const store = useClassroomStore.getState();

    // Trigger from top HUD or console header
    await store.demonstrateFeynmanAgent('stack');

    const state = useClassroomStore.getState();
    expect(state.isFeynmanOpen).toBe(true);
    expect(state.feynmanConcept).toBe('stack');
    expect(state.feynmanResponse?.session_id).toBe('FS_DEMO_002');

    // Trigger for Recursion Console header
    await store.demonstrateFeynmanAgent('recursion');
    expect(useClassroomStore.getState().feynmanConcept).toBe('recursion');

    // Trigger for Array Station Console header
    await store.demonstrateFeynmanAgent('array');
    expect(useClassroomStore.getState().feynmanConcept).toBe('array');

    // Trigger for Linked List Console header
    await store.demonstrateFeynmanAgent('linked_list');
    expect(useClassroomStore.getState().feynmanConcept).toBe('linked_list');

    // Trigger for Tree BST Console header
    await store.demonstrateFeynmanAgent('tree');
    expect(useClassroomStore.getState().feynmanConcept).toBe('tree');
  });

  // =========================================================================
  // SUCCESS CRITERIA 3: Toggle Between All 5 Modalities
  // =========================================================
  it('3. allows switching between all 5 modalities: Text, Visual, Voice, Video, and 3D apparatus', () => {
    const store = useClassroomStore.getState();

    // 1. Text Modality
    store.setFeynmanModality('TEXT');
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('TEXT');

    // 2. Visual Modality (interactive SVG diagram)
    store.setFeynmanModality('VISUAL');
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('VISUAL');

    // 3. Voice Modality (Groq Whisper + TTS)
    store.setFeynmanModality('VOICE');
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('VOICE');

    // 4. Video Modality (step animation scrubber)
    store.setFeynmanModality('VIDEO');
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('VIDEO');

    // 5. 3D Modality (apparatus kinetic focus)
    store.setFeynmanModality('3D');
    expect(useClassroomStore.getState().feynmanActiveModality).toBe('3D');
  });

  // =========================================================================
  // SUCCESS CRITERIA 4: Voice Input Recording & Groq Whisper Transcription
  // =========================================================
  it('4. records voice input and transcribes audio via Groq Whisper Speech-to-Text API with fallback', async () => {
    const store = useClassroomStore.getState();

    // Case A: Successful transcription from Groq Whisper API
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transcript: 'Can you explain why the stack is Last-In First-Out and how it connects to recursion?',
        provider: 'groq_whisper',
        model: 'whisper-large-v3',
        success: true,
      }),
    });

    const mockAudioBlob = new Blob(['mock binary audio stream'], { type: 'audio/webm' });
    const transcription = await store.transcribeAudioWithGroq(mockAudioBlob);

    expect(transcription).toBe(
      'Can you explain why the stack is Last-In First-Out and how it connects to recursion?'
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/feynman/transcribe',
      expect.objectContaining({
        method: 'POST',
      })
    );

    // Case B: Resilient simulated fallback on network interruption
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network offline or Groq API timeout'));

    const fallbackTranscription = await store.transcribeAudioWithGroq(mockAudioBlob);
    expect(fallbackTranscription).toBeTruthy();
    expect(typeof fallbackTranscription).toBe('string');
  });

  // =========================================================================
  // SUCCESS CRITERIA 5: 3D Modality Sends Kinetic Manipulation Commands
  // =========================================================
  it('5. dispatches 3D apparatus kinetic manipulation commands directly to the virtual classroom apparatus', () => {
    const store = useClassroomStore.getState();

    // Verify initial state
    expect(store.feynmanKineticStatus).toBeNull();
    const initialDiscs = store.stackDiscs.length;

    // 1. Dispatch kinetic PUSH instruction to Stack Tower apparatus
    const pushInstruction: ThreeDApparatusInstruction = {
      target_apparatus: 'stack_tower',
      action: 'push',
      parameters: {
        element_value: 'FEYNMAN_DISC_42',
        color: '#00f0ff',
      },
      duration_ms: 1200,
      description: 'Pushing disc onto stack to demonstrate top pointer progression',
    };

    store.dispatchFeynmanKineticApparatus('stack', pushInstruction);

    let state = useClassroomStore.getState();
    expect(state.feynmanKineticStatus).not.toBeNull();
    expect(state.feynmanKineticStatus?.dispatched).toBe(true);
    expect(state.feynmanKineticStatus?.concept).toBe('stack');
    expect(state.feynmanKineticStatus?.action).toBe('push');
    expect(state.stackDiscs.length).toBe(initialDiscs + 1);
    expect(state.cinematicCamera).toBeDefined();
    expect(state.cinematicCamera?.position).toEqual([0, 4, 15]);

    // 2. Dispatch kinetic POP instruction to Stack Tower apparatus
    const popInstruction: ThreeDApparatusInstruction = {
      target_apparatus: 'stack_tower',
      action: 'pop',
      duration_ms: 1000,
      description: 'Popping top disc from stack to demonstrate LIFO removal',
    };

    store.dispatchFeynmanKineticApparatus('stack', popInstruction);

    state = useClassroomStore.getState();
    expect(state.feynmanKineticStatus?.action).toBe('pop');
    expect(state.stackDiscs.length).toBe(initialDiscs);

    // 3. Dispatch kinetic instruction to Recursion Chamber apparatus
    const recursionInstruction: ThreeDApparatusInstruction = {
      target_apparatus: 'recursion_chamber',
      action: 'push_frame',
      parameters: { function_name: 'factorial(3)', n: 3 },
      duration_ms: 1500,
      description: 'Pushing new stack frame into the recursion elevator',
    };

    store.dispatchFeynmanKineticApparatus('recursion', recursionInstruction);

    state = useClassroomStore.getState();
    expect(state.feynmanKineticStatus?.concept).toBe('recursion');
    expect(state.feynmanKineticStatus?.action).toBe('push_frame');
    expect(state.recursionFrames.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // SUCCESS CRITERIA 6: Targeted Verification Question Updates BKT Mastery
  // =========================================================
  it('6. evaluates targeted Feynman verification question and updates BKT mastery and unlocks wings', async () => {
    // 1. Populate Feynman session with active verification question
    useClassroomStore.setState({
      learnerProfile: {
        learner_id: 'learner_b',
        name: 'Learner B (Stack Deficit)',
        description: 'Weak stack understanding blocking recursion access',
        mastery_map: {
          array: 0.90,
          linked_list: 0.70,
          stack: 0.38,
          recursion: 0.20,
          tree: 0.10,
        },
      },
      feynmanResponse: {
        session_id: 'FS_VERIFY_HERO',
        student_id: 'learner_b',
        concept_id: 'stack',
        input_type: 'TEXT',
        unified_input: 'Explain LIFO stack mechanics',
        decision: {
          decision_id: 'FD_VER_1',
          concept_id: 'stack',
          problem: 'lifo',
          modality: 'VISUAL',
          difficulty: 'BEGINNER',
          learning_objective: 'lifo_concept_mastery',
          reason: 'Diagnostic detected Stack deficit (38%)',
          understood: [],
          gaps: ['stack'],
          misconceptions: [],
          confidence: 0.95,
        },
        explanation: {
          title: 'Stack Mechanics Verified',
          modality: 'VISUAL',
          analogy: 'Cafeteria tray spring canister',
          detailed_explanation: 'LIFO order means the last pushed element is the first popped.',
          code_or_trace: 'stack.pop()',
          visual_steps: [],
          voice_script: '',
          video_timeline: [],
        },
        verification_question: {
          question_id: 'VQ_HERO_STACK_01',
          prompt: 'Which disc in the Stack Tower is popped first when a pop operation is issued?',
          options: [
            'The topmost disc that was pushed most recently (LIFO)',
            'The bottommost disc that was pushed first (FIFO)',
            'Any randomly chosen disc in the canister',
          ],
          correct_option_index: 0,
          explanation: 'Stacks enforce strict Last-In, First-Out order: only the topmost element is accessible.',
          tested_skill: 'lifo_top_access',
        },
        strategy_history: [],
        orchestrator: 'builtin_engine',
        llm_mode: 'deterministic_fallback',
        timestamp: new Date().toISOString(),
      },
    });

    // 2. Mock backend verification response crossing 70% threshold (0.38 -> 0.74, +0.36 delta)
    const mockVerification: VerificationResponse = {
      session_id: 'FS_VERIFY_HERO',
      student_id: 'learner_b',
      concept_id: 'stack',
      correct: true,
      feedback: 'Outstanding! You correctly identified LIFO retrieval. Your Stack mastery has crossed the 70% prerequisite threshold!',
      evidence: {
        evidence_id: 'LE_HERO_01',
        student_id: 'learner_b',
        concept_id: 'stack',
        source: 'feynman_agent',
        evidence_type: 'FEYNMAN_VERIFICATION',
        skill: 'lifo_top_access',
        correct: true,
        confidence: 0.96,
        response_time_ms: 3200,
        timestamp: new Date().toISOString(),
      },
      prior_mastery: 0.38,
      posterior_mastery: 0.74,
      delta: 0.36,
      threshold_crossed: true,
      unlocked_wing: 'recursion_lab',
      learner_profile: {
        learner_id: 'learner_b',
        mastery_map: {
          array: 0.90,
          linked_list: 0.70,
          stack: 0.74,
          recursion: 0.20,
          tree: 0.10,
        },
      },
      world_delta: {
        zones_unlocked: ['recursion_lab'],
        laser_barrier_dissolved: true,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockVerification,
    });

    const store = useClassroomStore.getState();

    // 3. Submit option index 0 (the correct answer)
    const result = await store.submitFeynmanVerification('VQ_HERO_STACK_01', 0);

    // 4. Assert verification outcome
    expect(result).not.toBeNull();
    expect(result?.correct).toBe(true);
    expect(result?.delta).toBe(0.36);
    expect(result?.threshold_crossed).toBe(true);
    expect(result?.unlocked_wing).toBe('recursion_lab');

    // 5. Assert store state updates
    const state = useClassroomStore.getState();
    expect(state.feynmanVerificationResult).not.toBeNull();
    expect(state.feynmanVerificationResult?.correct).toBe(true);
    expect(state.feynmanVerificationResult?.posterior_mastery).toBe(0.74);

    // Assert live BKT delta synced in store
    expect(state.lastMasteryDelta['stack']).toBeDefined();
    expect(state.lastMasteryDelta['stack'].delta).toBe(0.36);
    expect(state.lastMasteryDelta['stack'].newMastery).toBe(0.74);

    // Assert student profile mastery updated
    expect(state.learnerProfile?.mastery_map['stack']).toBe(0.74);

    // Assert Recursion Wing is unlocked and prerequisite barrier dissolved
    expect(state.isThresholdCrossed).toBe(true);
    expect(state.unlockedWingId).toBe('recursion_lab');
    expect(state.dissolvingWingId).toBe('recursion_lab');
  });
});
