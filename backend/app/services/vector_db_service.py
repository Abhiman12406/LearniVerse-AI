"""Vector Database Service for LearniVerse-AI Data Structures & Algorithms.

Provides semantic similarity search, automatic seeding from the authoritative
DSA knowledge corpus, and formatted RAG prompt context injection for pedagogical AI agents.
"""

import logging
from typing import Any, Dict, List, Optional

from backend.app.db.vector_db import VectorDBClient, vector_db_client
from backend.app.services.dsa_corpus_data import DSA_KNOWLEDGE_CORPUS

logger = logging.getLogger("learniverse.vector_db_service")


class VectorDBService:
    """Manages the semantic DSA knowledge store and agent retrieval interfaces."""

    def __init__(self, client: Optional[VectorDBClient] = None):
        self._client = client or vector_db_client

    def seed_dsa_knowledge_base(self, force: bool = False) -> Dict[str, Any]:
        """Seeds or updates the vector database with the full DSA knowledge corpus."""
        existing_count = self._client.count()
        if existing_count > 0 and not force:
            logger.info(f"Vector DB already contains {existing_count} documents. Skipping seed.")
            return {
                "status": "already_seeded",
                "document_count": existing_count,
                "message": "Vector DB is populated. Use force=True to re-index.",
            }

        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for item in DSA_KNOWLEDGE_CORPUS:
            ids.append(item["id"])
            # Combine title and content for optimal dense retrieval
            doc_text = f"{item['title']}\n\n{item['content']}"
            documents.append(doc_text)
            metadatas.append({
                "concept": str(item["concept"]),
                "subconcept": str(item["subconcept"]),
                "category": str(item["category"]),
                "difficulty": str(item["difficulty"]),
                "title": str(item["title"]),
            })

        self._client.add_documents(ids=ids, documents=documents, metadatas=metadatas)
        total = self._client.count()
        logger.info(f"Successfully indexed {len(ids)} DSA corpus documents into Vector DB.")

        concepts = sorted(list(set(item["concept"] for item in DSA_KNOWLEDGE_CORPUS)))
        categories = sorted(list(set(item["category"] for item in DSA_KNOWLEDGE_CORPUS)))

        return {
            "status": "seeded",
            "document_count": total,
            "indexed_chunks": len(ids),
            "concepts": concepts,
            "categories": categories,
        }

    def similarity_search(
        self,
        query: str,
        top_k: int = 4,
        concept: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Performs semantic similarity search against the DSA knowledge base.

        Args:
            query: Natural language question or code fragment.
            top_k: Number of most relevant documents to retrieve.
            concept: Optional concept filter (e.g. 'recursion', 'stack', 'tree').
            category: Optional category filter (e.g. 'analogy', 'misconception', 'code_implementation').

        Returns:
            List of ranked result dictionaries with document text, metadata, and similarity score.
        """
        if not query or not query.strip():
            return []

        # Ensure database is seeded
        if self._client.count() == 0:
            self.seed_dsa_knowledge_base()

        where_filter: Dict[str, Any] = {}
        if concept:
            where_filter["concept"] = concept.lower().strip()
        if category:
            where_filter["category"] = category.lower().strip()

        raw_results = self._client.query(
            query_text=query,
            n_results=top_k,
            where=where_filter if where_filter else None,
        )

        output: List[Dict[str, Any]] = []
        ids_list = raw_results.get("ids", [[]])[0]
        docs_list = raw_results.get("documents", [[]])[0]
        metas_list = raw_results.get("metadatas", [[]])[0]
        dists_list = raw_results.get("distances", [[]])[0]

        for i in range(len(ids_list)):
            dist = dists_list[i] if i < len(dists_list) else 0.0
            # Approximate cosine similarity from distance
            sim = round(max(0.0, 1.0 - dist), 4)
            output.append({
                "id": ids_list[i],
                "document": docs_list[i] if i < len(docs_list) else "",
                "metadata": metas_list[i] if i < len(metas_list) else {},
                "distance": dist,
                "similarity_score": sim,
            })

        return output

    def get_rag_context(
        self,
        query: str,
        concept: Optional[str] = None,
        top_k: int = 3,
    ) -> str:
        """Retrieves and formats top semantic chunks into a structured prompt injection context."""
        matches = self.similarity_search(query=query, top_k=top_k, concept=concept)
        if not matches:
            return ""

        sections = ["### AUTHORITATIVE DSA CURRICULUM CONTEXT:"]
        for idx, match in enumerate(matches, 1):
            meta = match.get("metadata", {})
            title = meta.get("title", "Curriculum Knowledge")
            concept_name = meta.get("concept", "general")
            category = meta.get("category", "concept")
            sections.append(
                f"[{idx}] {title} (Concept: {concept_name}, Category: {category}):\n{match['document']}\n"
            )

        return "\n".join(sections)

    def list_concepts(self) -> Dict[str, Any]:
        """Returns catalog of all supported DSA concepts, subconcepts, and categories."""
        by_concept: Dict[str, List[str]] = {}
        all_categories: Set[str] = set()

        for item in DSA_KNOWLEDGE_CORPUS:
            c = item["concept"]
            by_concept.setdefault(c, []).append(item["title"])
            all_categories.add(item["category"])

        return {
            "concepts": list(by_concept.keys()),
            "categories": sorted(list(all_categories)),
            "catalog": by_concept,
            "total_documents": len(DSA_KNOWLEDGE_CORPUS),
        }

    def get_status(self) -> Dict[str, Any]:
        """Provides status and telemetry for vector database endpoints."""
        db_status = self._client.get_status()
        return {
            **db_status,
            "corpus_definition_count": len(DSA_KNOWLEDGE_CORPUS),
            "is_ready": db_status["document_count"] > 0,
        }


# Global singleton service
vector_db_service = VectorDBService()
