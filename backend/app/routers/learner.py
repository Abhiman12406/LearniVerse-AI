"""Learner API router providing profile inspection and profile switching."""

from fastapi import APIRouter, HTTPException
from backend.app.models.learner import LearnerProfile, SwitchLearnerRequest
from backend.app.services.learner_service import learner_service

router = APIRouter(prefix="/api/learner", tags=["Learner"])


@router.get("/profile", response_model=LearnerProfile)
def get_current_profile() -> LearnerProfile:
    """Return the currently active learner profile, learning state, and mastery map."""
    return learner_service.get_active_learner_profile()


@router.get("/{learner_id}", response_model=LearnerProfile)
def get_profile_by_id(learner_id: str) -> LearnerProfile:
    """Retrieve a specific learner profile by ID."""
    profile = learner_service.get_learner_profile(learner_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Learner profile '{learner_id}' not found")
    return profile


@router.post("/switch", response_model=LearnerProfile)
def switch_learner_profile(req: SwitchLearnerRequest) -> LearnerProfile:
    """Switch active profile between Learner A and Learner B."""
    return learner_service.switch_learner(req.learner_id)


@router.post("/reset", response_model=LearnerProfile)
def reset_learner_profiles() -> LearnerProfile:
    """Reset profiles to seed state."""
    return learner_service.reset_profiles()
