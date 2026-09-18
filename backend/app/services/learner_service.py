"""Authoritative Learner Service managing profiles, mathematical states, and world access."""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from backend.app.models.learner import (
    LearnerProfile,
    LearningState,
    MasteryMap,
    WingInfo,
    WorldState,
)
from backend.app.services.prerequisite_service import prerequisite_service
from backend.app.services.multidimensional_mastery_service import multidimensional_mastery_service
from backend.app.services.knowledge_graph_service import knowledge_graph_service

# Seeded default profiles conforming to BACKEND_LOGIC.md and Game Environment.md
SEED_PROFILES: Dict[str, LearnerProfile] = {
    "learner_b": LearnerProfile(
        learner_id="learner_b",
        name="Alex Mercer (Learner B - Remedial)",
        persona_type="Remedial - Stack Deficient",
        learning_state=LearningState(
            status="remediation_required",
            summary="Prerequisite Gap detected: Stack mastery (38%) is below the 70% threshold required to enter the Recursion Wing.",
            primary_focus_concept="stack",
            active_prerequisite_gap="Stack mastery 0.38 < 0.70 prerequisite threshold for Recursion",
        ),
        mastery_map=MasteryMap(
            array=0.90,
            linked_list=0.70,
            stack=0.38,
            recursion=0.20,
            tree=0.10,
        ),
        ability_irt={
            "array": 1.20,
            "linked_list": 0.40,
            "stack": -0.60,
            "recursion": -1.20,
            "tree": -1.50,
        },
        confidence_map={
            "array": 0.85,
            "linked_list": 0.72,
            "stack": 0.45,
            "recursion": 0.30,
            "tree": 0.15,
        },
        dimensions_map={
            "array": {"recall": 0.95, "understanding": 0.90, "application": 0.88, "problem_solving": 0.85, "transfer": 0.80, "retention": 0.90},
            "linked_list": {"recall": 0.75, "understanding": 0.70, "application": 0.68, "problem_solving": 0.65, "transfer": 0.60, "retention": 0.70},
            "stack": {"recall": 0.50, "understanding": 0.38, "application": 0.35, "problem_solving": 0.30, "transfer": 0.25, "retention": 0.40},
            "recursion": {"recall": 0.30, "understanding": 0.20, "application": 0.15, "problem_solving": 0.15, "transfer": 0.10, "retention": 0.20},
            "tree": {"recall": 0.20, "understanding": 0.10, "application": 0.10, "problem_solving": 0.05, "transfer": 0.05, "retention": 0.10},
        },
        sm2_records={
            "array": {"concept_id": "array", "easiness_factor": 2.60, "repetitions": 4, "interval_days": 15},
            "linked_list": {"concept_id": "linked_list", "easiness_factor": 2.45, "repetitions": 2, "interval_days": 6},
            "stack": {"concept_id": "stack", "easiness_factor": 2.10, "repetitions": 0, "interval_days": 1},
            "recursion": {"concept_id": "recursion", "easiness_factor": 2.20, "repetitions": 0, "interval_days": 1},
            "tree": {"concept_id": "tree", "easiness_factor": 2.50, "repetitions": 0, "interval_days": 1},
        },
        mastery_classification={
            "array": "HIGH",
            "linked_list": "MEDIUM",
            "stack": "LOW",
            "recursion": "LOW",
            "tree": "UNCERTAIN",
        },
        active_wing="atrium",
        recommended_station="stack_lab",
    ),
    "learner_a": LearnerProfile(
        learner_id="learner_a",
        name="Dr. Elena Vance (Learner A - Advanced)",
        persona_type="Advanced - Recursion Ready",
        learning_state=LearningState(
            status="advanced",
            summary="All core prerequisites verified. Stack mastery at 84%. Ready for advanced Recursion call-stack challenges.",
            primary_focus_concept="recursion",
            active_prerequisite_gap=None,
        ),
        mastery_map=MasteryMap(
            array=0.92,
            linked_list=0.88,
            stack=0.84,
            recursion=0.72,
            tree=0.65,
        ),
        ability_irt={
            "array": 1.80,
            "linked_list": 1.50,
            "stack": 1.40,
            "recursion": 1.10,
            "tree": 0.60,
        },
        confidence_map={
            "array": 0.95,
            "linked_list": 0.90,
            "stack": 0.88,
            "recursion": 0.78,
            "tree": 0.65,
        },
        dimensions_map={
            "array": {"recall": 0.96, "understanding": 0.94, "application": 0.92, "problem_solving": 0.90, "transfer": 0.88, "retention": 0.95},
            "linked_list": {"recall": 0.92, "understanding": 0.90, "application": 0.88, "problem_solving": 0.85, "transfer": 0.82, "retention": 0.90},
            "stack": {"recall": 0.90, "understanding": 0.88, "application": 0.85, "problem_solving": 0.82, "transfer": 0.80, "retention": 0.86},
            "recursion": {"recall": 0.80, "understanding": 0.75, "application": 0.70, "problem_solving": 0.68, "transfer": 0.65, "retention": 0.72},
            "tree": {"recall": 0.70, "understanding": 0.65, "application": 0.60, "problem_solving": 0.58, "transfer": 0.55, "retention": 0.60},
        },
        sm2_records={
            "array": {"concept_id": "array", "easiness_factor": 2.70, "repetitions": 6, "interval_days": 30},
            "linked_list": {"concept_id": "linked_list", "easiness_factor": 2.60, "repetitions": 5, "interval_days": 21},
            "stack": {"concept_id": "stack", "easiness_factor": 2.55, "repetitions": 4, "interval_days": 14},
            "recursion": {"concept_id": "recursion", "easiness_factor": 2.45, "repetitions": 2, "interval_days": 6},
            "tree": {"concept_id": "tree", "easiness_factor": 2.40, "repetitions": 1, "interval_days": 1},
        },
        mastery_classification={
            "array": "HIGH",
            "linked_list": "HIGH",
            "stack": "HIGH",
            "recursion": "HIGH",
            "tree": "MEDIUM",
        },
        active_wing="atrium",
        recommended_station="recursion_lab",
    ),
}

# Standard Wing spatial layout defined in Game Environment.md
WING_DEFINITIONS: Dict[str, dict] = {
    "array_station": {
        "wing_id": "array_station",
        "name": "Array Station",
        "concept": "array",
        "azimuth_deg": 30.0,
        "coordinates": [12.0, 0.0, -20.0],
        "required_mastery": None,
    },
    "linked_list_lab": {
        "wing_id": "linked_list_lab",
        "name": "Linked List Lab",
        "concept": "linked_list",
        "azimuth_deg": 90.0,
        "coordinates": [24.0, 0.0, 0.0],
        "required_mastery": {"array": 0.60},
    },
    "stack_lab": {
        "wing_id": "stack_lab",
        "name": "Stack Lab",
        "concept": "stack",
        "azimuth_deg": 150.0,
        "coordinates": [12.0, 0.0, 20.0],
        "required_mastery": {"linked_list": 0.50},
    },
    "recursion_lab": {
        "wing_id": "recursion_lab",
        "name": "Recursion Lab",
        "concept": "recursion",
        "azimuth_deg": 270.0,
        "coordinates": [-24.0, 0.0, 0.0],
        "required_mastery": {"stack": 0.70},
    },
    "tree_lab": {
        "wing_id": "tree_lab",
        "name": "Tree Lab",
        "concept": "tree",
        "azimuth_deg": 210.0,
        "coordinates": [-12.0, 0.0, 20.0],
        "required_mastery": {"recursion": 0.70},
    },
}


class LearnerService:
    def __init__(self):
        self._profiles: Dict[str, LearnerProfile] = {
            k: v.model_copy(deep=True) for k, v in SEED_PROFILES.items()
        }
        self._active_learner_id: str = "learner_b"

    def get_active_learner_id(self) -> str:
        return self._active_learner_id

    def get_active_learner_profile(self) -> LearnerProfile:
        return self._profiles[self._active_learner_id]

    def get_learner_profile(self, learner_id: str) -> Optional[LearnerProfile]:
        return self._profiles.get(learner_id)

    def switch_learner(self, learner_id: str) -> LearnerProfile:
        if learner_id not in self._profiles:
            learner_id = "learner_b"
        self._active_learner_id = learner_id
        return self._profiles[self._active_learner_id]

    def reset_profiles(self) -> LearnerProfile:
        self._profiles = {
            k: v.model_copy(deep=True) for k, v in SEED_PROFILES.items()
        }
        self._active_learner_id = "learner_b"
        multidimensional_mastery_service.reset_student("learner_a")
        multidimensional_mastery_service.reset_student("learner_b")
        return self._profiles[self._active_learner_id]

    def update_concept_mastery(
        self,
        learner_id: Optional[str] = None,
        concept: str = "stack",
        new_mastery: Optional[float] = None,
        value: Optional[float] = None,
    ) -> LearnerProfile:
        """Update a specific concept mastery for a learner and re-evaluate pedagogical state."""
        lid = learner_id or self._active_learner_id
        profile = self._profiles.get(lid)
        if not profile:
            profile = self._profiles["learner_b"]
            lid = "learner_b"

        mastery_val = new_mastery if new_mastery is not None else (value if value is not None else 0.5)

        current_map = profile.mastery_map.model_dump()
        current_map[concept] = round(float(mastery_val), 2)
        profile.mastery_map = MasteryMap(**current_map)

        # Dynamic re-evaluation of prerequisite constraints
        recursion_eval = prerequisite_service.evaluate_concept(
            "recursion", profile.mastery_map
        )
        if recursion_eval.is_ready:
            pct = int(current_map.get("stack", 0.0) * 100)
            profile.learning_state.status = "advanced"
            profile.learning_state.active_prerequisite_gap = None
            profile.learning_state.summary = (
                f"Stack mastery elevated to {pct}%. Prerequisite barrier dissolved! "
                "Recursion Wing portal is unlocked and ready for exploration."
            )
            profile.learning_state.primary_focus_concept = "recursion"
            profile.recommended_station = "recursion_lab"
        else:
            pct = int(current_map.get("stack", 0.0) * 100)
            profile.learning_state.status = "remediation_required"
            profile.learning_state.summary = (
                f"Prerequisite Gap: Stack mastery ({pct}%) is below the 70% threshold required for Recursion Wing."
            )
            profile.learning_state.primary_focus_concept = "stack"
            profile.learning_state.active_prerequisite_gap = recursion_eval.reason
            profile.recommended_station = "stack_lab"

        # Update 4-tier classification
        classification = multidimensional_mastery_service.classify_mastery(
            lid, concept, mastery_val, current_map
        )
        profile.mastery_classification[concept] = classification

        return profile

    def update_learner_evidence(
        self,
        learner_id: str,
        concept: str,
        new_mastery: float,
        theta: float,
        confidence: float,
        classification: str,
        dimension_scores: Optional[Dict[str, float]] = None,
        sm2_record: Optional[Dict[str, Any]] = None,
    ) -> LearnerProfile:
        """Atomically updates all mathematical evidence streams for a learner."""
        profile = self._profiles.get(learner_id)
        if not profile:
            profile = self._profiles["learner_b"]

        # 1. Update BKT mastery and re-evaluate world state
        self.update_concept_mastery(learner_id, concept, new_mastery)

        # 2. Update IRT ability
        profile.ability_irt[concept] = round(float(theta), 2)

        # 3. Update Confidence
        profile.confidence_map[concept] = round(float(confidence), 2)

        # 4. Update Classification
        profile.mastery_classification[concept] = classification

        # 5. Update Dimensions
        if dimension_scores:
            profile.dimensions_map[concept] = dimension_scores

        # 6. Update SM-2
        if sm2_record:
            profile.sm2_records[concept] = sm2_record

        return profile

    def get_world_state(self, learner_id: Optional[str] = None) -> WorldState:
        lid = learner_id or self._active_learner_id
        profile = self._profiles.get(lid, self._profiles["learner_b"])
        mastery = profile.mastery_map

        wings: Dict[str, WingInfo] = {}
        for wid, meta in WING_DEFINITIONS.items():
            concept = meta["concept"]
            eval_res = prerequisite_service.evaluate_concept(concept, mastery)

            wings[wid] = WingInfo(
                wing_id=meta["wing_id"],
                name=meta["name"],
                concept=meta["concept"],
                status=eval_res.status,
                azimuth_deg=meta["azimuth_deg"],
                coordinates=meta["coordinates"],
                required_mastery=meta["required_mastery"],
                reason=eval_res.reason,
            )

        return WorldState(
            active_learner_id=lid,
            atrium_radius=18.0,
            wings=wings,
            conduits_target_wing=profile.recommended_station,
        )

    def simulate_mastery_jump(
        self, learner_id: Optional[str] = "learner_b", target_stack: float = 0.75
    ) -> LearnerProfile:
        """Elevate Stack mastery across the 70% threshold and dissolve the barrier."""
        return self.update_concept_mastery(learner_id, "stack", target_stack)


learner_service = LearnerService()
