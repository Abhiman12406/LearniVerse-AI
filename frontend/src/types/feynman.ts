/**
 * TypeScript definitions for Feynman Agent Multimodal Adaptive Explanation System.
 * Conforming to FEYNMAN.md.
 */

export interface VisualStep {
  step_number: number;
  title: string;
  description: string;
  visual_state: Record<string, unknown>;
  highlight_element?: string | null;
  analogy_note?: string | null;
}

export interface VideoFrame {
  timestamp_sec: number;
  caption: string;
  frame_type: string;
  visual_data: Record<string, unknown>;
}

export interface ThreeDApparatusInstruction {
  action: string;
  concept: string;
  zone: string;
  visualization: string;
  focus_elements: string[];
  camera_target?: [number, number, number] | null;
}

export interface FeynmanDecision {
  decision_id: string;
  concept_id: string;
  problem: string;
  modality: 'TEXT' | 'VISUAL' | 'VOICE' | 'VIDEO' | '3D' | string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string;
  learning_objective: string;
  reason: string;
  understood: string[];
  gaps: string[];
  misconceptions: string[];
  confidence: number;
}

export interface VerificationQuestion {
  question_id: string;
  prompt: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  tested_skill: string;
}

export interface FeynmanExplanationPayload {
  title: string;
  modality: 'TEXT' | 'VISUAL' | 'VOICE' | 'VIDEO' | '3D' | string;
  analogy: string;
  detailed_explanation: string;
  code_or_trace?: string | null;
  visual_steps: VisualStep[];
  voice_script: string;
  video_timeline: VideoFrame[];
  three_d_instruction?: ThreeDApparatusInstruction | null;
}

export interface StrategyHistoryItem {
  modality: string;
  result: 'HELPFUL' | 'PARTIALLY_HELPFUL' | 'NOT_HELPFUL' | string;
  concept: string;
  timestamp: string;
}

export interface FeynmanResponse {
  session_id: string;
  student_id: string;
  concept_id: string;
  input_type: string;
  unified_input: string;
  decision: FeynmanDecision;
  explanation: FeynmanExplanationPayload;
  verification_question: VerificationQuestion;
  strategy_history: StrategyHistoryItem[];
  orchestrator: string;
  llm_mode: string;
  cache_status?: string | null;
  cache_provider?: string | null;
  latency_saved_ms?: number | null;
  timestamp: string;
}

export interface LearningEvidence {
  evidence_id: string;
  student_id: string;
  concept_id: string;
  source: string;
  evidence_type: string;
  skill: string;
  correct: boolean;
  confidence: number;
  response_time_ms: number;
  timestamp: string;
}

export interface VerificationResponse {
  session_id: string;
  student_id: string;
  concept_id: string;
  correct: boolean;
  feedback: string;
  evidence: LearningEvidence;
  prior_mastery: number;
  posterior_mastery: number;
  delta: number;
  threshold_crossed: boolean;
  unlocked_wing?: string | null;
  learner_profile: Record<string, unknown>;
  world_delta: Record<string, unknown>;
  deliberation?: Record<string, unknown> | null;
}

export interface TranscribeRequest {
  audio_base64?: string | null;
  audio_format?: string;
  language?: string;
  prompt?: string | null;
}

export interface TranscribeResponse {
  transcript: string;
  provider: string;
  model: string;
  success: boolean;
  warning?: string | null;
}
