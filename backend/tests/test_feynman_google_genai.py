"""Automated test suite for Python Google GenAI Feynman Remediation Service."""

import json
from unittest.mock import MagicMock, patch
import pytest

from backend.app.models.feynman import FeynmanRequest
from backend.app.services.feynman.google_genai_service import (
    GoogleGenAIService,
    google_genai_service,
)
from backend.app.services.feynman_service import feynman_service
from backend.app.services.learner_service import learner_service
from backend.app.services.langcache_service import langcache_service


@pytest.fixture(autouse=True)
def reset_state():
    """Reset learner profiles, cache, and feynman session state."""
    learner_service.reset_profiles()
    feynman_service._sessions.clear()
    langcache_service.clear_cache()
    yield
    langcache_service.clear_cache()


class TestGoogleGenAIServiceUnit:
    def test_service_initialization_without_key(self, monkeypatch):
        """When no API key is in environment, service initializes safely and reports unavailable."""
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

        svc = GoogleGenAIService(api_key=None)
        assert svc.is_available() is False
        assert svc.get_client() is None

    def test_service_initialization_with_explicit_key(self):
        """When API key is provided, client is initialized."""
        svc = GoogleGenAIService(api_key="test_fake_api_key_12345")
        assert svc.is_available() is True
        assert svc.get_client() is not None

    def test_generate_explanation_successful_structured_output(self, monkeypatch):
        """Verify successful structured multimodal generation using mocked Google GenAI client."""
        svc = GoogleGenAIService(api_key="test_fake_api_key_12345")

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "decision": {
                "problem": "Student confuses call stack frame push/pop order during recursion unwinding",
                "modality": "VISUAL",
                "difficulty": "BEGINNER",
                "learning_objective": "Understand recursion stack frames unwinding to base case",
                "reason": "Visual diagrams clarify activation record lifecycles",
                "understood": ["function self-invocation"],
                "gaps": ["return value propagation"],
                "misconceptions": ["looping forever without memory footprint"],
                "confidence": 0.95
            },
            "explanation": {
                "title": "Recursion: The Magic Russian Nesting Dolls",
                "analogy": "Opening nested Russian Matryoshka dolls until reaching the tiny golden doll inside.",
                "detailed_explanation": "Each recursive call pauses and pushes a new doll onto the stack until the base case stops.",
                "code_or_trace": "def countdown(n): return 1 if n == 0 else n * countdown(n-1)",
                "voice_script": "Imagine opening a doll inside a doll. You can't close the big doll until the smallest is solved!"
            },
            "verification": {
                "prompt": "What happens to the stack memory when the recursive base case is reached?",
                "options": [
                    "Stack frames begin returning values and popping in reverse order",
                    "All stack memory is permanently allocated",
                    "The program immediately resets without returning values",
                    "A new recursive call is placed on the heap"
                ],
                "correct_option_index": 0,
                "explanation": "Base case halts descent, allowing active frames to unwind and pop.",
                "tested_skill": "recursion_unwinding"
            }
        })
        mock_client.models.generate_content.return_value = mock_response
        svc._client = mock_client

        context = feynman_service.get_learning_context("learner_b", "recursion")
        result = svc.generate_explanation(
            concept="recursion",
            context=context,
            student_input="Why does recursion pause?",
            selected_modality="VISUAL",
        )

        assert result is not None
        decision, explanation, verification = result

        assert decision.concept_id == "recursion"
        assert decision.modality == "VISUAL"
        assert "Matryoshka" in explanation.analogy or "doll" in explanation.analogy.lower()
        assert len(explanation.visual_steps) >= 4
        assert len(explanation.video_timeline) >= 3
        assert explanation.three_d_instruction is not None
        assert explanation.three_d_instruction.zone == "recursion_lab"
        assert verification.correct_option_index == 0
        assert "unwind" in verification.explanation.lower() or "pop" in verification.explanation.lower()

    def test_generate_explanation_fallback_on_api_exception(self):
        """When Google GenAI API raises an exception, generate_explanation returns None gracefully."""
        svc = GoogleGenAIService(api_key="test_fake_api_key_12345")

        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = RuntimeError("Google GenAI quota exceeded")
        svc._client = mock_client

        context = feynman_service.get_learning_context("learner_b", "stack")
        result = svc.generate_explanation(
            concept="stack",
            context=context,
            student_input="How does LIFO work?",
            selected_modality="VISUAL",
        )
        assert result is None


class TestFeynmanServiceGoogleGenAIIntegration:
    def test_process_feynman_request_uses_google_genai_when_available(self, monkeypatch):
        """When Google GenAI returns valid explanation, feynman_service marks llm_mode as 'google_genai'."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "decision": {
                "problem": "LIFO vs FIFO confusion",
                "modality": "VISUAL",
                "difficulty": "BEGINNER",
                "learning_objective": "Master Stack LIFO mechanics",
                "reason": "Spring tray visual model",
                "understood": ["storing items"],
                "gaps": ["removal order"],
                "misconceptions": ["first item inserted is removed first"],
                "confidence": 0.96
            },
            "explanation": {
                "title": "The Spring Plate Dispenser Analogy",
                "analogy": "Like a cafeteria spring tray dispenser: you can only grab the top plate!",
                "detailed_explanation": "Every push pushes existing plates down. Every pop takes the topmost plate.",
                "code_or_trace": "stack.push(10); stack.push(20); stack.pop(); # returns 20",
                "voice_script": "Think of cafeteria trays stacked on a spring mechanism."
            },
            "verification": {
                "prompt": "If you push A, then B, then C onto an empty stack, which item is popped first?",
                "options": ["C", "A", "B", "None"],
                "correct_option_index": 0,
                "explanation": "C was pushed last, so in LIFO it pops first.",
                "tested_skill": "lifo_order"
            }
        })
        mock_client.models.generate_content.return_value = mock_response

        # Monkeypatch google_genai_service client
        monkeypatch.setattr(google_genai_service, "get_client", lambda: mock_client)

        req = FeynmanRequest(
            student_id="learner_b",
            concept_id="stack",
            input_type="TEXT",
            input="Why does a stack remove the top item first?",
        )
        resp = feynman_service.process_feynman_request(req)

        assert resp.orchestrator == "google_genai"
        assert resp.llm_mode == "google_genai"
        assert resp.decision.concept_id == "stack"
        assert "cafeteria" in resp.explanation.analogy.lower() or "tray" in resp.explanation.analogy.lower()
        assert resp.verification_question.options[0] == "C"

    def test_process_feynman_request_semantic_cache_hit(self, monkeypatch):
        """Second identical query retrieves from LangCache with 'cached_google_genai' status."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "decision": {
                "problem": "Linked list head pointer lost",
                "modality": "VISUAL",
                "difficulty": "BEGINNER",
                "learning_objective": "Maintain reference to head node",
                "reason": "Pointer arrow diagram",
                "understood": ["node contains data and next"],
                "gaps": ["pointer reassignment order"],
                "misconceptions": ["nodes are contiguous in memory"],
                "confidence": 0.93
            },
            "explanation": {
                "title": "Linked Lists as a Treasure Scavenger Hunt",
                "analogy": "Each clue card points to the location of the next clue card.",
                "detailed_explanation": "If you lose the first clue card, the whole chain is unreachable.",
                "code_or_trace": "new_node.next = head; head = new_node;",
                "voice_script": "Remember the treasure hunt: don't lose your starting clue!"
            },
            "verification": {
                "prompt": "What happens if you reassign the head pointer before setting new_node.next?",
                "options": [
                    "You lose reference to the rest of the list (orphan memory)",
                    "The list automatically reverses",
                    "The list doubles in size",
                    "Nothing changes"
                ],
                "correct_option_index": 0,
                "explanation": "Prematurely overwriting head severs access to the original chain.",
                "tested_skill": "pointer_retention"
            }
        })
        mock_client.models.generate_content.return_value = mock_response
        monkeypatch.setattr(google_genai_service, "get_client", lambda: mock_client)

        req = FeynmanRequest(
            student_id="learner_b",
            concept_id="linked_list",
            input_type="TEXT",
            input="Why did I lose my linked list nodes?",
        )

        # First request -> Google GenAI MISS
        resp1 = feynman_service.process_feynman_request(req)
        assert resp1.llm_mode == "google_genai"
        assert resp1.cache_status == "MISS"

        # Second request -> LangCache HIT
        resp2 = feynman_service.process_feynman_request(req)
        assert resp2.llm_mode == "cached_google_genai"
        assert resp2.cache_status == "HIT"
        assert resp2.explanation.title == resp1.explanation.title

    def test_process_feynman_request_deterministic_fallback_when_offline(self, monkeypatch):
        """When Google GenAI has no client/key, falls back to deterministic curriculum engine cleanly."""
        monkeypatch.setattr(google_genai_service, "get_client", lambda: None)

        req = FeynmanRequest(
            student_id="learner_b",
            concept_id="stack",
            input_type="TEXT",
            input="Explain stack mechanics",
        )
        resp = feynman_service.process_feynman_request(req)

        assert resp.orchestrator == "google_genai"
        assert resp.llm_mode == "deterministic_fallback"
        assert resp.decision.concept_id == "stack"
        assert "cafeteria" in resp.explanation.analogy.lower() or "tray" in resp.explanation.analogy.lower()
        assert resp.verification_question.question_id is not None
