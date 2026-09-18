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
    "array": {
        "easy": {
            "mission_id": "array_indexing_01",
            "name": "Array Indexing & Random Access",
            "title": "Operation Hardware-Probe: O(1) Memory Offsets",
            "objective": "Identify 0-indexed contiguous memory slots and direct address calculations.",
            "learning_objectives": [
                "Understand contiguous memory allocation and zero-based indexing",
                "Verify O(1) direct memory pointer dereferencing",
                "Detect hardware boundary bounds violations",
            ],
        },
        "medium": {
            "mission_id": "array_scan_02",
            "name": "Linear Search & Traversal",
            "title": "Operation Bus-Scan: O(n) Traversal Limits",
            "objective": "Scan memory slots sequentially and measure traversal complexity.",
            "learning_objectives": [
                "Execute sequential probe traversal across memory bays",
                "Compare worst-case O(n) scan against O(1) random access",
            ],
        },
        "hard": {
            "mission_id": "array_bounds_03",
            "name": "Buffer Boundary Security",
            "title": "ArrayIndexOutOfBounds Hardening",
            "objective": "Guard contiguous memory against buffer over-read segmentation faults.",
            "learning_objectives": [
                "Prevent memory leaks and invalid index traps",
                "Simulate dynamic resize amortized bounds",
            ],
        },
    },
    "linked_list": {
        "easy": {
            "mission_id": "linked_list_traversal_01",
            "name": "Pointer Chain Traversal",
            "title": "Operation Node-Link: Traversal & Next References",
            "objective": "Traverse heap-allocated nodes by following explicit next pointer references.",
            "learning_objectives": [
                "Follow HEAD pointer references through node chains terminating at NULL",
                "Differentiate contiguous array indices from dynamic heap pointers",
            ],
        },
        "medium": {
            "mission_id": "linked_list_mutation_02",
            "name": "Dynamic Node Insertion & Relinking",
            "title": "Operation Pointer-Splice: O(1) Head Insertion",
            "objective": "Insert nodes and re-wire successor references without shifting memory.",
            "learning_objectives": [
                "Splice incoming pointers without data duplication",
                "Maintain integrity of the terminating NULL pointer",
            ],
        },
        "hard": {
            "mission_id": "linked_list_cycle_03",
            "name": "Cycle Detection & Fast-Slow Pointers",
            "title": "Operation Floyd-Probe: Cycle Invariants",
            "objective": "Identify cyclic reference loops using two-pointer algorithms.",
            "learning_objectives": [
                "Detect infinite pointer loops",
                "Guard dynamic heap chains against dangling references",
            ],
        },
    },
    "stack": {
        "easy": {
            "mission_id": "stack_diagnostic_mission",
            "name": "Stack LIFO Fundamentals",
            "title": "Operation Spring-Tray: Master LIFO Invariant",
            "objective": "Understand push/pop operations and Last-In First-Out mechanics.",
            "learning_objectives": [
                "Master Last-In, First-Out (LIFO) extraction order",
                "Trace interleaved PUSH and POP memory transitions",
                "Understand Capacity Overflow and Underflow boundary conditions",
                "Bridge stack manipulation directly to Call Stack activation records",
            ],
        },
        "medium": {
            "mission_id": "stack_diagnostic_mission",
            "name": "Interleaved Push & Pop Trace",
            "title": "Buffer Traversal & Pointer Maintenance",
            "objective": "Trace internal stack buffer across interleaved mutations.",
            "learning_objectives": [
                "Trace interleaved PUSH and POP memory transitions",
                "Understand Capacity Overflow and Underflow boundary conditions",
            ],
        },
        "hard": {
            "mission_id": "stack_diagnostic_mission",
            "name": "Stack Boundary Defense",
            "title": "Underflow & Overflow Hardening",
            "objective": "Guard against buffer exceptions and simulate recursive call frames.",
            "learning_objectives": [
                "Understand structural boundary constraints and safety guards",
                "Bridge stack manipulation directly to Call Stack activation records",
            ],
        },
    },
    "recursion": {
        "easy": {
            "mission_id": "recursion_call_stack_01",
            "name": "Base Case Foundation",
            "title": "The Call Stack Anchor",
            "objective": "Identify base case termination preventing stack overflow.",
            "learning_objectives": [
                "Identify base case condition preventing infinite call accumulation",
                "Observe physical call stack frame allocation in real time",
            ],
        },
        "medium": {
            "mission_id": "recursion_call_stack_02",
            "name": "Call Frame Accumulation",
            "title": "Tracing Activation Records",
            "objective": "Track activation records accumulating on the physical call stack.",
            "learning_objectives": [
                "Observe stack frame expansion during recursive descent",
                "Calculate return values across ascending activation frames",
            ],
        },
        "hard": {
            "mission_id": "recursion_call_stack_03",
            "name": "Call Stack Unwinding",
            "title": "Return Cascade & Frame Dissolution",
            "objective": "Execute cumulative frame pop transitions across nested recursive returns.",
            "learning_objectives": [
                "Execute frame dissolution cascading upward to the root call",
                "Synthesize composite factorial results from base return",
            ],
        },
    },
    "tree": {
        "easy": {
            "mission_id": "tree_bst_search_01",
            "name": "Binary Search Tree Invariant",
            "title": "Operation Bifurcation: Left < Root < Right",
            "objective": "Navigate binary search paths eliminating half the search space at each step.",
            "learning_objectives": [
                "Enforce Left < Root < Right ordering invariant",
                "Execute O(log n) binary search traversal",
            ],
        },
        "medium": {
            "mission_id": "tree_inorder_02",
            "name": "In-Order Traversal & Monotonic Sorting",
            "title": "Operation Monotonic-Stream: In-Order Walk",
            "objective": "Traverse BST nodes in left-root-right order producing a sorted sequence.",
            "learning_objectives": [
                "Execute recursive left-root-right in-order traversal",
                "Produce monotonic sorted streams from hierarchical nodes",
            ],
        },
        "hard": {
            "mission_id": "tree_balance_03",
            "name": "Tree Balance & Degeneracy Prevention",
            "title": "Operation Height-Defense: AVL Balancing",
            "objective": "Detect tree skew and restore logarithmic depth invariants.",
            "learning_objectives": [
                "Prevent O(n) degenerate linked list degradation",
                "Balance subtree heights dynamically",
            ],
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
