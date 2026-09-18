"""Unit tests for the decoupled Feynman Multimodal Explanation Adapters.

Conforms to codebase-design principles: "One adapter = hypothetical seam, two = real."
Verifies:
1. CurriculumExplanationRepository content retrieval and fallback.
2. TranscriptionAdapter offline simulation and error handling.
3. WebhookDispatchAdapter resilient local fallback.
4. End-to-end FeynmanService parity with decoupled adapters.
"""

import pytest
from backend.app.models.feynman import FeynmanRequest, TranscribeRequest
from backend.app.services.feynman.curriculum_content import (
    CURRICULUM_EXPLANATIONS,
    CurriculumExplanationRepository,
    curriculum_repository,
)
from backend.app.services.feynman.transcription_adapter import (
    TranscriptionAdapter,
    transcription_adapter,
)
from backend.app.services.feynman.webhook_adapter import (
    WebhookDispatchAdapter,
    webhook_adapter,
)
from backend.app.services.feynman_service import feynman_service


class TestCurriculumExplanationRepository:
    def test_repository_contains_all_core_concepts(self):
        """Repository must provide curated content for recursion, stack, linked_list, array, and tree."""
        supported = curriculum_repository.list_supported_concepts()
        assert "recursion" in supported
        assert "stack" in supported
        assert "linked_list" in supported
        assert "array" in supported
        assert "tree" in supported

    def test_repository_retrieves_complete_metadata(self):
        """Content bundle must contain analogy, visual steps, and verification question."""
        stack_content = curriculum_repository.get_content("stack")
        assert stack_content is not None
        assert "analogy" in stack_content
        assert "cafeteria plate dispenser" in stack_content["analogy"].lower()
        assert "visual_steps" in stack_content
        assert len(stack_content["visual_steps"]) >= 4
        assert "verification_question" in stack_content

    def test_repository_falls_back_gracefully(self):
        """Unknown concept falls back to recursion default."""
        fallback = curriculum_repository.get_content("nonexistent_quantum_sorting")
        assert fallback is not None
        assert "recursion" in fallback["title"].lower()

    def test_backward_compatible_dict_reexport(self):
        """CURRICULUM_EXPLANATIONS must remain accessible from feynman_service for backwards compatibility."""
        from backend.app.services.feynman_service import CURRICULUM_EXPLANATIONS as EXPORTED_DICT
        assert "recursion" in EXPORTED_DICT
        assert "stack" in EXPORTED_DICT


class TestTranscriptionAdapter:
    def test_offline_simulated_transcription(self, monkeypatch):
        """When GROQ_API_KEY is not configured, returns simulated transcription for test resilience."""
        monkeypatch.delenv("GROQ_API_KEY", raising=False)
        adapter = TranscriptionAdapter()

        res = adapter.transcribe_sync(b"dummy_bytes", audio_format="webm")
        assert res.success is True
        assert res.provider == "groq_whisper_simulated"
        assert len(res.transcript) > 0

    @pytest.mark.anyio
    async def test_async_transcription_empty_payload(self):
        """Empty audio base64 payload returns default simulated prompt."""
        adapter = TranscriptionAdapter()
        req = TranscribeRequest(audio_base64=None)

        res = await adapter.transcribe_async(req)
        assert res.success is True
        assert "No audio payload" in (res.warning or "")


class TestWebhookDispatchAdapter:
    def test_fallback_when_no_webhook_url(self, monkeypatch):
        """When N8N_WEBHOOK_URL is absent, falls back seamlessly to builtin_engine."""
        monkeypatch.delenv("N8N_WEBHOOK_URL", raising=False)
        adapter = WebhookDispatchAdapter()

        orchestrator, data = adapter.dispatch_n8n_sync({"session": "test"})
        assert orchestrator == "builtin_engine"
        assert data is None

    def test_fallback_when_target_unreachable(self):
        """Unreachable webhook endpoint seamlessly falls back to builtin_engine."""
        adapter = WebhookDispatchAdapter(default_webhook_url="http://127.0.0.1:59999/unreachable")
        orchestrator, data = adapter.dispatch_n8n_sync({"session": "test"}, timeout_seconds=0.1)

        assert orchestrator == "builtin_engine"
        assert data is None


class TestFeynmanServiceEndToEndParity:
    def test_process_feynman_request_end_to_end(self):
        """FeynmanService processes explanation request end-to-end using decoupled adapters."""
        req = FeynmanRequest(
            student_id="learner_b",
            concept_id="stack",
            input_type="TEXT",
            input="Why do we use stacks instead of queues?",
            requested_modality="VISUAL",
        )

        res = feynman_service.process_feynman_request(req)

        assert res.student_id == "learner_b"
        assert res.concept_id == "stack"
        assert res.explanation.title is not None
        assert len(res.explanation.visual_steps) >= 4
        assert res.verification_question.question_id is not None
        assert res.orchestrator in ["builtin_engine", "n8n"]
