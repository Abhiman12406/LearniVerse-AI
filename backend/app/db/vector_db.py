"""Vector Database Client and Abstraction Layer for LearniVerse-AI.

Supports persistent ChromaDB storage with automatic in-memory fallback
to ensure zero-downtime operation across all environments.
"""

import logging
import os
import re
from math import sqrt
from typing import Any, Dict, List, Optional

logger = logging.getLogger("learniverse.vector_db")

try:
    import chromadb
    from chromadb.config import Settings
    HAS_CHROMADB = True
except ImportError:
    chromadb = None
    HAS_CHROMADB = False


class InMemoryVectorFallback:
    """Zero-dependency resilient vector fallback using TF-IDF / term-frequency cosine similarity."""

    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {}

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text)]

    def _vectorize(self, tokens: List[str]) -> Dict[str, float]:
        tf: Dict[str, float] = {}
        for token in tokens:
            tf[token] = tf.get(token, 0.0) + 1.0
        # Normalize
        norm = sqrt(sum(v * v for v in tf.values())) or 1.0
        return {k: v / norm for k, v in tf.items()}

    def _cosine_similarity(self, vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
        common_keys = set(vec_a.keys()) & set(vec_b.keys())
        return sum(vec_a[k] * vec_b[k] for k in common_keys)

    def add(self, ids: List[str], documents: List[str], metadatas: List[Dict[str, Any]]) -> None:
        for doc_id, doc, meta in zip(ids, documents, metadatas):
            tokens = self._tokenize(doc)
            self.documents[doc_id] = {
                "id": doc_id,
                "document": doc,
                "metadata": meta,
                "vector": self._vectorize(tokens),
            }

    def query(
        self,
        query_text: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, List[Any]]:
        q_tokens = self._tokenize(query_text)
        q_vec = self._vectorize(q_tokens)

        scored: List[tuple] = []
        for doc_id, entry in self.documents.items():
            meta = entry["metadata"]
            if where:
                match = True
                for k, v in where.items():
                    if meta.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            sim = self._cosine_similarity(q_vec, entry["vector"])
            scored.append((sim, doc_id, entry["document"], meta))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_k = scored[:n_results]

        return {
            "ids": [[item[1] for item in top_k]],
            "documents": [[item[2] for item in top_k]],
            "metadatas": [[item[3] for item in top_k]],
            "distances": [[1.0 - max(0.0, item[0]) for item in top_k]],
        }

    def count(self) -> int:
        return len(self.documents)

    def reset(self) -> None:
        self.documents.clear()


class VectorDBClient:
    """Manages persistent ChromaDB vector storage with in-memory fallback."""

    def __init__(self, persist_dir: Optional[str] = None):
        self.collection_name = "learniverse_dsa_knowledge"
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.persist_dir = persist_dir or os.getenv(
            "VECTOR_DB_DIR", os.path.join(base_dir, "data", "vector_store")
        )
        self._chroma_client = None
        self._collection = None
        self._fallback = InMemoryVectorFallback()
        self.is_persistent = False
        self._init_db()

    def _init_db(self) -> None:
        """Attempts to initialize ChromaDB PersistentClient, falling back if needed."""
        if not HAS_CHROMADB:
            logger.warning("ChromaDB library not available. Operating in in-memory fallback mode.")
            return

        try:
            os.makedirs(self.persist_dir, exist_ok=True)
            self._chroma_client = chromadb.PersistentClient(path=self.persist_dir)
            self._collection = self._chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "LearniVerse-AI DSA Curriculum Knowledge Base"},
            )
            self.is_persistent = True
            logger.info(f"Initialized ChromaDB persistent vector database at '{self.persist_dir}'.")
        except Exception as exc:
            logger.error(f"Failed to initialize ChromaDB PersistentClient: {exc}. Using fallback.")
            self._chroma_client = None
            self._collection = None
            self.is_persistent = False

    def add_documents(
        self,
        ids: List[str],
        documents: List[str],
        metadatas: List[Dict[str, Any]],
    ) -> bool:
        """Adds or updates documents in the vector store."""
        # Update in-memory fallback first for instant mirroring
        self._fallback.add(ids=ids, documents=documents, metadatas=metadatas)

        if self.is_persistent and self._collection is not None:
            try:
                # Use upsert to prevent duplicate key collisions on re-seeding
                self._collection.upsert(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas,
                )
                return True
            except Exception as exc:
                logger.error(f"ChromaDB upsert error: {exc}. Handled by in-memory mirror.")
        return True

    def query(
        self,
        query_text: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, List[Any]]:
        """Semantic search querying ChromaDB or falling back seamlessly."""
        if self.is_persistent and self._collection is not None:
            try:
                kwargs: Dict[str, Any] = {
                    "query_texts": [query_text],
                    "n_results": n_results,
                }
                if where:
                    kwargs["where"] = where
                results = self._collection.query(**kwargs)
                return results
            except Exception as exc:
                logger.error(f"ChromaDB query error: {exc}. Falling back to in-memory cosine search.")

        return self._fallback.query(query_text=query_text, n_results=n_results, where=where)

    def count(self) -> int:
        """Returns total document count in the vector collection."""
        if self.is_persistent and self._collection is not None:
            try:
                return self._collection.count()
            except Exception as exc:
                logger.error(f"ChromaDB count error: {exc}")
        return self._fallback.count()

    def reset(self) -> None:
        """Clears the collection."""
        self._fallback.reset()
        if self.is_persistent and self._chroma_client is not None:
            try:
                self._chroma_client.delete_collection(self.collection_name)
                self._collection = self._chroma_client.create_collection(
                    name=self.collection_name,
                    metadata={"description": "LearniVerse-AI DSA Curriculum Knowledge Base"},
                )
            except Exception as exc:
                logger.error(f"ChromaDB reset error: {exc}")

    def get_status(self) -> Dict[str, Any]:
        """Telemetry and status information for healthchecks."""
        return {
            "active_engine": "chromadb_persistent" if self.is_persistent else "in_memory_fallback",
            "is_persistent": self.is_persistent,
            "collection_name": self.collection_name,
            "persist_dir": self.persist_dir if self.is_persistent else None,
            "document_count": self.count(),
        }


# Global singleton client
vector_db_client = VectorDBClient()
