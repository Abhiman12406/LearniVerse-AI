"""Curriculum Prerequisite Knowledge Graph Service (Neo4j with NetworkX Fallback).

Conforms strictly to AGENTS.md §1, §9, §11, §13, §34 and BACKEND_LOGIC.md §5, §8, §20:
- §1.0 & §11.0: Neo4j primary graph database representation of (:Concept)-[:PREREQUISITE_OF]->(:Concept)
- §5.0: Resilient NetworkX Directed Acyclic Graph (DAG) in-memory fallback
- §5.1: Prerequisite Gate: Eligible(c) = 1[min(M_p) >= tau_p]
- §8.0: Prerequisite Gap: Gap_c = max(0, tau_c - M_c)
- §8.0: Downstream Importance Priority Weight: Priority_c = Gap_c * W_c
"""

import logging
from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import BaseModel
import networkx as nx

from backend.app.services.config_service import config_service
from backend.app.db.neo4j import neo4j_client, Neo4jClient

logger = logging.getLogger("learniverse.knowledge_graph")


class PrerequisiteEvaluation(BaseModel):
    concept: str
    status: str  # "accessible" | "sealed"
    is_ready: bool
    missing_prerequisite: Optional[str] = None
    required_threshold: Optional[float] = None
    current_mastery: Optional[float] = None
    reason: Optional[str] = None


class KnowledgeGraphService:
    """Manages curriculum DAG, prerequisite threshold validation, and topological gap weighting

    using Neo4j as the primary knowledge graph with seamless NetworkX fallback.
    """

    def __init__(self, client: Optional[Neo4jClient] = None):
        self._neo4j = client or neo4j_client
        self._dag = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        """Constructs NetworkX DAG from config parameters for offline resilience."""
        self._dag.clear()
        nodes = ["array", "linked_list", "stack", "recursion", "tree"]
        for node in nodes:
            self._dag.add_node(node)

        edges_cfg = config_service.get_nested("prerequisites", "edges", [
            {"source": "array", "target": "linked_list", "threshold": 0.60},
            {"source": "linked_list", "target": "stack", "threshold": 0.50},
            {"source": "stack", "target": "recursion", "threshold": 0.70},
            {"source": "recursion", "target": "tree", "threshold": 0.70},
        ])

        for edge in edges_cfg:
            self._dag.add_edge(
                edge["source"],
                edge["target"],
                threshold=float(edge.get("threshold", 0.70)),
            )

        assert nx.is_directed_acyclic_graph(self._dag), "Curriculum graph must be a strict DAG"

    @property
    def is_neo4j_active(self) -> bool:
        """Returns True if Neo4j driver is active and reachable."""
        return bool(self._neo4j and self._neo4j.is_connected)

    def get_engine_status(self) -> Dict[str, Any]:
        """Returns runtime telemetry regarding Neo4j and Knowledge Graph engine status."""
        neo4j_online = self.is_neo4j_active
        return {
            "active_engine": "neo4j" if neo4j_online else "networkx_fallback",
            "neo4j_connected": neo4j_online,
            "neo4j_uri": self._neo4j.uri if self._neo4j else None,
            "neo4j_database": self._neo4j.database if self._neo4j else None,
            "node_count": len(self._dag.nodes()),
            "edge_count": len(self._dag.edges()),
            "topological_order": self.get_topological_sort(),
        }

    def seed_neo4j(self) -> bool:
        """Seeds Neo4j database with curriculum concepts, prerequisites, questions, and missions."""
        if self._neo4j:
            return self._neo4j.seed_curriculum_graph()
        return False

    def get_prerequisites(self, concept: str) -> Dict[str, float]:
        """Returns direct prerequisites of concept with required thresholds.

        Queries Neo4j Cypher first; falls back to NetworkX DAG if Neo4j is offline.
        """
        if self.is_neo4j_active:
            res = self._neo4j.get_prerequisites(concept)
            if res is not None:
                return res

        if not self._dag.has_node(concept):
            return {}
        prereqs = {}
        for pred in self._dag.predecessors(concept):
            edge_data = self._dag.get_edge_data(pred, concept)
            prereqs[pred] = edge_data.get("threshold", 0.70)
        return prereqs

    def get_transitive_prerequisites(self, concept: str) -> List[str]:
        """Returns all ancestral prerequisite concepts in topological order."""
        if self.is_neo4j_active:
            res = self._neo4j.get_transitive_prerequisites(concept)
            if res is not None:
                return res

        if not self._dag.has_node(concept):
            return []
        ancestors = nx.ancestors(self._dag, concept)
        top_order = list(nx.topological_sort(self._dag))
        return [c for c in top_order if c in ancestors]

    def get_downstream_weight(self, concept: str) -> float:
        """Calculates downstream topological dependency weight W_c (§8, §11).

        Concepts blocking more downstream curriculum nodes have larger W_c.
        """
        if self.is_neo4j_active:
            cnt = self._neo4j.get_downstream_dependents_count(concept)
            if cnt is not None:
                return 1.0 + cnt * 0.5

        if not self._dag.has_node(concept):
            return 1.0
        descendants = nx.descendants(self._dag, concept)
        return 1.0 + len(descendants) * 0.5

    def evaluate_concept(
        self, concept: str, mastery: Any
    ) -> PrerequisiteEvaluation:
        """Evaluate readiness for a target concept based on learner mastery and Knowledge Graph prerequisites."""
        prereqs = self.get_prerequisites(concept)
        if not prereqs:
            return PrerequisiteEvaluation(
                concept=concept,
                status="accessible",
                is_ready=True,
            )

        # Handle either MasteryMap or dict
        if hasattr(mastery, "model_dump"):
            mastery_dict = mastery.model_dump()
        elif hasattr(mastery, "__dict__") and not isinstance(mastery, dict):
            mastery_dict = vars(mastery)
        else:
            mastery_dict = dict(mastery)

        for req_concept, threshold in prereqs.items():
            current_val = float(mastery_dict.get(req_concept, 0.0))
            if current_val < threshold:
                req_title = req_concept.replace("_", " ").title()
                reason = (
                    f"Requires {req_title} ≥ {int(threshold * 100)}% | "
                    f"Current: {int(current_val * 100)}%"
                )
                return PrerequisiteEvaluation(
                    concept=concept,
                    status="sealed",
                    is_ready=False,
                    missing_prerequisite=req_concept,
                    required_threshold=threshold,
                    current_mastery=current_val,
                    reason=reason,
                )

        return PrerequisiteEvaluation(
            concept=concept,
            status="accessible",
            is_ready=True,
        )

    def evaluate_all(self, mastery: Any) -> Dict[str, PrerequisiteEvaluation]:
        """Evaluate readiness across all concepts in the Knowledge Graph."""
        nodes = self.get_topological_sort() if self._dag.nodes() else ["array", "linked_list", "stack", "recursion", "tree"]
        return {concept: self.evaluate_concept(concept, mastery) for concept in nodes}

    def is_eligible(
        self, concept: str, mastery_map: Dict[str, float]
    ) -> Tuple[bool, Optional[str], Optional[float], Optional[float]]:
        """Evaluates Prerequisite Gate (§5.1):

        Eligible(c) = 1[min_{p in Pred(c)} M_p >= tau_p]
        Returns (is_ready, blocking_concept, required_threshold, current_mastery)
        """
        eval_res = self.evaluate_concept(concept, mastery_map)
        return eval_res.is_ready, eval_res.missing_prerequisite, eval_res.required_threshold, eval_res.current_mastery

    def compute_gap(self, concept: str, current_mastery: float) -> float:
        """Calculates gap to threshold (§8):

        Gap_c = max(0, tau_c - M_c)
        """
        tau_c = float(config_service.get_nested("prerequisites", "default_threshold", 0.70))
        return max(0.0, round(tau_c - current_mastery, 4))

    def compute_priority(self, concept: str, current_mastery: float) -> float:
        """Calculates remediation priority (§8):

        Priority_c = Gap_c * W_c
        """
        gap = self.compute_gap(concept, current_mastery)
        weight = self.get_downstream_weight(concept)
        return round(gap * weight, 4)

    def get_topological_sort(self) -> List[str]:
        return list(nx.topological_sort(self._dag))

    def get_full_graph(self) -> Dict[str, Dict[str, float]]:
        """Returns dict of rules {concept: {prereq: threshold}}."""
        if self.is_neo4j_active:
            res = self._neo4j.get_curriculum_dag()
            if res and "prerequisite_rules" in res:
                return res["prerequisite_rules"]

        rules = {}
        for node in self._dag.nodes():
            rules[node] = self.get_prerequisites(node)
        return rules

    def get_graph_visualization(self) -> Dict[str, Any]:
        """Returns node and link data suitable for graph rendering in UI/telemetry."""
        if self.is_neo4j_active:
            res = self._neo4j.get_graph_schema()
            if res is not None:
                return {
                    "engine": "neo4j",
                    **res,
                }

        # Generate from NetworkX DAG
        nodes = []
        links = []
        wing_mapping = {
            "array": "array_station",
            "linked_list": "linked_list_lab",
            "stack": "stack_lab",
            "recursion": "recursion_lab",
            "tree": "tree_lab",
        }
        for n in self._dag.nodes():
            nodes.append({
                "id": n,
                "labels": ["Concept"],
                "properties": {
                    "id": n,
                    "name": n.replace("_", " ").title(),
                    "wing_id": wing_mapping.get(n, n),
                },
            })

        for u, v, data in self._dag.edges(data=True):
            links.append({
                "source": u,
                "target": v,
                "type": "PREREQUISITE_OF",
                "properties": {
                    "threshold": data.get("threshold", 0.70),
                },
            })

        return {
            "engine": "networkx_fallback",
            "nodes": nodes,
            "links": links,
            "node_count": len(nodes),
            "edge_count": len(links),
        }


# Global singleton instance
knowledge_graph_service = KnowledgeGraphService()
