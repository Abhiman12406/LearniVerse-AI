"""Neo4j Database Client and Knowledge Graph Repository for LearniVerse-AI.

Conforms strictly to AGENTS.md §1, §9, §11, §13, §34:
- Direct driver integration using official `neo4j` Python driver
- Strict Schema Constraints: Concept(id), Question(id), Mission(id)
- Standard Curriculum DAG:
    Array -> Linked List -> Stack -> Recursion -> Tree
- Relationships:
    (:Concept)-[:PREREQUISITE_OF {threshold: Float}]->(:Concept)
    (:Concept)-[:TESTED_BY]->(:Question)
    (:Concept)-[:IMPLEMENTED_BY]->(:Mission)
- Cypher queries for direct prerequisites, transitive ancestry, downstream dependency weights,
  and deterministic learner prerequisite gates.
"""

import os
import logging
from typing import Any, Dict, List, Optional, Tuple

try:
    from neo4j import GraphDatabase, Driver, Session
    from neo4j.exceptions import ServiceUnavailable, AuthError, Neo4jError
    NEO4J_AVAILABLE = True
except ImportError:
    GraphDatabase = None
    Driver = None
    Session = None
    ServiceUnavailable = Exception
    AuthError = Exception
    Neo4jError = Exception
    NEO4J_AVAILABLE = False

logger = logging.getLogger("learniverse.neo4j")


class Neo4jClient:
    """Manages Neo4j driver connection lifecycle, Cypher schema setup, and graph traversal."""

    def __init__(
        self,
        uri: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
        connection_timeout: float = 1.0,
    ):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.username = username or os.getenv("NEO4J_USERNAME", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "password")
        self.database = database or os.getenv("NEO4J_DATABASE", "neo4j")
        self.connection_timeout = connection_timeout
        
        self._driver: Optional[Driver] = None
        self._connected: bool = False
        self._connection_attempted: bool = False

    def get_driver(self) -> Optional[Driver]:
        """Lazy initialization of Neo4j driver."""
        if not NEO4J_AVAILABLE:
            return None

        if self._driver is None and not self._connection_attempted:
            self._connection_attempted = True
            try:
                self._driver = GraphDatabase.driver(
                    self.uri,
                    auth=(self.username, self.password),
                    max_connection_lifetime=30 * 60,
                    max_connection_pool_size=50,
                    connection_acquisition_timeout=self.connection_timeout,
                )
                self.verify_connectivity()
            except Exception as e:
                logger.warning(f"Neo4j driver initial connection failed: {e}. Falling back to NetworkX.")
                self._driver = None
                self._connected = False

        return self._driver

    def verify_connectivity(self) -> bool:
        """Verifies active connectivity to Neo4j instance."""
        if not NEO4J_AVAILABLE or self._driver is None:
            self._connected = False
            return False

        try:
            self._driver.verify_connectivity()
            self._connected = True
            return True
        except Exception as e:
            logger.debug(f"Neo4j verify_connectivity failed: {e}")
            self._connected = False
            return False

    @property
    def is_connected(self) -> bool:
        """Returns whether Neo4j client is actively connected."""
        if not self._connected and not self._connection_attempted:
            self.get_driver()
        return self._connected

    def close(self):
        """Closes the driver instance."""
        if self._driver:
            try:
                self._driver.close()
            except Exception:
                pass
            self._driver = None
            self._connected = False
            self._connection_attempted = False

    def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> Optional[List[Dict[str, Any]]]:
        """Executes a Cypher query safely and returns list of record dictionaries."""
        driver = self.get_driver()
        if not driver or not self._connected:
            return None

        try:
            records, summary, keys = driver.execute_query(
                query,
                parameters or {},
                database_=self.database,
            )
            return [dict(record) for record in records]
        except Exception as e:
            logger.warning(f"Neo4j Cypher query failed: {query} with error: {e}")
            return None

    def initialize_schema(self) -> bool:
        """Creates uniqueness constraints and indexes in Neo4j."""
        driver = self.get_driver()
        if not driver or not self._connected:
            return False

        constraint_queries = [
            "CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE",
            "CREATE CONSTRAINT question_id_unique IF NOT EXISTS FOR (q:Question) REQUIRE q.id IS UNIQUE",
            "CREATE CONSTRAINT mission_id_unique IF NOT EXISTS FOR (m:Mission) REQUIRE m.id IS UNIQUE",
        ]

        for q in constraint_queries:
            try:
                driver.execute_query(q, database_=self.database)
            except Exception as e:
                logger.warning(f"Failed to create constraint: {q} - {e}")
        return True

    def seed_curriculum_graph(self) -> bool:
        """Seeds the standard curriculum knowledge graph DAG into Neo4j."""
        driver = self.get_driver()
        if not driver or not self._connected:
            return False

        self.initialize_schema()

        # 1. Concept nodes
        concepts = [
            {
                "id": "array",
                "name": "Arrays",
                "description": "Contiguous memory allocation and random-access indexing",
                "min_mastery": 0.60,
                "wing_id": "array_station",
                "difficulty_level": "beginner",
            },
            {
                "id": "linked_list",
                "name": "Linked Lists",
                "description": "Pointer-based dynamic node allocation and traversal",
                "min_mastery": 0.50,
                "wing_id": "linked_list_lab",
                "difficulty_level": "intermediate",
            },
            {
                "id": "stack",
                "name": "Stacks",
                "description": "LIFO discipline, push/pop/peek operations, and expression evaluation",
                "min_mastery": 0.70,
                "wing_id": "stack_lab",
                "difficulty_level": "intermediate",
            },
            {
                "id": "recursion",
                "name": "Recursion",
                "description": "Call stack frames, base cases, recurrence relations, and tree search",
                "min_mastery": 0.70,
                "wing_id": "recursion_lab",
                "difficulty_level": "advanced",
            },
            {
                "id": "tree",
                "name": "Trees",
                "description": "Hierarchical data structures, binary search trees, and DFS/BFS traversals",
                "min_mastery": 0.70,
                "wing_id": "tree_lab",
                "difficulty_level": "advanced",
            },
        ]

        upsert_concept_query = """
        UNWIND $concepts AS c
        MERGE (node:Concept {id: c.id})
        SET node.name = c.name,
            node.description = c.description,
            node.min_mastery = c.min_mastery,
            node.wing_id = c.wing_id,
            node.difficulty_level = c.difficulty_level
        """
        driver.execute_query(upsert_concept_query, {"concepts": concepts}, database_=self.database)

        # 2. PREREQUISITE_OF Edges with Thresholds
        edges = [
            {"source": "array", "target": "linked_list", "threshold": 0.60},
            {"source": "linked_list", "target": "stack", "threshold": 0.50},
            {"source": "stack", "target": "recursion", "threshold": 0.70},
            {"source": "recursion", "target": "tree", "threshold": 0.70},
        ]

        upsert_edges_query = """
        UNWIND $edges AS e
        MATCH (src:Concept {id: e.source})
        MATCH (tgt:Concept {id: e.target})
        MERGE (src)-[r:PREREQUISITE_OF]->(tgt)
        SET r.threshold = e.threshold
        """
        driver.execute_query(upsert_edges_query, {"edges": edges}, database_=self.database)

        # 3. Questions & Missions associated with concepts
        questions = [
            {"id": "Q_ARR_01", "concept_id": "array", "text": "What is the lookup time complexity for an array element by index?", "difficulty": 0.20},
            {"id": "Q_LL_01", "concept_id": "linked_list", "text": "What happens when you insert a node at the head of a linked list?", "difficulty": 0.35},
            {"id": "Q_STK_01", "concept_id": "stack", "text": "Which operation removes the most recently pushed item in LIFO order?", "difficulty": 0.30},
            {"id": "Q_REC_01", "concept_id": "recursion", "text": "Why must every recursive function define a base case?", "difficulty": 0.55},
            {"id": "Q_TRE_01", "concept_id": "tree", "text": "What is the maximum number of children for a binary tree node?", "difficulty": 0.40},
        ]

        upsert_questions_query = """
        UNWIND $questions AS q
        MATCH (c:Concept {id: q.concept_id})
        MERGE (node:Question {id: q.id})
        SET node.text = q.text,
            node.difficulty = q.difficulty,
            node.concept_id = q.concept_id
        MERGE (c)-[:TESTED_BY]->(node)
        """
        driver.execute_query(upsert_questions_query, {"questions": questions}, database_=self.database)

        missions = [
            {"id": "M_ARR_01", "concept_id": "array", "name": "Indexing Gauntlet", "difficulty": "easy"},
            {"id": "M_LL_01", "concept_id": "linked_list", "name": "Pointer Repair Lab", "difficulty": "medium"},
            {"id": "M_STK_01", "concept_id": "stack", "name": "Defend the Stack", "difficulty": "easy"},
            {"id": "M_REC_01", "concept_id": "recursion", "name": "Call Stack Descent", "difficulty": "hard"},
            {"id": "M_TRE_01", "concept_id": "tree", "name": "Binary Tree Canopy", "difficulty": "hard"},
        ]

        upsert_missions_query = """
        UNWIND $missions AS m
        MATCH (c:Concept {id: m.concept_id})
        MERGE (node:Mission {id: m.id})
        SET node.name = m.name,
            node.difficulty = m.difficulty,
            node.concept_id = m.concept_id
        MERGE (c)-[:IMPLEMENTED_BY]->(node)
        """
        driver.execute_query(upsert_missions_query, {"missions": missions}, database_=self.database)

        logger.info("Successfully seeded Neo4j knowledge graph curriculum DAG.")
        return True

    def get_prerequisites(self, concept_id: str) -> Optional[Dict[str, float]]:
        """Queries direct incoming prerequisite concepts and their required thresholds."""
        query = """
        MATCH (p:Concept)-[r:PREREQUISITE_OF]->(c:Concept {id: $concept_id})
        RETURN p.id AS prerequisite, r.threshold AS threshold
        """
        records = self.execute_query(query, {"concept_id": concept_id})
        if records is None:
            return None
        return {r["prerequisite"]: float(r["threshold"]) for r in records}

    def get_transitive_prerequisites(self, concept_id: str) -> Optional[List[str]]:
        """Queries all upstream ancestors in topological / dependency chain order."""
        query = """
        MATCH path = (ancestor:Concept)-[:PREREQUISITE_OF*1..10]->(c:Concept {id: $concept_id})
        RETURN DISTINCT ancestor.id AS ancestor_id, length(path) AS depth
        ORDER BY depth DESC
        """
        records = self.execute_query(query, {"concept_id": concept_id})
        if records is None:
            return None
        return [r["ancestor_id"] for r in records]

    def get_downstream_dependents_count(self, concept_id: str) -> Optional[int]:
        """Queries count of distinct downstream curriculum nodes blocked by this concept."""
        query = """
        MATCH (c:Concept {id: $concept_id})-[:PREREQUISITE_OF*1..10]->(d:Concept)
        RETURN count(DISTINCT d) AS downstream_count
        """
        records = self.execute_query(query, {"concept_id": concept_id})
        if records is None or not records:
            return None
        return int(records[0]["downstream_count"])

    def get_curriculum_dag(self) -> Optional[Dict[str, Any]]:
        """Retrieves full graph topology from Neo4j."""
        query_nodes = """
        MATCH (c:Concept)
        RETURN c.id AS id, c.name AS name, c.description AS description, c.wing_id AS wing_id
        """
        query_edges = """
        MATCH (src:Concept)-[r:PREREQUISITE_OF]->(tgt:Concept)
        RETURN src.id AS source, tgt.id AS target, r.threshold AS threshold
        """
        node_records = self.execute_query(query_nodes)
        edge_records = self.execute_query(query_edges)

        if node_records is None or edge_records is None:
            return None

        rules: Dict[str, Dict[str, float]] = {n["id"]: {} for n in node_records}
        for e in edge_records:
            target = e["target"]
            source = e["source"]
            if target in rules:
                rules[target][source] = float(e["threshold"])

        return {
            "nodes": [n["id"] for n in node_records],
            "node_details": node_records,
            "edges": edge_records,
            "prerequisite_rules": rules,
        }

    def get_graph_schema(self) -> Optional[Dict[str, Any]]:
        """Returns comprehensive graph nodes and relationships for visualization."""
        query = """
        MATCH (n)
        OPTIONAL MATCH (n)-[r]->(m)
        RETURN labels(n) AS node_labels, properties(n) AS node_props,
               type(r) AS rel_type, properties(r) AS rel_props,
               labels(m) AS target_labels, properties(m) AS target_props
        """
        records = self.execute_query(query)
        if records is None:
            return None

        nodes_dict: Dict[str, Dict[str, Any]] = {}
        links: List[Dict[str, Any]] = []

        for r in records:
            np = r.get("node_props") or {}
            nid = np.get("id")
            if nid and nid not in nodes_dict:
                nodes_dict[nid] = {
                    "id": nid,
                    "labels": r.get("node_labels") or [],
                    "properties": np,
                }

            tp = r.get("target_props") or {}
            tid = tp.get("id")
            if tid and tid not in nodes_dict:
                nodes_dict[tid] = {
                    "id": tid,
                    "labels": r.get("target_labels") or [],
                    "properties": tp,
                }

            rel_type = r.get("rel_type")
            if rel_type and nid and tid:
                links.append({
                    "source": nid,
                    "target": tid,
                    "type": rel_type,
                    "properties": r.get("rel_props") or {},
                })

        return {
            "nodes": list(nodes_dict.values()),
            "links": links,
            "node_count": len(nodes_dict),
            "edge_count": len(links),
        }


# Global singleton client
neo4j_client = Neo4jClient()
