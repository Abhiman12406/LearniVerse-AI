import { create } from 'zustand';
import { LearnerProfile, WorldState, AvatarState } from '../types/world';
import { soundSystem } from '../audio/soundSystem';

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

  // Station Console & Stack Apparatus State
  activeStation: string | null;
  stackDiscs: Array<{ id: string; value: number }>;

  // Actions
  fetchLearnerProfile: () => Promise<void>;
  fetchWorldState: () => Promise<void>;
  switchLearner: (learnerId: string) => Promise<void>;
  toggleAudioMute: () => void;
  setAvatarState: (position: [number, number, number], rotation: number, isMoving: boolean) => void;
  resetWorldSeed: () => Promise<void>;
  setActiveStation: (stationId: string | null) => void;
  pushStackDisc: (value?: number) => void;
  popStackDisc: () => void;
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
        return;
      }
    } catch {
      // Fall through to resilient offline switch
    }

    // Offline / Standalone Mock Fallback
    const fallbackProfile = learnerId === 'learner_a' ? SEED_LEARNER_A : DEFAULT_LEARNER;
    const fallbackWorld = learnerId === 'learner_a' ? WORLD_STATE_A : DEFAULT_WORLD_STATE;
    set({ learner: fallbackProfile, worldState: fallbackWorld, isLoading: false });
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

  activeStation: null,
  stackDiscs: [
    { id: 'disc-1', value: 10 },
    { id: 'disc-2', value: 25 },
    { id: 'disc-3', value: 42 },
  ],

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
      set({
        avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
        activeStation: null,
        stackDiscs: [
          { id: 'disc-1', value: 10 },
          { id: 'disc-2', value: 25 },
          { id: 'disc-3', value: 42 },
        ],
      });
    } catch {
      // reset locally
      set({
        learner: DEFAULT_LEARNER,
        worldState: DEFAULT_WORLD_STATE,
        avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
        activeStation: null,
        stackDiscs: [
          { id: 'disc-1', value: 10 },
          { id: 'disc-2', value: 25 },
          { id: 'disc-3', value: 42 },
        ],
      });
    }
  },
}));
