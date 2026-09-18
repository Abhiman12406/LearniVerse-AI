"""Database Layer for LearniVerse-AI (Neo4j Graph Database & Persistence)."""
from backend.app.db.neo4j import neo4j_client, Neo4jClient

__all__ = ["neo4j_client", "Neo4jClient"]
