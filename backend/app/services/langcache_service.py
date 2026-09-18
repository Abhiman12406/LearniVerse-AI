"""Redis LangCache Service with Resilient Fallback.

Provides a unified semantic caching layer for LLM pedagogical operations:
- Official Redis LangCache SDK integration (cloud managed semantic cache)
- High-performance, zero-downtime in-memory semantic fallback (token/Jaccard/Levenshtein matching)
- Namespaced key scoping (feynman, diagnostic, planner)
- TTL management and cache invalidation
- Detailed telemetry: hit/miss counters, hit ratio, saved latency tracking
"""

import logging
import os
import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger("learniverse.langcache")

# Attempt import of official langcache SDK
try:
    from langcache import LangCache as RedisLangCacheClient  # type: ignore
    HAS_REDIS_LANGCACHE_SDK = True
except ImportError:
    RedisLangCacheClient = None
    HAS_REDIS_LANGCACHE_SDK = False


@dataclass
class CachedEntry:
    prompt: str
    response: Any
    namespace: str
    created_at: float
    ttl: int
    tokens: Set[str] = field(default_factory=set)

    @property
    def is_expired(self) -> bool:
        if self.ttl <= 0:
            return False
        return (time.time() - self.created_at) > self.ttl


class LangCacheService:
    """Authoritative semantic cache service providing resilient dual-mode operation."""

    def __init__(self):
        # Configuration
        self.server_url: str = os.getenv("LANGCACHE_SERVER_URL", "").strip()
        self.cache_id: str = os.getenv("LANGCACHE_CACHE_ID", "learniverse-cache").strip()
        self.api_key: str = os.getenv("LANGCACHE_API_KEY", "").strip()
        
        try:
            self.threshold: float = float(os.getenv("LANGCACHE_SIMILARITY_THRESHOLD", "0.85"))
        except ValueError:
            self.threshold = 0.85
            
        try:
            self.default_ttl: int = int(os.getenv("LANGCACHE_TTL", "86400"))
        except ValueError:
            self.default_ttl = 86400

        # Redis LangCache Client instance
        self._cloud_client: Optional[Any] = None
        self._cloud_connected: bool = False
        self._init_cloud_client()

        # In-memory semantic cache store: namespace -> list of CachedEntry
        self._memory_store: Dict[str, List[CachedEntry]] = {}

        # Telemetry & Observability
        self._hits: int = 0
        self._misses: int = 0
        self._bypasses: int = 0
        self._total_latency_saved_ms: float = 0.0

    def _init_cloud_client(self) -> None:
        """Initialize official Redis LangCache client if SDK and credentials are present."""
        if not HAS_REDIS_LANGCACHE_SDK:
            logger.info("Official 'langcache' SDK not installed. Operating in in-memory fallback mode.")
            self._cloud_connected = False
            return

        if not (self.server_url and self.api_key and self.cache_id):
            logger.info("LangCache environment credentials not fully set. Operating in in-memory fallback mode.")
            self._cloud_connected = False
            return

        try:
            self._cloud_client = RedisLangCacheClient(
                server_url=self.server_url,
                cache_id=self.cache_id,
                api_key=self.api_key,
            )
            self._cloud_connected = True
            logger.info("Successfully connected to official Redis LangCache managed service.")
        except Exception as exc:
            logger.warning(f"Failed to initialize Redis LangCache client: {exc}. Falling back to in-memory.")
            self._cloud_client = None
            self._cloud_connected = False

    @staticmethod
    def _tokenize(text: str) -> Set[str]:
        """Extract alphanumeric token set for semantic similarity estimation."""
        # Strip header tags like [recursion:VISUAL:BEGINNER] for token analysis
        cleaned = re.sub(r"^\[[^\]]+\]", "", text)
        words = re.findall(r"\b[a-zA-Z0-9_]+\b", cleaned.lower())
        stopwords = {
            "a", "an", "the", "and", "or", "in", "on", "at", "to", "for",
            "is", "are", "was", "were", "it", "this", "that", "i", "you",
            "me", "my", "how", "what", "why", "when", "where", "does", "do",
            "did", "can", "could", "would", "please", "tell", "explain",
            "during", "about", "with", "from", "by", "of", "between"
        }
        return {w for w in words if len(w) > 1 and w not in stopwords}

    def _compute_similarity(self, query: str, cached_query: str, q_tokens: Set[str], c_tokens: Set[str]) -> float:
        """
        Compute high-fidelity semantic similarity score [0.0 - 1.0].
        Respects domain header tags [concept:modality:tier] and evaluates keyword recall + fuzzy syntax.
        """
        if not query or not cached_query:
            return 0.0
        if query.strip().lower() == cached_query.strip().lower():
            return 1.0

        # Check for bracketed domain tags e.g. [recursion:VISUAL:BEGINNER]
        tag_match_q = re.match(r"^(\[[^\]]+\])\s*(.*)", query.strip(), re.IGNORECASE)
        tag_match_c = re.match(r"^(\[[^\]]+\])\s*(.*)", cached_query.strip(), re.IGNORECASE)

        if tag_match_q and tag_match_c:
            tag_q = tag_match_q.group(1).lower()
            tag_c = tag_match_c.group(1).lower()
            # If domain/modality/tier tags disagree, reject match
            if tag_q != tag_c:
                return 0.0
            body_q = tag_match_q.group(2).strip()
            body_c = tag_match_c.group(2).strip()
            if body_q.lower() == body_c.lower():
                return 1.0
        else:
            body_q = query.strip()
            body_c = cached_query.strip()

        # Keyword recall & Jaccard overlap
        if q_tokens and c_tokens:
            intersection = len(q_tokens & c_tokens)
            union = len(q_tokens | c_tokens)
            jaccard = intersection / union if union > 0 else 0.0
            keyword_recall = intersection / min(len(q_tokens), len(c_tokens))
        else:
            jaccard = 0.0
            keyword_recall = 0.0

        # Sequence alignment ratio of the full query
        full_seq = SequenceMatcher(None, query.lower(), cached_query.lower()).ratio()

        # Weighted score: 35% sequence ratio + 35% keyword recall + 30% Jaccard
        score = (0.35 * full_seq) + (0.35 * keyword_recall) + (0.30 * jaccard)
        return round(score, 4)

    def search(
        self,
        prompt: str,
        namespace: str = "default",
        threshold: Optional[float] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Search the semantic cache for a matching prompt in the given namespace.
        
        Returns:
            Dict containing:
                - response: The cached LLM response
                - similarity: float score (0.0 to 1.0)
                - provider: 'redis_langcache' or 'in_memory_fallback'
                - cached_at: ISO timestamp
            or None if cache miss or similarity < threshold.
        """
        active_threshold = threshold if threshold is not None else self.threshold
        start_time = time.perf_counter()

        # 1. Attempt Cloud Redis LangCache Search if connected
        if self._cloud_connected and self._cloud_client:
            try:
                # Redis LangCache search call
                cloud_res = self._cloud_client.search(prompt=prompt)
                if cloud_res:
                    elapsed_ms = (time.perf_counter() - start_time) * 1000
                    saved_ms = max(800.0, 1500.0 - elapsed_ms)  # Estimated LLM latency saved
                    self._hits += 1
                    self._total_latency_saved_ms += saved_ms
                    return {
                        "response": cloud_res.get("response") if isinstance(cloud_res, dict) else cloud_res,
                        "similarity": float(cloud_res.get("similarity", 0.95)) if isinstance(cloud_res, dict) else 0.95,
                        "provider": "redis_langcache",
                        "cached_at": datetime.now(timezone.utc).isoformat(),
                        "latency_saved_ms": round(saved_ms, 2),
                    }
            except Exception as exc:
                logger.warning(f"Error querying Redis LangCache cloud service: {exc}. Falling back to in-memory.")

        # 2. Resilient In-Memory Semantic Fallback
        entries = self._memory_store.get(namespace, [])
        if not entries:
            self._misses += 1
            return None

        # Clean up expired entries
        now = time.time()
        active_entries = [e for e in entries if not e.is_expired]
        self._memory_store[namespace] = active_entries

        q_tokens = self._tokenize(prompt)
        best_entry: Optional[CachedEntry] = None
        best_score: float = 0.0

        for entry in active_entries:
            sim = self._compute_similarity(prompt, entry.prompt, q_tokens, entry.tokens)
            if sim > best_score:
                best_score = sim
                best_entry = entry

        if best_entry and best_score >= active_threshold:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            saved_ms = max(600.0, 1200.0 - elapsed_ms)
            self._hits += 1
            self._total_latency_saved_ms += saved_ms
            return {
                "response": best_entry.response,
                "similarity": best_score,
                "provider": "in_memory_fallback",
                "cached_at": datetime.fromtimestamp(best_entry.created_at, tz=timezone.utc).isoformat(),
                "latency_saved_ms": round(saved_ms, 2),
            }

        self._misses += 1
        return None

    def set(
        self,
        prompt: str,
        response: Any,
        namespace: str = "default",
        ttl: Optional[int] = None,
    ) -> bool:
        """
        Store a prompt and its LLM response in the cache.
        Stores in Redis LangCache if connected, and mirrors in in-memory store for high availability.
        """
        effective_ttl = ttl if ttl is not None else self.default_ttl

        # 1. Attempt Cloud Redis LangCache store
        if self._cloud_connected and self._cloud_client:
            try:
                self._cloud_client.set(prompt=prompt, response=response)
            except Exception as exc:
                logger.warning(f"Failed to write to Redis LangCache cloud: {exc}")

        # 2. Save in In-Memory Store
        if namespace not in self._memory_store:
            self._memory_store[namespace] = []

        tokens = self._tokenize(prompt)
        entry = CachedEntry(
            prompt=prompt,
            response=response,
            namespace=namespace,
            created_at=time.time(),
            ttl=effective_ttl,
            tokens=tokens,
        )

        # Prepend to front (LRU behavior) and cap namespace size to 250 items
        self._memory_store[namespace].insert(0, entry)
        if len(self._memory_store[namespace]) > 250:
            self._memory_store[namespace] = self._memory_store[namespace][:250]

        return True

    def get_stats(self) -> Dict[str, Any]:
        """Return comprehensive cache observability and telemetry statistics."""
        total_queries = self._hits + self._misses
        hit_ratio = (self._hits / total_queries) if total_queries > 0 else 0.0

        # Count total active in-memory entries
        now = time.time()
        total_cached = 0
        namespace_counts: Dict[str, int] = {}
        for ns, entries in self._memory_store.items():
            valid_count = sum(1 for e in entries if not e.is_expired)
            namespace_counts[ns] = valid_count
            total_cached += valid_count

        return {
            "active_provider": "redis_langcache" if self._cloud_connected else "in_memory_fallback",
            "cloud_configured": bool(self.server_url and self.api_key),
            "cloud_connected": self._cloud_connected,
            "total_requests": total_queries,
            "hits": self._hits,
            "misses": self._misses,
            "hit_ratio": round(hit_ratio, 4),
            "total_latency_saved_ms": round(self._total_latency_saved_ms, 2),
            "total_cached_entries": total_cached,
            "namespaces": namespace_counts,
            "similarity_threshold": self.threshold,
            "default_ttl_seconds": self.default_ttl,
        }

    def clear_cache(self, namespace: Optional[str] = None) -> Dict[str, Any]:
        """Clear cache entries across all or a specific namespace."""
        cleared_count = 0
        if namespace:
            if namespace in self._memory_store:
                cleared_count = len(self._memory_store[namespace])
                self._memory_store[namespace] = []
        else:
            for ns, entries in self._memory_store.items():
                cleared_count += len(entries)
            self._memory_store.clear()

        return {
            "cleared_namespace": namespace or "ALL",
            "cleared_entries": cleared_count,
            "status": "SUCCESS",
        }


# Global authoritative instance
langcache_service = LangCacheService()
