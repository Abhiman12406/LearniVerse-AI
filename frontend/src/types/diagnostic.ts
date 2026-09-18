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

export interface DiagnosticAnswerReview {
  question_id: string;
  concept: string;
  selected_option_id: string | null;
  correct_option_id: string;
  is_correct: boolean;
  explanation: string;
  title: string;
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
  status: string;
  evaluation_timestamp: string;
}
