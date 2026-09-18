"""Bayesian Knowledge Tracing (BKT) Engine for Continuous Concept Mastery.

Conforms strictly to BACKEND_LOGIC.md §3:
- §3.1 Correct response Bayes update and learning opportunity transition
- §3.2 Incorrect response Bayes update and configurable learning transition
- §3.3 Validity gating: ΔM_effective = V_i * ΔM (zero update on technical failures)
"""

from typing import Dict, NamedTuple, Optional
import numpy as np

from backend.app.services.config_service import config_service


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

DIFFICULTY_ADJUSTMENTS: Dict[str, Dict[str, float]] = {
    "easy": {"p_guess_mult": 1.25, "p_slip_mult": 0.8},
    "medium": {"p_guess_mult": 1.0, "p_slip_mult": 1.0},
    "hard": {"p_guess_mult": 0.75, "p_slip_mult": 1.25},
}


class BKTService:
    """Computes posterior mastery probabilities using 2-step Bayesian Knowledge Tracing."""

    def __init__(self):
        pass

    def get_parameters(self, concept: str, difficulty: str = "medium") -> BKTParameters:
        """Retrieves calibrated parameters from config_service with fallbacks."""
        bkt_cfg = config_service.get("bkt", {})
        concepts_cfg = bkt_cfg.get("concepts", {})

        if concept in concepts_cfg:
            c_data = concepts_cfg[concept]
            base = BKTParameters(
                p_transit=float(c_data.get("p_transit", 0.08)),
                p_guess=float(c_data.get("p_guess", 0.20)),
                p_slip=float(c_data.get("p_slip", 0.10)),
            )
        else:
            base = DEFAULT_CONCEPT_PARAMS.get(concept, DEFAULT_CONCEPT_PARAMS["stack"])

        diff = DIFFICULTY_ADJUSTMENTS.get(difficulty.lower(), DIFFICULTY_ADJUSTMENTS["medium"])

        p_guess = float(np.clip(base.p_guess * diff["p_guess_mult"], 0.05, 0.60))
        p_slip = float(np.clip(base.p_slip * diff["p_slip_mult"], 0.02, 0.30))
        p_transit = float(base.p_transit)

        return BKTParameters(p_transit=p_transit, p_guess=p_guess, p_slip=p_slip)

    def compute_posterior(
        self,
        prior: float,
        correct: bool,
        concept: str = "stack",
        difficulty: str = "medium",
        validity_score: float = 1.0,
        validity: Optional[float] = None,
    ) -> float:
        """
        Calculates posterior probability P(L_t) given prior belief P(L_{t-1}) and response correctness.
        Incorporates validity factor V_i from Evidence Validity Gate (§2, §3.3).

        If validity_score == 0.0 (e.g. timeout or network failure), effective delta is 0,
        returning the prior untouched.
        """
        if validity is not None:
            validity_score = validity

        prior = float(np.clip(prior, 0.01, 0.99))
        
        # Rule A & §3.3: If invalid evidence (e.g. timeout or pure movement), zero update
        if validity_score <= 0.0:
            return round(prior, 2)

        params = self.get_parameters(concept, difficulty)
        p_t = params.p_transit
        p_g = params.p_guess
        p_s = params.p_slip

        # §3.1 Correct response Bayes update
        if correct:
            num = prior * (1.0 - p_s)
            den = num + (1.0 - prior) * p_g
            p_obs = num / den if den > 0 else prior
            # Learning transition
            raw_posterior = p_obs + (1.0 - p_obs) * p_t
        # §3.2 Incorrect response Bayes update
        else:
            num = prior * p_s
            den = num + (1.0 - prior) * (1.0 - p_g)
            p_obs = num / den if den > 0 else prior
            
            # Check if post-incorrect transition is enabled in config
            allow_post_incorrect_transit = config_service.get_nested("bkt", "post_incorrect_transit", False)
            if allow_post_incorrect_transit:
                raw_posterior = p_obs + (1.0 - p_obs) * p_t
            else:
                raw_posterior = p_obs

        # Apply validity gating: ΔM_effective = V_i * ΔM (§2.2)
        raw_delta = raw_posterior - prior
        effective_delta = validity_score * raw_delta
        posterior = prior + effective_delta

        bounded = float(np.clip(posterior, 0.01, 0.99))
        return round(bounded, 2)


bkt_service = BKTService()
