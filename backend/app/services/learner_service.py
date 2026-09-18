"""Authoritative Learner Service managing profiles and world access states."""

from typing import Dict, Optional
from backend.app.models.learner import (
    LearnerProfile,
    LearningState,
    MasteryMap,
    WingInfo,
    WorldState,
)
from backend.app.services.prerequisite_service import prerequisite_service

# Seeded default profiles defined in Game Environment.md
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
            # Fallback to default if unknown ID
            learner_id = "learner_b"
        self._active_learner_id = learner_id
        return self._profiles[self._active_learner_id]

    def reset_profiles(self) -> LearnerProfile:
        self._profiles = {
            k: v.model_copy(deep=True) for k, v in SEED_PROFILES.items()
        }
        self._active_learner_id = "learner_b"
        return self._profiles[self._active_learner_id]

    def update_concept_mastery(
        self, learner_id: str, concept: str, new_mastery: float
    ) -> LearnerProfile:
        """Update a specific concept mastery for a learner and re-evaluate pedagogical state."""
        profile = self._profiles.get(learner_id)
        if not profile:
            profile = self._profiles["learner_b"]
            learner_id = "learner_b"

        current_map = profile.mastery_map.model_dump()
        current_map[concept] = round(float(new_mastery), 2)
        profile.mastery_map = MasteryMap(**current_map)

        # Dynamic state adaptation: When Stack mastery crosses the 0.70 threshold
        if concept == "stack":
            if current_map["stack"] >= 0.70:
                profile.learning_state.status = "remediation_complete"
                profile.learning_state.summary = (
                    f"Prerequisite satisfied: Stack mastery ({int(current_map['stack']*100)}%) crossed the 70% threshold. "
                    "Recursion Wing is now unlocked and accessible."
                )
                profile.learning_state.primary_focus_concept = "recursion"
                profile.learning_state.active_prerequisite_gap = None
                profile.recommended_station = "recursion_lab"
            else:
                profile.learning_state.status = "remediation_required"
                profile.learning_state.summary = (
                    f"Prerequisite Gap: Stack mastery ({int(current_map['stack']*100)}%) is below the 70% threshold required for Recursion Wing."
                )
                profile.learning_state.primary_focus_concept = "stack"
                profile.learning_state.active_prerequisite_gap = (
                    f"Stack mastery {current_map['stack']:.2f} < 0.70 prerequisite threshold for Recursion"
                )
                profile.recommended_station = "stack_lab"

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


learner_service = LearnerService()
