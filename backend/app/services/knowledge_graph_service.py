"""NetworkX Curriculum Prerequisite DAG and Knowledge Graph Service.

Conforms strictly to BACKEND_LOGIC.md §5, §8, §20:
- §5.0 NetworkX Directed Acyclic Graph (DAG) representation
- §5.1 Prerequisite Gate: Eligible(c) = 1[min(M_p) >= tau_p]
- §8.0 Prerequisite Gap: Gap_c = max(0, tau_c - M_c)
- §8.0 Downstream Importance Priority Weight: Priority_c = Gap_c * W_c
"""

from typing import Dict, List, Optional, Tuple
import networkx as nx

from backend.app.services.config_service import config_service


class KnowledgeGraphService:
    """Manages curriculum DAG, prerequisite threshold validation, and topological gap weighting."""

    def __init__(self):
        self._dag = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        """Constructs NetworkX DAG from config parameters."""
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

    def get_prerequisites(self, concept: str) -> Dict[str, float]:
        """Returns direct prerequisites of concept with required thresholds."""
        if not self._dag.has_node(concept):
            return {}
        prereqs = {}
        for pred in self._dag.predecessors(concept):
            edge_data = self._dag.get_edge_data(pred, concept)
            prereqs[pred] = edge_data.get("threshold", 0.70)
        return prereqs

    def get_transitive_prerequisites(self, concept: str) -> List[str]:
        """Returns all ancestral prerequisite concepts in topological order."""
        if not self._dag.has_node(concept):
            return []
        ancestors = nx.ancestors(self._dag, concept)
        # Sort in topological order
        top_order = list(nx.topological_sort(self._dag))
        return [c for c in top_order if c in ancestors]

    def get_downstream_weight(self, concept: str) -> float:
        """
        Calculates downstream topological dependency weight W_c (§8, §11).
        Concepts blocking more downstream curriculum nodes have larger W_c.
        """
        if not self._dag.has_node(concept):
            return 1.0
        descendants = nx.descendants(self._dag, concept)
        # Base weight 1.0 + 0.5 for each downstream concept dependent on this node
        return 1.0 + len(descendants) * 0.5

    def is_eligible(self, concept: str, mastery_map: Dict[str, float]) -> Tuple[bool, Optional[str], Optional[float], Optional[float]]:
        """
        Evaluates Prerequisite Gate (§5.1):
        Eligible(c) = 1[min_{p in Pred(c)} M_p >= tau_p]
        Returns (is_ready, blocking_concept, required_threshold, current_mastery)
        """
        prereqs = self.get_prerequisites(concept)
        if not prereqs:
            return True, None, None, None

        for p_concept, tau_p in prereqs.items():
            current_m = float(mastery_map.get(p_concept, 0.0))
            if current_m < tau_p:
                return False, p_concept, tau_p, current_m

        return True, None, None, None

    def compute_gap(self, concept: str, current_mastery: float) -> float:
        """
        Calculates gap to threshold (§8):
        Gap_c = max(0, tau_c - M_c)
        """
        # Default passing standard is 0.70 unless specified in incoming edge
        tau_c = float(config_service.get_nested("prerequisites", "default_threshold", 0.70))
        return max(0.0, round(tau_c - current_mastery, 4))

    def compute_priority(self, concept: str, current_mastery: float) -> float:
        """
        Calculates remediation priority (§8):
        Priority_c = Gap_c * W_c
        """
        gap = self.compute_gap(concept, current_mastery)
        weight = self.get_downstream_weight(concept)
        return round(gap * weight, 4)

    def get_topological_sort(self) -> List[str]:
        return list(nx.topological_sort(self._dag))

    def get_full_graph(self) -> Dict[str, Dict[str, float]]:
        """Returns dict of rules {concept: {prereq: threshold}} for backward compatibility."""
        rules = {}
        for node in self._dag.nodes():
            rules[node] = self.get_prerequisites(node)
        return rules


knowledge_graph_service = KnowledgeGraphService()
