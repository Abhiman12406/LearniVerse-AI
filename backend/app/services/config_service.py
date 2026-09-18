"""Configuration Service loading and managing calibrated parameters.

Conforms to BACKEND_LOGIC.md §25.
"""

import os
from pathlib import Path
from typing import Any, Dict
import yaml


DEFAULT_FALLBACK_CONFIG: Dict[str, Any] = {
    "bkt": {
        "initial_mastery": 0.30,
        "guess": 0.20,
        "slip": 0.10,
        "learn": 0.15,
        "post_incorrect_transit": False,
        "concepts": {
            "array": {"p_transit": 0.10, "p_guess": 0.25, "p_slip": 0.08},
            "linked_list": {"p_transit": 0.12, "p_guess": 0.22, "p_slip": 0.10},
            "stack": {"p_transit": 0.05, "p_guess": 0.54, "p_slip": 0.11},
            "recursion": {"p_transit": 0.08, "p_guess": 0.20, "p_slip": 0.12},
            "tree": {"p_transit": 0.08, "p_guess": 0.18, "p_slip": 0.12},
        },
    },
    "irt": {
        "theta_min": -4.0,
        "theta_max": 4.0,
        "default_a": 1.2,
        "default_b": 0.0,
        "selection": "max_information",
        "max_optimizer_iterations": 50,
        "convergence_tolerance": 0.001,
    },
    "prerequisites": {
        "default_threshold": 0.70,
        "edges": [
            {"source": "array", "target": "linked_list", "threshold": 0.60},
            {"source": "linked_list", "target": "stack", "threshold": 0.50},
            {"source": "stack", "target": "recursion", "threshold": 0.70},
            {"source": "recursion", "target": "tree", "threshold": 0.70},
        ],
    },
    "mastery": {
        "low_threshold": 0.45,
        "high_threshold": 0.75,
        "dimension_weights": {
            "recall": 1.0,
            "understanding": 1.0,
            "application": 1.2,
            "problem_solving": 1.5,
            "transfer": 1.8,
            "retention": 1.0,
        },
    },
    "zpd": {
        "sigma": 0.50,
        "utility_cost_lambda": 0.10,
        "base_gain": 0.15,
        "difficulty_map": {"easy": -1.0, "medium": 0.0, "hard": 1.0},
    },
    "confidence": {"kappa": 8.0},
    "feynman": {
        "trigger_threshold": 0.60,
        "weights": {
            "alpha_repeated_errors": 0.35,
            "beta_hint_dependence": 0.25,
            "gamma_misconceptions": 0.25,
            "delta_uncertainty": 0.15,
        },
    },
    "sm2": {
        "min_easiness_factor": 1.30,
        "default_ef": 2.50,
        "initial_interval_1": 1,
        "initial_interval_2": 6,
        "quality_threshold": 3,
    },
    "pomdp": {
        "reward_alpha_mastery": 1.0,
        "reward_beta_transfer": 0.5,
        "reward_gamma_cost": 0.2,
        "discount_factor": 0.95,
    },
}


class ConfigService:
    """Manages external parameter configuration with hot-reloading capability."""

    def __init__(self, config_path: Path = None):
        self._config_path = config_path or Path(__file__).parent.parent / "config" / "parameters.yaml"
        self._config: Dict[str, Any] = {}
        self.reload()

    def reload(self):
        if self._config_path.exists():
            try:
                with open(self._config_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    self._config = data or DEFAULT_FALLBACK_CONFIG
            except Exception:
                self._config = DEFAULT_FALLBACK_CONFIG
        else:
            self._config = DEFAULT_FALLBACK_CONFIG

    def get(self, section: str, default: Any = None) -> Any:
        return self._config.get(section, DEFAULT_FALLBACK_CONFIG.get(section, default))

    def get_nested(self, section: str, key: str, default: Any = None) -> Any:
        sec = self.get(section, {})
        if isinstance(sec, dict):
            return sec.get(key, default)
        return default


config_service = ConfigService()
