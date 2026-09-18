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
import { FeynmanResponse, VerificationResponse, TranscribeResponse } from '../types/feynman';

export interface ArrayBayElement {
  index: number;
  value: number;
  address: string;
  color: string;
}

export interface ArrayOperationDetail {
  type: 'random_access' | 'linear_search' | 'out_of_bounds' | 'write';
  timeComplexity: 'O(1)' | 'O(n)';
  description: string;
  formula: string;
  baseAddress: string;
  index: number;
  targetAddress: string;
  stepsCount: number;
  targetValue?: number;
  foundIndex?: number;
}

export const DEFAULT_ARRAY_BAYS: ArrayBayElement[] = [
  { index: 0, value: 12, address: '0x2000', color: '#6ee7b7' },
  { index: 1, value: 45, address: '0x2004', color: '#fb7185' },
  { index: 2, value: 78, address: '0x2008', color: '#c084fc' },
  { index: 3, value: 23, address: '0x200C', color: '#10b981' },
  { index: 4, value: 56, address: '0x2010', color: '#8b5cf6' },
];

export interface LinkedListNodeElement {
  id: string;
  label: string;
  value: number;
  address: string;
  crystalColor: string;
  nextId: string | null;
}

export interface LinkedListOperationDetail {
  type: 'traversal' | 'insert' | 'delete' | 'sever' | 'repair' | 'null_dereference';
  timeComplexity: 'O(1)' | 'O(n)';
  description: string;
  codeSnippet: string;
  activeNodeId?: string | null;
  stepsCount?: number;
}

export const DEFAULT_LINKED_LIST_NODES: LinkedListNodeElement[] = [
  { id: 'node_a', label: 'A', value: 10, address: '0x3F00', crystalColor: '#00d4ff', nextId: 'node_b' },
  { id: 'node_b', label: 'B', value: 20, address: '0x3F40', crystalColor: '#10b981', nextId: 'node_c' },
  { id: 'node_c', label: 'C', value: 30, address: '0x3F80', crystalColor: '#f43f5e', nextId: null },
];

export interface RecursionFrameElement {
  id: string;
  n: number;
  callLabel: string;
  argValue: number;
  returnValue: number | null;
  status: 'active' | 'base_case' | 'resolved';
}

export interface RecursionOperationDetail {
  type: 'push' | 'unwind' | 'overflow' | 'reset' | 'base_case';
  title: string;
  description: string;
  depth: number;
  timestamp: number;
}

export const DEFAULT_RECURSION_FRAMES: RecursionFrameElement[] = [
  { id: 'frame-3', n: 3, callLabel: 'f(3)', argValue: 3, returnValue: null, status: 'active' },
  { id: 'frame-2', n: 2, callLabel: 'f(2)', argValue: 2, returnValue: null, status: 'active' },
  { id: 'frame-1', n: 1, callLabel: 'f(1)', argValue: 1, returnValue: null, status: 'base_case' },
];

export interface TreeNodeElement {
  value: number;
  level: number;
  leftChildValue: number | null;
  rightChildValue: number | null;
  color: string;
}

export interface TreeOperationDetail {
  type: 'in_order_traversal' | 'search' | 'reset';
  timeComplexity: 'O(log n)' | 'O(n)';
  description: string;
  formula: string;
  visitedNodes: number[];
  targetValue?: number;
  found?: boolean;
  stepsCount: number;
}

export const DEFAULT_TREE_NODES: TreeNodeElement[] = [
  { value: 50, level: 0, leftChildValue: 30, rightChildValue: 70, color: '#00f0ff' },
  { value: 30, level: 1, leftChildValue: 20, rightChildValue: 40, color: '#10b981' },
  { value: 70, level: 1, leftChildValue: 60, rightChildValue: 80, color: '#10b981' },
  { value: 20, level: 2, leftChildValue: null, rightChildValue: null, color: '#34d399' },
  { value: 40, level: 2, leftChildValue: null, rightChildValue: null, color: '#34d399' },
  { value: 60, level: 2, leftChildValue: null, rightChildValue: null, color: '#34d399' },
  { value: 80, level: 2, leftChildValue: null, rightChildValue: null, color: '#34d399' },
];

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
  perspectiveMode: '3rd_person' | '1st_person';

  // Navigation & Teleport State
  teleportRequest: [number, number, number] | null;
  cameraAngleRequest: number | null;

  // Golden Hour Lighting State
  isGoldenHour: boolean;

  // Toast Notification State
  toastMessage: string | null;

  // Station Console & Stack Apparatus State
  activeStation: string | null;
  stackDiscs: Array<{ id: string; value: number }>;

  // Array Station State & Mechanics
  arrayBays: ArrayBayElement[];
  arrayTargetIndex: number;
  arrayProbeIndex: number;
  arrayIsScanning: boolean;
  arrayScanCurrentStep: number | null;
  arrayScanTargetValue: number | null;
  arrayOutOfBounds: boolean;
  arrayErrorMessage: string | null;
  arrayOperation: ArrayOperationDetail | null;

  // Linked List Apparatus State & Mechanics
  linkedListNodes: LinkedListNodeElement[];
  linkedListActiveNodeId: string | null;
  linkedListIsTraversing: boolean;
  linkedListIsSevered: boolean;
  linkedListSeveredNodeId: string | null;
  linkedListNullError: string | null;
  linkedListOperation: LinkedListOperationDetail | null;

  // Recursion Chamber State & Mechanics
  recursionFrames: RecursionFrameElement[];
  recursionMaxDepth: number;
  recursionIsExecuting: boolean;
  recursionIsUnwinding: boolean;
  recursionReturnStep: number;
  recursionStackOverflow: boolean;
  recursionOperation: RecursionOperationDetail | null;

  // Tree & BST Lab State & Mechanics
  treeNodes: TreeNodeElement[];
  treeActiveNodeValue: number | null;
  treeTraversingValues: number[];
  treeSearchTarget: number | null;
  treeIsTraversing: boolean;
  treeOperation: TreeOperationDetail | null;

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
  togglePerspectiveMode: () => void;
  setPerspectiveMode: (mode: '3rd_person' | '1st_person') => void;
  teleportAvatar: (pos: [number, number, number], cameraAngle?: number) => void;
  clearTeleportRequest: () => void;
  requestCameraAngle: (angle: number) => void;
  clearCameraAngleRequest: () => void;
  toggleGoldenHour: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  setActiveStation: (stationId: string | null) => void;
  pushStackDisc: (value?: number) => void;
  popStackDisc: () => void;

  // Array Station Actions
  jumpToArrayIndex: (index: number) => void;
  runArrayLinearSearch: (targetValue: number) => Promise<{ found: boolean; index: number; steps: number }>;
  updateArrayElement: (index: number, newValue: number) => void;
  clearArrayError: () => void;
  resetArrayStation: () => void;

  // Linked List Apparatus Actions
  traverseLinkedList: () => Promise<{ steps: number; completed: boolean }>;
  insertLinkedListNode: (targetIndex: number, value: number, label?: string) => void;
  removeLinkedListNode: (id: string) => void;
  severLinkedListLink: (nodeId: string) => void;
  repairLinkedListLink: () => void;
  triggerNullPointerDereference: () => void;
  clearLinkedListError: () => void;
  resetLinkedList: () => void;

  // Recursion Chamber Actions
  pushRecursionCall: (n?: number) => void;
  popRecursionCall: () => void;
  triggerRecursionReturn: () => Promise<void>;
  triggerStackOverflowError: () => void;
  clearRecursionOverflow: () => void;
  resetRecursionChamber: () => void;
  runRecursiveFactorialDemo: (n?: number) => Promise<void>;

  // Tree & BST Actions
  runTreeInOrderTraversal: (stepDelay?: number) => Promise<number[]>;
  runTreeSearch: (target: number, stepDelay?: number) => Promise<{ found: boolean; path: number[]; steps: number }>;
  resetTreeLab: () => void;

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

  // Feynman Multimodal Agent State & Actions
  isFeynmanOpen: boolean;
  feynmanConcept: string;
  feynmanActivityId: string | null;
  feynmanLoading: boolean;
  feynmanResponse: FeynmanResponse | null;
  feynmanVerificationResult: VerificationResponse | null;
  feynmanActiveModality: 'TEXT' | 'VISUAL' | 'VOICE' | 'VIDEO' | '3D';
  feynmanError: string | null;

  openFeynman: (concept?: string, activityId?: string, defaultInput?: string) => void;
  closeFeynman: () => void;
  setFeynmanModality: (modality: 'TEXT' | 'VISUAL' | 'VOICE' | 'VIDEO' | '3D') => void;
  requestFeynmanExplanation: (input: string, inputType?: string, requestedModality?: string) => Promise<void>;
  submitFeynmanVerification: (questionId: string, selectedOptionIndex?: number, textAnswer?: string) => Promise<VerificationResponse | null>;
  transcribeAudioWithGroq: (audioBlob: Blob) => Promise<string>;
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
  perspectiveMode: '3rd_person',
  teleportRequest: null,
  cameraAngleRequest: null,
  isGoldenHour: false,
  toastMessage: null,

  activeStation: null,
  stackDiscs: [
    { id: 'disc-1', value: 10 },
    { id: 'disc-2', value: 25 },
    { id: 'disc-3', value: 42 },
  ],

  // Array Station Initial State
  arrayBays: DEFAULT_ARRAY_BAYS,
  arrayTargetIndex: 2,
  arrayProbeIndex: 2,
  arrayIsScanning: false,
  arrayScanCurrentStep: null,
  arrayScanTargetValue: null,
  arrayOutOfBounds: false,
  arrayErrorMessage: null,
  arrayOperation: {
    type: 'random_access',
    timeComplexity: 'O(1)',
    description: 'Direct pointer arithmetic calculation targeting index 2.',
    formula: 'Address = 0x2000 + (2 * 4) = 0x2008',
    baseAddress: '0x2000',
    index: 2,
    targetAddress: '0x2008',
    stepsCount: 1,
  },

  // Linked List Initial State
  linkedListNodes: DEFAULT_LINKED_LIST_NODES,
  linkedListActiveNodeId: null,
  linkedListIsTraversing: false,
  linkedListIsSevered: false,
  linkedListSeveredNodeId: null,
  linkedListNullError: null,
  linkedListOperation: {
    type: 'traversal',
    timeComplexity: 'O(n)',
    description: 'Linear node chain linked via forward pointer references (A → B → C → NULL).',
    codeSnippet: 'Node* head = &nodeA;\nnodeA.next = &nodeB;\nnodeB.next = &nodeC;\nnodeC.next = NULL;',
    activeNodeId: null,
    stepsCount: 3,
  },

  // Recursion Chamber Initial State
  recursionFrames: DEFAULT_RECURSION_FRAMES,
  recursionMaxDepth: 5,
  recursionIsExecuting: false,
  recursionIsUnwinding: false,
  recursionReturnStep: 0,
  recursionStackOverflow: false,
  recursionOperation: {
    type: 'base_case',
    title: 'Call Stack Initialized',
    description: 'Call frames stacked in elevator shaft: f(3) → f(2) → f(1) [Base Case].',
    depth: 3,
    timestamp: Date.now(),
  },

  // Tree & BST Initial State
  treeNodes: DEFAULT_TREE_NODES,
  treeActiveNodeValue: null,
  treeTraversingValues: [],
  treeSearchTarget: null,
  treeIsTraversing: false,
  treeOperation: null,

  // Feynman Multimodal Agent Initial State
  isFeynmanOpen: false,
  feynmanConcept: 'recursion',
  feynmanActivityId: null,
  feynmanLoading: false,
  feynmanResponse: null,
  feynmanVerificationResult: null,
  feynmanActiveModality: 'VISUAL',
  feynmanError: null,

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

  togglePerspectiveMode: () => {
    soundSystem.playChirp();
    set((state) => ({
      perspectiveMode: state.perspectiveMode === '3rd_person' ? '1st_person' : '3rd_person',
    }));
  },

  setPerspectiveMode: (mode: '3rd_person' | '1st_person') => {
    soundSystem.playChirp();
    set({ perspectiveMode: mode });
  },

  teleportAvatar: (pos: [number, number, number], cameraAngle?: number) => {
    soundSystem.playChirp();
    set({
      teleportRequest: pos,
      cameraAngleRequest: cameraAngle !== undefined ? cameraAngle : null,
      avatar: {
        ...get().avatar,
        position: pos,
        isMoving: false,
      },
    });
  },

  clearTeleportRequest: () => {
    set({ teleportRequest: null });
  },

  requestCameraAngle: (angle: number) => {
    set({ cameraAngleRequest: angle });
  },

  clearCameraAngleRequest: () => {
    set({ cameraAngleRequest: null });
  },

  toggleGoldenHour: () => {
    soundSystem.playChirp();
    set((state) => ({ isGoldenHour: !state.isGoldenHour }));
  },

  showToast: (msg: string) => {
    set({ toastMessage: msg });
  },

  clearToast: () => {
    set({ toastMessage: null });
  },

  openMentor: () => {
    soundSystem.playMentorGreeting();
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

  jumpToArrayIndex: (index: number) => {
    soundSystem.playMechanicalClick();
    const bays = get().arrayBays;
    const baseAddr = 0x2000;
    const elementSize = 4;
    const computedAddr = `0x${(baseAddr + index * elementSize).toString(16).toUpperCase()}`;

    if (index < 0 || index >= bays.length) {
      soundSystem.playAlert();
      set({
        arrayOutOfBounds: true,
        arrayTargetIndex: index,
        arrayProbeIndex: index,
        arrayErrorMessage: `ArrayIndexOutOfBoundsException: Index ${index} out of bounds for length ${bays.length}`,
        arrayOperation: {
          type: 'out_of_bounds',
          timeComplexity: 'O(1)',
          description: `Index ${index} is outside valid buffer bounds [0..${bays.length - 1}]. Hardware boundary violation.`,
          formula: `Offset (${index} × 4B) exceeds memory segment allocation!`,
          baseAddress: '0x2000',
          index,
          targetAddress: computedAddr,
          stepsCount: 1,
        },
      });
      return;
    }

    soundSystem.playChime();
    set({
      arrayOutOfBounds: false,
      arrayErrorMessage: null,
      arrayTargetIndex: index,
      arrayProbeIndex: index,
      arrayIsScanning: false,
      arrayOperation: {
        type: 'random_access',
        timeComplexity: 'O(1)',
        description: `Instantaneous O(1) random access resolved via base pointer arithmetic.`,
        formula: `Address = Base (0x2000) + (Index ${index} × 4B) = ${computedAddr}`,
        baseAddress: '0x2000',
        index,
        targetAddress: computedAddr,
        stepsCount: 1,
      },
    });
  },

  runArrayLinearSearch: async (targetValue: number) => {
    const bays = get().arrayBays;
    set({
      arrayIsScanning: true,
      arrayScanTargetValue: targetValue,
      arrayOutOfBounds: false,
      arrayErrorMessage: null,
    });

    let found = false;
    let foundIndex = -1;
    let steps = 0;

    for (let i = 0; i < bays.length; i++) {
      steps++;
      set({
        arrayScanCurrentStep: i,
        arrayProbeIndex: i,
        arrayTargetIndex: i,
      });
      soundSystem.playChirp();

      // Delay between steps to allow visual scan animation
      await new Promise((r) => setTimeout(r, 300));

      if (bays[i].value === targetValue) {
        found = true;
        foundIndex = i;
        soundSystem.playSuccess();
        break;
      }
    }

    if (!found) {
      soundSystem.playAlert();
    }

    const resultDetail: ArrayOperationDetail = {
      type: 'linear_search',
      timeComplexity: 'O(n)',
      description: found
        ? `Linear sequential search located value ${targetValue} at index ${foundIndex} after ${steps} comparison step(s).`
        : `Linear sequential search exhausted all ${steps} elements without finding value ${targetValue}.`,
      formula: `T(n) = ${steps} comparisons ≤ O(n)`,
      baseAddress: '0x2000',
      index: foundIndex >= 0 ? foundIndex : bays.length - 1,
      targetAddress: foundIndex >= 0 ? bays[foundIndex].address : 'N/A',
      stepsCount: steps,
      targetValue,
      foundIndex: foundIndex >= 0 ? foundIndex : undefined,
    };

    set({
      arrayIsScanning: false,
      arrayOperation: resultDetail,
    });

    return { found, index: foundIndex, steps };
  },

  updateArrayElement: (index: number, newValue: number) => {
    const bays = [...get().arrayBays];
    if (index < 0 || index >= bays.length) return;

    soundSystem.playMagneticThud();
    bays[index] = { ...bays[index], value: newValue };

    set({
      arrayBays: bays,
      arrayTargetIndex: index,
      arrayProbeIndex: index,
      arrayOperation: {
        type: 'write',
        timeComplexity: 'O(1)',
        description: `Direct memory write at index ${index} with constant-time O(1) pointer mutation.`,
        formula: `*(${bays[index].address}) = ${newValue}`,
        baseAddress: '0x2000',
        index,
        targetAddress: bays[index].address,
        stepsCount: 1,
      },
    });
  },

  clearArrayError: () => {
    set({
      arrayOutOfBounds: false,
      arrayErrorMessage: null,
      arrayTargetIndex: 2,
      arrayProbeIndex: 2,
    });
  },

  resetArrayStation: () => {
    set({
      arrayBays: DEFAULT_ARRAY_BAYS,
      arrayTargetIndex: 2,
      arrayProbeIndex: 2,
      arrayIsScanning: false,
      arrayScanCurrentStep: null,
      arrayScanTargetValue: null,
      arrayOutOfBounds: false,
      arrayErrorMessage: null,
      arrayOperation: {
        type: 'random_access',
        timeComplexity: 'O(1)',
        description: 'Direct pointer arithmetic calculation targeting index 2.',
        formula: 'Address = 0x2000 + (2 * 4) = 0x2008',
        baseAddress: '0x2000',
        index: 2,
        targetAddress: '0x2008',
        stepsCount: 1,
      },
    });
  },

  traverseLinkedList: async () => {
    const nodes = get().linkedListNodes;
    set({
      linkedListIsTraversing: true,
      linkedListNullError: null,
    });

    let currentId: string | null = nodes.length > 0 ? nodes[0].id : null;
    let steps = 0;

    while (currentId) {
      steps++;
      const node = nodes.find((n) => n.id === currentId);
      if (!node) break;

      set({
        linkedListActiveNodeId: currentId,
        linkedListOperation: {
          type: 'traversal',
          timeComplexity: 'O(n)',
          description: `Sequential traversal at Node ${node.label} [Val: ${node.value}, Addr: ${node.address}]. Following pointer (*next).`,
          codeSnippet: `curr = curr->next; // Now at Node ${node.label} (${node.address})`,
          activeNodeId: currentId,
          stepsCount: steps,
        },
      });
      soundSystem.playChirp();

      await new Promise((r) => setTimeout(r, 350));

      // Check for severed link
      if (get().linkedListIsSevered && get().linkedListSeveredNodeId === currentId) {
        soundSystem.playAlert();
        set({
          linkedListIsTraversing: false,
          linkedListNullError: `BrokenLinkException: Cannot traverse past Node ${node.label}. Pointer connection is severed.`,
          linkedListOperation: {
            type: 'sever',
            timeComplexity: 'O(n)',
            description: `Traversal halted at severed Node ${node.label}! Downstream nodes unreachable.`,
            codeSnippet: `// Dangling pointer encountered at Node ${node.label}\nif (curr->next == NULL && !isTerminal) throw BrokenLink;`,
            activeNodeId: currentId,
            stepsCount: steps,
          },
        });
        return { steps, completed: false };
      }

      currentId = node.nextId;
    }

    soundSystem.playSuccess();
    set({
      linkedListActiveNodeId: null,
      linkedListIsTraversing: false,
      linkedListOperation: {
        type: 'traversal',
        timeComplexity: 'O(n)',
        description: `Traversal completed across all ${steps} nodes terminating at NULL ground plate.`,
        codeSnippet: `while (curr != NULL) {\n  visit(curr);\n  curr = curr->next;\n}\n// Terminated cleanly at NULL`,
        activeNodeId: null,
        stepsCount: steps,
      },
    });

    return { steps, completed: true };
  },

  insertLinkedListNode: (targetIndex: number, value: number, label?: string) => {
    const currentNodes = [...get().linkedListNodes];
    const nodeCount = currentNodes.length;
    const nodeLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const chosenLabel = label || nodeLabels[nodeCount] || `N${nodeCount}`;
    const newId = `node_${chosenLabel.toLowerCase()}_${Date.now()}`;
    const hexAddr = `0x3F${(0x40 * (nodeCount + 1)).toString(16).toUpperCase()}`;

    // Colors matching blueprint palette
    const crystalColors = ['#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
    const chosenColor = crystalColors[nodeCount % crystalColors.length];

    soundSystem.playMagneticThud();

    // Insert at index (default index 1: between A and B, or at tail)
    const safeIdx = Math.max(0, Math.min(targetIndex, currentNodes.length));
    const nextNode = currentNodes[safeIdx] || null;

    const newNode: LinkedListNodeElement = {
      id: newId,
      label: chosenLabel,
      value,
      address: hexAddr,
      crystalColor: chosenColor,
      nextId: nextNode ? nextNode.id : null,
    };

    if (safeIdx > 0 && currentNodes[safeIdx - 1]) {
      currentNodes[safeIdx - 1] = {
        ...currentNodes[safeIdx - 1],
        nextId: newId,
      };
    }

    currentNodes.splice(safeIdx, 0, newNode);

    set({
      linkedListNodes: currentNodes,
      linkedListActiveNodeId: newId,
      linkedListNullError: null,
      linkedListOperation: {
        type: 'insert',
        timeComplexity: 'O(1)',
        description: `O(1) Dynamic node insertion of Node ${chosenLabel} (Value: ${value}). Two pointer assignments dynamically allocate and integrate node without memory reallocation.`,
        codeSnippet: `Node* newNode = (Node*)malloc(sizeof(Node));\nnewNode->val = ${value};\nnewNode->next = prev->next;\nprev->next = newNode;\n// Constant time O(1) pointer redirection!`,
        activeNodeId: newId,
        stepsCount: 2,
      },
    });
  },

  removeLinkedListNode: (id: string) => {
    const currentNodes = [...get().linkedListNodes];
    if (currentNodes.length <= 1) return; // Retain at least 1 node

    const idx = currentNodes.findIndex((n) => n.id === id);
    if (idx === -1) return;

    soundSystem.playPop();

    const targetNode = currentNodes[idx];
    const prevNode = idx > 0 ? currentNodes[idx - 1] : null;

    if (prevNode) {
      prevNode.nextId = targetNode.nextId;
    }

    currentNodes.splice(idx, 1);

    set({
      linkedListNodes: currentNodes,
      linkedListActiveNodeId: null,
      linkedListNullError: null,
      linkedListOperation: {
        type: 'delete',
        timeComplexity: 'O(1)',
        description: `O(1) Node removal of Node ${targetNode.label}. Predecessor pointer safely bypassed target node to connect directly to successor.`,
        codeSnippet: `prev->next = target->next;\nfree(target);\n// Pointer bypassed node in O(1) time`,
        activeNodeId: null,
        stepsCount: 1,
      },
    });
  },

  severLinkedListLink: (nodeId: string) => {
    soundSystem.playAlert();
    const nodes = get().linkedListNodes;
    const node = nodes.find((n) => n.id === nodeId);
    const label = node ? node.label : nodeId;

    set({
      linkedListIsSevered: true,
      linkedListSeveredNodeId: nodeId,
      linkedListOperation: {
        type: 'sever',
        timeComplexity: 'O(1)',
        description: `Dangling pointer created! Outgoing pointer from Node ${label} has been severed. Any downstream traversal will fail.`,
        codeSnippet: `// Dangling Pointer Warning!\nnode${label}->next = (Node*)0xDEADBEEF; // Invalid reference\n// Memory leak / unreachable heap nodes downstream!`,
        activeNodeId: nodeId,
        stepsCount: 1,
      },
    });
  },

  repairLinkedListLink: () => {
    soundSystem.playSuccess();
    set({
      linkedListIsSevered: false,
      linkedListSeveredNodeId: null,
      linkedListNullError: null,
      linkedListOperation: {
        type: 'repair',
        timeComplexity: 'O(1)',
        description: `Chain repaired! Pointer beam re-knitted with golden energy fusion, restoring contiguous pointer traversal.`,
        codeSnippet: `// Pointer link restored\ncurr->next = nextValidNode;\n// Memory path verified`,
        activeNodeId: null,
        stepsCount: 1,
      },
    });
  },

  triggerNullPointerDereference: () => {
    soundSystem.playAlert();
    set({
      linkedListNullError:
        'NullPointerException: Attempted to dereference null pointer (*next) pointing to address 0x0000. Segmentation Fault.',
      linkedListOperation: {
        type: 'null_dereference',
        timeComplexity: 'O(1)',
        description:
          'CRITICAL: Null Pointer Dereference! Accessing member fields or next pointers on a NULL reference causes an immediate crash / Segmentation Fault.',
        codeSnippet: `Node* ptr = NULL;\nint val = ptr->val; // 🔥 SIGSEGV: NullPointerException at 0x0000!`,
        activeNodeId: null,
        stepsCount: 1,
      },
    });
  },

  clearLinkedListError: () => {
    set({
      linkedListNullError: null,
    });
  },

  resetLinkedList: () => {
    set({
      linkedListNodes: DEFAULT_LINKED_LIST_NODES,
      linkedListActiveNodeId: null,
      linkedListIsTraversing: false,
      linkedListIsSevered: false,
      linkedListSeveredNodeId: null,
      linkedListNullError: null,
      linkedListOperation: {
        type: 'traversal',
        timeComplexity: 'O(n)',
        description: 'Linear node chain linked via forward pointer references (A → B → C → NULL).',
        codeSnippet: 'Node* head = &nodeA;\nnodeA.next = &nodeB;\nnodeB.next = &nodeC;\nnodeC.next = NULL;',
        activeNodeId: null,
        stepsCount: 3,
      },
    });
  },

  // Recursion Chamber Actions
  pushRecursionCall: (n?: number) => {
    const currentFrames = get().recursionFrames;
    if (get().recursionStackOverflow) {
      soundSystem.playAlert();
      return;
    }

    if (currentFrames.length >= get().recursionMaxDepth) {
      soundSystem.playOverflowWarning();
      set({
        recursionStackOverflow: true,
        recursionOperation: {
          type: 'overflow',
          title: 'Stack Overflow Detected!',
          description: `Maximum recursion depth (${get().recursionMaxDepth}) exceeded! Call stack memory exhausted.`,
          depth: currentFrames.length + 1,
          timestamp: Date.now(),
        },
      });
      return;
    }

    const topFrame = currentFrames[0];
    const newN = n !== undefined ? n : (topFrame ? Math.max(1, topFrame.n - 1) : 1);
    const newFrame: RecursionFrameElement = {
      id: `frame-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      n: newN,
      callLabel: `f(${newN})`,
      argValue: newN,
      returnValue: null,
      status: newN === 1 ? 'base_case' : 'active',
    };

    soundSystem.playFramePush();
    const updated = [newFrame, ...currentFrames];
    set({
      recursionFrames: updated,
      recursionStackOverflow: false,
      recursionOperation: {
        type: newN === 1 ? 'base_case' : 'push',
        title: newN === 1 ? 'Base Case Reached: f(1)' : `Recursive Call: f(${newN})`,
        description: newN === 1
          ? 'Base case termination condition reached! n <= 1 triggers upward return cascade.'
          : `Invocation f(${newN}) pushed onto Call Stack. Halts current frame and descends.`,
        depth: updated.length,
        timestamp: Date.now(),
      },
    });
  },

  popRecursionCall: () => {
    const current = get().recursionFrames;
    if (current.length === 0) return;
    const popped = current[0];
    const remaining = current.slice(1);
    soundSystem.playChirp();
    set({
      recursionFrames: remaining,
      recursionStackOverflow: false,
      recursionOperation: {
        type: 'unwind',
        title: `Frame Popped: ${popped.callLabel}`,
        description: `Popped ${popped.callLabel} from Call Stack. Control returned to caller.`,
        depth: remaining.length,
        timestamp: Date.now(),
      },
    });
  },

  triggerRecursionReturn: async () => {
    const frames = [...get().recursionFrames];
    if (frames.length === 0 || get().recursionIsUnwinding) return;

    set({
      recursionIsUnwinding: true,
      recursionStackOverflow: false,
      recursionReturnStep: 0,
    });

    soundSystem.playAscend();

    let accumulatedReturn = 1;
    for (let i = frames.length - 1; i >= 0; i--) {
      const frame = frames[i];
      if (frame.n <= 1) {
        accumulatedReturn = 1;
      } else {
        accumulatedReturn = frame.n * accumulatedReturn;
      }

      frames[i] = {
        ...frame,
        returnValue: accumulatedReturn,
        status: 'resolved',
      };

      set({
        recursionFrames: [...frames],
        recursionReturnStep: frames.length - i,
        recursionOperation: {
          type: 'unwind',
          title: `Resolved ${frame.callLabel} → ${accumulatedReturn}`,
          description: `Frame ${frame.callLabel} received return value ${accumulatedReturn}. Upward cascade active.`,
          depth: i + 1,
          timestamp: Date.now(),
        },
      });

      soundSystem.playChime();
      await new Promise((r) => setTimeout(r, 450));
    }

    soundSystem.playSuccess();
    set({
      recursionIsUnwinding: false,
      recursionOperation: {
        type: 'unwind',
        title: `Recursive Computation Complete!`,
        description: `Root call returned final result: ${accumulatedReturn}. Call stack unwound to base.`,
        depth: 0,
        timestamp: Date.now(),
      },
    });
  },

  triggerStackOverflowError: () => {
    soundSystem.playOverflowWarning();
    set({
      recursionStackOverflow: true,
      recursionOperation: {
        type: 'overflow',
        title: 'Stack Overflow Simulated!',
        description: 'Infinite recursion without a base case has exhausted the memory call stack limit!',
        depth: 6,
        timestamp: Date.now(),
      },
    });
  },

  clearRecursionOverflow: () => {
    set({ recursionStackOverflow: false });
  },

  resetRecursionChamber: () => {
    soundSystem.playChirp();
    set({
      recursionFrames: DEFAULT_RECURSION_FRAMES,
      recursionIsExecuting: false,
      recursionIsUnwinding: false,
      recursionReturnStep: 0,
      recursionStackOverflow: false,
      recursionOperation: {
        type: 'reset',
        title: 'Recursion Chamber Reset',
        description: 'Elevator shaft restored with default 3-tier call stack (f(3) → f(2) → f(1)).',
        depth: 3,
        timestamp: Date.now(),
      },
    });
  },

  runRecursiveFactorialDemo: async (startN = 3) => {
    if (get().recursionIsExecuting) return;
    set({ recursionIsExecuting: true, recursionStackOverflow: false });

    set({ recursionFrames: [] });
    await new Promise((r) => setTimeout(r, 200));

    for (let current = startN; current >= 1; current--) {
      get().pushRecursionCall(current);
      await new Promise((r) => setTimeout(r, 600));
    }

    await get().triggerRecursionReturn();
    set({ recursionIsExecuting: false });
  },

  runTreeInOrderTraversal: async (stepDelay: number = 220) => {
    soundSystem.playChirp();
    set({ treeIsTraversing: true, treeSearchTarget: null, treeTraversingValues: [] });

    const sortedOrder = [20, 30, 40, 50, 60, 70, 80];
    const visited: number[] = [];

    for (const val of sortedOrder) {
      visited.push(val);
      soundSystem.playFootstep('wood');
      set({
        treeActiveNodeValue: val,
        treeTraversingValues: [...visited],
        treeOperation: {
          type: 'in_order_traversal',
          timeComplexity: 'O(n)',
          description: `In-Order (Left-Root-Right): Visited node [${val}]. Sorted sequence producing monotonically ascending order.`,
          formula: 'T(n) = 2T(n/2) + O(1) => O(n) linear scan across all n nodes',
          visitedNodes: [...visited],
          stepsCount: visited.length,
        },
      });
      if (stepDelay > 0) {
        await new Promise((res) => setTimeout(res, stepDelay));
      }
    }

    soundSystem.playUnlockArpeggio();
    set({
      treeIsTraversing: false,
      treeActiveNodeValue: null,
      treeTraversingValues: sortedOrder,
      treeOperation: {
        type: 'in_order_traversal',
        timeComplexity: 'O(n)',
        description: `In-Order Traversal Complete: [${sortedOrder.join(', ')}]. BST invariant guarantees strictly sorted sequence!`,
        formula: 'O(n) complete tree visit',
        visitedNodes: sortedOrder,
        stepsCount: sortedOrder.length,
      },
    });
    return sortedOrder;
  },

  runTreeSearch: async (target: number, stepDelay: number = 300) => {
    soundSystem.playChirp();
    set({ treeIsTraversing: true, treeSearchTarget: target, treeTraversingValues: [] });

    const path: number[] = [];
    let curr: number | null = 50;

    const nodeMap: Record<number, { left: number | null; right: number | null }> = {
      50: { left: 30, right: 70 },
      30: { left: 20, right: 40 },
      70: { left: 60, right: 80 },
      20: { left: null, right: null },
      40: { left: null, right: null },
      60: { left: null, right: null },
      80: { left: null, right: null },
    };

    let found = false;

    while (curr !== null) {
      path.push(curr);
      soundSystem.playChirp();
      set({
        treeActiveNodeValue: curr,
        treeTraversingValues: [...path],
        treeOperation: {
          type: 'search',
          timeComplexity: 'O(log n)',
          description: `Inspecting node [${curr}] against search key [${target}].`,
          formula:
            target < curr
              ? `${target} < ${curr} => descend LEFT`
              : target > curr
              ? `${target} > ${curr} => descend RIGHT`
              : `MATCH! ${target} == ${curr}`,
          visitedNodes: [...path],
          targetValue: target,
          stepsCount: path.length,
        },
      });
      if (stepDelay > 0) {
        await new Promise((res) => setTimeout(res, stepDelay));
      }

      if (curr === target) {
        found = true;
        break;
      } else if (target < curr) {
        curr = nodeMap[curr]?.left ?? null;
      } else {
        curr = nodeMap[curr]?.right ?? null;
      }
    }

    if (found) {
      soundSystem.playUnlockArpeggio();
    }

    set({
      treeIsTraversing: false,
      treeActiveNodeValue: found ? target : null,
      treeTraversingValues: [...path],
      treeOperation: {
        type: 'search',
        timeComplexity: 'O(log n)',
        description: found
          ? `Key [${target}] successfully located in ${path.length} comparisons! Binary search cuts problem space in half each step.`
          : `Key [${target}] not found in tree canopy after ${path.length} comparisons.`,
        formula: 'Tree Height = ceil(log2(7 + 1)) = 3 comparisons => O(log n)',
        visitedNodes: [...path],
        targetValue: target,
        found,
        stepsCount: path.length,
      },
    });

    return { found, path, steps: path.length };
  },

  resetTreeLab: () => {
    soundSystem.playChirp();
    set({
      treeActiveNodeValue: null,
      treeTraversingValues: [],
      treeSearchTarget: null,
      treeIsTraversing: false,
      treeOperation: null,
    });
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
        teleportRequest: null,
        isGoldenHour: false,
        toastMessage: null,
        activeStation: null,
        stackDiscs: [
          { id: 'disc-1', value: 10 },
          { id: 'disc-2', value: 25 },
          { id: 'disc-3', value: 42 },
        ],
        arrayBays: DEFAULT_ARRAY_BAYS,
        arrayTargetIndex: 2,
        arrayProbeIndex: 2,
        arrayIsScanning: false,
        arrayScanCurrentStep: null,
        arrayScanTargetValue: null,
        arrayOutOfBounds: false,
        arrayErrorMessage: null,
        linkedListNodes: DEFAULT_LINKED_LIST_NODES,
        linkedListActiveNodeId: null,
        linkedListIsTraversing: false,
        linkedListIsSevered: false,
        linkedListSeveredNodeId: null,
        linkedListNullError: null,
        linkedListOperation: {
          type: 'traversal',
          timeComplexity: 'O(n)',
          description: 'Linear node chain linked via forward pointer references (A → B → C → NULL).',
          codeSnippet: 'Node* head = &nodeA;\nnodeA.next = &nodeB;\nnodeB.next = &nodeC;\nnodeC.next = NULL;',
          activeNodeId: null,
          stepsCount: 3,
        },
        recursionFrames: DEFAULT_RECURSION_FRAMES,
        recursionIsExecuting: false,
        recursionIsUnwinding: false,
        recursionReturnStep: 0,
        recursionStackOverflow: false,
        recursionOperation: {
          type: 'reset',
          title: 'Recursion Chamber Reset',
          description: 'Elevator shaft restored with default 3-tier call stack (f(3) → f(2) → f(1)).',
          depth: 3,
          timestamp: Date.now(),
        },
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
        arrayBays: DEFAULT_ARRAY_BAYS,
        arrayTargetIndex: 2,
        arrayProbeIndex: 2,
        arrayIsScanning: false,
        arrayScanCurrentStep: null,
        arrayScanTargetValue: null,
        arrayOutOfBounds: false,
        arrayErrorMessage: null,
        linkedListNodes: DEFAULT_LINKED_LIST_NODES,
        linkedListActiveNodeId: null,
        linkedListIsTraversing: false,
        linkedListIsSevered: false,
        linkedListSeveredNodeId: null,
        linkedListNullError: null,
        linkedListOperation: {
          type: 'traversal',
          timeComplexity: 'O(n)',
          description: 'Linear node chain linked via forward pointer references (A → B → C → NULL).',
          codeSnippet: 'Node* head = &nodeA;\nnodeA.next = &nodeB;\nnodeB.next = &nodeC;\nnodeC.next = NULL;',
          activeNodeId: null,
          stepsCount: 3,
        },
        recursionFrames: DEFAULT_RECURSION_FRAMES,
        recursionIsExecuting: false,
        recursionIsUnwinding: false,
        recursionReturnStep: 0,
        recursionStackOverflow: false,
        recursionOperation: {
          type: 'reset',
          title: 'Recursion Chamber Reset',
          description: 'Elevator shaft restored with default 3-tier call stack (f(3) → f(2) → f(1)).',
          depth: 3,
          timestamp: Date.now(),
        },
        activeChallengeIndex: 0,
        selectedAnswers: {},
        submittedAnswers: {},
        lastMasteryDelta: {},
        isThresholdCrossed: false,
        unlockedWingId: null,
        latestDeliberation: DEFAULT_DELIBERATION_B,
        latestBktTrace: DEFAULT_BKT_TRACE_B,
        isFeynmanOpen: false,
        feynmanResponse: null,
        feynmanVerificationResult: null,
      });
    }
  },

  // Feynman Multimodal Agent Actions
  openFeynman: (concept?: string, activityId?: string, defaultInput?: string) => {
    soundSystem.playChime();
    const targetConcept = concept || (get().learner?.learning_state?.primary_focus_concept || 'recursion');
    set({
      isFeynmanOpen: true,
      feynmanConcept: targetConcept,
      feynmanActivityId: activityId || null,
      feynmanVerificationResult: null,
      feynmanError: null,
    });
    if (defaultInput) {
      get().requestFeynmanExplanation(defaultInput, 'TEXT');
    }
  },

  closeFeynman: () => {
    soundSystem.playChirp();
    set({ isFeynmanOpen: false });
  },

  setFeynmanModality: (modality: 'TEXT' | 'VISUAL' | 'VOICE' | 'VIDEO' | '3D') => {
    soundSystem.playChirp();
    set({ feynmanActiveModality: modality });
  },

  requestFeynmanExplanation: async (input: string, inputType: string = 'TEXT', requestedModality?: string) => {
    const studentId = get().learner?.learner_id || 'learner_b';
    const conceptId = get().feynmanConcept || 'recursion';
    const activityId = get().feynmanActivityId;

    set({ feynmanLoading: true, feynmanError: null, feynmanVerificationResult: null });
    soundSystem.playChime();

    try {
      const res = await fetch('/api/feynman/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          concept_id: conceptId,
          input_type: inputType,
          input: input,
          requested_modality: requestedModality || null,
          activity_id: activityId || null,
        }),
      });

      if (!res.ok) {
        throw new Error(`Feynman API returned status ${res.status}`);
      }

      const data: FeynmanResponse = await res.json();
      set({
        feynmanResponse: data,
        feynmanLoading: false,
        feynmanActiveModality: (data.decision.modality as 'TEXT' | 'VISUAL' | 'VOICE' | 'VIDEO' | '3D') || 'VISUAL',
      });
      soundSystem.playCorrect();
    } catch (err: any) {
      set({
        feynmanLoading: false,
        feynmanError: err.message || 'Failed to connect to Feynman Agent',
      });
    }
  },

  submitFeynmanVerification: async (questionId: string, selectedOptionIndex?: number, textAnswer?: string) => {
    const session = get().feynmanResponse;
    if (!session) return null;

    const studentId = get().learner?.learner_id || 'learner_b';
    const conceptId = session.concept_id;

    set({ feynmanLoading: true, feynmanError: null });

    try {
      const res = await fetch('/api/feynman/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          student_id: studentId,
          concept_id: conceptId,
          question_id: questionId,
          selected_option_index: selectedOptionIndex,
          text_answer: textAnswer,
        }),
      });

      if (!res.ok) {
        throw new Error(`Verification failed with status ${res.status}`);
      }

      const data: VerificationResponse = await res.json();
      set({
        feynmanVerificationResult: data,
        feynmanLoading: false,
      });

      // Synchronize updated authoritative learner profile and delta
      if (data.learner_profile) {
        set((state) => ({
          learner: data.learner_profile as any,
          lastMasteryDelta: {
            ...state.lastMasteryDelta,
            [conceptId]: {
              delta: data.delta,
              oldMastery: data.prior_mastery,
              newMastery: data.posterior_mastery,
              timestamp: Date.now(),
            },
          },
        }));
      }

      // Check if threshold crossed
      if (data.threshold_crossed) {
        set({ isThresholdCrossed: true, unlockedWingId: data.unlocked_wing || 'recursion_lab' });
        soundSystem.playUnlockArpeggio();
        get().triggerBarrierDissolve(data.unlocked_wing || 'recursion_lab');
      } else if (data.correct) {
        soundSystem.playCorrect();
      } else {
        soundSystem.playError();
      }

      // Fetch fresh world state and deliberation traces
      await get().fetchWorldState();
      await get().fetchDeliberation(studentId);

      return data;
    } catch (err: any) {
      set({
        feynmanLoading: false,
        feynmanError: err.message || 'Verification failed',
      });
      return null;
    }
  },

  transcribeAudioWithGroq: async (audioBlob: Blob): Promise<string> => {
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = (reader.result as string) || '';
          const base64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const res = await fetch('/api/feynman/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_base64: base64Audio,
          audio_format: audioBlob.type.includes('wav') ? 'wav' : 'webm',
          language: 'en',
        }),
      });

      if (!res.ok) {
        throw new Error(`Groq Whisper endpoint returned status ${res.status}`);
      }

      const data: TranscribeResponse = await res.json();
      return data.transcript;
    } catch (err: any) {
      console.warn('Groq Whisper speech transcription failed:', err);
      throw err;
    }
  },
}));
