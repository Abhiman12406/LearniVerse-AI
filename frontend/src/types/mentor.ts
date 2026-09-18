export interface FeynmanExplanation {
  concept: string;
  target_prerequisite_of?: string | null;
  analogy: string;
  conceptual_bridge: string;
  hardware_software_context: string;
  prerequisite_gap?: string | null;
}

export interface MentorQuestion {
  id: string;
  label: string;
  answer: string;
}

export interface MentorGuidance {
  learner_id: string;
  learner_name: string;
  persona_type: string;
  status: 'remediation_required' | 'advanced_readiness';
  focus_concept: string;
  recommended_station: string;
  greeting: string;
  diagnostic_summary: string;
  feynman_explanation: FeynmanExplanation;
  interactive_questions: MentorQuestion[];
  action_recommendation: string;
}
