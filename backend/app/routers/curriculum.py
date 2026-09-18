"""Curriculum, DAG, 2PL IRT, and Spaced Repetition Router.

Conforms strictly to BACKEND_LOGIC.md:
- §4: 2PL Item Response Theory (IRT) & Fisher Information Selection
- §5: NetworkX Curriculum DAG Representation
- §8-§11: ZPD Gaussian-gain Planning & Task Utility
- §13: Feynman Technique Trigger Condition
- §15: SuperMemo-2 (SM-2) Spaced Repetition Schedule
- §18: Network-Aware Modality Delivery
- §25: External Parameters Inspection
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.app.models.evidence import NetworkContext
from backend.app.services.config_service import config_service
from backend.app.services.feynman_service import feynman_service
from backend.app.services.irt_service import irt_service
from backend.app.services.knowledge_graph_service import knowledge_graph_service
from backend.app.services.learner_service import learner_service
from backend.app.services.network_delivery_service import network_delivery_service
from backend.app.services.sm2_service import sm2_service
from backend.app.services.zpd_planner_service import zpd_planner_service

router = APIRouter(prefix="/api/curriculum", tags=["Curriculum & Evidence Math"])


@router.get("/dag")
def get_curriculum_dag() -> Dict[str, Any]:
    """
    Returns Curriculum Directed Acyclic Graph (DAG) state (§5 & §11).
    Powered by Neo4j Knowledge Graph with resilient NetworkX fallback.
    Includes topological sort, edge thresholds, downstream dependency weights W_c, and engine telemetry.
    """
    engine_status = knowledge_graph_service.get_engine_status()
    topological_order = knowledge_graph_service.get_topological_sort()
    full_rules = knowledge_graph_service.get_full_graph()
    downstream_weights = {
        node: knowledge_graph_service.get_downstream_weight(node)
        for node in topological_order
    }

    return {
        "engine": engine_status["active_engine"],
        "neo4j_connected": engine_status["neo4j_connected"],
        "nodes": topological_order,
        "topological_order": topological_order,
        "prerequisite_rules": full_rules,
        "downstream_weights": downstream_weights,
        "is_acyclic": True,
    }


@router.get("/graph/status")
def get_graph_engine_status() -> Dict[str, Any]:
    """
    Returns Knowledge Graph database engine status (Neo4j vs NetworkX fallback) and metrics.
    """
    return knowledge_graph_service.get_engine_status()


@router.post("/graph/seed")
def seed_graph_database() -> Dict[str, Any]:
    """
    Seeds Neo4j graph database with the curriculum DAG, questions, and missions.
    """
    status = knowledge_graph_service.get_engine_status()
    if not status["neo4j_connected"]:
        return {
            "success": False,
            "message": "Neo4j is not connected or reachable. Curriculum is currently running on resilient NetworkX fallback.",
            "status": status,
        }

    seeded = knowledge_graph_service.seed_neo4j()
    return {
        "success": seeded,
        "message": "Neo4j curriculum knowledge graph seeded successfully." if seeded else "Failed to seed Neo4j graph.",
        "status": knowledge_graph_service.get_engine_status(),
    }


@router.get("/graph/visualization")
def get_graph_visualization() -> Dict[str, Any]:
    """
    Returns graph nodes and relationships for visual rendering in telemetry or HUD.
    """
    return knowledge_graph_service.get_graph_visualization()


@router.get("/prerequisites/{concept}")
def get_concept_prerequisites(concept: str) -> Dict[str, Any]:
    """
    Returns direct and transitive prerequisites for a concept queried from the Knowledge Graph.
    """
    direct = knowledge_graph_service.get_prerequisites(concept)
    transitive = knowledge_graph_service.get_transitive_prerequisites(concept)
    weight = knowledge_graph_service.get_downstream_weight(concept)

    return {
        "concept": concept,
        "direct_prerequisites": direct,
        "transitive_prerequisites": transitive,
        "downstream_dependency_weight": weight,
    }


@router.get("/adaptive-item")
def get_adaptive_item(
    concept: str = Query(..., description="Concept to assess (e.g. stack, recursion)"),
    theta: float = Query(0.0, description="Learner IRT ability estimate θ in [-4, 4]"),
) -> Dict[str, Any]:
    """
    Selects the optimal assessment item maximizing Fisher Information I_i(θ) (§4.2).
    """
    best_item = irt_service.select_item_max_information(theta, concept)
    prob_correct = irt_service.probability_2pl(theta, best_item.a_discrimination, best_item.b_difficulty)
    fisher_info = irt_service.fisher_information(theta, best_item.a_discrimination, best_item.b_difficulty)

    return {
        "selected_item": best_item.model_dump(),
        "learner_theta": theta,
        "probability_correct": round(prob_correct, 3),
        "fisher_information": round(fisher_info, 4),
        "selection_strategy": "max_fisher_information",
    }


@router.get("/zpd-tasks")
def get_zpd_tasks(
    concept: str = Query("stack", description="Target concept"),
    student_id: Optional[str] = Query("learner_b", description="Learner ID"),
) -> Dict[str, Any]:
    """
    Evaluates candidate tasks using Gaussian ZPD gain and Prerequisite-Aware Utility (§8-§11).
    """
    profile = learner_service.get_learner_profile(student_id or "learner_b")
    if not profile:
        profile = learner_service.get_active_learner_profile()

    mastery = float(profile.mastery_map.model_dump().get(concept, 0.5))
    theta = float(profile.ability_irt.get(concept, 0.0))

    is_ready, _, _, _ = knowledge_graph_service.is_eligible(concept, profile.mastery_map.model_dump())
    optimal_task, all_candidates = zpd_planner_service.select_optimal_task(
        concept=concept,
        mastery=mastery,
        theta=theta,
        eligible=is_ready,
    )

    return {
        "concept": concept,
        "student_id": profile.learner_id,
        "current_mastery": mastery,
        "current_theta": theta,
        "is_eligible": is_ready,
        "optimal_task": optimal_task.model_dump(),
        "candidate_tasks": [c.model_dump() for c in all_candidates],
    }


@router.get("/review-schedule/{student_id}")
def get_review_schedule(student_id: str) -> Dict[str, Any]:
    """
    Returns SuperMemo-2 (SM-2) spaced repetition schedule for a learner (§15).
    """
    profile = learner_service.get_learner_profile(student_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Learner '{student_id}' not found")

    due_concepts = []
    schedules = {}

    for concept, record_data in profile.sm2_records.items():
        record = sm2_service.create_initial_record(concept)
        if isinstance(record_data, dict):
            for k, v in record_data.items():
                if hasattr(record, k):
                    setattr(record, k, v)
        schedules[concept] = record.model_dump()
        if sm2_service.is_due_for_review(record):
            due_concepts.append(concept)

    return {
        "student_id": student_id,
        "schedules": schedules,
        "due_concepts": due_concepts,
    }


@router.get("/feynman-trigger")
def check_feynman_trigger(
    student_id: str = Query("learner_b"),
    concept: str = Query("stack"),
    recent_errors: int = Query(2),
    hints_used: int = Query(1),
    misconception_detected: bool = Query(True),
) -> Dict[str, Any]:
    """
    Evaluates evidence-based Feynman Technique Trigger Condition (§13).
    """
    return feynman_service.evaluate_trigger_condition(
        student_id=student_id,
        concept=concept,
        recent_errors=recent_errors,
        hints_used=hints_used,
        misconception_detected=misconception_detected,
    )


@router.post("/delivery-config")
def get_delivery_config(context: NetworkContext) -> Dict[str, Any]:
    """
    Calculates network-aware modality and client rendering configuration (§18).
    Guarantees d(Mastery) / d(NetworkQuality) = 0.
    """
    return network_delivery_service.select_modality(context)


@router.get("/parameters")
def get_system_parameters() -> Dict[str, Any]:
    """
    Returns external calibrated parameters loaded from parameters.yaml (§25).
    """
    return config_service.get_all()
