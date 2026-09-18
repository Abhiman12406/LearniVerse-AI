"""Bayesian Knowledge Tracing (BKT) Engine for Adaptive Student Modeling.

Implements exact Bayesian belief update equations and learning transition equations
conforming to the core product architecture in AGENTS.md.
"""

from typing import Dict, NamedTuple
import numpy as np


class BKTParameters(NamedTuple):
    p_transit: float  # P(T) - probability of learning between opportunities
    p_guess: float    # P(G) - probability of guessing correctly when unmastered
    p_slip: float     # P(S) - probability of slipping (incorrect when mastered)


# Default concept parameters calibrated for Data Structures curriculum
DEFAULT_CONCEPT_PARAMS: Dict[str, BKTParameters] = {
    "array": BKTParameters(p_transit=0.10, p_guess=0.25, p_slip=0.08),
    "linked_list": BKTParameters(p_transit=0.12, p_guess=0.22, p_slip=0.10),
    "stack": BKTParameters(p_transit=0.05, p_guess=0.54, p_slip=0.11),
    "recursion": BKTParameters(p_transit=0.08, p_guess=0.20, p_slip=0.12),
    "tree": BKTParameters(p_transit=0.08, p_guess=0.18, p_slip=0.12),
}

# Difficulty modifiers to adjust guess/slip parameters dynamically
DIFFICULTY_ADJUSTMENTS: Dict[str, Dict[str, float]] = {
    "easy": {"p_guess_mult": 1.25, "p_slip_mult": 0.8},
    "medium": {"p_guess_mult": 1.0, "p_slip_mult": 1.0},
    "hard": {"p_guess_mult": 0.75, "p_slip_mult": 1.25},
}


class BKTService:
    """Computes posterior mastery probabilities using Bayesian Knowledge Tracing."""

    def __init__(self, concept_params: Dict[str, BKTParameters] = None):
        self._params = concept_params or DEFAULT_CONCEPT_PARAMS

    def get_parameters(self, concept: str, difficulty: str = "medium") -> BKTParameters:
        base = self._params.get(concept, DEFAULT_CONCEPT_PARAMS["stack"])
        diff = DIFFICULTY_ADJUSTMENTS.get(difficulty.lower(), DIFFICULTY_ADJUSTMENTS["medium"])

        p_guess = np.clip(base.p_guess * diff["p_guess_mult"], 0.05, 0.60)
        p_slip = np.clip(base.p_slip * diff["p_slip_mult"], 0.02, 0.30)
        p_transit = base.p_transit

        return BKTParameters(p_transit=float(p_transit), p_guess=float(p_guess), p_slip=float(p_slip))

    def compute_posterior(
        self,
        prior: float,
        correct: bool,
        concept: str = "stack",
        difficulty: str = "medium",
    ) -> float:
        """
        Calculates posterior probability P(L_t) given prior belief P(L_{t-1}) and response correctness.

        Exact Bayesian update:
        If correct:
            P(L_t | obs) = [P(L_{t-1}) * (1 - P(S))] / [P(L_{t-1}) * (1 - P(S)) + (1 - P(L_{t-1})) * P(G)]
        If incorrect:
            P(L_t | obs) = [P(L_{t-1}) * P(S)] / [P(L_{t-1}) * P(S) + (1 - P(L_{t-1})) * (1 - P(G))]

        Transition to next state:
            P(L_t) = P(L_t | obs) + (1 - P(L_t | obs)) * P(T)
        """
        prior = float(np.clip(prior, 0.01, 0.99))
        params = self.get_parameters(concept, difficulty)
        p_t = params.p_transit
        p_g = params.p_guess
        p_s = params.p_slip

        if correct:
            # Observation likelihood given mastery: 1 - P(S)
            # Observation likelihood given non-mastery: P(G)
            num = prior * (1.0 - p_s)
            den = num + (1.0 - prior) * p_g
            p_obs = num / den if den > 0 else prior
        else:
            # Observation likelihood given mastery: P(S)
            # Observation likelihood given non-mastery: 1 - P(G)
            num = prior * p_s
            den = num + (1.0 - prior) * (1.0 - p_g)
            p_obs = num / den if den > 0 else prior

        # Learning transition equation: opportunity to learn
        posterior = p_obs + (1.0 - p_obs) * p_t

        # Strictly bound and round to 2 decimal places for presentation & consistency
        bounded = float(np.clip(posterior, 0.01, 0.99))
        return round(bounded, 2)


bkt_service = BKTService()
