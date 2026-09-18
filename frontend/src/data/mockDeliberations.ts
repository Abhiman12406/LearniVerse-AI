import { DeliberationResponse, BktTelemetryTrace } from '../types/agents';

export const DEFAULT_DELIBERATION_B: DeliberationResponse = {
  student_id: 'learner_b',
  timestamp: new Date().toISOString(),
  llm_mode: 'deterministic_fallback',
  final_decision: {
    action: 'REMEDIATE',
    concept: 'stack',
    difficulty: 'easy',
    reason:
      "Deterministic Guardrail Overrule: Proposed concept 'Recursion' requires Stack ≥ 70%. Current mastery is only 38%. Overruled proposal to REMEDIATE STACK.",
    certified: false,
    guardrail_status: 'OVERRULED',
    overruled: true,
    overruling_reason:
      "Deterministic Guardrail Overrule: Proposed concept 'Recursion' requires Stack ≥ 70%. Current mastery is only 38%. Overruled proposal to REMEDIATE STACK.",
  },
  world_instructions: {
    wing_barriers: {
      array_station: {
        wing_id: 'array_station',
        name: 'Array Station',
        concept: 'array',
        status: 'accessible',
        reason: null,
        coordinates: [12.0, 0.0, -20.0],
      },
      linked_list_lab: {
        wing_id: 'linked_list_lab',
        name: 'Linked List Lab',
        concept: 'linked_list',
        status: 'accessible',
        reason: null,
        coordinates: [24.0, 0.0, 0.0],
      },
      stack_lab: {
        wing_id: 'stack_lab',
        name: 'Stack Lab',
        concept: 'stack',
        status: 'accessible',
        reason: null,
        coordinates: [12.0, 0.0, 20.0],
      },
      recursion_lab: {
        wing_id: 'recursion_lab',
        name: 'Recursion Lab',
        concept: 'recursion',
        status: 'sealed',
        reason: 'Requires Stack ≥ 70% | Current: 38%',
        coordinates: [-24.0, 0.0, 0.0],
      },
      tree_lab: {
        wing_id: 'tree_lab',
        name: 'Tree Lab',
        concept: 'tree',
        status: 'sealed',
        reason: 'Requires Recursion ≥ 70% | Current: 20%',
        coordinates: [-12.0, 0.0, 20.0],
      },
    },
    recommended_station: 'stack_lab',
    conduits_target_wing: 'stack_lab',
    active_mission: {
      mission_id: 'stack_intro_01',
      name: 'Stack Remediation Protocol',
      title: 'Defend the Call Stack',
      objective: 'Master Last-In-First-Out (LIFO) stack operations before attempting nested call stacks.',
    },
    mentor_guidance: {
      greeting: 'Greetings, Alex.',
      diagnostic_summary:
        'Prerequisite Gap detected: Stack mastery (38%) is below the 70% threshold required to enter Recursion Wing.',
      recommended_station: 'Stack Lab',
      feynman_analogy:
        'Think of a stack like a spring-loaded cafeteria plate dispenser. You can only take the top plate off, just like nested function calls in memory!',
      conceptual_bridge:
        'Mastering stack push/pop will unlock the Recursion Lab by guaranteeing you can trace call stack activation records.',
    },
  },
  traces: [
    {
      agent_name: 'Context Agent',
      stage: 'context_retrieval',
      timestamp: new Date(Date.now() - 250).toISOString(),
      duration_ms: 14.2,
      status: 'SUCCESS',
      input_summary: {
        student_id: 'learner_b',
        session_id: 'sess_live_b',
        target_concept: 'recursion',
      },
      output_summary: {
        mastery_map: { array: 0.9, linked_list: 0.7, stack: 0.38, recursion: 0.2, tree: 0.1 },
        active_wing: 'atrium',
        persona_type: 'Remedial - Stack Deficient',
      },
      reasoning: 'Retrieved learner knowledge profile. Identified active deficit in Stack concept (0.38).',
    },
    {
      agent_name: 'Diagnostic Agent',
      stage: 'prerequisite_diagnosis',
      timestamp: new Date(Date.now() - 200).toISOString(),
      duration_ms: 18.6,
      status: 'SUCCESS',
      input_summary: {
        target_concept: 'recursion',
        mastery_map: { stack: 0.38, recursion: 0.2 },
      },
      output_summary: {
        prerequisite_chain: ['array', 'linked_list', 'stack', 'recursion'],
        blocking_concept: 'stack',
        deficit_delta: -0.32,
        is_ready: false,
      },
      reasoning: 'Neo4j DAG evaluation: Concept "recursion" depends on "stack" (threshold 0.70). Current mastery is 0.38.',
    },
    {
      agent_name: 'Planner Agent',
      stage: 'pedagogical_planning',
      timestamp: new Date(Date.now() - 140).toISOString(),
      duration_ms: 36.4,
      status: 'SUCCESS',
      input_summary: {
        proposed_target: 'recursion',
        diagnostic_flag: 'blocking_prerequisite_present',
      },
      output_summary: {
        proposal_action: 'REMEDIATE',
        proposal_concept: 'stack',
        proposal_difficulty: 'easy',
      },
      reasoning: 'Planner prioritized resolving the upstream prerequisite gap in Stack before advancing student to call stacks.',
    },
    {
      agent_name: 'Validator Agent',
      stage: 'guardrail_validation',
      timestamp: new Date(Date.now() - 80).toISOString(),
      duration_ms: 9.1,
      status: 'OVERRULED',
      input_summary: {
        proposed_action: 'PRACTICE',
        proposed_concept: 'recursion',
        required_prerequisite: 'stack',
        required_threshold: 0.7,
        current_mastery: 0.38,
      },
      output_summary: {
        guardrail_status: 'OVERRULED',
        certified: false,
        enforced_action: 'REMEDIATE',
        enforced_concept: 'stack',
        enforced_difficulty: 'easy',
      },
      reasoning:
        "Deterministic Guardrail Overrule: Proposed concept 'Recursion' requires Stack ≥ 70%. Current mastery is only 38%. Overruled proposal to REMEDIATE STACK.",
    },
    {
      agent_name: 'Game Agent',
      stage: 'world_adaptation',
      timestamp: new Date(Date.now() - 30).toISOString(),
      duration_ms: 22.8,
      status: 'SUCCESS',
      input_summary: {
        enforced_action: 'REMEDIATE',
        enforced_concept: 'stack',
      },
      output_summary: {
        recommended_station: 'stack_lab',
        conduits_target_wing: 'stack_lab',
        wing_barrier_states: { recursion_lab: 'sealed', stack_lab: 'accessible' },
      },
      reasoning: 'Configured light conduits to point towards Stack Lab. Maintained collision barrier on Recursion Wing archway.',
    },
  ],
};

export const DEFAULT_DELIBERATION_A: DeliberationResponse = {
  student_id: 'learner_a',
  timestamp: new Date().toISOString(),
  llm_mode: 'deterministic_fallback',
  final_decision: {
    action: 'PRACTICE',
    concept: 'recursion',
    difficulty: 'hard',
    reason:
      "Certified: All DAG prerequisite constraints satisfied for 'Recursion'. Policy approves proposed pedagogical assignment.",
    certified: true,
    guardrail_status: 'CERTIFIED',
    overruled: false,
    overruling_reason: null,
  },
  world_instructions: {
    wing_barriers: {
      array_station: {
        wing_id: 'array_station',
        name: 'Array Station',
        concept: 'array',
        status: 'accessible',
        reason: null,
        coordinates: [12.0, 0.0, -20.0],
      },
      linked_list_lab: {
        wing_id: 'linked_list_lab',
        name: 'Linked List Lab',
        concept: 'linked_list',
        status: 'accessible',
        reason: null,
        coordinates: [24.0, 0.0, 0.0],
      },
      stack_lab: {
        wing_id: 'stack_lab',
        name: 'Stack Lab',
        concept: 'stack',
        status: 'accessible',
        reason: null,
        coordinates: [12.0, 0.0, 20.0],
      },
      recursion_lab: {
        wing_id: 'recursion_lab',
        name: 'Recursion Lab',
        concept: 'recursion',
        status: 'accessible',
        reason: null,
        coordinates: [-24.0, 0.0, 0.0],
      },
      tree_lab: {
        wing_id: 'tree_lab',
        name: 'Tree Lab',
        concept: 'tree',
        status: 'accessible',
        reason: null,
        coordinates: [-12.0, 0.0, 20.0],
      },
    },
    recommended_station: 'recursion_lab',
    conduits_target_wing: 'recursion_lab',
    active_mission: {
      mission_id: 'recursion_advanced_01',
      name: 'Nested Call Stack Simulation',
      title: 'Mastering the Recursive Call Stack',
      objective: 'Trace recursive base cases and memory activation records.',
    },
    mentor_guidance: {
      greeting: 'Welcome back, Dr. Elena.',
      diagnostic_summary:
        'All core prerequisites verified. Stack mastery at 84%. Ready for advanced Recursion call-stack challenges.',
      recommended_station: 'Recursion Lab',
      feynman_analogy:
        'Recursion is a function that mirrors itself until it hits the foundation of a base case.',
      conceptual_bridge:
        'Because your Stack mastery is above 70%, the Recursion Wing forcefield is dissolved and ready for exploration.',
    },
  },
  traces: [
    {
      agent_name: 'Context Agent',
      stage: 'context_retrieval',
      timestamp: new Date(Date.now() - 250).toISOString(),
      duration_ms: 11.2,
      status: 'SUCCESS',
      input_summary: {
        student_id: 'learner_a',
        session_id: 'sess_live_a',
        target_concept: 'recursion',
      },
      output_summary: {
        mastery_map: { array: 0.92, linked_list: 0.88, stack: 0.84, recursion: 0.72, tree: 0.65 },
        active_wing: 'atrium',
        persona_type: 'Advanced - Recursion Ready',
      },
      reasoning: 'Retrieved profile for Learner A. Stack mastery verified at 0.84.',
    },
    {
      agent_name: 'Diagnostic Agent',
      stage: 'prerequisite_diagnosis',
      timestamp: new Date(Date.now() - 200).toISOString(),
      duration_ms: 15.4,
      status: 'SUCCESS',
      input_summary: {
        target_concept: 'recursion',
        mastery_map: { stack: 0.84, recursion: 0.72 },
      },
      output_summary: {
        prerequisite_chain: ['array', 'linked_list', 'stack', 'recursion'],
        blocking_concept: null,
        deficit_delta: 0.14,
        is_ready: true,
      },
      reasoning: 'All prerequisites verified. Stack mastery (0.84) exceeds 0.70 requirement.',
    },
    {
      agent_name: 'Planner Agent',
      stage: 'pedagogical_planning',
      timestamp: new Date(Date.now() - 140).toISOString(),
      duration_ms: 28.1,
      status: 'SUCCESS',
      input_summary: {
        proposed_target: 'recursion',
        diagnostic_flag: 'prerequisites_met',
      },
      output_summary: {
        proposal_action: 'PRACTICE',
        proposal_concept: 'recursion',
        proposal_difficulty: 'hard',
      },
      reasoning: 'Generated advanced challenge proposal for Recursion Lab.',
    },
    {
      agent_name: 'Validator Agent',
      stage: 'guardrail_validation',
      timestamp: new Date(Date.now() - 80).toISOString(),
      duration_ms: 8.0,
      status: 'CERTIFIED',
      input_summary: {
        proposed_action: 'PRACTICE',
        proposed_concept: 'recursion',
        required_prerequisite: 'stack',
        required_threshold: 0.7,
        current_mastery: 0.84,
      },
      output_summary: {
        guardrail_status: 'CERTIFIED',
        certified: true,
        enforced_action: 'PRACTICE',
        enforced_concept: 'recursion',
        enforced_difficulty: 'hard',
      },
      reasoning:
        "Certified: All DAG prerequisite constraints satisfied for 'Recursion'. Policy approves proposed pedagogical assignment.",
    },
    {
      agent_name: 'Game Agent',
      stage: 'world_adaptation',
      timestamp: new Date(Date.now() - 30).toISOString(),
      duration_ms: 21.0,
      status: 'SUCCESS',
      input_summary: {
        enforced_action: 'PRACTICE',
        enforced_concept: 'recursion',
      },
      output_summary: {
        recommended_station: 'recursion_lab',
        conduits_target_wing: 'recursion_lab',
        wing_barrier_states: { recursion_lab: 'accessible', tree_lab: 'accessible' },
      },
      reasoning: 'Dissolved barrier on Recursion Lab archway. Routed guidance conduits to Recursion portal.',
    },
  ],
};

export const DEFAULT_BKT_TRACE_B: BktTelemetryTrace = {
  concept: 'stack',
  prior: 0.38,
  correct: true,
  difficulty: 'easy',
  p_guess: 0.60,
  p_slip: 0.11,
  p_transit: 0.05,
  numerator: 0.3382,
  denominator: 0.7102,
  p_obs: 0.476,
  posterior: 0.50,
  delta: 0.12,
  threshold_crossed: false,
  timestamp: new Date().toISOString(),
};

export const DEFAULT_BKT_TRACE_A: BktTelemetryTrace = {
  concept: 'stack',
  prior: 0.84,
  correct: true,
  difficulty: 'hard',
  p_guess: 0.40,
  p_slip: 0.14,
  p_transit: 0.05,
  numerator: 0.7224,
  denominator: 0.7864,
  p_obs: 0.919,
  posterior: 0.92,
  delta: 0.08,
  threshold_crossed: false,
  timestamp: new Date().toISOString(),
};
