import { create } from 'zustand';
import { LearnerProfile, WorldState, AvatarState, MasteryMap } from '../types/world';
import { MentorGuidance } from '../types/mentor';
import { soundSystem } from '../audio/soundSystem';
import { StackMission } from '../types/challenge';
import { STACK_MISSION } from '../data/stackChallenges';

interface ClassroomStore {
  // Authoritative State
  learner: LearnerProfile | null;
  worldState: WorldState | null;
  isLoading: boolean;
  error: string | null;

  // Transient Audio & HUD State
  isMuted: boolean;
  activeZoneTitle: string;

  // Avatar spatial state
  avatar: AvatarState;

  // AI Mentor Dialog & Proximity State
  isMentorOpen: boolean;
  isNearMentor: boolean;
  mentorGuidance: MentorGuidance | null;

  // Station Console & Stack Apparatus State
  activeStation: string | null;
  stackDiscs: Array<{ id: string; value: number }>;

  // Stack Challenge Console State
  stackMission: StackMission;
  activeChallengeIndex: number;
  selectedAnswers: Record<string, string>;
  submittedAnswers: Record<string, { isCorrect: boolean; feedback: string }>;
  isConsoleSubmitting: boolean;

  // BKT Engine & Telemetry State
  lastMasteryDelta: Record<
    string,
    { delta: number; oldMastery: number; newMastery: number; timestamp: number }
  >;
  isThresholdCrossed: boolean;
  unlockedWingId: string | null;

  // Actions
  fetchLearnerProfile: () => Promise<void>;
  fetchWorldState: () => Promise<void>;
  switchLearner: (learnerId: string) => Promise<void>;
  toggleAudioMute: () => void;
  setAvatarState: (position: [number, number, number], rotation: number, isMoving: boolean) => void;
  resetWorldSeed: () => Promise<void>;
  openMentor: () => void;
  closeMentor: () => void;
  setIsNearMentor: (isNear: boolean) => void;
  fetchMentorGuidance: (learnerId?: string) => Promise<void>;
  setActiveStation: (stationId: string | null) => void;
  pushStackDisc: (value?: number) => void;
  popStackDisc: () => void;

  // Challenge Console Actions
  setChallengeAnswer: (challengeId: string, optionId: string) => void;
  submitChallengeAnswer: (challengeId: string) => Promise<{ isCorrect: boolean; explanation: string }>;
  setActiveChallengeIndex: (index: number) => void;
  nextChallenge: () => void;
  prevChallenge: () => void;
  loadChallengeOntoApparatus: (challengeId: string) => void;
  resetChallengeProgress: () => void;

  // BKT & Interaction Actions
  submitInteraction: (
    concept: string,
    questionId: string,
    correct: boolean,
    difficulty?: string
  ) => Promise<{ prior: number; posterior: number; delta: number; thresholdCrossed: boolean }>;
  simulateMasteryJump: (
    targetOrLearnerId?: number | string,
    concept?: string,
    target?: number
  ) => Promise<void>;
}

// Fallback seed profile for initial rendering or offline mock
const DEFAULT_LEARNER: LearnerProfile = {
  learner_id: 'learner_b',
  name: 'Alex Mercer (Learner B - Remedial)',
  persona_type: 'Remedial - Stack Deficient',
  learning_state: {
    status: 'remediation_required',
    summary: 'Prerequisite Gap detected: Stack mastery (38%) is below the 70% threshold required to enter Recursion Wing.',
    primary_focus_concept: 'stack',
    active_prerequisite_gap: 'Stack mastery 0.38 < 0.70 prerequisite threshold for Recursion',
  },
  mastery_map: {
    array: 0.90,
    linked_list: 0.70,
    stack: 0.38,
    recursion: 0.20,
    tree: 0.10,
  },
  active_wing: 'atrium',
  recommended_station: 'stack_lab',
};

const DEFAULT_WORLD_STATE: WorldState = {
  active_learner_id: 'learner_b',
  atrium_radius: 18.0,
  wings: {
    array_station: {
      wing_id: 'array_station',
      name: 'Array Station',
      concept: 'array',
      status: 'accessible',
      azimuth_deg: 30.0,
      coordinates: [12.0, 0.0, -20.0],
    },
    linked_list_lab: {
      wing_id: 'linked_list_lab',
      name: 'Linked List Lab',
      concept: 'linked_list',
      status: 'accessible',
      azimuth_deg: 90.0,
      coordinates: [24.0, 0.0, 0.0],
      required_mastery: { array: 0.60 },
    },
    stack_lab: {
      wing_id: 'stack_lab',
      name: 'Stack Lab',
      concept: 'stack',
      status: 'accessible',
      azimuth_deg: 150.0,
      coordinates: [12.0, 0.0, 20.0],
      required_mastery: { linked_list: 0.50 },
    },
    recursion_lab: {
      wing_id: 'recursion_lab',
      name: 'Recursion Lab',
      concept: 'recursion',
      status: 'sealed',
      azimuth_deg: 270.0,
      coordinates: [-24.0, 0.0, 0.0],
      required_mastery: { stack: 0.70 },
      reason: 'Requires Stack ≥ 70% | Current: 38%',
    },
    tree_lab: {
      wing_id: 'tree_lab',
      name: 'Tree Lab',
      concept: 'tree',
      status: 'sealed',
      azimuth_deg: 210.0,
      coordinates: [-12.0, 0.0, 20.0],
      required_mastery: { recursion: 0.70 },
      reason: 'Requires Recursion ≥ 70% | Current: 20%',
    },
  },
  conduits_target_wing: 'stack_lab',
};

// Seed profile for Learner A (Advanced)
const SEED_LEARNER_A: LearnerProfile = {
  learner_id: 'learner_a',
  name: 'Dr. Elena Vance (Learner A - Advanced)',
  persona_type: 'Advanced - Recursion Ready',
  learning_state: {
    status: 'advanced',
    summary: 'All core prerequisites verified. Stack mastery at 84%. Ready for advanced Recursion call-stack challenges.',
    primary_focus_concept: 'recursion',
    active_prerequisite_gap: null,
  },
  mastery_map: {
    array: 0.92,
    linked_list: 0.88,
    stack: 0.84,
    recursion: 0.72,
    tree: 0.65,
  },
  active_wing: 'atrium',
  recommended_station: 'recursion_lab',
};

const WORLD_STATE_A: WorldState = {
  active_learner_id: 'learner_a',
  atrium_radius: 18.0,
  wings: {
    array_station: {
      wing_id: 'array_station',
      name: 'Array Station',
      concept: 'array',
      status: 'accessible',
      azimuth_deg: 30.0,
      coordinates: [12.0, 0.0, -20.0],
    },
    linked_list_lab: {
      wing_id: 'linked_list_lab',
      name: 'Linked List Lab',
      concept: 'linked_list',
      status: 'accessible',
      azimuth_deg: 90.0,
      coordinates: [24.0, 0.0, 0.0],
      required_mastery: { array: 0.60 },
    },
    stack_lab: {
      wing_id: 'stack_lab',
      name: 'Stack Lab',
      concept: 'stack',
      status: 'accessible',
      azimuth_deg: 150.0,
      coordinates: [12.0, 0.0, 20.0],
      required_mastery: { linked_list: 0.50 },
    },
    recursion_lab: {
      wing_id: 'recursion_lab',
      name: 'Recursion Lab',
      concept: 'recursion',
      status: 'accessible',
      azimuth_deg: 270.0,
      coordinates: [-24.0, 0.0, 0.0],
      required_mastery: { stack: 0.70 },
      reason: null,
    },
    tree_lab: {
      wing_id: 'tree_lab',
      name: 'Tree Lab',
      concept: 'tree',
      status: 'accessible',
      azimuth_deg: 210.0,
      coordinates: [-12.0, 0.0, 20.0],
      required_mastery: { recursion: 0.70 },
      reason: null,
    },
  },
  conduits_target_wing: 'recursion_lab',
};

const DEFAULT_MENTOR_GUIDANCE_B: MentorGuidance = {
  learner_id: 'learner_b',
  learner_name: 'Alex Mercer (Learner B - Remedial)',
  persona_type: 'Remedial - Stack Deficient',
  status: 'remediation_required',
  focus_concept: 'stack',
  recommended_station: 'stack_lab',
  greeting: 'Greetings, Alex. I detect you are seeking entry to the Recursion Wing.',
  diagnostic_summary:
    'Prerequisite barrier engaged. Your current Stack mastery is 38%, which is below the mandatory 70% pedagogical threshold for the Recursion Wing.',
  feynman_explanation: {
    concept: 'stack',
    target_prerequisite_of: 'recursion',
    analogy:
      'Imagine a spring-loaded cafeteria tray dispenser. Every clean tray is pressed down on top of the pile. When someone takes a tray, they must take the topmost one that was placed last. This is LIFO: Last-In, First-Out.',
    conceptual_bridge:
      'Why must you master Stacks before Recursion? Because computer processors do not have magical memory! When a function calls itself, its execution pauses mid-sentence. The CPU must preserve all local variables and return locations on a physical structure called the Call Stack. If you do not intuitively understand how data pushes and pops in LIFO order, recursive unwinding will feel like an abstract mystery rather than orderly mechanical stack manipulation.',
    hardware_software_context:
      'In computer architecture, every recursive call pushes a stack activation record. Without a sound base case, the stack overflows into unallocated memory, triggering a critical segmentation fault.',
    prerequisite_gap: 'Stack Mastery: 38% (Threshold: 70% required for Recursion Wing)',
  },
  interactive_questions: [
    {
      id: 'why_stack_first',
      label: "Why can't I just learn Recursion right now?",
      answer:
        'Because recursion without a mental model of stacks is like trying to follow a conversation where each speaker interrupts the previous one with a new question. Without a notebook (the Call Stack) tracking who was waiting for an answer, your mental model will collapse. Master the Stack, and Recursion becomes easy.',
    },
    {
      id: 'call_stack_unwind',
      label: 'How does the Call Stack unwind upon base case?',
      answer:
        'When the deepest recursive call hits the Base Case, it terminates and returns its value. The CPU pops that top frame, instantly resuming the parent frame right where it paused. Frames pop in reverse order until the original caller receives the cumulative result.',
    },
    {
      id: 'stack_lab_guidance',
      label: 'What will I do in the Stack Lab?',
      answer:
        'In the Stack Lab, you will interact with the vertical cylindrical apparatus to push and pop data discs, observe LIFO ordering, and solve practical stack challenges to bring your mastery above 70%.',
    },
  ],
  action_recommendation:
    'Step down from the Dais and follow the pulsing guidance conduits to the Stack Lab (South-East Archway). Complete the LIFO apparatus challenges to elevate your mastery and dissolve the barrier.',
};

const DEFAULT_MENTOR_GUIDANCE_A: MentorGuidance = {
  learner_id: 'learner_a',
  learner_name: 'Dr. Elena Vance (Learner A - Advanced)',
  persona_type: 'Advanced - Recursion Ready',
  status: 'advanced_readiness',
  focus_concept: 'recursion',
  recommended_station: 'recursion_lab',
  greeting: 'Welcome, Dr. Vance. Prerequisite diagnostic checks verified.',
  diagnostic_summary:
    'All foundational prerequisites satisfied. Stack mastery is at 84%. The Recursion Wing portal is fully accessible.',
  feynman_explanation: {
    concept: 'recursion',
    target_prerequisite_of: 'tree',
    analogy:
      'Imagine a set of Russian Matryoshka nesting dolls. Each doll opens to reveal an identical smaller doll, until you reach the tiny solid wooden doll in the center—the Base Case. Then you reassemble them outward.',
    conceptual_bridge:
      'With your Stack mastery verified at 84%, you already understand that each recursive branch is an activation frame pushed onto the Call Stack. You are ready to analyze how recursive branching forms self-similar computation trees and how return values bubble back up through stack frame unwinding.',
    hardware_software_context:
      'In high-performance systems, deep recursion can incur memory overhead. You are ready to evaluate tail-call optimization and recursive tree traversal complexities.',
    prerequisite_gap: null,
  },
  interactive_questions: [
    {
      id: 'base_case_contract',
      label: 'What is the golden rule of recursive design?',
      answer:
        'Always define and test your Base Case first. Without a verifiable termination condition, the recursion never stops pushing frames to the Call Stack, inevitably producing a Stack Overflow.',
    },
    {
      id: 'recursion_to_trees',
      label: 'How does Recursion unlock the Tree Lab?',
      answer:
        'A tree is fundamentally a recursive data structure: every tree consists of a root node and subtrees that are themselves trees. Mastering recursion is the key that unlocks Tree traversals (pre-order, in-order, post-order).',
    },
  ],
  action_recommendation:
    'Proceed West through the unlocked Archway into the Recursion Lab. Engage the Call Stack apparatus to tackle nested recursive simulations.',
};

export const useClassroomStore = create<ClassroomStore>((set, get) => ({
  learner: DEFAULT_LEARNER,
  worldState: DEFAULT_WORLD_STATE,
  isLoading: false,
  error: null,
  isMuted: false,
  activeZoneTitle: 'Central Atrium',

  avatar: {
    position: [0, 0, 8],
    rotation: 0,
    isMoving: false,
  },

  isMentorOpen: false,
  isNearMentor: false,
  mentorGuidance: DEFAULT_MENTOR_GUIDANCE_B,

  fetchLearnerProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/learner/profile');
      if (res.ok) {
        const data: LearnerProfile = await res.json();
        set({ learner: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchWorldState: async () => {
    try {
      const res = await fetch('/api/world/state');
      if (res.ok) {
        const data: WorldState = await res.json();
        set({ worldState: data });
      }
    } catch {
      // Retain default world state
    }
  },

  fetchMentorGuidance: async (learnerId?: string) => {
    const lid = learnerId || get().learner?.learner_id || 'learner_b';
    try {
      const res = await fetch(`/api/mentor/guidance?learner_id=${lid}`);
      if (res.ok) {
        const data: MentorGuidance = await res.json();
        set({ mentorGuidance: data });
        return;
      }
    } catch {
      // Fallback below
    }
    const fallback = lid === 'learner_a' ? DEFAULT_MENTOR_GUIDANCE_A : DEFAULT_MENTOR_GUIDANCE_B;
    set({ mentorGuidance: fallback });
  },

  switchLearner: async (learnerId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/learner/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learner_id: learnerId }),
      });
      if (res.ok) {
        const data: LearnerProfile = await res.json();
        set({ learner: data, isLoading: false });
        await get().fetchWorldState();
        await get().fetchMentorGuidance(learnerId);
        return;
      }
    } catch {
      // Fall through to resilient offline switch
    }

    // Offline / Standalone Mock Fallback
    const fallbackProfile = learnerId === 'learner_a' ? SEED_LEARNER_A : DEFAULT_LEARNER;
    const fallbackWorld = learnerId === 'learner_a' ? WORLD_STATE_A : DEFAULT_WORLD_STATE;
    const fallbackMentor = learnerId === 'learner_a' ? DEFAULT_MENTOR_GUIDANCE_A : DEFAULT_MENTOR_GUIDANCE_B;
    set({
      learner: fallbackProfile,
      worldState: fallbackWorld,
      mentorGuidance: fallbackMentor,
      isLoading: false,
    });
  },

  toggleAudioMute: () => {
    const muted = soundSystem.toggleMute();
    soundSystem.playChirp();
    set({ isMuted: muted });
  },

  setAvatarState: (position, rotation, isMoving) => {
    set({
      avatar: { position, rotation, isMoving },
    });
  },

  openMentor: () => {
    soundSystem.playChime();
    set({ isMentorOpen: true });
    // Refresh guidance for current learner
    get().fetchMentorGuidance();
  },

  closeMentor: () => {
    soundSystem.playChirp();
    set({ isMentorOpen: false });
  },

  setIsNearMentor: (isNear: boolean) => {
    set({ isNearMentor: isNear });
  },

  activeStation: null,
  stackDiscs: [
    { id: 'disc-1', value: 10 },
    { id: 'disc-2', value: 25 },
    { id: 'disc-3', value: 42 },
  ],

  // Stack Challenge Console State
  stackMission: STACK_MISSION,
  activeChallengeIndex: 0,
  selectedAnswers: {},
  submittedAnswers: {},
  isConsoleSubmitting: false,

  // BKT Engine & Telemetry State
  lastMasteryDelta: {},
  isThresholdCrossed: false,
  unlockedWingId: null,

  setChallengeAnswer: (challengeId: string, optionId: string) => {
    soundSystem.playChirp();
    set((state) => ({
      selectedAnswers: {
        ...state.selectedAnswers,
        [challengeId]: optionId,
      },
    }));
  },

  submitChallengeAnswer: async (challengeId: string) => {
    const state = get();
    const challenge = state.stackMission.challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      return { isCorrect: false, explanation: 'Challenge not found.' };
    }

    const selected = state.selectedAnswers[challengeId];
    if (!selected) {
      soundSystem.playAlert();
      return { isCorrect: false, explanation: 'Please select an option first.' };
    }

    const isCorrect = selected === challenge.correctOptionId;
    if (isCorrect) {
      soundSystem.playSuccess();
    } else {
      soundSystem.playAlert();
    }

    const chosenOption = challenge.options.find((o) => o.id === selected);
    const feedback = chosenOption?.explanation || challenge.pedagogicalExplanation;

    set((s) => ({
      submittedAnswers: {
        ...s.submittedAnswers,
        [challengeId]: {
          isCorrect,
          feedback,
        },
      },
    }));

    // Trigger and await BKT Interaction loop
    await get().submitInteraction(challenge.concept, challenge.id, isCorrect, challenge.difficulty);

    return { isCorrect, explanation: feedback };
  },

  submitInteraction: async (concept, questionId, correct, difficulty = 'medium') => {
    const state = get();
    const currentMastery = state.learner?.mastery_map[concept as keyof MasteryMap] ?? 0.38;

    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: state.learner?.learner_id || 'learner_b',
          concept,
          question_id: questionId,
          correct,
          difficulty,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const {
          prior_mastery,
          posterior_mastery,
          delta,
          threshold_crossed,
          unlocked_wing,
          world_delta,
          learner_profile,
        } = data;

        set((s) => ({
          learner: learner_profile,
          worldState: world_delta,
          lastMasteryDelta: {
            ...s.lastMasteryDelta,
            [concept]: {
              delta,
              oldMastery: prior_mastery,
              newMastery: posterior_mastery,
              timestamp: Date.now(),
            },
          },
          isThresholdCrossed: threshold_crossed,
          unlockedWingId: unlocked_wing,
        }));

        if (threshold_crossed) {
          soundSystem.playSuccess();
        }

        return {
          prior: prior_mastery,
          posterior: posterior_mastery,
          delta,
          thresholdCrossed: threshold_crossed,
        };
      }
    } catch {
      // Fall through to resilient local BKT calculation
    }

    // Local offline calculation
    const p_transit = 0.05;
    const p_guess = difficulty === 'easy' ? 0.60 : difficulty === 'hard' ? 0.40 : 0.54;
    const p_slip = difficulty === 'hard' ? 0.14 : 0.11;
    let p_obs: number;
    if (correct) {
      const num = currentMastery * (1.0 - p_slip);
      const den = num + (1.0 - currentMastery) * p_guess;
      p_obs = den > 0 ? num / den : currentMastery;
    } else {
      const num = currentMastery * p_slip;
      const den = num + (1.0 - currentMastery) * (1.0 - p_guess);
      p_obs = den > 0 ? num / den : currentMastery;
    }
    const posterior = Math.round(Math.min(0.99, Math.max(0.01, p_obs + (1.0 - p_obs) * p_transit)) * 100) / 100;
    const delta = Math.round((posterior - currentMastery) * 100) / 100;
    const thresholdCrossed = currentMastery < 0.70 && posterior >= 0.70;

    const currentProfile = state.learner || DEFAULT_LEARNER;
    const updatedMap = { ...currentProfile.mastery_map, [concept]: posterior };
    const updatedWorld = state.worldState ? JSON.parse(JSON.stringify(state.worldState)) : DEFAULT_WORLD_STATE;

    let unlockedWing: string | null = null;
    if (concept === 'stack' && posterior >= 0.70) {
      updatedWorld.wings.recursion_lab.status = 'accessible';
      updatedWorld.wings.recursion_lab.reason = null;
      updatedWorld.conduits_target_wing = 'recursion_lab';
      unlockedWing = 'recursion_lab';
    }

    set((s) => ({
      learner: {
        ...currentProfile,
        mastery_map: updatedMap,
        recommended_station: posterior >= 0.70 && concept === 'stack' ? 'recursion_lab' : currentProfile.recommended_station,
      },
      worldState: updatedWorld,
      lastMasteryDelta: {
        ...s.lastMasteryDelta,
        [concept]: {
          delta,
          oldMastery: currentMastery,
          newMastery: posterior,
          timestamp: Date.now(),
        },
      },
      isThresholdCrossed: thresholdCrossed,
      unlockedWingId: unlockedWing,
    }));

    if (thresholdCrossed) {
      soundSystem.playSuccess();
    }

    return {
      prior: currentMastery,
      posterior,
      delta,
      thresholdCrossed,
    };
  },

  simulateMasteryJump: async (
    targetOrLearnerId?: number | string,
    concept: string = 'stack',
    target: number = 0.74
  ) => {
    const state = get();
    let learnerId = state.learner?.learner_id || 'learner_b';
    let targetMastery = 0.74;
    let targetConcept = concept;

    if (typeof targetOrLearnerId === 'number') {
      targetMastery = targetOrLearnerId;
    } else if (typeof targetOrLearnerId === 'string') {
      learnerId = targetOrLearnerId;
      targetMastery = typeof target === 'number' ? target : 0.74;
    }

    const prior = state.learner?.mastery_map[targetConcept as keyof MasteryMap] ?? 0.38;

    try {
      const res = await fetch('/api/simulate-mastery-jump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learner_id: learnerId,
          concept: targetConcept,
          target_mastery: targetMastery,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        set((s) => ({
          learner: data.learner_profile,
          worldState: data.world_state,
          lastMasteryDelta: {
            ...s.lastMasteryDelta,
            [targetConcept]: {
              delta: Math.round((targetMastery - prior) * 100) / 100,
              oldMastery: prior,
              newMastery: targetMastery,
              timestamp: Date.now(),
            },
          },
          isThresholdCrossed: data.threshold_crossed,
          unlockedWingId: data.unlocked_wing,
        }));
        soundSystem.playSuccess();
        return;
      }
    } catch {
      // Fallback
    }

    // Local fallback jump
    const currentProfile = state.learner || DEFAULT_LEARNER;
    const updatedMap = { ...currentProfile.mastery_map, [targetConcept]: targetMastery };
    const updatedWorld = state.worldState ? JSON.parse(JSON.stringify(state.worldState)) : DEFAULT_WORLD_STATE;

    if (targetConcept === 'stack' && targetMastery >= 0.70) {
      updatedWorld.wings.recursion_lab.status = 'accessible';
      updatedWorld.wings.recursion_lab.reason = null;
      updatedWorld.conduits_target_wing = 'recursion_lab';
    }

    set((s) => ({
      learner: {
        ...currentProfile,
        mastery_map: updatedMap,
        recommended_station: targetConcept === 'stack' && targetMastery >= 0.70 ? 'recursion_lab' : currentProfile.recommended_station,
        learning_state: {
          ...currentProfile.learning_state,
          status: 'progressing',
          summary: `Prerequisite satisfied: Stack mastery (${Math.round(targetMastery * 100)}%) crossed the 70% threshold. Recursion Wing is now unlocked.`,
          primary_focus_concept: 'recursion',
          active_prerequisite_gap: null,
        },
      },
      worldState: updatedWorld,
      lastMasteryDelta: {
        ...s.lastMasteryDelta,
        [targetConcept]: {
          delta: Math.round((targetMastery - prior) * 100) / 100,
          oldMastery: prior,
          newMastery: targetMastery,
          timestamp: Date.now(),
        },
      },
      isThresholdCrossed: targetMastery >= 0.70 && prior < 0.70,
      unlockedWingId: targetConcept === 'stack' && targetMastery >= 0.70 ? 'recursion_lab' : null,
    }));
    soundSystem.playSuccess();
  },

  setActiveChallengeIndex: (index: number) => {
    const total = get().stackMission.challenges.length;
    if (index >= 0 && index < total) {
      soundSystem.playChirp();
      set({ activeChallengeIndex: index });
    }
  },

  nextChallenge: () => {
    const { activeChallengeIndex, stackMission } = get();
    if (activeChallengeIndex < stackMission.challenges.length - 1) {
      soundSystem.playChirp();
      set({ activeChallengeIndex: activeChallengeIndex + 1 });
    }
  },

  prevChallenge: () => {
    const { activeChallengeIndex } = get();
    if (activeChallengeIndex > 0) {
      soundSystem.playChirp();
      set({ activeChallengeIndex: activeChallengeIndex - 1 });
    }
  },

  loadChallengeOntoApparatus: (challengeId: string) => {
    const challenge = get().stackMission.challenges.find((c) => c.id === challengeId);
    if (!challenge || !challenge.simulatedStackInitial) return;

    soundSystem.playMagneticThud();
    const initialDiscs = challenge.simulatedStackInitial.map((val, idx) => ({
      id: `sim-disc-${idx}-${val}`,
      value: val,
    }));
    set({ stackDiscs: initialDiscs });
  },

  resetChallengeProgress: () => {
    set({
      activeChallengeIndex: 0,
      selectedAnswers: {},
      submittedAnswers: {},
    });
  },

  setActiveStation: (stationId: string | null) => {
    if (stationId) {
      soundSystem.playChirp();
    }
    set({ activeStation: stationId });
  },

  pushStackDisc: (val?: number) => {
    const current = get().stackDiscs;
    if (current.length >= 6) return; // Max capacity 6

    const nextValues = [50, 64, 88, 99, 128];
    const value = val !== undefined ? val : (nextValues[current.length % nextValues.length] || 15);
    const newDisc = {
      id: `disc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      value,
    };

    soundSystem.playMagneticThud();
    set({ stackDiscs: [...current, newDisc] });
  },

  popStackDisc: () => {
    const current = get().stackDiscs;
    if (current.length === 0) return; // Underflow protection

    soundSystem.playPop();
    set({ stackDiscs: current.slice(0, -1) });
  },

  resetWorldSeed: async () => {
    try {
      await fetch('/api/learner/reset', { method: 'POST' });
      await get().fetchLearnerProfile();
      await get().fetchWorldState();
      await get().fetchMentorGuidance('learner_b');
      set({
        avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
        isMentorOpen: false,
        activeStation: null,
        stackDiscs: [
          { id: 'disc-1', value: 10 },
          { id: 'disc-2', value: 25 },
          { id: 'disc-3', value: 42 },
        ],
        activeChallengeIndex: 0,
        selectedAnswers: {},
        submittedAnswers: {},
        lastMasteryDelta: {},
        isThresholdCrossed: false,
        unlockedWingId: null,
      });
    } catch {
      // reset locally
      set({
        learner: DEFAULT_LEARNER,
        worldState: DEFAULT_WORLD_STATE,
        mentorGuidance: DEFAULT_MENTOR_GUIDANCE_B,
        avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
        isMentorOpen: false,
        activeStation: null,
        stackDiscs: [
          { id: 'disc-1', value: 10 },
          { id: 'disc-2', value: 25 },
          { id: 'disc-3', value: 42 },
        ],
        activeChallengeIndex: 0,
        selectedAnswers: {},
        submittedAnswers: {},
        lastMasteryDelta: {},
        isThresholdCrossed: false,
        unlockedWingId: null,
      });
    }
  },
}));
