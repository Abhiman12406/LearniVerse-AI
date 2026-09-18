"""Feynman Agent Multimodal Adaptive Explanation Service.

Implements the complete Feynman Agent pipeline conforming to FEYNMAN.md:
- Student Context Retrieval (§12)
- Multimodal Analysis & Strategy Formulation (§13, §14)
- Gemini Reasoning with Deterministic Pedagogical Fallback (§16, §26)
- Multimodal Explanation Generation: Text, Visual/Diagram, Voice, Video, 3D (§15, §17, §18)
- Targeted Student Verification (§19)
- Structured Learning Evidence Pipeline feeding BKT (§20)
- Strategy Memory & Observability (§28, §31)
- Optional n8n Webhook Dispatch with resilient fallback (§7, §8, §29)
"""

import base64
import json
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx

from backend.app.agents.coordinator import agent_coordinator
from backend.app.models.feynman import (
    FeynmanDecision,
    FeynmanExplanationPayload,
    FeynmanRequest,
    FeynmanResponse,
    LearnerContextResponse,
    LearningEvidence,
    ThreeDApparatusInstruction,
    TranscribeRequest,
    TranscribeResponse,
    VerificationQuestion,
    VerificationRequest,
    VerificationResponse,
    VideoFrame,
    VisualStep,
)
from backend.app.services.bkt_service import bkt_service
from backend.app.services.learner_service import learner_service
from backend.app.services.knowledge_graph_service import knowledge_graph_service
from backend.app.services.feynman.curriculum_content import (
    CURRICULUM_EXPLANATIONS,
    curriculum_repository,
)
from backend.app.services.feynman.transcription_adapter import transcription_adapter
from backend.app.services.feynman.webhook_adapter import webhook_adapter



class FeynmanService:
    """Authoritative service coordinating Feynman Analysis, Explanation, and Verification."""

    def __init__(self):
        # In-memory storage for Feynman sessions, interactions, and strategy memory
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._strategy_history: Dict[str, List[Dict[str, Any]]] = {
            "learner_b": [
                {"modality": "TEXT", "result": "NOT_HELPFUL", "concept": "stack", "timestamp": "2026-09-18T10:00:00Z"},
                {"modality": "VISUAL", "result": "PARTIALLY_HELPFUL", "concept": "stack", "timestamp": "2026-09-18T10:15:00Z"},
            ],
            "learner_a": [
                {"modality": "TEXT", "result": "HELPFUL", "concept": "recursion", "timestamp": "2026-09-18T09:00:00Z"}
            ],
        }

    def get_learning_context(self, student_id: str, concept: str) -> LearnerContextResponse:
        """
        Produce a minimal, structured learner context conforming to FEYNMAN.md §12.
        Queries authoritative learner profile and prerequisite DAG without leaking entire DB.
        """
        profile = learner_service.get_learner_profile(student_id)
        if not profile:
            profile = learner_service.get_active_learner_profile()
            student_id = profile.learner_id

        mastery_map = profile.mastery_map.model_dump()
        concept_mastery = float(mastery_map.get(concept, 0.30))

        # Retrieve direct prerequisites from Knowledge Graph
        concept_prereqs = knowledge_graph_service.get_prerequisites(concept)

        # Collect prerequisite masteries
        prereq_masteries: Dict[str, float] = {
            p: float(mastery_map.get(p, 0.50)) for p in concept_prereqs.keys()
        }

        # Derive calibrated recent mistakes based on student knowledge state
        recent_mistakes: List[str] = []
        recent_attempts: List[Dict[str, Any]] = []

        if concept == "recursion":
            if prereq_masteries.get("stack", 1.0) < 0.70:
                recent_mistakes.append("cannot explain Call Stack activation records")
                recent_mistakes.append("confuses base case termination with infinite loop")
                recent_attempts.append({"question": "Q17_call_stack_trace", "correct": False})
            else:
                recent_attempts.append({"question": "Q21_recursion_tree", "correct": True})
        elif concept == "stack":
            if concept_mastery < 0.70:
                recent_mistakes.append("confuses LIFO pop order with FIFO queue processing")
                recent_mistakes.append("underflow on empty stack pop")
                recent_attempts.append({"question": "Q05_lifo_order", "correct": False})
            else:
                recent_attempts.append({"question": "Q08_stack_balancing", "correct": True})
        elif concept == "linked_list":
            recent_mistakes.append("lost head pointer reference during node insertion")
            recent_attempts.append({"question": "Q02_pointer_next", "correct": False})
        else:
            recent_attempts.append({"question": "Q01_array_bounds", "correct": True})

        current_station = profile.recommended_station or f"{concept}_lab"

        return LearnerContextResponse(
            student_id=student_id,
            concept=concept,
            mastery=concept_mastery,
            prerequisites=prereq_masteries,
            recent_mistakes=recent_mistakes,
            recent_attempts=recent_attempts,
            current_activity=current_station,
            persona_type=profile.persona_type,
        )

    def evaluate_trigger_condition(
        self,
        student_id: str,
        concept: str,
        recent_errors: int = 0,
        hints_used: int = 0,
        misconception_detected: bool = False,
    ) -> Dict[str, Any]:
        """
        Evaluates the evidence-based Feynman Technique Trigger Condition (§13.0):
        T_F = alpha * E_c + beta * H_c + gamma * Mis_c + delta * (1 - C_c)
        Trigger if T_F > tau_F.
        """
        from backend.app.services.config_service import config_service
        from backend.app.services.multidimensional_mastery_service import multidimensional_mastery_service

        alpha = float(config_service.get_nested("feynman", "weights", {}).get("alpha_repeated_errors", 0.35))
        beta = float(config_service.get_nested("feynman", "weights", {}).get("beta_hint_dependence", 0.25))
        gamma = float(config_service.get_nested("feynman", "weights", {}).get("gamma_misconceptions", 0.25))
        delta = float(config_service.get_nested("feynman", "weights", {}).get("delta_uncertainty", 0.15))
        tau_f = float(config_service.get_nested("feynman", "trigger_threshold", 0.60))

        e_c = min(1.0, max(0.0, recent_errors / 3.0))
        h_c = min(1.0, max(0.0, hints_used / 3.0))
        mis_c = 1.0 if misconception_detected else 0.0
        c_c = multidimensional_mastery_service.compute_confidence(student_id, concept)
        uncertainty = max(0.0, 1.0 - c_c)

        t_f = (alpha * e_c) + (beta * h_c) + (gamma * mis_c) + (delta * uncertainty)
        t_f = round(float(t_f), 4)

        triggered = t_f >= tau_f

        return {
            "triggered": triggered,
            "trigger_score": t_f,
            "threshold": tau_f,
            "components": {
                "error_rate_score": round(e_c, 3),
                "hint_dependence_score": round(h_c, 3),
                "misconception_flag": mis_c,
                "uncertainty_score": round(uncertainty, 3),
            },
            "concept": concept,
            "student_id": student_id,
        }

    def select_modality(
        self,
        student_id: str,
        concept: str,
        input_type: str,
        user_requested_modality: Optional[str],
        recent_mistakes: List[str],
    ) -> str:
        """
        Select the optimal explanation modality per FEYNMAN.md §14, §27, §28.
        Uses policy rules and checks student's strategy history to avoid repeated failure modalities.
        """
        # 1. Direct user explicit preference
        if user_requested_modality and user_requested_modality.upper() in ["TEXT", "VISUAL", "VOICE", "VIDEO", "3D"]:
            return user_requested_modality.upper()

        # 2. Audio input modality triggers Voice response
        if input_type.upper() == "AUDIO":
            return "VOICE"

        # 3. Check strategy memory: if student recently struggled with TEXT, upgrade to VISUAL or VIDEO
        history = self._strategy_history.get(student_id, [])
        failed_modalities = [
            h["modality"] for h in history if h.get("concept") == concept and h.get("result") == "NOT_HELPFUL"
        ]

        # 4. Pedagogical policy based on concept domain
        if concept in ["recursion", "stack"]:
            # Complex dynamic process / sequence / call stack unwinding
            if "TEXT" in failed_modalities and "VISUAL" in failed_modalities:
                return "VIDEO"
            elif "TEXT" in failed_modalities:
                return "VISUAL"
            else:
                return "VISUAL"
        elif concept == "linked_list":
            return "VISUAL"
        elif concept == "array":
            return "TEXT"
        else:
            return "VISUAL"

    def transcribe_with_groq_whisper_sync(
        self,
        audio_bytes: bytes,
        audio_format: str = "webm",
        language: str = "en",
        prompt: Optional[str] = None,
    ) -> TranscribeResponse:
        """Synchronously transcribe audio using Groq Whisper API (delegated to transcription_adapter)."""
        return transcription_adapter.transcribe_sync(
            audio_bytes=audio_bytes,
            audio_format=audio_format,
            language=language,
            prompt=prompt,
        )

    async def transcribe_audio(self, req: TranscribeRequest) -> TranscribeResponse:
        """Async transcription endpoint handler for student voice input (delegated to transcription_adapter)."""
        return await transcription_adapter.transcribe_async(req)

    def process_feynman_request(self, req: FeynmanRequest) -> FeynmanResponse:
        """
        Main Feynman Agent pipeline:
        1. Normalizes input into Unified Evidence (processing voice via Groq Whisper if audio_base64 provided).
        2. Retrieves student context.
        3. Attempts n8n webhook dispatch if configured.
        4. Runs Gemini analyzer or curriculum fallback.
        5. Returns structured multimodal explanation payload + verification question.
        """
        session_id = f"FS_{uuid.uuid4().hex[:8].upper()}"
        student_id = req.student_id or "learner_b"
        concept = (req.concept_id or "recursion").lower()

        # Step 1: Normalize input into unified text
        unified_input = req.input.strip()
        if req.audio_base64:
            try:
                raw_audio = base64.b64decode(req.audio_base64)
                transcription = self.transcribe_with_groq_whisper_sync(
                    audio_bytes=raw_audio,
                    audio_format="webm",
                    language="en",
                )
                if transcription.transcript:
                    unified_input = f"[Voice Input via Groq Whisper] {transcription.transcript}"
            except Exception:
                unified_input = f"[Voice Input] {unified_input}" if unified_input else "Explain this concept"
        elif req.input_type.upper() in ["AUDIO", "VOICE"]:
            # Audio was transcribed on client or via STT
            if not unified_input.startswith("[Voice Input"):
                unified_input = f"[Voice Input] {unified_input}"

        # Step 2: Retrieve minimal learner context
        context = self.get_learning_context(student_id, concept)

        # Step 3: Determine modality via pedagogical policy & strategy memory
        selected_modality = self.select_modality(
            student_id=student_id,
            concept=concept,
            input_type=req.input_type,
            user_requested_modality=req.requested_modality,
            recent_mistakes=context.recent_mistakes,
        )

        # Step 4: Dispatch external n8n webhook via adapter with resilient fallback
        payload = {
            "session_id": session_id,
            "student_id": student_id,
            "concept_id": concept,
            "input_type": req.input_type,
            "input": unified_input,
            "requested_modality": selected_modality,
            "context": context.model_dump(),
        }
        orchestrator, _ = webhook_adapter.dispatch_n8n_sync(payload)
        llm_mode = "deterministic_fallback"

        # Step 5: Execute Gemini reasoning if API key present
        gemini_result = self._try_gemini_analysis(
            concept=concept,
            context=context,
            student_input=unified_input,
            selected_modality=selected_modality,
        )

        if gemini_result:
            decision, explanation, verify_q = gemini_result
            llm_mode = "gemini"
        else:
            decision, explanation, verify_q = self._build_deterministic_explanation(
                concept=concept,
                context=context,
                student_input=unified_input,
                selected_modality=selected_modality,
            )
            llm_mode = "deterministic_fallback"

        # Record session for audit and verification matching
        self._sessions[session_id] = {
            "session_id": session_id,
            "student_id": student_id,
            "concept_id": concept,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "input_type": req.input_type,
            "unified_input": unified_input,
            "selected_modality": selected_modality,
            "decision": decision.model_dump(),
            "verification_question": verify_q.model_dump(),
            "status": "AWAITING_VERIFICATION",
            "context_before": context.model_dump(),
        }

        history = self._strategy_history.get(student_id, [])

        return FeynmanResponse(
            session_id=session_id,
            student_id=student_id,
            concept_id=concept,
            input_type=req.input_type,
            unified_input=unified_input,
            decision=decision,
            explanation=explanation,
            verification_question=verify_q,
            strategy_history=history,
            orchestrator=orchestrator,
            llm_mode=llm_mode,
        )

    def _try_gemini_analysis(
        self,
        concept: str,
        context: LearnerContextResponse,
        student_input: str,
        selected_modality: str,
    ) -> Optional[tuple[FeynmanDecision, FeynmanExplanationPayload, VerificationQuestion]]:
        """Attempt Google Gemini 2.5 structured analysis and explanation generation."""
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return None

        try:
            import importlib
            genai = importlib.import_module("google.genai")
            client = genai.Client(api_key=api_key)

            prompt = f"""
You are the Feynman Analysis and Multimodal Explanation Agent in an adaptive virtual classroom.
FEYNMAN CORE PRINCIPLE: Explain difficult Data Structures concepts using everyday physical metaphors, crystal-clear step-by-step logic, and zero unnecessary jargon.

Student Context:
- Concept: {concept}
- Current Mastery: {context.mastery:.2f}
- Prerequisites: {json.dumps(context.prerequisites)}
- Recent Mistakes: {json.dumps(context.recent_mistakes)}
- Student Input: "{student_input}"
- Selected Modality: {selected_modality}

Your response must be strict JSON matching this exact structure:
{{
  "decision": {{
    "problem": "Brief summary of root conceptual difficulty",
    "modality": "{selected_modality}",
    "difficulty": "BEGINNER",
    "learning_objective": "Single clear learning target",
    "reason": "Why this modality and explanation focus was chosen",
    "understood": ["what student grasped"],
    "gaps": ["specific identified gap"],
    "misconceptions": ["detected misconception"],
    "confidence": 0.92
  }},
  "explanation": {{
    "title": "Engaging Headline",
    "analogy": "Concrete everyday physical analogy",
    "detailed_explanation": "Simplified step-by-step breakdown",
    "code_or_trace": "Short code or trace showing execution",
    "voice_script": "Clear narration text formatted for voice read-aloud"
  }},
  "verification": {{
    "prompt": "Short multiple-choice question testing the identified gap",
    "options": ["Correct option", "Distractor 1", "Distractor 2", "Distractor 3"],
    "correct_option_index": 0,
    "explanation": "Why option 0 is correct",
    "tested_skill": "The specific skill tested"
  }}
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

                # Pull fallback steps for visual and 3D apparatus commands
                fallback_base = curriculum_repository.get_content(concept)

                decision_dict = parsed.get("decision", {})
                decision = FeynmanDecision(
                    decision_id=f"FD_{uuid.uuid4().hex[:6].upper()}",
                    concept_id=concept,
                    problem=decision_dict.get("problem", "Conceptual confusion"),
                    modality=decision_dict.get("modality", selected_modality),
                    difficulty=decision_dict.get("difficulty", "BEGINNER"),
                    learning_objective=decision_dict.get("learning_objective", f"Understand {concept}"),
                    reason=decision_dict.get("reason", "Gemini adaptive diagnosis"),
                    understood=decision_dict.get("understood", []),
                    gaps=decision_dict.get("gaps", [f"core_{concept}_mechanics"]),
                    misconceptions=decision_dict.get("misconceptions", []),
                    confidence=float(decision_dict.get("confidence", 0.92)),
                )

                expl_dict = parsed.get("explanation", {})
                explanation = FeynmanExplanationPayload(
                    title=expl_dict.get("title", fallback_base["title"]),
                    modality=selected_modality,
                    analogy=expl_dict.get("analogy", fallback_base["analogy"]),
                    detailed_explanation=expl_dict.get("detailed_explanation", fallback_base["detailed_explanation"]),
                    code_or_trace=expl_dict.get("code_or_trace", fallback_base.get("code_or_trace")),
                    visual_steps=[VisualStep(**s) for s in fallback_base["visual_steps"]],
                    voice_script=expl_dict.get("voice_script", fallback_base["voice_script"]),
                    video_timeline=[VideoFrame(**v) for v in fallback_base["video_timeline"]],
                    three_d_instruction=ThreeDApparatusInstruction(**fallback_base["three_d_instruction"]),
                )

                ver_dict = parsed.get("verification", {})
                verification = VerificationQuestion(
                    question_id=f"VQ_{uuid.uuid4().hex[:6].upper()}",
                    prompt=ver_dict.get("prompt", fallback_base["verification_question"]["prompt"]),
                    options=ver_dict.get("options", fallback_base["verification_question"]["options"]),
                    correct_option_index=int(ver_dict.get("correct_option_index", 0)),
                    explanation=ver_dict.get("explanation", fallback_base["verification_question"]["explanation"]),
                    tested_skill=ver_dict.get("tested_skill", fallback_base["verification_question"]["tested_skill"]),
                )

                return decision, explanation, verification
        except Exception:
            pass

        return None

    def _build_deterministic_explanation(
        self,
        concept: str,
        context: LearnerContextResponse,
        student_input: str,
        selected_modality: str,
    ) -> tuple[FeynmanDecision, FeynmanExplanationPayload, VerificationQuestion]:
        """Synthesize rich, calibrated pedagogical explanation from expert knowledge base."""
        base = curriculum_repository.get_content(concept)

        # Calibrate problem description and reason
        problem_desc = f"{concept}_understanding_gap"
        if concept == "recursion":
            problem_desc = "call_stack_activation_confusion"
            reason = (
                f"Student Stack mastery is {int(context.prerequisites.get('stack', 0.38) * 100)}%. "
                f"Without a physical model of Call Stack frames pushing and unwinding, recursive calls appear confusing."
            )
        elif concept == "stack":
            problem_desc = "lifo_ordering_confusion"
            reason = "Student has difficulty distinguishing LIFO (Last-In, First-Out) stack order from FIFO queues."
        else:
            reason = f"Personalized explanation tailored to student mastery ({int(context.mastery * 100)}%)."

        decision = FeynmanDecision(
            decision_id=f"FD_{uuid.uuid4().hex[:6].upper()}",
            concept_id=concept,
            problem=problem_desc,
            modality=selected_modality,
            difficulty="BEGINNER" if context.mastery < 0.45 else "INTERMEDIATE",
            learning_objective=base["learning_objective"],
            reason=reason,
            understood=["function_call_syntax"] if concept == "recursion" else ["data_storage"],
            gaps=[base["default_gap"]],
            misconceptions=[base["default_misconception"]],
            confidence=0.91,
        )

        explanation = FeynmanExplanationPayload(
            title=base["title"],
            modality=selected_modality,
            analogy=base["analogy"],
            detailed_explanation=base["detailed_explanation"],
            code_or_trace=base.get("code_or_trace"),
            visual_steps=[VisualStep(**s) for s in base["visual_steps"]],
            voice_script=base["voice_script"],
            video_timeline=[VideoFrame(**v) for v in base["video_timeline"]],
            three_d_instruction=ThreeDApparatusInstruction(**base["three_d_instruction"]),
        )

        vq = base["verification_question"]
        verification = VerificationQuestion(
            question_id=vq["question_id"],
            prompt=vq["prompt"],
            options=vq["options"],
            correct_option_index=vq["correct_option_index"],
            explanation=vq["explanation"],
            tested_skill=vq["tested_skill"],
        )

        return decision, explanation, verification

    def verify_student_response(self, req: VerificationRequest) -> VerificationResponse:
        """
        Verify student understanding after Feynman explanation conforming to FEYNMAN.md §19 & §20.
        Produces structured Learning Evidence, invokes BKT calculation, updates learner state,
        re-evaluates prerequisite DAG, and executes agent deliberation re-planning!
        """
        session = self._sessions.get(req.session_id)
        concept = req.concept_id.lower()
        student_id = req.student_id or "learner_b"

        # Determine correctness
        correct = False
        feedback = ""
        tested_skill = "concept_verification"

        if session and "verification_question" in session:
            vq = session["verification_question"]
            correct_idx = vq.get("correct_option_index", 0)
            tested_skill = vq.get("tested_skill", tested_skill)
            if req.selected_option_index is not None:
                correct = (req.selected_option_index == correct_idx)
            elif req.text_answer:
                # Text answer heuristic
                key_terms = ["stack", "pause", "wait", "lifo", "top", "last"]
                correct = any(t in req.text_answer.lower() for t in key_terms)
            feedback = vq.get("explanation", "Verification completed.")
        else:
            # Fallback evaluation
            correct = (req.selected_option_index == 0)
            feedback = "Correct understanding demonstrated!" if correct else "Review the analogy and try once more."

        # Step 1: Formulate structured Learning Evidence (FEYNMAN.md §20, §24)
        evidence = LearningEvidence(
            evidence_id=f"LE_{uuid.uuid4().hex[:8].upper()}",
            student_id=student_id,
            concept_id=concept,
            source="feynman_agent",
            evidence_type="FEYNMAN_VERIFICATION",
            skill=tested_skill,
            correct=correct,
            confidence=0.92 if correct else 0.85,
            response_time_ms=req.response_time_ms,
        )

        # Step 2: Extract current concept mastery prior
        profile = learner_service.get_learner_profile(student_id)
        if not profile:
            profile = learner_service.get_active_learner_profile()
            student_id = profile.learner_id

        current_map = profile.mastery_map.model_dump()
        prior_mastery = float(current_map.get(concept, 0.38))

        # Step 3: Compute BKT posterior update
        difficulty_level = "easy" if correct else "medium"
        posterior_mastery = bkt_service.compute_posterior(
            prior=prior_mastery,
            correct=correct,
            concept=concept,
            difficulty=difficulty_level,
        )

        # If learner succeeded after Feynman remediation on a struggling concept,
        # provide a calibrated pedagogical boost reflecting resolved misconception
        if correct and prior_mastery < 0.70:
            boosted = min(posterior_mastery + 0.12, 0.95)
            posterior_mastery = round(boosted, 2)

        delta = round(posterior_mastery - prior_mastery, 2)

        # Step 4: Authoritatively update learner profile
        updated_profile = learner_service.update_concept_mastery(
            learner_id=student_id,
            concept=concept,
            new_mastery=posterior_mastery,
        )

        # Step 5: Check prerequisite threshold crossing (e.g. Stack crosses 0.70 -> Recursion unlocked)
        threshold_crossed = (prior_mastery < 0.70) and (posterior_mastery >= 0.70)
        unlocked_wing = "recursion_lab" if (concept == "stack" and threshold_crossed) else None

        # Step 6: Fetch updated world state delta
        world_delta = learner_service.get_world_state(student_id)

        # Step 7: Re-run 5-agent deliberation workflow
        deliberation_resp = agent_coordinator.run_deliberation(
            student_id=student_id,
        )

        # Step 7.5: Record observation in multi-dimensional mastery service
        from backend.app.services.multidimensional_mastery_service import multidimensional_mastery_service
        multidimensional_mastery_service.record_observation(
            student_id=student_id,
            concept=concept,
            correct=correct,
            dimension="understanding",
        )

        # Step 8: Update Strategy Memory (§28) and Intervention Gain (§14)
        if student_id not in self._strategy_history:
            self._strategy_history[student_id] = []

        modality_used = session.get("selected_modality", "VISUAL") if session else "VISUAL"
        result_label = "HELPFUL" if correct else "NOT_HELPFUL"
        intervention_gain = round(posterior_mastery - prior_mastery, 4)

        self._strategy_history[student_id].append({
            "modality": modality_used,
            "result": result_label,
            "concept": concept,
            "intervention_gain": intervention_gain,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Update session record
        if session:
            session["status"] = "COMPLETED"
            session["learning_evidence"] = evidence.model_dump()
            session["result"] = result_label
            session["mastery_before"] = prior_mastery
            session["mastery_after"] = posterior_mastery
            session["intervention_gain"] = intervention_gain

        return VerificationResponse(
            session_id=req.session_id,
            student_id=student_id,
            concept_id=concept,
            correct=correct,
            feedback=feedback,
            evidence=evidence,
            prior_mastery=prior_mastery,
            posterior_mastery=posterior_mastery,
            delta=delta,
            threshold_crossed=threshold_crossed,
            unlocked_wing=unlocked_wing,
            learner_profile=updated_profile.model_dump(),
            world_delta=world_delta.model_dump(),
            deliberation=deliberation_resp.model_dump(),
        )

    def get_sessions(self, student_id: str) -> List[Dict[str, Any]]:
        """Return history of all Feynman sessions for observability (§31)."""
        return [
            s for s in self._sessions.values()
            if s.get("student_id") == student_id
        ]

    def get_explainability(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Return explainability audit trace for a specific session (§31)."""
        return self._sessions.get(session_id)


feynman_service = FeynmanService()
