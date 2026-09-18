"""Planner Agent: Stage 3 of the LangGraph Deliberation Pipeline.

Synthesizes the pedagogical action, target concept, difficulty, and reasoning.
Operates in dual mode: utilizes Google Gemini API when configured with an API key,
and seamlessly falls back to a deterministic decision heuristic offline.
"""

import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from backend.app.agents.state import AgentState
from backend.app.models.agents import AgentTraceItem, PlannerProposal


def _generate_deterministic_proposal(
    diagnostic: Dict[str, Any],
    mastery_map: Dict[str, float],
    target_concept: str,
) -> PlannerProposal:
    """Deterministic pedagogical heuristic fallback."""
    status = diagnostic.get("status", "progressing")
    blocking_prereq = diagnostic.get("blocking_prerequisite")
    stack_val = mastery_map.get("stack", 0.5)

    if status == "remediation_required" or blocking_prereq == "stack" or stack_val < 0.70:
        diff = "easy" if stack_val < 0.45 else "medium"
        return PlannerProposal(
            action="REMEDIATE",
            concept="stack",
            difficulty=diff,
            reason=(
                f"Pedagogical Planner identifies Stack mastery ({int(stack_val*100)}%) is below the "
                "70% threshold required for Recursion Wing. Targeted remediation scheduled in Stack Lab."
            ),
            mode="deterministic_fallback",
        )
    elif stack_val >= 0.70:
        rec_val = mastery_map.get("recursion", 0.20)
        if rec_val >= 0.70:
            return PlannerProposal(
                action="CHALLENGE",
                concept="recursion",
                difficulty="hard",
                reason=(
                    f"Prerequisites verified across curriculum. Advanced challenge initiated for "
                    f"Recursion (current mastery: {int(rec_val*100)}%)."
                ),
                mode="deterministic_fallback",
            )
        else:
            return PlannerProposal(
                action="LEARN",
                concept="recursion",
                difficulty="medium",
                reason=(
                    f"Stack prerequisite verified ({int(stack_val*100)}% ≥ 70%). "
                    "Recursion Wing barrier dissolved. Advancing to Recursion Lab."
                ),
                mode="deterministic_fallback",
            )
    else:
        concept = target_concept or "stack"
        val = mastery_map.get(concept, 0.5)
        diff = "easy" if val < 0.45 else ("medium" if val < 0.70 else "hard")
        return PlannerProposal(
            action="PRACTICE",
            concept=concept,
            difficulty=diff,
            reason=f"Standard mastery progression practice on {concept.replace('_', ' ').title()}.",
            mode="deterministic_fallback",
        )


def _call_gemini_planner(
    diagnostic: Dict[str, Any],
    mastery_map: Dict[str, float],
    target_concept: str,
    persona_type: str,
) -> Optional[PlannerProposal]:
    """Attempt Google Gemini API structured output generation."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an expert Adaptive Learning Planner AI for a 3D Cybernetic Data Structures Classroom.
Learner Persona: {persona_type}
Curriculum DAG: Array -> Linked List -> Stack -> Recursion -> Tree
Current Mastery Map: {json.dumps(mastery_map)}
Diagnostic Analysis: {json.dumps(diagnostic)}
Target Concept Considered: {target_concept}

Determine the optimal next pedagogical assignment for the student.
Respond strictly in JSON matching this schema:
{{
  "action": "LEARN" | "PRACTICE" | "REMEDIATE" | "CHALLENGE" | "REVIEW",
  "concept": "array" | "linked_list" | "stack" | "recursion" | "tree",
  "difficulty": "easy" | "medium" | "hard",
  "reason": "Detailed pedagogical rationale explaining why this action was selected"
}}
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        if response and response.text:
            cleaned = response.text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())
            return PlannerProposal(
                action=parsed.get("action", "PRACTICE").upper(),
                concept=parsed.get("concept", "stack").lower(),
                difficulty=parsed.get("difficulty", "medium").lower(),
                reason=parsed.get("reason", "Gemini adaptive planning decision."),
                mode="gemini",
            )
    except Exception:
        # Fallback to deterministic generator upon network/API errors
        return None

    return None


def planner_agent_node(state: AgentState) -> AgentState:
    """Execute Planner Agent node in LangGraph workflow."""
    start_time = time.perf_counter()

    force_proposal = state.get("force_proposal")
    diagnostic = state.get("diagnostic_evaluation") or {}
    mastery_map = state.get("mastery_map") or {}
    target_concept = state.get("target_concept") or "stack"
    persona_type = (state.get("learner_profile") or {}).get("persona_type", "Standard Learner")

    llm_mode = "deterministic_fallback"
    proposal: Optional[PlannerProposal] = None

    # Check for manual test/simulation proposal injection
    if force_proposal:
        proposal = PlannerProposal(
            action=force_proposal.get("action", "LEARN"),
            concept=force_proposal.get("concept", "recursion"),
            difficulty=force_proposal.get("difficulty", "hard"),
            reason=force_proposal.get("reason", "Injected test proposal for guardrail verification"),
            mode="forced_simulation",
        )
        llm_mode = "forced_simulation"
    else:
        # Try live Gemini API
        proposal = _call_gemini_planner(diagnostic, mastery_map, target_concept, persona_type)
        if proposal:
            llm_mode = "gemini"
        else:
            # Fallback to deterministic heuristic planner
            proposal = _generate_deterministic_proposal(diagnostic, mastery_map, target_concept)
            llm_mode = "deterministic_fallback"

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    input_summary = {
        "persona_type": persona_type,
        "llm_mode": llm_mode,
        "diagnostic_status": diagnostic.get("status"),
        "forced_override": bool(force_proposal),
    }
    output_summary = {
        "proposed_action": proposal.action,
        "proposed_concept": proposal.concept,
        "proposed_difficulty": proposal.difficulty,
        "mode": proposal.mode,
    }

    trace_item = AgentTraceItem(
        agent_name="Planner Agent",
        stage="pedagogical_planning",
        timestamp=datetime.now(timezone.utc).isoformat(),
        duration_ms=elapsed_ms,
        status="SUCCESS",
        input_summary=input_summary,
        output_summary=output_summary,
        reasoning=proposal.reason,
    )

    existing_traces = list(state.get("traces") or [])
    existing_traces.append(trace_item.model_dump())

    return {
        **state,
        "planner_proposal": proposal.model_dump(),
        "llm_mode": llm_mode,
        "traces": existing_traces,
    }
