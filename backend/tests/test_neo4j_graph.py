"""Unit and Integration Tests for Neo4j Knowledge Graph & Resilience.

Conforms strictly to AGENTS.md §1, §9, §11, §13, §34:
- Validates Neo4j schema setup, seeding, and Cypher query methods
- Validates graceful fallback to NetworkX when Neo4j is offline
- Validates curriculum DAG traversal and prerequisite gate calculations
- Validates API endpoints exposed in curriculum router
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.neo4j import Neo4jClient
from backend.app.services.knowledge_graph_service import KnowledgeGraphService, knowledge_graph_service


@pytest.fixture
def client():
    return TestClient(app)


class TestNeo4jClient:
    """Tests for the Neo4j client connection, query execution, and schema management."""

    def test_client_defaults(self):
        client = Neo4jClient()
        assert client.uri == "bolt://localhost:7687"
        assert client.username == "neo4j"
        assert client.database == "neo4j"
        assert client.is_connected is False or client.is_connected is True

    def test_client_graceful_offline_handling(self):
        # Point to an unopen port with rapid timeout
        offline_client = Neo4jClient(uri="bolt://127.0.0.1:9999", connection_timeout=0.2)
        assert offline_client.verify_connectivity() is False
        assert offline_client.is_connected is False
        assert offline_client.execute_query("MATCH (n) RETURN n") is None
        assert offline_client.initialize_schema() is False
        assert offline_client.seed_curriculum_graph() is False
        offline_client.close()

    def test_mocked_neo4j_queries(self):
        mock_driver = MagicMock()
        client = Neo4jClient()
        client._driver = mock_driver
        client._connected = True

        # Test execute_query
        mock_record = {"prerequisite": "linked_list", "threshold": 0.50}
        mock_driver.execute_query.return_value = ([mock_record], MagicMock(), ["prerequisite", "threshold"])

        prereqs = client.get_prerequisites("stack")
        assert prereqs == {"linked_list": 0.50}
        assert mock_driver.execute_query.called

        # Test transitive prerequisites
        mock_driver.execute_query.return_value = (
            [{"ancestor_id": "array", "depth": 2}, {"ancestor_id": "linked_list", "depth": 1}],
            MagicMock(),
            ["ancestor_id", "depth"],
        )
        transitive = client.get_transitive_prerequisites("stack")
        assert transitive == ["array", "linked_list"]

        # Test downstream count
        mock_driver.execute_query.return_value = (
            [{"downstream_count": 2}],
            MagicMock(),
            ["downstream_count"],
        )
        count = client.get_downstream_dependents_count("stack")
        assert count == 2

    def test_mocked_seeding(self):
        mock_driver = MagicMock()
        client = Neo4jClient()
        client._driver = mock_driver
        client._connected = True

        success = client.seed_curriculum_graph()
        assert success is True
        # Verify execute_query was called multiple times (constraints, concepts, edges, questions, missions)
        assert mock_driver.execute_query.call_count >= 5


class TestKnowledgeGraphServiceWithNeo4j:
    """Tests the KnowledgeGraphService with both Neo4j active and fallback modes."""

    def test_service_offline_fallback(self):
        # Service with offline Neo4j client
        offline_client = MagicMock()
        offline_client.is_connected = False
        service = KnowledgeGraphService(client=offline_client)

        assert service.is_neo4j_active is False
        status = service.get_engine_status()
        assert status["active_engine"] == "networkx_fallback"
        assert status["node_count"] == 5
        assert status["edge_count"] == 4

        # NetworkX fallback provides accurate DAG properties
        prereqs = service.get_prerequisites("recursion")
        assert prereqs == {"stack": 0.70}

        ancestors = service.get_transitive_prerequisites("recursion")
        assert "stack" in ancestors
        assert "linked_list" in ancestors
        assert "array" in ancestors

        weight_stack = service.get_downstream_weight("stack")
        assert weight_stack == 2.0  # 1.0 + 2 descendants * 0.5

        # Prerequisite Gate check
        ready, blocking, req, cur = service.is_eligible("recursion", {"stack": 0.80})
        assert ready is True
        assert blocking is None

        not_ready, blocking, req, cur = service.is_eligible("recursion", {"stack": 0.38})
        assert not_ready is False
        assert blocking == "stack"
        assert req == 0.70
        assert cur == 0.38

    def test_service_delegates_to_connected_neo4j(self):
        mock_client = MagicMock()
        mock_client.is_connected = True
        mock_client.get_prerequisites.return_value = {"stack": 0.70}
        mock_client.get_transitive_prerequisites.return_value = ["array", "linked_list", "stack"]
        mock_client.get_downstream_dependents_count.return_value = 2

        service = KnowledgeGraphService(client=mock_client)
        assert service.is_neo4j_active is True

        prereqs = service.get_prerequisites("recursion")
        assert prereqs == {"stack": 0.70}
        mock_client.get_prerequisites.assert_called_with("recursion")

        transitive = service.get_transitive_prerequisites("recursion")
        assert transitive == ["array", "linked_list", "stack"]
        mock_client.get_transitive_prerequisites.assert_called_with("recursion")

        weight = service.get_downstream_weight("stack")
        assert weight == 2.0
        mock_client.get_downstream_dependents_count.assert_called_with("stack")


class TestCurriculumRouterEndpoints:
    """Tests FastAPI router endpoints for Knowledge Graph inspection."""

    def test_curriculum_dag_endpoint(self, client):
        response = client.get("/api/curriculum/dag")
        assert response.status_code == 200
        data = response.json()
        assert "engine" in data
        assert "nodes" in data
        assert "topological_order" in data
        assert data["topological_order"] == ["array", "linked_list", "stack", "recursion", "tree"]
        assert "prerequisite_rules" in data
        assert data["prerequisite_rules"]["recursion"] == {"stack": 0.70}

    def test_graph_status_endpoint(self, client):
        response = client.get("/api/curriculum/graph/status")
        assert response.status_code == 200
        data = response.json()
        assert "active_engine" in data
        assert "neo4j_connected" in data
        assert "node_count" in data
        assert data["node_count"] == 5

    def test_graph_visualization_endpoint(self, client):
        response = client.get("/api/curriculum/graph/visualization")
        assert response.status_code == 200
        data = response.json()
        assert "engine" in data
        assert "nodes" in data
        assert "links" in data
        assert len(data["nodes"]) >= 5
        assert len(data["links"]) >= 4

    def test_concept_prerequisites_endpoint(self, client):
        response = client.get("/api/curriculum/prerequisites/recursion")
        assert response.status_code == 200
        data = response.json()
        assert data["concept"] == "recursion"
        assert data["direct_prerequisites"] == {"stack": 0.70}
        assert "stack" in data["transitive_prerequisites"]
        assert data["downstream_dependency_weight"] >= 1.5

    def test_graph_seed_endpoint_offline(self, client):
        # When Neo4j is not connected, seeding returns clean status response
        response = client.post("/api/curriculum/graph/seed")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
