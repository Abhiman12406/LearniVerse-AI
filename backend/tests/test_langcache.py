"""Unit and Integration Tests for Redis LangCache Service and Adapters."""

import pytest
import time
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.models.feynman import FeynmanRequest
from backend.app.services.langcache_service import LangCacheService, langcache_service
from backend.app.services.feynman_service import FeynmanService


@pytest.fixture(autouse=True)
def reset_langcache():
    """Reset cache before and after every test."""
    langcache_service.clear_cache()
    langcache_service._hits = 0
    langcache_service._misses = 0
    langcache_service._total_latency_saved_ms = 0.0
    yield
    langcache_service.clear_cache()


def test_langcache_initialization():
    """Verify default initialization parameters and resilient in-memory provider."""
    stats = langcache_service.get_stats()
    assert "active_provider" in stats
    assert stats["similarity_threshold"] == 0.85
    assert stats["default_ttl_seconds"] == 86400
    assert stats["hits"] == 0
    assert stats["misses"] == 0


def test_semantic_similarity_matching():
    """Test exact match, semantic paraphrasing match, and unrelated query rejection."""
    prompt = "[recursion:VISUAL:BEGINNER] How does the call stack work during recursion?"
    response_payload = {
        "title": "Call Stack Cafeteria Trays",
        "analogy": "Every function call is a new tray added to the stack.",
    }

    # Store entry in feynman namespace
    stored = langcache_service.set(prompt=prompt, response=response_payload, namespace="feynman")
    assert stored is True

    # 1. Exact match search
    hit_exact = langcache_service.search(prompt=prompt, namespace="feynman")
    assert hit_exact is not None
    assert hit_exact["similarity"] == 1.0
    assert hit_exact["response"]["title"] == "Call Stack Cafeteria Trays"
    assert hit_exact["provider"] == "in_memory_fallback"

    # 2. Semantic paraphrased match (words overlapping in meaning, similar structure)
    paraphrased = "[recursion:VISUAL:BEGINNER] How does call stack operate in recursion?"
    hit_semantic = langcache_service.search(prompt=paraphrased, namespace="feynman", threshold=0.75)
    assert hit_semantic is not None
    assert hit_semantic["similarity"] >= 0.75
    assert hit_semantic["response"]["title"] == "Call Stack Cafeteria Trays"

    # 3. Unrelated query miss
    unrelated = "[array:TEXT:ADVANCED] Explain memory address offset calculation."
    hit_unrelated = langcache_service.search(prompt=unrelated, namespace="feynman")
    assert hit_unrelated is None


def test_namespace_isolation():
    """Verify entries in one namespace are not accessible from another."""
    prompt = "Explain tree traversal"
    langcache_service.set(prompt=prompt, response={"type": "feynman_expl"}, namespace="feynman")

    # Found in feynman
    assert langcache_service.search(prompt=prompt, namespace="feynman") is not None
    # Not found in diagnostic
    assert langcache_service.search(prompt=prompt, namespace="diagnostic") is None


def test_ttl_expiration():
    """Verify entries expire and are pruned after TTL expires."""
    prompt = "Short lived item"
    langcache_service.set(prompt=prompt, response={"data": 123}, namespace="default", ttl=1)

    # Immediately available
    assert langcache_service.search(prompt=prompt, namespace="default") is not None

    # Wait for TTL expiry
    time.sleep(1.1)

    # Should be expired and return None
    assert langcache_service.search(prompt=prompt, namespace="default") is None


def test_stats_and_telemetry():
    """Verify stats correctly track hits, misses, hit ratio, and namespace counts."""
    langcache_service.set(prompt="Test Query 1", response="Answer 1", namespace="feynman")
    langcache_service.set(prompt="Test Query 2", response="Answer 2", namespace="diagnostic")

    # Search existing -> hit
    langcache_service.search(prompt="Test Query 1", namespace="feynman")
    # Search non-existent -> miss
    langcache_service.search(prompt="Non existent query", namespace="feynman")

    stats = langcache_service.get_stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["hit_ratio"] == 0.5
    assert stats["total_cached_entries"] == 2
    assert stats["namespaces"]["feynman"] == 1
    assert stats["namespaces"]["diagnostic"] == 1


def test_cache_clear():
    """Verify selective and global cache clearing."""
    langcache_service.set(prompt="P1", response="R1", namespace="ns1")
    langcache_service.set(prompt="P2", response="R2", namespace="ns2")

    # Clear ns1
    res1 = langcache_service.clear_cache(namespace="ns1")
    assert res1["cleared_entries"] == 1
    assert langcache_service.search(prompt="P1", namespace="ns1") is None
    assert langcache_service.search(prompt="P2", namespace="ns2") is not None

    # Clear all
    res2 = langcache_service.clear_cache()
    assert res2["cleared_entries"] == 1
    assert langcache_service.search(prompt="P2", namespace="ns2") is None


def test_feynman_service_cache_hit_pipeline():
    """Verify FeynmanService end-to-end cache hit returns cached explanation and telemetry."""
    service = FeynmanService()
    concept = "recursion"
    student_input = "Why does my recursive function never return?"

    # Pre-seed cache with structured decision & explanation
    cache_prompt = "[recursion:VISUAL:BEGINNER] Why does my recursive function never return?"
    cached_payload = {
        "decision": {
            "decision_id": "FD_SEEDED",
            "concept_id": "recursion",
            "problem": "Missing base case causes endless recursion",
            "modality": "VISUAL",
            "difficulty": "BEGINNER",
            "learning_objective": "Understand recursion base case",
            "reason": "Seeded explanation for testing",
            "understood": ["function calls itself"],
            "gaps": ["base case termination"],
            "misconceptions": ["functions stop automatically"],
            "confidence": 0.95,
        },
        "explanation": {
            "title": "The Infinite Russian Nesting Dolls",
            "analogy": "Opening a doll inside a doll without finding the smallest solid wooden doll.",
            "detailed_explanation": "Without a base case, recursion executes forever until call stack overflow.",
            "code_or_trace": "if n <= 1: return 1",
            "voice_script": "Remember to always define your base case first.",
            "visual_steps": [],
            "video_frames": [],
            "three_d_apparatus": [],
        },
        "verification": {
            "question_id": "VQ_SEEDED",
            "prompt": "What stops infinite recursion?",
            "options": ["A base case", "A while loop", "A stack overflow", "A return 0"],
            "correct_option_index": 0,
            "explanation": "A base case halts recursion.",
            "tested_skill": "base_case_termination",
        },
    }

    langcache_service.set(prompt=cache_prompt, response=cached_payload, namespace="feynman")

    # Send request matching seeded concept & query
    req = FeynmanRequest(
        student_id="learner_b",
        concept_id="recursion",
        input=student_input,
        input_type="TEXT",
        requested_modality="VISUAL",
    )

    resp = service.process_feynman_request(req)
    assert resp.cache_status == "HIT"
    assert resp.llm_mode == "cached_gemini"
    assert resp.decision.learning_objective == "Understand recursion base case"
    assert resp.explanation.title == "The Infinite Russian Nesting Dolls"
    assert resp.verification_question.prompt == "What stops infinite recursion?"
    assert resp.latency_saved_ms is not None
    assert resp.latency_saved_ms > 0


def test_cache_api_endpoints():
    """Verify HTTP API endpoints for /api/cache/stats, /api/cache/clear, and /api/cache/test-search."""
    client = TestClient(app)

    # 1. GET /api/cache/stats
    res = client.get("/api/cache/stats")
    assert res.status_code == 200
    data = res.json()
    assert "active_provider" in data
    assert "hits" in data

    # 2. Seed an item and test POST /api/cache/test-search
    test_prompt = "[stack:VISUAL:BEGINNER] What is LIFO principle?"
    langcache_service.set(
        prompt=test_prompt,
        response={"answer": "Last In First Out"},
        namespace="feynman",
    )

    search_res = client.post(
        "/api/cache/test-search",
        json={"prompt": test_prompt, "namespace": "feynman"},
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["hit"] is True
    assert search_data["similarity"] == 1.0
    assert search_data["response"]["answer"] == "Last In First Out"

    # 3. POST /api/cache/clear
    clear_res = client.post("/api/cache/clear?namespace=feynman")
    assert clear_res.status_code == 200
    assert clear_res.json()["status"] == "SUCCESS"
