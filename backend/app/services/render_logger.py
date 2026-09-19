"""High-visibility structured agent & pedagogical logger formatted for Render live logs stream."""

import sys
from typing import Any, Dict, List, Optional


def _safe_print(text: str = "", file=sys.stdout, flush: bool = True) -> None:
    """Safely print unicode text, falling back to ASCII/replacement chars if terminal doesn't support it."""
    try:
        print(text, file=file, flush=flush)
    except (UnicodeEncodeError, Exception):
        try:
            enc = getattr(file, "encoding", "utf-8") or "utf-8"
            safe_text = text.encode(enc, errors="replace").decode(enc)
            print(safe_text, file=file, flush=flush)
        except Exception:
            pass


def log_langgraph_deliberation(deliberation: Any) -> None:
    """Print high-visibility ASCII banner for LangGraph 5-Agent deliberation cycle."""
    try:
        final_dec = getattr(deliberation, "final_decision", None)
        world_inst = getattr(deliberation, "world_instructions", None)
        traces = getattr(deliberation, "traces", [])
        student_id = getattr(deliberation, "student_id", "unknown")
        llm_mode = getattr(deliberation, "llm_mode", "deterministic")

        _safe_print("\n" + "=" * 80)
        _safe_print(f"[LANGGRAPH 5-AGENT DELIBERATION] Student: {student_id} | Mode: {llm_mode}")
        _safe_print("-" * 80)

        for idx, trace in enumerate(traces, start=1):
            name = getattr(trace, "agent_name", f"Agent {idx}")
            reason = getattr(trace, "reasoning", "")
            out_summary = getattr(trace, "output_summary", {}) or {}

            if "Context" in name:
                target = out_summary.get("target_concept", "N/A")
                weak = out_summary.get("weak_concepts", [])
                blocking = out_summary.get("blocking_prerequisite", "None")
                _safe_print(f"1. [{name}] Target: {target} | Weak: {weak} | Blocking Prereq: {blocking}")
            elif "Diagnostic" in name:
                status = out_summary.get("status", "N/A")
                gap = out_summary.get("active_gap") or out_summary.get("blocking_prerequisite") or "None"
                _safe_print(f"2. [{name}] Learner Status: {status} | Gap: {gap}")
            elif "Planner" in name:
                action = out_summary.get("proposed_action", "N/A")
                concept = out_summary.get("proposed_concept", "N/A")
                diff = out_summary.get("proposed_difficulty", "N/A")
                _safe_print(f"3. [{name}] Action: {action} | Concept: {concept} | Difficulty: {diff}")
                if reason:
                    _safe_print(f"      Reasoning: {reason[:120]}...")
            elif "Validator" in name:
                status = getattr(trace, "status", "APPROVED")
                override = out_summary.get("overridden", False)
                verdict = "OVERRIDDEN" if override else "APPROVED"
                _safe_print(f"4. [{name}] Deterministic Policy Check: {verdict}")
                if reason:
                    _safe_print(f"      Policy Rule: {reason[:120]}...")
            elif "Game" in name:
                station = out_summary.get("recommended_station", "N/A")
                mission = out_summary.get("active_mission_title") or out_summary.get("mission_id") or "N/A"
                _safe_print(f"5. [{name}] Station: {station} | Assigned Mission: {mission}")

        if final_dec:
            action = getattr(final_dec, "action", "")
            concept = getattr(final_dec, "concept", "")
            diff = getattr(final_dec, "difficulty", "")
            station = getattr(world_inst, "recommended_station", "") if world_inst else ""
            _safe_print("-" * 80)
            _safe_print(f"DECISION OUTCOME: {action} on [{concept.upper()}] ({diff.upper()}) -> Redirect to {station}")

        _safe_print("=" * 80 + "\n")
    except Exception as e:
        _safe_print(f"[RenderLogger] Deliberation logging error: {e}", file=sys.stderr)


def log_feynman_request(
    session_id: str,
    student_id: str,
    concept: str,
    user_input: str,
    gap: str,
    modality: str,
    objective: str,
) -> None:
    """Print high-visibility banner for Feynman Agent request & pedagogical diagnosis."""
    try:
        _safe_print("\n" + "=" * 80)
        _safe_print(f"[FEYNMAN MULTIMODAL AGENT: DIAGNOSIS & REPAIR] Session: {session_id}")
        _safe_print("-" * 80)
        _safe_print(f"• Student: {student_id} | Concept: {concept.upper()}")
        _safe_print(f"• Student Input: \"{user_input[:100]}\"")
        _safe_print(f"• Detected Gap: {gap}")
        _safe_print(f"• Selected Pedagogical Modality: {modality} (Tailored to student mastery)")
        _safe_print(f"• Learning Objective: {objective}")
        _safe_print("=" * 80 + "\n")
    except Exception as e:
        _safe_print(f"[RenderLogger] Feynman request logging error: {e}", file=sys.stderr)


def log_feynman_verification(
    session_id: str,
    student_id: str,
    concept: str,
    correct: bool,
    prior_mastery: float,
    posterior_mastery: float,
    threshold_crossed: bool,
) -> None:
    """Print high-visibility banner for Feynman verification response and BKT update."""
    try:
        delta = round(posterior_mastery - prior_mastery, 2)
        sign = "+" if delta >= 0 else ""
        verdict = "CORRECT (Misconception Repaired)" if correct else "INCORRECT (Further Practice Needed)"
        
        _safe_print("\n" + "=" * 80)
        _safe_print(f"[FEYNMAN AGENT: VERIFICATION & BKT SYNCHRONIZATION] Session: {session_id}")
        _safe_print("-" * 80)
        _safe_print(f"• Student: {student_id} | Concept: {concept.upper()}")
        _safe_print(f"• Student Response Evaluation: {verdict}")
        _safe_print(f"• BKT Mastery Shift: {prior_mastery:.2f} -> {posterior_mastery:.2f} ({sign}{delta:.2f})")
        if threshold_crossed:
            _safe_print(f"• PREREQUISITE BARRIER DISSOLVED: {concept.upper()} crossed 0.70 threshold!")
        _safe_print("=" * 80 + "\n")
    except Exception as e:
        _safe_print(f"[RenderLogger] Feynman verification logging error: {e}", file=sys.stderr)


def log_interaction_event(
    student_id: str,
    concept: str,
    question_id: str,
    correct: bool,
    prior_mastery: float,
    posterior_mastery: float,
    threshold_crossed: bool,
) -> None:
    """Print interaction event and BKT update to Render logs."""
    try:
        delta = round(posterior_mastery - prior_mastery, 2)
        sign = "+" if delta >= 0 else ""
        result = "CORRECT" if correct else "INCORRECT"
        _safe_print(
            f"[BKT INTERACTION] Student: {student_id} | Concept: {concept} ({question_id}) | "
            f"Result: {result} | BKT: {prior_mastery:.2f} -> {posterior_mastery:.2f} ({sign}{delta:.2f})"
        )
        if threshold_crossed:
            _safe_print(f"[GATE UNLOCKED] {concept.upper()} mastery crossed 70% threshold!")
    except Exception as e:
        _safe_print(f"[RenderLogger] Interaction logging error: {e}", file=sys.stderr)
