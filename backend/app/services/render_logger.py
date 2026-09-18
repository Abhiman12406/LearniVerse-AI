"""High-visibility structured agent & pedagogical logger formatted for Render live logs stream."""

import sys
from typing import Any, Dict, List, Optional


def log_langgraph_deliberation(deliberation: Any) -> None:
    """Print high-visibility ASCII banner for LangGraph 5-Agent deliberation cycle."""
    try:
        final_dec = getattr(deliberation, "final_decision", None)
        world_inst = getattr(deliberation, "world_instructions", None)
        traces = getattr(deliberation, "traces", [])
        student_id = getattr(deliberation, "student_id", "unknown")
        llm_mode = getattr(deliberation, "llm_mode", "deterministic")

        print("\n" + "=" * 80, flush=True)
        print(f"🤖 [LANGGRAPH 5-AGENT DELIBERATION] Student: {student_id} | Mode: {llm_mode}", flush=True)
        print("-" * 80, flush=True)

        for idx, trace in enumerate(traces, start=1):
            name = getattr(trace, "agent_name", f"Agent {idx}")
            reason = getattr(trace, "reasoning", "")
            out_summary = getattr(trace, "output_summary", {}) or {}

            if "Context" in name:
                target = out_summary.get("target_concept", "N/A")
                weak = out_summary.get("weak_concepts", [])
                blocking = out_summary.get("blocking_prerequisite", "None")
                print(f"1. 🔍 [{name}] Target: {target} | Weak: {weak} | Blocking Prereq: {blocking}", flush=True)
            elif "Diagnostic" in name:
                status = out_summary.get("status", "N/A")
                gap = out_summary.get("active_gap") or out_summary.get("blocking_prerequisite") or "None"
                print(f"2. 🩺 [{name}] Learner Status: {status} | Gap: {gap}", flush=True)
            elif "Planner" in name:
                action = out_summary.get("proposed_action", "N/A")
                concept = out_summary.get("proposed_concept", "N/A")
                diff = out_summary.get("proposed_difficulty", "N/A")
                print(f"3. 🎯 [{name}] Action: {action} | Concept: {concept} | Difficulty: {diff}", flush=True)
                if reason:
                    print(f"      Reasoning: {reason[:120]}...", flush=True)
            elif "Validator" in name:
                status = getattr(trace, "status", "APPROVED")
                override = out_summary.get("overridden", False)
                verdict = "⚠️ OVERRIDDEN" if override else "✓ APPROVED"
                print(f"4. 🛡️  [{name}] Deterministic Policy Check: {verdict}", flush=True)
                if reason:
                    print(f"      Policy Rule: {reason[:120]}...", flush=True)
            elif "Game" in name:
                station = out_summary.get("recommended_station", "N/A")
                mission = out_summary.get("active_mission_title") or out_summary.get("mission_id") or "N/A"
                print(f"5. 🎮 [{name}] Station: {station} | Assigned Mission: {mission}", flush=True)

        if final_dec:
            action = getattr(final_dec, "action", "")
            concept = getattr(final_dec, "concept", "")
            diff = getattr(final_dec, "difficulty", "")
            station = getattr(world_inst, "recommended_station", "") if world_inst else ""
            print("-" * 80, flush=True)
            print(f"⭐ DECISION OUTCOME: {action} on [{concept.upper()}] ({diff.upper()}) ➔ Redirect to {station}", flush=True)

        print("=" * 80 + "\n", flush=True)
    except Exception as e:
        print(f"[RenderLogger] Deliberation logging error: {e}", file=sys.stderr, flush=True)


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
        print("\n" + "=" * 80, flush=True)
        print(f"🧠 [FEYNMAN MULTIMODAL AGENT: DIAGNOSIS & REPAIR] Session: {session_id}", flush=True)
        print("-" * 80, flush=True)
        print(f"• Student: {student_id} | Concept: {concept.upper()}", flush=True)
        print(f"• Student Input: \"{user_input[:100]}\"", flush=True)
        print(f"• Detected Gap: {gap}", flush=True)
        print(f"• Selected Pedagogical Modality: {modality} (Tailored to student mastery)", flush=True)
        print(f"• Learning Objective: {objective}", flush=True)
        print("=" * 80 + "\n", flush=True)
    except Exception as e:
        print(f"[RenderLogger] Feynman request logging error: {e}", file=sys.stderr, flush=True)


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
        verdict = "✓ CORRECT (Misconception Repaired)" if correct else "✗ INCORRECT (Further Practice Needed)"
        
        print("\n" + "=" * 80, flush=True)
        print(f"✨ [FEYNMAN AGENT: VERIFICATION & BKT SYNCHRONIZATION] Session: {session_id}", flush=True)
        print("-" * 80, flush=True)
        print(f"• Student: {student_id} | Concept: {concept.upper()}", flush=True)
        print(f"• Student Response Evaluation: {verdict}", flush=True)
        print(f"• BKT Mastery Shift: {prior_mastery:.2f} ➔ {posterior_mastery:.2f} ({sign}{delta:.2f})", flush=True)
        if threshold_crossed:
            print(f"• 🔓 PREREQUISITE BARRIER DISSOLVED: {concept.upper()} crossed 0.70 threshold!", flush=True)
        print("=" * 80 + "\n", flush=True)
    except Exception as e:
        print(f"[RenderLogger] Feynman verification logging error: {e}", file=sys.stderr, flush=True)


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
        result = "CORRECT ✓" if correct else "INCORRECT ✗"
        print(
            f"📊 [BKT INTERACTION] Student: {student_id} | Concept: {concept} ({question_id}) | "
            f"Result: {result} | BKT: {prior_mastery:.2f} ➔ {posterior_mastery:.2f} ({sign}{delta:.2f})",
            flush=True,
        )
        if threshold_crossed:
            print(f"🔓 [GATE UNLOCKED] {concept.upper()} mastery crossed 70% threshold!", flush=True)
    except Exception as e:
        print(f"[RenderLogger] Interaction logging error: {e}", file=sys.stderr, flush=True)
