"""Redis LangCache API Router.

Exposes observability, telemetry stats, cache clearing, and live test search endpoints
for monitoring the Redis LangCache semantic caching layer.
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query

from backend.app.services.langcache_service import langcache_service

router = APIRouter(prefix="/api/cache", tags=["Redis LangCache"])


class CacheSearchTestRequest(BaseModel):
    prompt: str = Field(..., description="Prompt or query to test in the semantic cache")
    namespace: str = Field(default="feynman", description="Cache namespace (e.g. feynman, diagnostic)")
    threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Optional custom similarity threshold")


class CacheSearchTestResponse(BaseModel):
    hit: bool
    similarity: Optional[float] = None
    provider: Optional[str] = None
    latency_saved_ms: Optional[float] = None
    response: Optional[Any] = None


@router.get("/stats")
def get_cache_stats() -> Dict[str, Any]:
    """Retrieve live Redis LangCache telemetry, hit/miss ratios, and latency savings."""
    return langcache_service.get_stats()


@router.post("/clear")
def clear_cache(
    namespace: Optional[str] = Query(None, description="Specific namespace to clear or None for all")
) -> Dict[str, Any]:
    """Clear cached entries across all namespaces or a specific namespace."""
    return langcache_service.clear_cache(namespace=namespace)


@router.post("/test-search", response_model=CacheSearchTestResponse)
def test_cache_search(req: CacheSearchTestRequest) -> CacheSearchTestResponse:
    """Test semantic matching against the cache for live verification in judge/demo panel."""
    result = langcache_service.search(
        prompt=req.prompt,
        namespace=req.namespace,
        threshold=req.threshold,
    )
    if result:
        return CacheSearchTestResponse(
            hit=True,
            similarity=result.get("similarity"),
            provider=result.get("provider"),
            latency_saved_ms=result.get("latency_saved_ms"),
            response=result.get("response"),
        )
    return CacheSearchTestResponse(hit=False)
