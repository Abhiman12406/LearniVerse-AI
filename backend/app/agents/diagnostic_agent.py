"""Diagnostic Agent: Stage 2 of the LangGraph Deliberation Pipeline.

Analyzes prerequisite readiness across the curriculum DAG, detects prerequisite gaps,
and establishes authoritative pedagogical diagnostic facts for the Planner.
"""

import time
from datetime import datetime, timezone
from typing import Any, Dict
from backend.app.agents.state import AgentState
from backend.app.models.agents import AgentTraceItem
from backend.app.models.learner import MasteryMap
from backend.app.services.prerequisite_service import prerequisite_service


def diagnostic_agent_node(state: AgentState) -> AgentState:
    """Execute Diagnostic Agent node in LangGraph workflow."""
    start_time = time.perf_counter()

    mastery_dict = state.get("mastery_map") or {}
    mastery = MasteryMap(**mastery_dict)
    target_concept = state.get("target_concept") or "stack"

    # Evaluate readiness across all concepts in curriculum
    all_evals = prerequisite_service.evaluate_all(mastery)
    eval_dict: Dict[str, Any] = {c: e.model_dump() for c, e in all_evals.items()}

    # Target concept evaluation
    target_eval = eval_dict.get(target_concept, {})
    is_target_ready = target_eval.get("is_ready", True)
    blocking_prereq = target_eval.get("missing_prerequisite")

    # Overall prerequisite gap identification
    unmet_gaps = [
        f"{c}: {e['reason']}" for c, e in eval_dict.items() if not e["is_ready"]
    ]

    # Categorize diagnostic status
    stack_val = mastery.stack
    recursion_ready = eval_dict.get("recursion", {}).get("is_ready", False)

    if not recursion_ready and stack_val < 0.70:
        diagnostic_status = "remediation_required"
        primary_gap = f"Stack mastery ({int(stack_val*100)}%) is below 70% threshold required for Recursion Wing."
    elif recursion_ready and mastery.recursion >= 0.70:
        diagnostic_status = "advanced"
        primary_gap = None
    else:
        diagnostic_status = "progressing"
        primary_gap = None

    from backend.app.services.knowledge_graph_service import knowledge_graph_service
    focus_c = blocking_prereq or target_concept
    focus_val = float(mastery_dict.get(focus_c, 0.5))
    gap_val = knowledge_graph_service.compute_gap(focus_c, focus_val)
    priority_val = knowledge_graph_service.compute_priority(focus_c, focus_val)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    input_summary = {
        "target_concept": target_concept,
        "mastery_vector": {k: f"{int(v*100)}%" for k, v in mastery_dict.items()},
    }
    output_summary = {
        "diagnostic_status": diagnostic_status,
        "is_target_ready": is_target_ready,
        "blocking_prerequisite": blocking_prereq,
        "unmet_gaps_count": len(unmet_gaps),
        "primary_gap": primary_gap,
        "topological_gap": gap_val,
        "remediation_priority": priority_val,
    }
    reasoning = (
        f"Diagnostic evaluation complete. Identified {len(unmet_gaps)} prerequisite gap(s). "
        f"Target concept '{target_concept}' readiness: {is_target_ready}. "
        f"Topological priority weight: {priority_val} (gap: {gap_val}). "
        f"Pedagogical status categorized as '{diagnostic_status}'. "
        + (f"Critical barrier: {primary_gap}" if primary_gap else "All foundational prerequisites satisfied.")
    )

    trace_item = AgentTraceItem(
        agent_name="Diagnostic Agent",
        stage="diagnostic_analysis",
        timestamp=datetime.now(timezone.utc).isoformat(),
        duration_ms=elapsed_ms,
        status="SUCCESS",
        input_summary=input_summary,
        output_summary=output_summary,
        reasoning=reasoning,
    )

    existing_traces = list(state.get("traces") or [])
    existing_traces.append(trace_item.model_dump())

    diagnostic_result = {
        "status": diagnostic_status,
        "evaluations": eval_dict,
        "target_concept": target_concept,
        "is_target_ready": is_target_ready,
        "blocking_prerequisite": blocking_prereq,
        "primary_gap": primary_gap,
        "unmet_gaps": unmet_gaps,
    }

    return {
        **state,
        "diagnostic_evaluation": diagnostic_result,
        "traces": existing_traces,
    }
