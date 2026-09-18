"""Zone of Proximal Development (ZPD) Gaussian-Gain Planner Service.

Conforms strictly to BACKEND_LOGIC.md §8, §9, §10, §11, §12:
- §8.0 Gaussian ZPD Factor: ZPD(a) = exp(-(d_a - theta)^2 / (2 * sigma^2))
- §9.0 Expected Gain: Delta M_c(a) = base_gain * (1 - M_c) * ZPD(a)
- §10.0 Prerequisite-Aware Task Utility: Utility(a, c) = Delta M_c(a) * W_c - lambda * Cost(a)
- §11.0 Optimal Action Selection: a* = argmax_{a in A} Utility(a, c)
- §12.0 POMDP Reward Tracking: R(s, a) = alpha * Delta M + beta * Transfer - gamma * Cost
"""

import math
from typing import Dict, List, Optional, Tuple

DEFAULT_ZPD_SIGMA = 0.50
DEFAULT_UTILITY_COST_LAMBDA = 0.10

from backend.app.models.evidence import CandidateTask
from backend.app.services.config_service import config_service
from backend.app.services.knowledge_graph_service import knowledge_graph_service


class ZpdPlannerService:
    """Computes ZPD suitability, task utilities, and selects the optimal pedagogical action."""

    def __init__(self):
        pass

    def get_difficulty_for_level(self, level: str) -> float:
        """Maps categorical difficulty string to IRT scale b in [-4, 4]."""
        diff_map = config_service.get_nested("zpd", "difficulty_map", {
            "easy": -1.0,
            "medium": 0.0,
            "hard": 1.0,
        })
        return float(diff_map.get(level.lower(), 0.0))

    def calculate_zpd_factor(self, difficulty_b: float, theta: float, sigma: Optional[float] = None) -> float:
        """
        Calculates Gaussian Zone of Proximal Development factor (§8):
        ZPD(a) = exp(-(d_a - theta)^2 / (2 * sigma^2))
        Maximal when item difficulty matches learner ability (d_a == theta).
        """
        if sigma is None:
            sigma = float(config_service.get_nested("zpd", "sigma", DEFAULT_ZPD_SIGMA))
        if sigma <= 0:
            sigma = 0.50

        diff_sq = (difficulty_b - theta) ** 2
        denom = 2.0 * (sigma ** 2)
        zpd = math.exp(-diff_sq / denom)
        return round(float(zpd), 4)

    def calculate_expected_gain(
        self,
        mastery: float,
        zpd_factor: float,
        base_gain: Optional[float] = None,
    ) -> float:
        """
        Calculates expected mastery increase (§9):
        Delta M_c(a) = base_gain * (1 - M_c) * ZPD(a)
        """
        if base_gain is None:
            base_gain = float(config_service.get_nested("zpd", "base_gain", 0.15))

        remaining_headroom = max(0.0, 1.0 - mastery)
        gain = base_gain * remaining_headroom * zpd_factor
        return round(float(gain), 4)

    def calculate_utility(
        self,
        expected_gain: float,
        prerequisite_weight: float,
        cost: float,
        lambda_cost: Optional[float] = None,
    ) -> float:
        """
        Calculates net task utility (§10):
        Utility(a, c) = Delta M_c(a) * W_c - lambda * Cost(a)
        """
        if lambda_cost is None:
            lambda_cost = float(config_service.get_nested("zpd", "utility_cost_lambda", DEFAULT_UTILITY_COST_LAMBDA))

        utility = (expected_gain * prerequisite_weight) - (lambda_cost * cost)
        return round(float(utility), 4)

    def generate_candidate_tasks(
        self,
        concept: str,
        mastery: float,
        theta: float,
    ) -> List[CandidateTask]:
        """
        Generates candidate educational activities with evaluated ZPD, gain, and utility (§10, §11).
        """
        w_c = knowledge_graph_service.get_downstream_weight(concept)

        candidates_meta = [
            {
                "task_id": f"{concept}_diagnostic_quiz",
                "task_type": "quiz",
                "difficulty_b": max(-3.0, min(3.0, theta)),  # adaptive match
                "cost": 0.08,
                "reason_template": "Targeted adaptive quiz matching current IRT ability.",
            },
            {
                "task_id": f"{concept}_foundation_lab",
                "task_type": "3d_mission",
                "difficulty_b": self.get_difficulty_for_level("easy"),
                "cost": 0.15,
                "reason_template": "Scaffolded 3D spatial laboratory mission for core mechanics.",
            },
            {
                "task_id": f"{concept}_standard_challenge",
                "task_type": "3d_mission",
                "difficulty_b": self.get_difficulty_for_level("medium"),
                "cost": 0.18,
                "reason_template": "Applied structural challenge testing operational comprehension.",
            },
            {
                "task_id": f"{concept}_advanced_challenge",
                "task_type": "3d_mission",
                "difficulty_b": self.get_difficulty_for_level("hard"),
                "cost": 0.25,
                "reason_template": "High-order mastery synthesis and edge-case challenge.",
            },
            {
                "task_id": f"{concept}_feynman_session",
                "task_type": "feynman",
                "difficulty_b": max(-0.5, theta * 0.8),
                "cost": 0.22,
                "reason_template": "Active verbal Feynman technique for deep conceptual grounding.",
            },
            {
                "task_id": f"{concept}_code_trace",
                "task_type": "trace",
                "difficulty_b": self.get_difficulty_for_level("medium"),
                "cost": 0.14,
                "reason_template": "Step-by-step execution trace targeting problem solving.",
            },
        ]

        evaluated_tasks: List[CandidateTask] = []
        for meta in candidates_meta:
            diff_b = meta["difficulty_b"]
            cost = meta["cost"]
            zpd = self.calculate_zpd_factor(diff_b, theta)
            gain = self.calculate_expected_gain(mastery, zpd)
            utility = self.calculate_utility(gain, w_c, cost)

            evaluated_tasks.append(
                CandidateTask(
                    task_id=meta["task_id"],
                    task_type=meta["task_type"],
                    concept_id=concept,
                    difficulty_b=diff_b,
                    expected_gain=gain,
                    zpd_factor=zpd,
                    prerequisite_weight=w_c,
                    cost=cost,
                    utility=utility,
                    reason=meta["reason_template"],
                )
            )

        return evaluated_tasks

    def select_optimal_task(
        self,
        concept: str,
        mastery: float,
        theta: float,
        eligible: bool = True,
    ) -> Tuple[CandidateTask, List[CandidateTask]]:
        """
        Determines the optimal learning task via argmax Utility(a, c) (§11).
        If ineligible (blocked by prerequisites), automatically biases towards remediation.
        """
        candidates = self.generate_candidate_tasks(concept, mastery, theta)
        # Sort descending by utility
        candidates.sort(key=lambda t: t.utility, reverse=True)

        if not eligible:
            # If not eligible, recommend foundation lab or remediation quiz
            remed_candidates = [c for c in candidates if c.difficulty_b <= 0.0]
            best = remed_candidates[0] if remed_candidates else candidates[0]
            best.reason = f"Prerequisite remediation required for {concept}: " + best.reason
            return best, candidates

        return candidates[0], candidates

    def compute_pomdp_reward(
        self,
        delta_m: float,
        transfer_gain: float = 0.0,
        cost: float = 0.15,
    ) -> float:
        """
        Computes empirical POMDP reward signal (§12):
        R(s, a) = alpha * Delta M + beta * Transfer - gamma * Cost
        """
        alpha = float(config_service.get_nested("pomdp", "reward_alpha_mastery", 1.0))
        beta = float(config_service.get_nested("pomdp", "reward_beta_transfer", 0.5))
        gamma = float(config_service.get_nested("pomdp", "reward_gamma_cost", 0.2))

        reward = (alpha * delta_m) + (beta * transfer_gain) - (gamma * cost)
        return round(float(reward), 4)


zpd_planner_service = ZpdPlannerService()
