/**
 * TypeScript types for AI Diagnostic Assessment, questions, and submission results.
 */

export interface DiagnosticOption {
  id: string;
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  explanation: string;
}

export interface DiagnosticQuestion {
  id: string;
  concept: 'array' | 'linked_list' | 'stack' | 'recursion' | 'tree';
  concept_title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  scenario: string;
  code_snippet?: string[];
  options: DiagnosticOption[];
  correct_option_id: string;
  hint: string;
  feynman_analogy: string;
  pedagogical_objective: string;
}

export interface DiagnosticAssessment {
  assessment_id: string;
  title: string;
  description: string;
  concepts: string[];
  questions: DiagnosticQuestion[];
  generated_by: 'gemini' | 'offline_curated';
  timestamp: string;
}

import { DeliberationResponse } from './agents';
import { LearnerProfile, WorldState } from './world';

export interface DiagnosticAnswerReview {
  question_id: string;
  concept: string;
  selected_option_id: string | null;
  correct_option_id: string;
  is_correct: boolean;
  explanation: string;
  title: string;
}

export interface DiagnosticBktDelta {
  concept: string;
  concept_title: string;
  prior_mastery: number;
  posterior_mastery: number;
  delta: number;
  is_correct: boolean;
  irt_ability: number;
  confidence: number;
  classification: string;
  barrier_status: 'accessible' | 'sealed';
  barrier_reason?: string | null;
}

export interface BarrierRecalculationDetail {
  wing_id: string;
  name: string;
  concept: string;
  status: 'accessible' | 'sealed';
  is_ready: boolean;
  was_sealed: boolean;
  is_sealed: boolean;
  dissolved: boolean;
  reason?: string | null;
  required_mastery?: Record<string, number> | null;
}

export interface DiagnosticSubmissionResponse {
  assessment_id: string;
  student_id: string;
  total_questions: number;
  answered_count: number;
  correct_count: number;
  score_percentage: number;
  reviews: DiagnosticAnswerReview[];
  concept_breakdown: Record<string, boolean>;
  bkt_updates?: DiagnosticBktDelta[];
  barrier_recalculations?: Record<string, BarrierRecalculationDetail>;
  learner_profile?: LearnerProfile | null;
  world_state?: WorldState | null;
  deliberation?: DeliberationResponse | null;
  threshold_crossed?: boolean;
  unlocked_wing?: string | null;
  status: string;
  evaluation_timestamp: string;
}


