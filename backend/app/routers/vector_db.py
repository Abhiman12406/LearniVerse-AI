"""FastAPI Router for LearniVerse-AI Vector Database.

Exposes endpoints for status monitoring, knowledge corpus seeding,
semantic similarity search, and concept catalogs.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from backend.app.services.vector_db_service import vector_db_service

router = APIRouter(prefix="/api/vector", tags=["Vector Database"])


class VectorSearchRequest(BaseModel):
    query: str = Field(..., description="Natural language search query or concept question")
    top_k: int = Field(default=4, ge=1, le=20, description="Maximum number of results to return")
    concept: Optional[str] = Field(default=None, description="Filter by DSA concept (e.g. recursion, stack, tree)")
    category: Optional[str] = Field(default=None, description="Filter by category (e.g. analogy, misconception, code_implementation)")
    include_rag_context: bool = Field(default=False, description="Whether to include formatted LLM prompt RAG string")


class VectorSearchResultItem(BaseModel):
    id: str
    document: str
    metadata: Dict[str, Any]
    distance: float
    similarity_score: float


class VectorSearchResponse(BaseModel):
    query: str
    count: int
    results: List[Dict[str, Any]]
    rag_context: Optional[str] = None


@router.get("/status")
def get_vector_db_status() -> Dict[str, Any]:
    """Returns vector database status, active engine, and document telemetry."""
    return vector_db_service.get_status()


@router.post("/seed")
def seed_vector_database(force: bool = Query(default=False, description="Force re-indexing of all documents")) -> Dict[str, Any]:
    """Populates the vector database with the authoritative Data Structures & Algorithms corpus."""
    return vector_db_service.seed_dsa_knowledge_base(force=force)


@router.post("/search", response_model=VectorSearchResponse)
def search_vector_database(req: VectorSearchRequest) -> VectorSearchResponse:
    """Performs semantic similarity search against the DSA vector store."""
    matches = vector_db_service.similarity_search(
        query=req.query,
        top_k=req.top_k,
        concept=req.concept,
        category=req.category,
    )

    rag_text = None
    if req.include_rag_context:
        rag_text = vector_db_service.get_rag_context(
            query=req.query,
            concept=req.concept,
            top_k=req.top_k,
        )

    return VectorSearchResponse(
        query=req.query,
        count=len(matches),
        results=matches,
        rag_context=rag_text,
    )


@router.get("/concepts")
def get_indexed_concepts() -> Dict[str, Any]:
    """Returns the taxonomy of indexed DSA concepts, subconcepts, and categories."""
    return vector_db_service.list_concepts()
