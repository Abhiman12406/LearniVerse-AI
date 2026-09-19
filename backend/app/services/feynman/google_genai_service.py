"""Python Google GenAI Service for Feynman Multimodal Remediation & Diagnosis.

Leverages the official Google GenAI SDK (`google-genai`) to generate
deep pedagogical explanations based on the Feynman Technique:
- Deconstructing complex DSA concepts into everyday physical analogies
- Detecting subtle conceptual gaps and misconceptions
- Formulating multimodal delivery instructions (Text, Visual, Voice, Video, 3D)
- Generating targeted verification questions with immediate feedback
"""

import json
import logging
import os
import uuid
from typing import Any, Dict, Optional, Tuple

from google import genai
from google.genai import types

from backend.app.models.feynman import (
    FeynmanDecision,
    FeynmanExplanationPayload,
    LearnerContextResponse,
    ThreeDApparatusInstruction,
    VerificationQuestion,
    VideoFrame,
    VisualStep,
)
from backend.app.services.feynman.curriculum_content import curriculum_repository

logger = logging.getLogger("google_genai_feynman")


class GoogleGenAIService:
    """Authoritative Python Google GenAI service for Feynman conceptual remediation."""

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        self._client: Optional[genai.Client] = None
        if self._api_key:
            try:
                self._client = genai.Client(api_key=self._api_key)
            except Exception as e:
                logger.warning("Failed to initialize Google GenAI Client: %s", e)
                self._client = None

    def get_client(self) -> Optional[genai.Client]:
        """Retrieve active Google GenAI client or lazily instantiate if env var became available."""
        if self._client is None:
            current_key = self._api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            if current_key:
                try:
                    self._client = genai.Client(api_key=current_key)
                    self._api_key = current_key
                except Exception as e:
                    logger.warning("Failed to initialize Google GenAI Client: %s", e)
                    self._client = None
        return self._client

    def is_available(self) -> bool:
        """Check if Google GenAI service is configured with valid credentials."""
        return self.get_client() is not None

    def generate_explanation(
        self,
        concept: str,
        context: LearnerContextResponse,
        student_input: str,
        selected_modality: str,
        model_name: str = "gemini-2.5-flash",
    ) -> Optional[Tuple[FeynmanDecision, FeynmanExplanationPayload, VerificationQuestion]]:
        """
        Synthesize Feynman diagnosis, multimodal explanation, and verification quiz
        using Python Google GenAI SDK.

        Returns (FeynmanDecision, FeynmanExplanationPayload, VerificationQuestion) or None on failure.
        """
        client = self.get_client()
        if not client:
            return None

        prompt = f"""
You are the authoritative Feynman Pedagogical Remediation Agent in an adaptive virtual computer science classroom.
FEYNMAN CORE PRINCIPLE: Explain difficult Data Structures & Algorithms concepts using everyday physical metaphors, crystal-clear step-by-step logic, and zero unnecessary jargon.

Student Context:
- Concept: {concept}
- Current Mastery: {context.mastery:.2f}
- Prerequisites: {json.dumps(context.prerequisites)}
- Recent Mistakes: {json.dumps(context.recent_mistakes)}
- Student Input / Struggle: "{student_input}"
- Target Modality: {selected_modality}

Respond with strict JSON adhering to this exact schema:
{{
  "decision": {{
    "problem": "Brief summary of root conceptual difficulty",
    "modality": "{selected_modality}",
    "difficulty": "BEGINNER",
    "learning_objective": "Single clear learning target",
    "reason": "Why this modality and explanation focus was chosen",
    "understood": ["concept elements student already grasps"],
    "gaps": ["specific identified knowledge gap"],
    "misconceptions": ["detected misconception"],
    "confidence": 0.92
  }},
  "explanation": {{
    "title": "Engaging Headline",
    "analogy": "Concrete everyday physical analogy (e.g. cafeteria spring tray dispenser for stack, nesting doll for recursion, scavenger hunt for linked list)",
    "detailed_explanation": "Simplified step-by-step breakdown stripping away technical jargon",
    "code_or_trace": "Short code snippet or execution trace demonstrating the concept",
    "voice_script": "Clear narration text formatted for voice read-aloud"
  }},
  "verification": {{
    "prompt": "Targeted multiple-choice question testing the specific identified gap",
    "options": ["Correct option", "Distractor 1", "Distractor 2", "Distractor 3"],
    "correct_option_index": 0,
    "explanation": "Why the correct option is right and what principle it demonstrates",
    "tested_skill": "The specific skill or concept tested"
  }}
}}
"""

        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )

            if not response or not response.text:
                return None

            cleaned_text = response.text.strip()
            # Clean possible markdown fence if returned
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]

            parsed = json.loads(cleaned_text.strip())

            # Retrieve rich curriculum assets to guarantee interactive diagrams, video timeline, and 3D apparatus instructions
            fallback_base = curriculum_repository.get_content(concept)

            dec_dict = parsed.get("decision", {})
            decision = FeynmanDecision(
                decision_id=f"FD_GENAI_{uuid.uuid4().hex[:6].upper()}",
                concept_id=concept,
                problem=dec_dict.get("problem", f"Difficulty understanding {concept}"),
                modality=dec_dict.get("modality", selected_modality),
                difficulty=dec_dict.get("difficulty", "BEGINNER"),
                learning_objective=dec_dict.get("learning_objective", f"Master core mechanics of {concept}"),
                reason=dec_dict.get("reason", "Google GenAI adaptive diagnosis"),
                understood=dec_dict.get("understood", []),
                gaps=dec_dict.get("gaps", [fallback_base.get("default_gap", f"{concept}_gap")]),
                misconceptions=dec_dict.get("misconceptions", [fallback_base.get("default_misconception", "")]),
                confidence=float(dec_dict.get("confidence", 0.94)),
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
                question_id=f"VQ_GENAI_{uuid.uuid4().hex[:6].upper()}",
                prompt=ver_dict.get("prompt", fallback_base["verification_question"]["prompt"]),
                options=ver_dict.get("options", fallback_base["verification_question"]["options"]),
                correct_option_index=int(ver_dict.get("correct_option_index", 0)),
                explanation=ver_dict.get("explanation", fallback_base["verification_question"]["explanation"]),
                tested_skill=ver_dict.get("tested_skill", fallback_base["verification_question"]["tested_skill"]),
            )

            return decision, explanation, verification

        except Exception as e:
            logger.warning("Google GenAI explanation generation failed, falling back: %s", e)
            return None


google_genai_service = GoogleGenAIService()
