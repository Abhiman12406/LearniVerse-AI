"""Game Agent: Stage 5 of the LangGraph Deliberation Pipeline.

Translates the certified/overruled pedagogical decision into concrete 3D virtual classroom
instructions: wing barrier forcefield states, recommended station, pulsing conduit targets,
active mission assignment, and AI Mentor guidance.
"""

import time
from datetime import datetime, timezone
from typing import Any, Dict
from backend.app.agents.state import AgentState
from backend.app.models.agents import AgentTraceItem, WorldInstructions
from backend.app.models.learner import MasteryMap
from backend.app.services.learner_service import WING_DEFINITIONS, learner_service
from backend.app.services.mentor_service import mentor_service
from backend.app.services.prerequisite_service import prerequisite_service

STATION_MAP = {
    "array": "array_station",
    "linked_list": "linked_list_lab",
    "stack": "stack_lab",
    "recursion": "recursion_lab",
    "tree": "tree_lab",
}

MISSION_CATALOG = {
    "stack": {
        "easy": {
            "mission_id": "stack_diagnostic_mission",
            "name": "Stack LIFO Fundamentals",
            "title": "Operation Spring-Tray: Master LIFO Invariant",
            "objective": "Understand push/pop operations and Last-In First-Out mechanics.",
        },
        "medium": {
            "mission_id": "stack_diagnostic_mission",
            "name": "Interleaved Push & Pop Trace",
            "title": "Buffer Traversal & Pointer Maintenance",
            "objective": "Trace internal stack buffer across interleaved mutations.",
        },
        "hard": {
            "mission_id": "stack_diagnostic_mission",
            "name": "Stack Boundary Defense",
            "title": "Underflow & Overflow Hardening",
            "objective": "Guard against buffer exceptions and simulate recursive call frames.",
        },
    },
    "recursion": {
        "easy": {
            "mission_id": "recursion_call_stack_01",
            "name": "Base Case Foundation",
            "title": "The Call Stack Anchor",
            "objective": "Identify base case termination preventing stack overflow.",
        },
        "medium": {
            "mission_id": "recursion_call_stack_02",
            "name": "Call Frame Accumulation",
            "title": "Tracing Activation Records",
            "objective": "Track activation records accumulating on the physical call stack.",
        },
        "hard": {
            "mission_id": "recursion_call_stack_03",
            "name": "Call Stack Unwinding",
            "title": "Return Cascade & Frame Dissolution",
            "objective": "Execute cumulative frame pop transitions across nested recursive returns.",
        },
    },
}


def game_agent_node(state: AgentState) -> AgentState:
    """Execute Game Agent node in LangGraph workflow."""
    start_time = time.perf_counter()

    student_id = state.get("student_id") or "learner_b"
    decision = state.get("final_decision") or {
        "action": "REMEDIATE",
        "concept": "stack",
        "difficulty": "easy",
        "reason": "Default fallback",
    }
    mastery_dict = state.get("mastery_map") or {}
    mastery = MasteryMap(**mastery_dict)

    concept = decision.get("concept", "stack")
    difficulty = decision.get("difficulty", "easy")

    # 1. Determine wing barrier forcefield states
    wing_barriers: Dict[str, Dict[str, Any]] = {}
    for wid, meta in WING_DEFINITIONS.items():
        w_concept = meta["concept"]
        eval_res = prerequisite_service.evaluate_concept(w_concept, mastery)
        wing_barriers[wid] = {
            "wing_id": wid,
            "name": meta["name"],
            "concept": w_concept,
            "status": eval_res.status,
            "reason": eval_res.reason,
            "coordinates": meta["coordinates"],
        }

    # 2. Recommended station and conduit guidance target
    recommended_station = STATION_MAP.get(concept, "stack_lab")
    conduits_target_wing = recommended_station

    # 3. Active mission selection
    concept_missions = MISSION_CATALOG.get(concept, MISSION_CATALOG["stack"])
    active_mission = concept_missions.get(difficulty, concept_missions["easy"])

    # 4. Contextual AI Mentor guidance
    guidance_resp = mentor_service.get_guidance(student_id)
    mentor_guidance = {
        "greeting": guidance_resp.greeting,
        "diagnostic_summary": guidance_resp.diagnostic_summary,
        "recommended_station": recommended_station,
        "feynman_analogy": guidance_resp.feynman_explanation.analogy,
        "conceptual_bridge": guidance_resp.feynman_explanation.conceptual_bridge,
    }

    world_instructions = WorldInstructions(
        wing_barriers=wing_barriers,
        recommended_station=recommended_station,
        conduits_target_wing=conduits_target_wing,
        active_mission=active_mission,
        mentor_guidance=mentor_guidance,
    )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    input_summary = {
        "enforced_concept": concept,
        "enforced_action": decision.get("action"),
        "difficulty": difficulty,
    }
    output_summary = {
        "recommended_station": recommended_station,
        "conduits_target_wing": conduits_target_wing,
        "active_mission_id": active_mission.get("mission_id"),
        "recursion_wing_status": wing_barriers.get("recursion_lab", {}).get("status"),
    }
    reasoning = (
        f"Transformed validated decision into cybernetic classroom instructions: "
        f"Target Station='{recommended_station}', Conduits directed to '{conduits_target_wing}', "
        f"Active Mission='{active_mission.get('name')}', "
        f"Recursion Wing status: {wing_barriers.get('recursion_lab', {}).get('status').upper()}."
    )

    trace_item = AgentTraceItem(
        agent_name="Game Agent",
        stage="world_adaptation",
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
        "world_instructions": world_instructions.model_dump(),
        "traces": existing_traces,
    }
