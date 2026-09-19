"""CLI Utility to Seed and Verify the LearniVerse-AI DSA Vector Database.

Usage:
    python backend/seed_vector_db.py [--force]
"""

import argparse
import sys
from pathlib import Path

# Ensure repo root is on sys.path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from backend.app.services.vector_db_service import vector_db_service


def main():
    parser = argparse.ArgumentParser(description="Seed and verify DSA Vector Database.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-indexing even if already seeded",
    )
    args = parser.parse_args()

    print("=" * 65)
    print(" LearniVerse-AI: Data Structures & Algorithms Vector Database Seeder")
    print("=" * 65)

    print("\n[1/3] Checking initial status...")
    status = vector_db_service.get_status()
    print(f"  Active Engine     : {status['active_engine']}")
    print(f"  Is Persistent     : {status['is_persistent']}")
    print(f"  Current Doc Count : {status['document_count']}")

    print(f"\n[2/3] Seeding DSA knowledge corpus (force={args.force})...")
    seed_result = vector_db_service.seed_dsa_knowledge_base(force=args.force)
    print(f"  Status            : {seed_result.get('status')}")
    print(f"  Indexed Chunks    : {seed_result.get('document_count', seed_result.get('indexed_chunks'))}")
    if "concepts" in seed_result:
        print(f"  Indexed Concepts  : {', '.join(seed_result['concepts'])}")
    if "categories" in seed_result:
        print(f"  Categories        : {', '.join(seed_result['categories'])}")

    print("\n[3/3] Running validation semantic similarity searches...")
    sample_queries = [
        ("Russian nesting dolls call stack", None),
        ("direct memory address O(1) index", "array"),
        ("which traversal produces sorted order in binary search tree", "tree"),
    ]

    for query, concept_filter in sample_queries:
        print(f"\n  Query: '{query}'" + (f" [Filter: {concept_filter}]" if concept_filter else ""))
        matches = vector_db_service.similarity_search(query=query, top_k=2, concept=concept_filter)
        for i, match in enumerate(matches, 1):
            meta = match["metadata"]
            print(f"    [{i}] (Score: {match['similarity_score']:.4f}) {meta.get('title')} [{meta.get('concept')} / {meta.get('category')}]")

    print("\n" + "=" * 65)
    print(" Vector Database Seed & Verification Complete!")
    print("=" * 65)


if __name__ == "__main__":
    main()
