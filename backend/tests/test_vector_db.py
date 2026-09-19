"""Unit and Integration Tests for LearniVerse-AI Vector Database.

Validates ChromaDB persistent client, resilient in-memory fallback,
semantic similarity retrieval, RAG context assembly, and FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.vector_db import InMemoryVectorFallback, VectorDBClient, vector_db_client
from backend.app.services.vector_db_service import VectorDBService, vector_db_service
from backend.app.services.dsa_corpus_data import DSA_KNOWLEDGE_CORPUS


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


class TestVectorDBStorageAndFallback:
    """Tests core database client abstractions and fallback mechanisms."""

    def test_in_memory_fallback_operations(self):
        fallback = InMemoryVectorFallback()
        fallback.add(
            ids=["doc_1", "doc_2"],
            documents=[
                "Recursion uses the call stack to unwind activation frames.",
                "Binary search trees enforce left less than root less than right.",
            ],
            metadatas=[
                {"concept": "recursion", "category": "overview"},
                {"concept": "tree", "category": "overview"},
            ],
        )
        assert fallback.count() == 2

        # Query recursion
        res_rec = fallback.query(query_text="call stack activation frames", n_results=1)
        assert res_rec["ids"][0][0] == "doc_1"
        assert res_rec["metadatas"][0][0]["concept"] == "recursion"

        # Query tree with where filter
        res_tree = fallback.query(
            query_text="search trees", n_results=1, where={"concept": "tree"}
        )
        assert res_tree["ids"][0][0] == "doc_2"

        # Reset
        fallback.reset()
        assert fallback.count() == 0

    def test_client_status_structure(self):
        status = vector_db_client.get_status()
        assert "active_engine" in status
        assert "is_persistent" in status
        assert "document_count" in status
        assert status["document_count"] >= len(DSA_KNOWLEDGE_CORPUS)


class TestVectorDBService:
    """Tests service-level indexing, semantic retrieval, and RAG formatting."""

    def test_seed_knowledge_base(self):
        res = vector_db_service.seed_dsa_knowledge_base(force=True)
        assert res["status"] == "seeded"
        assert res["document_count"] >= len(DSA_KNOWLEDGE_CORPUS)
        assert "recursion" in res["concepts"]
        assert "array" in res["concepts"]
        assert "stack" in res["concepts"]
        assert "tree" in res["concepts"]
        assert "linked_list" in res["concepts"]

    def test_similarity_search_recursion(self):
        results = vector_db_service.similarity_search(
            query="Russian Matryoshka nesting dolls unwinding",
            top_k=3,
        )
        assert len(results) > 0
        top = results[0]
        assert top["metadata"]["concept"] == "recursion"
        assert "analogy" in top["metadata"]["category"] or "Matryoshka" in top["document"]

    def test_similarity_search_with_concept_filter(self):
        results = vector_db_service.similarity_search(
            query="constant time memory address",
            top_k=2,
            concept="array",
        )
        assert len(results) > 0
        for r in results:
            assert r["metadata"]["concept"] == "array"

    def test_rag_context_formatting(self):
        rag_text = vector_db_service.get_rag_context(
            query="How does an array compute memory addresses?",
            concept="array",
            top_k=2,
        )
        assert "### AUTHORITATIVE DSA CURRICULUM CONTEXT:" in rag_text
        assert "array" in rag_text.lower()
        assert "Base_Address" in rag_text or "contiguous" in rag_text.lower()

    def test_list_concepts_catalog(self):
        catalog = vector_db_service.list_concepts()
        assert "concepts" in catalog
        assert "categories" in catalog
        assert len(catalog["concepts"]) >= 5
        assert catalog["total_documents"] == len(DSA_KNOWLEDGE_CORPUS)


class TestVectorDBRouterEndpoints:
    """Tests FastAPI REST endpoints under /api/vector/*."""

    def test_get_status_endpoint(self, client):
        resp = client.get("/api/vector/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "active_engine" in data
        assert "document_count" in data
        assert data["document_count"] > 0
        assert data["is_ready"] is True

    def test_get_concepts_endpoint(self, client):
        resp = client.get("/api/vector/concepts")
        assert resp.status_code == 200
        data = resp.json()
        assert "concepts" in data
        assert "array" in data["concepts"]
        assert "recursion" in data["concepts"]

    def test_post_seed_endpoint(self, client):
        resp = client.post("/api/vector/seed?force=false")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ["seeded", "already_seeded"]

    def test_post_search_endpoint(self, client):
        payload = {
            "query": "LIFO spring loaded plate dispenser",
            "top_k": 2,
            "concept": "stack",
            "include_rag_context": True,
        }
        resp = client.post("/api/vector/search", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] > 0
        assert len(data["results"]) > 0
        assert data["results"][0]["metadata"]["concept"] == "stack"
        assert data["rag_context"] is not None
        assert "stack" in data["rag_context"].lower()
