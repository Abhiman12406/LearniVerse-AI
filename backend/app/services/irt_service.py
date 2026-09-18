"""2-Parameter Logistic (2PL) Item Response Theory (IRT) Service.

Conforms strictly to BACKEND_LOGIC.md §4:
- §4.0 2PL probability formula P(X_i = 1 | θ, a_i, b_i)
- §4.2 Adaptive Question Selection via Maximum Fisher Information I_i(θ)
- §4.3 Ability estimation θ_hat via bounded log-likelihood optimization
"""

import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy.optimize import minimize_scalar

from backend.app.models.evidence import ItemParameter
from backend.app.services.config_service import config_service


# Curated items with calibrated 2PL discrimination (a) and difficulty (b) parameters
CALIBRATED_ITEM_BANK: List[ItemParameter] = [
    # Array Station items
    ItemParameter(item_id="ARR_01", concept_id="array", a_discrimination=1.1, b_difficulty=-1.5, dimension="recall"),
    ItemParameter(item_id="ARR_02", concept_id="array", a_discrimination=1.4, b_difficulty=-0.5, dimension="understanding"),
    ItemParameter(item_id="ARR_03", concept_id="array", a_discrimination=1.6, b_difficulty=0.8, dimension="application"),
    ItemParameter(item_id="ARR_04", concept_id="array", a_discrimination=1.8, b_difficulty=1.8, dimension="problem_solving"),

    # Linked List Lab items
    ItemParameter(item_id="LL_01", concept_id="linked_list", a_discrimination=1.2, b_difficulty=-1.2, dimension="recall"),
    ItemParameter(item_id="LL_02", concept_id="linked_list", a_discrimination=1.5, b_difficulty=-0.2, dimension="understanding"),
    ItemParameter(item_id="LL_03", concept_id="linked_list", a_discrimination=1.7, b_difficulty=0.9, dimension="application"),
    ItemParameter(item_id="LL_04", concept_id="linked_list", a_discrimination=1.9, b_difficulty=1.9, dimension="problem_solving"),

    # Stack Lab items
    ItemParameter(item_id="STK_01", concept_id="stack", a_discrimination=1.2, b_difficulty=-1.0, dimension="recall"),
    ItemParameter(item_id="STK_02", concept_id="stack", a_discrimination=1.6, b_difficulty=0.0, dimension="understanding"),
    ItemParameter(item_id="STK_03", concept_id="stack", a_discrimination=1.8, b_difficulty=1.0, dimension="application"),
    ItemParameter(item_id="STK_04", concept_id="stack", a_discrimination=2.0, b_difficulty=2.2, dimension="problem_solving"),

    # Recursion Lab items
    ItemParameter(item_id="REC_01", concept_id="recursion", a_discrimination=1.3, b_difficulty=-0.5, dimension="recall"),
    ItemParameter(item_id="REC_02", concept_id="recursion", a_discrimination=1.7, b_difficulty=0.5, dimension="understanding"),
    ItemParameter(item_id="REC_03", concept_id="recursion", a_discrimination=1.9, b_difficulty=1.5, dimension="application"),
    ItemParameter(item_id="REC_04", concept_id="recursion", a_discrimination=2.2, b_difficulty=2.5, dimension="problem_solving"),

    # Tree Lab items
    ItemParameter(item_id="TREE_01", concept_id="tree", a_discrimination=1.4, b_difficulty=0.0, dimension="recall"),
    ItemParameter(item_id="TREE_02", concept_id="tree", a_discrimination=1.8, b_difficulty=1.0, dimension="understanding"),
    ItemParameter(item_id="TREE_03", concept_id="tree", a_discrimination=2.0, b_difficulty=2.0, dimension="application"),
]


class IRTService:
    """Provides 2PL IRT scoring, adaptive question selection, and ability estimation."""

    def __init__(self, item_bank: Optional[List[ItemParameter]] = None):
        self._items = item_bank or CALIBRATED_ITEM_BANK
        # In-memory student response history: {student_id: {concept: [(a, b, correct)]}}
        self._student_responses: Dict[str, Dict[str, List[Tuple[float, float, bool]]]] = {}

    def record_response(
        self,
        student_id: str,
        concept: str,
        item_id: str,
        correct: bool,
        difficulty_level: str = "medium",
    ):
        """Records a learner item response for continuous ability estimation."""
        if student_id not in self._student_responses:
            self._student_responses[student_id] = {}
        if concept not in self._student_responses[student_id]:
            self._student_responses[student_id][concept] = []

        item = self.get_item(item_id)
        if item:
            a = item.a_discrimination
            b = item.b_difficulty
        else:
            diff_map = {"easy": -1.0, "medium": 0.0, "hard": 1.0}
            b = diff_map.get(difficulty_level.lower(), 0.0)
            a = 1.2

        self._student_responses[student_id][concept].append((a, b, correct))

    def probability_2pl(self, theta: float, a: float, b: float) -> float:
        """Alias for probability conforming to BACKEND_LOGIC.md §4."""
        return self.probability(theta, a, b)

    def select_item_max_information(self, theta: float, concept: str) -> ItemParameter:
        """Alias for select_adaptive_item."""
        item = self.select_adaptive_item(concept, theta)
        if not item:
            return ItemParameter(item_id=f"{concept}_default", concept_id=concept, a_discrimination=1.2, b_difficulty=0.0)
        return item

    def probability(self, theta: float, a: float, b: float) -> float:
        """
        Calculates 2PL probability P(X_i = 1 | θ, a_i, b_i):
        P = 1 / (1 + exp(-a * (θ - b)))
        """
        logit = -a * (theta - b)
        # Numerical stability clipping
        logit = float(np.clip(logit, -30.0, 30.0))
        return 1.0 / (1.0 + math.exp(logit))

    def fisher_information(self, theta: float, a: float, b: float) -> float:
        """
        Calculates 2PL Fisher Information:
        I_i(θ) = a_i^2 * P_i(θ) * (1 - P_i(θ))
        Peaks at θ = b_i where question provides maximum diagnostic information.
        """
        p = self.probability(theta, a, b)
        return (a ** 2) * p * (1.0 - p)

    def select_adaptive_item(
        self,
        concept: str,
        theta: float,
        exclude_item_ids: Optional[List[str]] = None,
        target_dimension: Optional[str] = None,
    ) -> Optional[ItemParameter]:
        """
        Selects item maximizing Fisher Information I_i(θ) subject to concept & constraints (§4.2).
        i* = argmax I_i(θ)
        """
        exclude_set = set(exclude_item_ids or [])
        candidates = [
            item for item in self._items
            if item.concept_id == concept and item.item_id not in exclude_set
        ]

        if target_dimension:
            dim_candidates = [item for item in candidates if item.dimension == target_dimension]
            if dim_candidates:
                candidates = dim_candidates

        if not candidates:
            # Fallback to any item of that concept
            candidates = [item for item in self._items if item.concept_id == concept]
            if not candidates:
                return None

        # Choose item with highest Fisher information at learner ability θ
        best_item = max(
            candidates,
            key=lambda it: self.fisher_information(theta, it.a_discrimination, it.b_difficulty),
        )
        return best_item

    def estimate_ability(
        self,
        responses_or_student_id: Any,
        concept_or_prior: Any = "stack",
        prior_theta: float = 0.0,
    ) -> float:
        """
        Estimates learner ability θ_hat using bounded log-likelihood optimization (§4.3).
        Constraints: -4.0 <= θ <= 4.0
        Supports estimate_ability(student_id, concept) and estimate_ability(responses, prior_theta).
        """
        if isinstance(responses_or_student_id, str):
            student_id = responses_or_student_id
            concept = concept_or_prior if isinstance(concept_or_prior, str) else "stack"
            responses = self._student_responses.get(student_id, {}).get(concept, [])
            if not responses:
                return prior_theta
        elif isinstance(responses_or_student_id, list):
            responses = responses_or_student_id
            if isinstance(concept_or_prior, (int, float)):
                prior_theta = float(concept_or_prior)
        else:
            return prior_theta

        if not responses:
            return prior_theta

        theta_min = float(config_service.get_nested("irt", "theta_min", -4.0))
        theta_max = float(config_service.get_nested("irt", "theta_max", 4.0))

        def neg_log_likelihood(th: float) -> float:
            nll = 0.0
            for a, b, correct in responses:
                p = self.probability(th, a, b)
                p = np.clip(p, 1e-6, 1.0 - 1e-6)
                if correct:
                    nll -= math.log(p)
                else:
                    nll -= math.log(1.0 - p)
            # Regularize slightly towards prior to avoid extreme divergence on sparse strings
            nll += 0.1 * ((th - prior_theta) ** 2)
            return nll

        res = minimize_scalar(
            neg_log_likelihood,
            bounds=(theta_min, theta_max),
            method="bounded",
        )
        if res.success:
            return round(float(np.clip(res.x, theta_min, theta_max)), 2)
        return round(float(np.clip(prior_theta, theta_min, theta_max)), 2)

    def get_item(self, item_id: str) -> Optional[ItemParameter]:
        for it in self._items:
            if it.item_id == item_id:
                return it
        return None


irt_service = IRTService()
