"""Validator Agent: Stage 4 of the LangGraph Deliberation Pipeline.

Strictly enforces deterministic DAG prerequisite guardrails. If an unready concept
(e.g., Recursion when Stack mastery is below 70%) is proposed, the Validator Agent
overrules the proposal to REMEDIATE STACK, guaranteeing pedagogical safety.
"""

import time
from datetime import datetime, timezone
from typing import Any, Dict
from backend.app.agents.state import AgentState
from backend.app.models.agents import AgentTraceItem, FinalDecision, ValidationResult
from backend.app.models.learner import MasteryMap
from backend.app.services.knowledge_graph_service import knowledge_graph_service


def validator_agent_node(state: AgentState) -> AgentState:
    """Execute Validator Agent node in LangGraph workflow."""
    start_time = time.perf_counter()

    proposal = state.get("planner_proposal") or {
        "action": "PRACTICE",
        "concept": "stack",
        "difficulty": "medium",
        "reason": "Default proposal",
    }
    mastery_dict = state.get("mastery_map") or {}
    mastery = MasteryMap(**mastery_dict)

    proposed_concept = proposal.get("concept", "stack").lower()
    proposed_action = proposal.get("action", "PRACTICE").upper()
    proposed_diff = proposal.get("difficulty", "medium").lower()
    proposed_reason = proposal.get("reason", "")

    # Check deterministic prerequisite evaluation using Knowledge Graph
    eval_res = knowledge_graph_service.evaluate_concept(proposed_concept, mastery)

    if not eval_res.is_ready:
        # VIOLATION DETECTED: Guardrail MUST overrule the proposal
        guardrail_status = "OVERRULED"
        certified = False
        overruled = True
        missing_req = eval_res.missing_prerequisite or "stack"
        req_title = missing_req.replace("_", " ").title()
        concept_title = proposed_concept.replace("_", " ").title()
        cur_pct = int((eval_res.current_mastery or 0.0) * 100)
        req_pct = int((eval_res.required_threshold or 0.70) * 100)

        enforced_action = "REMEDIATE"
        enforced_concept = missing_req
        enforced_difficulty = "easy"
        overruling_reason = (
            f"Deterministic Guardrail Overrule: Proposed concept '{concept_title}' requires "
            f"{req_title} ≥ {req_pct}%. Current mastery is only {cur_pct}%. "
            f"Overruled proposal to REMEDIATE {missing_req.upper()}."
        )
        justification = overruling_reason
        checked_prereq = missing_req
        req_thresh = eval_res.required_threshold
        cur_mastery = eval_res.current_mastery
        final_reason = overruling_reason
    else:
        # COMPLIANT: Guardrail certifies the proposal
        guardrail_status = "CERTIFIED"
        certified = True
        overruled = False
        enforced_action = proposed_action
        enforced_concept = proposed_concept
        enforced_difficulty = proposed_diff
        overruling_reason = None
        concept_title = proposed_concept.replace("_", " ").title()
        justification = (
            f"Certified: All DAG prerequisite constraints satisfied for '{concept_title}'. "
            "Policy approves proposed pedagogical assignment."
        )
        checked_prereq = None
        req_thresh = None
        cur_mastery = None
        final_reason = proposed_reason or justification

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    val_result = ValidationResult(
        guardrail_status=guardrail_status,
        certified=certified,
        enforced_action=enforced_action,
        enforced_concept=enforced_concept,
        enforced_difficulty=enforced_difficulty,
        justification=justification,
        checked_prerequisite=checked_prereq,
        required_threshold=req_thresh,
        current_mastery=cur_mastery,
    )

    final_decision = FinalDecision(
        action=enforced_action,
        concept=enforced_concept,
        difficulty=enforced_difficulty,
        reason=final_reason,
        certified=certified,
        guardrail_status=guardrail_status,
        overruled=overruled,
        overruling_reason=overruling_reason,
    )

    input_summary = {
        "proposed_concept": proposed_concept,
        "proposed_action": proposed_action,
        "proposed_difficulty": proposed_diff,
    }
    output_summary = {
        "guardrail_status": guardrail_status,
        "certified": certified,
        "enforced_action": enforced_action,
        "enforced_concept": enforced_concept,
        "enforced_difficulty": enforced_difficulty,
        "overruled": overruled,
    }

    trace_item = AgentTraceItem(
        agent_name="Validator Agent",
        stage="guardrail_validation",
        timestamp=datetime.now(timezone.utc).isoformat(),
        duration_ms=elapsed_ms,
        status=guardrail_status,
        input_summary=input_summary,
        output_summary=output_summary,
        reasoning=justification,
    )

    existing_traces = list(state.get("traces") or [])
    existing_traces.append(trace_item.model_dump())

    return {
        **state,
        "validation_result": val_result.model_dump(),
        "final_decision": final_decision.model_dump(),
        "traces": existing_traces,
    }
