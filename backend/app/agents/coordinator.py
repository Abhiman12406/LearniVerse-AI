"""Authoritative 5-Agent Deliberation Coordinator Service.

Manages execution of the compiled LangGraph workflow, caches live telemetry traces,
and synchronizes world instructions with learner state.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from backend.app.agents.graph import deliberation_workflow
from backend.app.agents.state import AgentState
from backend.app.models.agents import (
    AgentTraceItem,
    DeliberationResponse,
    FinalDecision,
    WorldInstructions,
)
from backend.app.services.learner_service import learner_service
from backend.app.services.render_logger import log_langgraph_deliberation


class AgentCoordinatorService:
    """Coordinates the 5-Agent LangGraph Deliberation Pipeline."""

    def __init__(self):
        self._latest_deliberations: Dict[str, DeliberationResponse] = {}

    def run_deliberation(
        self,
        student_id: Optional[str] = None,
        target_concept: Optional[str] = None,
        force_proposal: Optional[Dict[str, Any]] = None,
    ) -> DeliberationResponse:
        """Execute the 5-agent sequential pipeline and return the structured outcome."""
        target_id = student_id or learner_service.get_active_learner_id()

        initial_state: AgentState = {
            "student_id": target_id,
            "target_concept": target_concept,
            "force_proposal": force_proposal,
            "traces": [],
        }

        # Run compiled LangGraph workflow
        final_state = deliberation_workflow.invoke(initial_state)

        # Parse outputs into structured response
        traces = [
            AgentTraceItem(**trace_dict)
            for trace_dict in final_state.get("traces", [])
        ]
        final_decision = FinalDecision(**final_state["final_decision"])
        world_instructions = WorldInstructions(**final_state["world_instructions"])
        llm_mode = final_state.get("llm_mode", "deterministic_fallback")

        response = DeliberationResponse(
            student_id=target_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            llm_mode=llm_mode,
            final_decision=final_decision,
            world_instructions=world_instructions,
            traces=traces,
        )

        # Cache latest deliberation for Telemetry Drawer inspection
        self._latest_deliberations[target_id] = response

        # Stream structured agent deliberation log to Render live log stream
        log_langgraph_deliberation(response)

        # Sync authoritative recommended station if appropriate
        profile = learner_service.get_learner_profile(target_id)
        if profile and world_instructions.recommended_station:
            profile.recommended_station = world_instructions.recommended_station

        return response

    def get_latest_deliberation(self, student_id: Optional[str] = None) -> DeliberationResponse:
        """Retrieve the cached deliberation trace or execute a fresh cycle."""
        target_id = student_id or learner_service.get_active_learner_id()
        if target_id in self._latest_deliberations:
            return self._latest_deliberations[target_id]
        return self.run_deliberation(student_id=target_id)

    def clear_cache(self):
        """Clear cached deliberations (used in test resets)."""
        self._latest_deliberations.clear()


agent_coordinator = AgentCoordinatorService()
