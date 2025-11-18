"""
Side-by-Side RAG Comparison Demo
Demonstrates the difference between traditional RAG and MCP-enhanced RAG.
"""

import sys
import os

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from rag.without_mcp.rag_system import TraditionalRAG
from rag.with_mcp.rag_system import MCPEnhancedRAG
from analysis.comparator import RAGComparator
from analysis.visualizer import RAGVisualizer
import time


def print_header(title: str):
    """Print a formatted header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def print_section(title: str):
    """Print a formatted section title."""
    print(f"\n### {title} ###\n")


def demo_scenario_1():
    """
    Scenario 1: Single Document Query
    Shows the difference when querying about one document.
    """
    print_header("SCENARIO 1: Single Document Query")

    print("Setting up systems...")

    # Initialize both systems
    traditional = TraditionalRAG()
    mcp_enhanced = MCPEnhancedRAG()

    # Test document
    doc_id = "bill_117_hr_3684"

    print(f"\nIndexing document: {doc_id}")
    print("\nTraditional RAG (fetches only the requested document):")
    print("-" * 60)

    trad_start = time.time()
    trad_index_metrics = traditional.index_document(doc_id)
    trad_time = time.time() - trad_start

    print(f"  ✓ Documents loaded: {trad_index_metrics['documents_loaded']}")
    print(f"  ✓ Chunks created: {trad_index_metrics['chunks']}")
    print(f"  ✓ API calls: {trad_index_metrics['api_calls']}")
    print(f"  ✓ Time: {trad_time:.2f}s")

    print("\nMCP-Enhanced RAG (fetches document + dependencies):")
    print("-" * 60)

    mcp_start = time.time()
    mcp_index_metrics = mcp_enhanced.index_document(doc_id)
    mcp_time = time.time() - mcp_start

    print(f"  ✓ Documents loaded: {mcp_index_metrics['total_documents']}")
    print(f"  ✓ Dependencies fetched: {mcp_index_metrics['dependencies_fetched']}")
    print(f"  ✓ Chunks created: {mcp_index_metrics['chunks']}")
    print(f"  ✓ API calls: {mcp_index_metrics['api_calls']}")
    print(f"  ✓ Time: {mcp_time:.2f}s")

    # Query both systems
    question = "What are the key provisions of this infrastructure bill?"

    print(f"\n\nQuery: '{question}'")
    print("\nTraditional RAG Response:")
    print("-" * 60)

    trad_chunks, trad_query_metrics = traditional.query(question, k=3)
    print(f"  Retrieved {len(trad_chunks)} chunks from {trad_query_metrics['documents_in_context']} document(s)")
    print(f"  Query time: {trad_query_metrics['query_time']:.3f}s")

    print("\nMCP-Enhanced RAG Response:")
    print("-" * 60)

    mcp_chunks, mcp_query_metrics = mcp_enhanced.query(question, k=3)
    print(f"  Retrieved {len(mcp_chunks)} chunks from {mcp_query_metrics['documents_in_context']} document(s)")
    print(f"  Document types in context: {', '.join(mcp_query_metrics['document_types'])}")
    print(f"  Query time: {mcp_query_metrics['query_time']:.3f}s")

    # Return metrics for comparison
    return {
        'traditional': traditional.get_metrics(),
        'mcp_enhanced': mcp_enhanced.get_metrics()
    }


def demo_scenario_2():
    """
    Scenario 2: Multiple Follow-up Questions
    Shows how MCP reduces redundant API calls.
    """
    print_header("SCENARIO 2: Multiple Follow-up Questions (10 queries)")

    print("Setting up systems...")

    # Initialize both systems
    traditional = TraditionalRAG()
    mcp_enhanced = MCPEnhancedRAG()

    # Index document
    doc_id = "bill_117_hr_3684"

    print(f"\nIndexing document: {doc_id}\n")

    traditional.index_document(doc_id)
    mcp_enhanced.index_document(doc_id)

    # Simulate 10 follow-up questions
    questions = [
        "What is the total funding allocated?",
        "What amendments were made to this bill?",
        "Which previous laws does this reference?",
        "What are the highway funding provisions?",
        "How does this relate to the FAST Act?",
        "What broadband provisions are included?",
        "What is the timeline for implementation?",
        "Which committees reviewed this bill?",
        "What are the environmental requirements?",
        "How is funding distributed to states?",
    ]

    print("Processing 10 questions...\n")

    for i, question in enumerate(questions, 1):
        print(f"  {i}. {question[:60]}...")
        traditional.query(question, k=3)
        mcp_enhanced.query(question, k=3)

    print("\n✓ All questions processed")

    # Get final metrics
    trad_metrics = traditional.get_metrics()
    mcp_metrics = mcp_enhanced.get_metrics()

    print("\n\nFinal Metrics:")
    print("-" * 60)
    print(f"Traditional RAG:")
    print(f"  • Total queries: {trad_metrics['queries_processed']}")
    print(f"  • API calls: {trad_metrics['api_calls']}")
    print(f"  • Documents loaded: {trad_metrics['documents_loaded']}")

    print(f"\nMCP-Enhanced RAG:")
    print(f"  • Total queries: {mcp_metrics['queries_processed']}")
    print(f"  • API calls: {mcp_metrics['api_calls']}")  # Still just 1!
    print(f"  • Documents loaded: {mcp_metrics['documents_loaded']}")
    print(f"  • Dependencies auto-fetched: {mcp_metrics['dependencies_fetched']}")

    return {
        'traditional': trad_metrics,
        'mcp_enhanced': mcp_metrics
    }


def main():
    """Run all demonstration scenarios."""
    print_header("RAG SYSTEM COMPARISON DEMO")
    print("Comparing Traditional RAG vs MCP-Enhanced RAG\n")

    comparator = RAGComparator()

    # Run Scenario 1
    print("\nRunning Scenario 1...")
    scenario1_metrics = demo_scenario_1()
    comparator.compare_systems(
        scenario1_metrics['traditional'],
        scenario1_metrics['mcp_enhanced'],
        "Scenario 1: Single Document Query"
    )

    input("\n\nPress Enter to continue to Scenario 2...")

    # Run Scenario 2
    print("\nRunning Scenario 2...")
    scenario2_metrics = demo_scenario_2()
    comparator.compare_systems(
        scenario2_metrics['traditional'],
        scenario2_metrics['mcp_enhanced'],
        "Scenario 2: Multiple Follow-up Questions"
    )

    # Generate comparison report
    print_header("COMPARISON REPORT")
    print(comparator.generate_report())

    # Show aggregate improvements
    print_header("AGGREGATE IMPROVEMENTS")
    aggregate = comparator.get_aggregate_improvements()

    print(f"Average API Call Reduction: {aggregate['avg_api_reduction_percent']:.1f}%")
    print(f"Average Time Savings: {aggregate['avg_time_savings_percent']:.1f}%")
    print(f"Total API Calls Saved: {aggregate['total_api_calls_saved']}")
    print(f"Additional Context Documents: +{aggregate['avg_additional_context_docs']:.1f} per query")

    # Save report
    report_path = "results/comparison_report.txt"
    os.makedirs("results", exist_ok=True)
    comparator.save_report(report_path)

    print(f"\n\nFull report saved to: {report_path}")

    # Generate visualizations
    print_header("GENERATING VISUALIZATIONS")
    visualizer = RAGVisualizer(output_dir="results")
    visualizer.generate_all_visualizations(
        scenario2_metrics['traditional'],
        scenario2_metrics['mcp_enhanced']
    )

    print_header("KEY TAKEAWAYS")
    print("""
1. MCP-Enhanced RAG fetches dependencies automatically
   → Richer context for better answers

2. ONE MCP call replaces multiple traditional API calls
   → Significant cost and time savings

3. Dependencies are cached and reused
   → Follow-up questions require NO additional fetches

4. Retrieved context includes multiple document types
   → Bills, amendments, laws, etc. - comprehensive understanding

This demonstrates the power of MCP for RAG systems!
    """)


if __name__ == "__main__":
    main()
