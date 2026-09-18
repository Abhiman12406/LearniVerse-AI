"""World State API router exposing architectural Wing access and conduit targets."""

from typing import Optional
from fastapi import APIRouter, Query
from backend.app.models.learner import WorldState
from backend.app.services.learner_service import learner_service

router = APIRouter(prefix="/api/world", tags=["World"])


@router.get("/state", response_model=WorldState)
def get_world_state(learner_id: Optional[str] = Query(None, description="Optional target learner ID")) -> WorldState:
    """Return the authoritative architectural access state of all Atrium Wings."""
    return learner_service.get_world_state(learner_id)
