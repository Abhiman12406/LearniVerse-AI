/**
 * TypeScript interfaces for the 5-Agent LangGraph Deliberation Pipeline & Telemetry.
 */

export interface AgentTraceItem {
  agent_name: 'Context Agent' | 'Diagnostic Agent' | 'Planner Agent' | 'Validator Agent' | 'Game Agent' | string;
  stage: string;
  timestamp: string;
  duration_ms: number;
  status: 'SUCCESS' | 'CERTIFIED' | 'OVERRULED' | 'FALLBACK' | string;
  input_summary: Record<string, unknown>;
  output_summary: Record<string, unknown>;
  reasoning: string;
}

export interface FinalDecision {
  action: 'LEARN' | 'PRACTICE' | 'REMEDIATE' | 'CHALLENGE' | 'REVIEW' | string;
  concept: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  reason: string;
  certified: boolean;
  guardrail_status: 'CERTIFIED' | 'OVERRULED' | string;
  overruled: boolean;
  overruling_reason?: string | null;
}

export interface WorldInstructions {
  wing_barriers: Record<string, {
    wing_id: string;
    name: string;
    concept: string;
    status: 'accessible' | 'sealed';
    reason?: string | null;
    coordinates: [number, number, number];
  }>;
  recommended_station: string;
  conduits_target_wing: string;
  active_mission: {
    mission_id: string;
    name: string;
    title?: string;
    objective: string;
  };
  mentor_guidance: {
    greeting: string;
    diagnostic_summary: string;
    recommended_station: string;
    feynman_analogy: string;
    conceptual_bridge: string;
  };
}

export interface DeliberationResponse {
  student_id: string;
  timestamp: string;
  llm_mode: 'gemini' | 'deterministic_fallback' | string;
  final_decision: FinalDecision;
  world_instructions: WorldInstructions;
  traces: AgentTraceItem[];
}
