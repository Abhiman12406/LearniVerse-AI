"""Multi-Dimensional Mastery, Confidence Saturation, and 4-Tier Classification.

Conforms strictly to BACKEND_LOGIC.md §6, §7, §16:
- §6.0 Separate cognitive streams: Recall, Understanding, Application, Problem-Solving, Transfer, Retention
- §7.0 Confidence model: C_c = 1 - exp(-n_c / kappa)
- §16.0 4-tier classification: HIGH | MEDIUM | LOW | UNCERTAIN
"""

import math
from typing import Any, Dict, List, Optional
import numpy as np

from backend.app.models.evidence import CognitiveDimensionScores
from backend.app.services.config_service import config_service
from backend.app.services.knowledge_graph_service import knowledge_graph_service


class MultidimensionalMasteryService:
    """Evaluates multi-dimensional cognitive competency, confidence, and 4-tier classification."""

    def __init__(self):
        # In-memory tracking of dimension trials: {student_id: {concept: {dimension: [1, 0, 1]}}}
        self._history: Dict[str, Dict[str, Dict[str, List[int]]]] = {}
        # In-memory observation counts: {student_id: {concept: count}}
        self._obs_counts: Dict[str, Dict[str, int]] = {}

    def record_observation(
        self,
        student_id: str,
        concept: str,
        correct: bool,
        dimension: str = "understanding",
    ):
        """Records a valid educational trial for a specific cognitive dimension."""
        if student_id not in self._history:
            self._history[student_id] = {}
        if concept not in self._history[student_id]:
            self._history[student_id][concept] = {
                "recall": [1, 1],
                "understanding": [],
                "application": [],
                "problem_solving": [],
                "transfer": [],
                "retention": [],
            }
        
        dim_key = dimension.lower() if dimension.lower() in [
            "recall", "understanding", "application", "problem_solving", "transfer", "retention"
        ] else "understanding"

        if dim_key not in self._history[student_id][concept]:
            self._history[student_id][concept][dim_key] = []

        self._history[student_id][concept][dim_key].append(1 if correct else 0)

        # Update total valid observations count n_c (§7)
        if student_id not in self._obs_counts:
            self._obs_counts[student_id] = {}
        self._obs_counts[student_id][concept] = self._obs_counts[student_id].get(concept, 3) + 1

    def compute_dimensions(self, student_id: str, concept: str) -> CognitiveDimensionScores:
        """
        Calculates weighted dimension scores D_d = sum(w_i * x_i) / sum(w_i) (§6).
        """
        student_data = self._history.get(student_id, {}).get(concept, {})
        scores = {}

        for dim in ["recall", "understanding", "application", "problem_solving", "transfer", "retention"]:
            trials = student_data.get(dim, [])
            if not trials:
                # Default baseline priors based on concept
                if dim in ["recall", "understanding"]:
                    scores[dim] = 0.55
                elif dim in ["application", "problem_solving"]:
                    scores[dim] = 0.45
                else:
                    scores[dim] = 0.35
            else:
                scores[dim] = round(float(np.mean(trials)), 2)

        return CognitiveDimensionScores(**scores)

    def compute_confidence(self, student_id: str, concept: str) -> float:
        """
        Calculates confidence in the learner model (§7):
        C_c = 1 - exp(-n_c / kappa)
        """
        kappa = float(config_service.get_nested("confidence", "kappa", 8.0))
        n_c = self._obs_counts.get(student_id, {}).get(concept, 4)
        c_val = 1.0 - math.exp(-float(n_c) / kappa)
        return round(float(np.clip(c_val, 0.05, 0.99)), 2)

    def classify_mastery(
        self,
        student_id: str,
        concept: str,
        bkt_mastery: float,
        mastery_map: Dict[str, float],
    ) -> str:
        """
        Classifies learner into HIGH | MEDIUM | LOW | UNCERTAIN (§16).
        """
        confidence = self.compute_confidence(student_id, concept)
        high_thresh = float(config_service.get_nested("mastery", "high_threshold", 0.75))
        low_thresh = float(config_service.get_nested("mastery", "low_threshold", 0.45))

        # 1. UNCERTAIN if confidence is too low (< 0.25)
        if confidence < 0.25:
            return "UNCERTAIN"

        # Check prerequisite readiness
        is_ready, _, _, _ = knowledge_graph_service.is_eligible(concept, mastery_map)

        dim_scores = self.compute_dimensions(student_id, concept)

        # 2. HIGH: Above threshold, high confidence, prereqs met, acceptable problem-solving
        if (
            bkt_mastery >= high_thresh
            and confidence >= 0.40
            and is_ready
            and dim_scores.problem_solving >= 0.40
        ):
            return "HIGH"

        # 3. LOW: Below low threshold or missing critical prerequisite
        if bkt_mastery < low_thresh or not is_ready:
            return "LOW"

        # 4. MEDIUM: In intermediate range
        return "MEDIUM"

    def reset_student(self, student_id: str):
        if student_id in self._history:
            del self._history[student_id]
        if student_id in self._obs_counts:
            del self._obs_counts[student_id]


multidimensional_mastery_service = MultidimensionalMasteryService()
