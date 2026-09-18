"""Context Agent: Stage 1 of the LangGraph Deliberation Pipeline.

Gathers authoritative learner state, knowledge mastery scores, persona type,
active spatial coordinates, and curriculum prerequisite graph DAG.
"""

import time
from datetime import datetime, timezone
from typing import Dict
from backend.app.agents.state import AgentState
from backend.app.models.agents import AgentTraceItem
from backend.app.services.learner_service import learner_service
from backend.app.services.knowledge_graph_service import knowledge_graph_service


def context_agent_node(state: AgentState) -> AgentState:
    """Execute Context Agent node in LangGraph workflow."""
    start_time = time.perf_counter()
    student_id = state.get("student_id") or learner_service.get_active_learner_id()

    profile = learner_service.get_learner_profile(student_id)
    if not profile:
        profile = learner_service.get_active_learner_profile()
        student_id = profile.learner_id

    mastery_map = profile.mastery_map.model_dump()
    prereq_graph = knowledge_graph_service.get_full_graph()

    target_concept = state.get("target_concept") or profile.learning_state.primary_focus_concept

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    input_summary = {
        "student_id": student_id,
        "target_concept_requested": state.get("target_concept"),
    }
    output_summary = {
        "persona_type": profile.persona_type,
        "primary_focus_concept": target_concept,
        "active_wing": profile.active_wing,
        "mastery_scores": {k: f"{int(v*100)}%" for k, v in mastery_map.items()},
    }
    reasoning = (
        f"Retrieved authoritative profile for '{profile.name}' ({profile.persona_type}). "
        f"Mastery vector: Array={int(mastery_map.get('array',0)*100)}%, "
        f"Linked List={int(mastery_map.get('linked_list',0)*100)}%, "
        f"Stack={int(mastery_map.get('stack',0)*100)}%, "
        f"Recursion={int(mastery_map.get('recursion',0)*100)}%, "
        f"Tree={int(mastery_map.get('tree',0)*100)}%. "
        f"Loaded curriculum DAG with {len(prereq_graph)} concept nodes."
    )

    trace_item = AgentTraceItem(
        agent_name="Context Agent",
        stage="context_gathering",
        timestamp=datetime.now(timezone.utc).isoformat(),
        duration_ms=elapsed_ms,
        status="SUCCESS",
        input_summary=input_summary,
        output_summary=output_summary,
        reasoning=reasoning,
    )

    existing_traces = list(state.get("traces") or [])
    existing_traces.append(trace_item.model_dump())

    return {
        **state,
        "student_id": student_id,
        "target_concept": target_concept,
        "learner_profile": profile.model_dump(),
        "mastery_map": mastery_map,
        "prerequisite_graph": prereq_graph,
        "traces": existing_traces,
    }
