#!/usr/bin/env python3
"""
Quick Test Script for RAG Systems
Verifies both traditional and MCP-enhanced RAG are working.
"""

import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from rag.without_mcp.rag_system import TraditionalRAG
from rag.with_mcp.rag_system import MCPEnhancedRAG


def test_traditional_rag():
    """Test traditional RAG system."""
    print("\n" + "=" * 60)
    print("Testing Traditional RAG System")
    print("=" * 60)

    try:
        rag = TraditionalRAG()
        print("✓ Traditional RAG initialized")

        # Index document
        metrics = rag.index_document("bill_117_hr_3684")
        print(f"✓ Document indexed: {metrics['chunks']} chunks created")

        # Query
        chunks, query_metrics = rag.query("What is this bill about?", k=3)
        print(f"✓ Query processed: {len(chunks)} chunks retrieved")

        # Get metrics
        final_metrics = rag.get_metrics()
        print(f"✓ Metrics collected: {final_metrics['api_calls']} API calls made")

        print("\n✅ Traditional RAG: ALL TESTS PASSED")
        return True

    except Exception as e:
        print(f"\n❌ Traditional RAG: FAILED - {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_mcp_enhanced_rag():
    """Test MCP-enhanced RAG system."""
    print("\n" + "=" * 60)
    print("Testing MCP-Enhanced RAG System")
    print("=" * 60)

    try:
        rag = MCPEnhancedRAG()
        print("✓ MCP-Enhanced RAG initialized")

        # Index document with dependencies
        metrics = rag.index_document("bill_117_hr_3684")
        print(f"✓ Document indexed: {metrics['total_documents']} documents, {metrics['chunks']} chunks")
        print(f"  - Dependencies fetched: {metrics['dependencies_fetched']}")

        # Query
        chunks, query_metrics = rag.query("What is this bill about?", k=3)
        print(f"✓ Query processed: {len(chunks)} chunks from {query_metrics['documents_in_context']} documents")

        # Get metrics
        final_metrics = rag.get_metrics()
        print(f"✓ Metrics collected: {final_metrics['api_calls']} API calls for {final_metrics['documents_loaded']} documents")

        print("\n✅ MCP-Enhanced RAG: ALL TESTS PASSED")
        return True

    except Exception as e:
        print(f"\n❌ MCP-Enhanced RAG: FAILED - {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("RAG SYSTEMS TEST SUITE")
    print("=" * 60)

    results = []

    # Test traditional RAG
    results.append(("Traditional RAG", test_traditional_rag()))

    # Test MCP-enhanced RAG
    results.append(("MCP-Enhanced RAG", test_mcp_enhanced_rag()))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{name}: {status}")

    all_passed = all(r[1] for r in results)

    if all_passed:
        print("\n🎉 All tests passed! Systems are ready to use.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check output above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
