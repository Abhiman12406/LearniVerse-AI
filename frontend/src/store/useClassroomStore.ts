import { create } from 'zustand';
import { LearnerProfile, WorldState, AvatarState, MasteryMap } from '../types/world';
import { MentorGuidance } from '../types/mentor';
import { soundSystem } from '../audio/soundSystem';
import { StackMission } from '../types/challenge';
import { STACK_MISSION } from '../data/stackChallenges';
import { DeliberationResponse, BktTelemetryTrace } from '../types/agents';
import {
  DEFAULT_DELIBERATION_B,
  DEFAULT_DELIBERATION_A,
  DEFAULT_BKT_TRACE_B,
  DEFAULT_BKT_TRACE_A,
} from '../data/mockDeliberations';

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

  // Telemetry Drawer & Inspector State
  isTelemetryOpen: boolean;
  activeTelemetryTab: 'explainability' | 'agents' | 'bkt';
  latestBktTrace: BktTelemetryTrace | null;

  // Barrier Dissolve & Cinematic Camera State
  dissolvingWingId: string | null;
  dissolvePhase: 'idle' | 'flicker' | 'shockwave' | 'dissolved';
  cinematicCamera: {
    active: boolean;
    position: [number, number, number];
    lookAt: [number, number, number];
  } | null;

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
  latestDeliberation: DeliberationResponse | null;

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
  fetchDeliberation: (learnerId?: string) => Promise<void>;
  triggerBarrierDissolve: (wingId?: string) => void;
  setActiveStation: (stationId: string | null) => void;
  pushStackDisc: (value?: number) => void;
  popStackDisc: () => void;

  // Telemetry Drawer Actions
  toggleTelemetry: () => void;
  openTelemetry: (tab?: 'explainability' | 'agents' | 'bkt') => void;
  closeTelemetry: () => void;
  setActiveTelemetryTab: (tab: 'explainability' | 'agents' | 'bkt') => void;

  // Challenge Console Actions
  setChallengeAnswer: (challengeId: string, optionId: string) => void;
  submitChallengeAnswer: (challengeId: string) => Promise<{ isCorrect: boolean; explanation: string }>;
  setActiveChallengeIndex: (index: number) => void;
  nextChallenge: () => void;
  prevChallenge: () => void;
  loadChallengeOntoApparatus: (challengeId: string) => void;
  animateChallengeTrace: (challengeId: string) => Promise<void>;
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

  isTelemetryOpen: false,
  activeTelemetryTab: 'explainability',
  latestDeliberation: DEFAULT_DELIBERATION_B,
  latestBktTrace: DEFAULT_BKT_TRACE_B,

  dissolvingWingId: null,
  dissolvePhase: 'idle',
  cinematicCamera: null,

  activeStation: null,
  stackDiscs: [
    { id: 'disc-1', value: 10 },
    { id: 'disc-2', value: 25 },
    { id: 'disc-3', value: 42 },
  ],

  toggleTelemetry: () => {
    soundSystem.playChirp();
    set((state) => ({ isTelemetryOpen: !state.isTelemetryOpen }));
  },

  openTelemetry: (tab: 'explainability' | 'agents' | 'bkt' = 'explainability') => {
    soundSystem.playChime();
    set({ isTelemetryOpen: true, activeTelemetryTab: tab });
  },

  closeTelemetry: () => {
    soundSystem.playChirp();
    set({ isTelemetryOpen: false });
  },

  setActiveTelemetryTab: (tab: 'explainability' | 'agents' | 'bkt') => {
    soundSystem.playChirp();
    set({ activeTelemetryTab: tab });
  },

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

  fetchDeliberation: async (learnerId?: string) => {
    const lid = learnerId || get().learner?.learner_id || 'learner_b';
    try {
      const res = await fetch(`/api/agents/latest/${lid}`);
      if (res.ok) {
        const data: DeliberationResponse = await res.json();
        set({ latestDeliberation: data });
        return;
      }
    } catch {
      // Retain existing state or fallback below
    }
    const fallback = lid === 'learner_a' ? DEFAULT_DELIBERATION_A : DEFAULT_DELIBERATION_B;
    set({ latestDeliberation: fallback });
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
        set({
          learner: data,
          isLoading: false,
          latestBktTrace: learnerId === 'learner_a' ? DEFAULT_BKT_TRACE_A : DEFAULT_BKT_TRACE_B,
        });
        await get().fetchWorldState();
        await get().fetchMentorGuidance(learnerId);
        await get().fetchDeliberation(learnerId);
        return;
      }
    } catch {
      // Fall through to resilient offline switch
    }

    // Offline / Standalone Mock Fallback
    const fallbackProfile = learnerId === 'learner_a' ? SEED_LEARNER_A : DEFAULT_LEARNER;
    const fallbackWorld = learnerId === 'learner_a' ? WORLD_STATE_A : DEFAULT_WORLD_STATE;
    const fallbackMentor = learnerId === 'learner_a' ? DEFAULT_MENTOR_GUIDANCE_A : DEFAULT_MENTOR_GUIDANCE_B;
    const fallbackDelib = learnerId === 'learner_a' ? DEFAULT_DELIBERATION_A : DEFAULT_DELIBERATION_B;
    const fallbackBkt = learnerId === 'learner_a' ? DEFAULT_BKT_TRACE_A : DEFAULT_BKT_TRACE_B;
    set({
      learner: fallbackProfile,
      worldState: fallbackWorld,
      mentorGuidance: fallbackMentor,
      latestDeliberation: fallbackDelib,
      latestBktTrace: fallbackBkt,
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

  triggerBarrierDissolve: (wingId: string = 'recursion_lab') => {
    // Exit active station if open so the cinematic camera pan and dissolution are in full view
    if (get().activeStation) {
      set({ activeStation: null });
    }

    // 1. Synthesize procedural ascending unlock arpeggio
    soundSystem.playUnlockArpeggio();

    // 2. Pan/frame camera to the Recursion Lab archway and start violent flicker
    set({
      dissolvingWingId: wingId,
      dissolvePhase: 'flicker',
      cinematicCamera: {
        active: true,
        position: [-10.5, 3.6, 0.0],
        lookAt: [-24.0, 3.0, 0.0],
      },
    });

    // 3. Transition to explosive particle shockwave after 600ms
    setTimeout(() => {
      set({ dissolvePhase: 'shockwave' });

      // Update world state locally so barrier collision deactivates immediately
      const currentWorld = get().worldState;
      if (currentWorld && currentWorld.wings[wingId]) {
        const updatedWings = { ...currentWorld.wings };
        updatedWings[wingId] = {
          ...updatedWings[wingId],
          status: 'accessible',
          reason: null,
        };
        set({
          worldState: {
            ...currentWorld,
            wings: updatedWings,
            conduits_target_wing: wingId,
          },
        });
      }
    }, 600);

    // 4. Restore camera to avatar follow mode after 3500ms
    setTimeout(() => {
      set({
        dissolvePhase: 'dissolved',
        dissolvingWingId: null,
        cinematicCamera: null,
      });
    }, 3500);
  },

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
      // Animate corresponding operation on 3D apparatus to demonstrate LIFO mechanics
      if (challenge.id === 'stack_lifo_order' && get().stackDiscs.length > 0) {
        get().popStackDisc();
      }
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

    // Precalculate exact BKT parameters and probabilities for Telemetry Inspector
    const p_transit = 0.05;
    const p_guess = difficulty === 'easy' ? 0.60 : difficulty === 'hard' ? 0.40 : 0.54;
    const p_slip = difficulty === 'hard' ? 0.14 : 0.11;
    let num: number;
    let den: number;
    let p_obs: number;
    if (correct) {
      num = currentMastery * (1.0 - p_slip);
      den = num + (1.0 - currentMastery) * p_guess;
      p_obs = den > 0 ? num / den : currentMastery;
    } else {
      num = currentMastery * p_slip;
      den = num + (1.0 - currentMastery) * (1.0 - p_guess);
      p_obs = den > 0 ? num / den : currentMastery;
    }

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

        const bktTrace: BktTelemetryTrace = {
          concept,
          prior: prior_mastery,
          correct,
          difficulty,
          p_guess,
          p_slip,
          p_transit,
          numerator: Math.round(num * 10000) / 10000,
          denominator: Math.round(den * 10000) / 10000,
          p_obs: Math.round(p_obs * 1000) / 1000,
          posterior: posterior_mastery,
          delta,
          threshold_crossed,
          timestamp: new Date().toISOString(),
        };

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
          latestDeliberation: data.deliberation ?? s.latestDeliberation,
          latestBktTrace: bktTrace,
        }));

        if (threshold_crossed) {
          soundSystem.playSuccess();
          if (unlocked_wing) {
            get().triggerBarrierDissolve(unlocked_wing);
          } else if (concept === 'stack') {
            get().triggerBarrierDissolve('recursion_lab');
          }
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
    const rawPosterior = p_obs + (1.0 - p_obs) * p_transit;
    const posterior = Math.round(Math.min(0.99, Math.max(0.01, rawPosterior)) * 100) / 100;
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

    const bktTrace: BktTelemetryTrace = {
      concept,
      prior: currentMastery,
      correct,
      difficulty,
      p_guess,
      p_slip,
      p_transit,
      numerator: Math.round(num * 10000) / 10000,
      denominator: Math.round(den * 10000) / 10000,
      p_obs: Math.round(p_obs * 1000) / 1000,
      posterior,
      delta,
      threshold_crossed: thresholdCrossed,
      timestamp: new Date().toISOString(),
    };

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
      latestBktTrace: bktTrace,
      latestDeliberation: thresholdCrossed && concept === 'stack' ? DEFAULT_DELIBERATION_A : s.latestDeliberation,
    }));

    if (thresholdCrossed) {
      soundSystem.playSuccess();
      if (unlockedWing) {
        get().triggerBarrierDissolve(unlockedWing);
      } else if (concept === 'stack') {
        get().triggerBarrierDissolve('recursion_lab');
      }
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

    const jumpTrace: BktTelemetryTrace = {
      concept: targetConcept,
      prior,
      correct: true,
      difficulty: 'medium',
      p_guess: 0.54,
      p_slip: 0.11,
      p_transit: 0.05,
      numerator: Math.round(prior * (1.0 - 0.11) * 10000) / 10000,
      denominator: Math.round((prior * (1.0 - 0.11) + (1.0 - prior) * 0.54) * 10000) / 10000,
      p_obs: Math.round(targetMastery * 0.95 * 1000) / 1000,
      posterior: targetMastery,
      delta: Math.round((targetMastery - prior) * 100) / 100,
      threshold_crossed: prior < 0.70 && targetMastery >= 0.70,
      timestamp: new Date().toISOString(),
    };

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
          latestDeliberation: data.deliberation ?? (targetMastery >= 0.70 && targetConcept === 'stack' ? DEFAULT_DELIBERATION_A : s.latestDeliberation),
          latestBktTrace: jumpTrace,
        }));
        if (data.threshold_crossed && data.unlocked_wing) {
          get().triggerBarrierDissolve(data.unlocked_wing);
        }
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
          status: 'advanced',
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
      latestBktTrace: jumpTrace,
      latestDeliberation: targetMastery >= 0.70 && targetConcept === 'stack' ? DEFAULT_DELIBERATION_A : s.latestDeliberation,
    }));
    if (targetConcept === 'stack' && targetMastery >= 0.70 && prior < 0.70) {
      get().triggerBarrierDissolve('recursion_lab');
    }
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

  animateChallengeTrace: async (challengeId: string) => {
    const challenge = get().stackMission.challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    if (challengeId === 'stack_lifo_order') {
      // 1. Stage 4 discs [10, 20, 30, 40]
      set({
        stackDiscs: [
          { id: 'trace-1', value: 10 },
          { id: 'trace-2', value: 20 },
          { id: 'trace-3', value: 30 },
          { id: 'trace-4', value: 40 },
        ],
      });
      soundSystem.playMagneticThud();

      // 2. Sequentially pop discs in LIFO order (40, 30, 20, 10)
      for (let i = 0; i < 4; i++) {
        await new Promise((r) => setTimeout(r, 450));
        get().popStackDisc();
      }
    } else if (challengeId === 'stack_push_pop_trace') {
      // Sequence: PUSH(15) -> PUSH(30) -> POP() -> PUSH(45) -> PUSH(60) -> POP() -> PUSH(75)
      set({ stackDiscs: [] });
      await new Promise((r) => setTimeout(r, 150));

      get().pushStackDisc(15);
      await new Promise((r) => setTimeout(r, 300));
      get().pushStackDisc(30);
      await new Promise((r) => setTimeout(r, 300));
      get().popStackDisc();
      await new Promise((r) => setTimeout(r, 300));
      get().pushStackDisc(45);
      await new Promise((r) => setTimeout(r, 300));
      get().pushStackDisc(60);
      await new Promise((r) => setTimeout(r, 300));
      get().popStackDisc();
      await new Promise((r) => setTimeout(r, 300));
      get().pushStackDisc(75);
    } else if (challengeId === 'stack_overflow_underflow') {
      // Fill to 6 discs to illustrate buffer capacity
      set({ stackDiscs: [] });
      for (const val of [10, 20, 30, 40, 50, 60]) {
        await new Promise((r) => setTimeout(r, 180));
        get().pushStackDisc(val);
      }
    } else {
      get().loadChallengeOntoApparatus(challengeId);
    }
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
        isTelemetryOpen: false,
        dissolvingWingId: null,
        dissolvePhase: 'idle',
        cinematicCamera: null,
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
        latestDeliberation: DEFAULT_DELIBERATION_B,
        latestBktTrace: DEFAULT_BKT_TRACE_B,
      });
      await get().fetchDeliberation('learner_b');
    } catch {
      // reset locally
      set({
        learner: DEFAULT_LEARNER,
        worldState: DEFAULT_WORLD_STATE,
        mentorGuidance: DEFAULT_MENTOR_GUIDANCE_B,
        avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
        isMentorOpen: false,
        isTelemetryOpen: false,
        dissolvingWingId: null,
        dissolvePhase: 'idle',
        cinematicCamera: null,
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
        latestDeliberation: DEFAULT_DELIBERATION_B,
        latestBktTrace: DEFAULT_BKT_TRACE_B,
      });
    }
  },
}));
