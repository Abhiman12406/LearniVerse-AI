export type WingId = 
  | 'array_station' 
  | 'linked_list_lab' 
  | 'stack_lab' 
  | 'recursion_lab' 
  | 'tree_lab';

export interface MasteryMap {
  array: number;
  linked_list: number;
  stack: number;
  recursion: number;
  tree: number;
}

export interface LearningState {
  status: 'remediation_required' | 'advanced' | 'progressing' | 'foundational';
  summary: string;
  primary_focus_concept: string;
  active_prerequisite_gap: string | null;
}

export interface LearnerProfile {
  learner_id: string;
  name: string;
  persona_type: string;
  learning_state: LearningState;
  mastery_map: MasteryMap;
  active_wing: string;
  recommended_station: string;
}

export interface WingInfo {
  wing_id: WingId;
  name: string;
  concept: string;
  status: 'accessible' | 'sealed';
  azimuth_deg: number;
  coordinates: [number, number, number];
  required_mastery?: Record<string, number> | null;
  reason?: string | null;
}

export interface WorldState {
  active_learner_id: string;
  atrium_radius: number;
  wings: Record<string, WingInfo>;
  conduits_target_wing: string;
}

export interface AvatarState {
  position: [number, number, number];
  rotation: number; // yaw in radians
  isMoving: boolean;
}
