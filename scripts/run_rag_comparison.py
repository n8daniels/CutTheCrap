#!/usr/bin/env python3
"""
Script to run RAG comparison from Next.js API
"""

import sys
import os
import json

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from rag.without_mcp.rag_system import TraditionalRAG
from rag.with_mcp.rag_system import MCPEnhancedRAG


def run_comparison(bill_id: str, question: str):
    """
    Run comparison between Traditional and MCP-Enhanced RAG.

    Returns:
        dict with traditional and mcp metrics
    """
    # Initialize both systems
    traditional = TraditionalRAG()
    mcp_enhanced = MCPEnhancedRAG()

    # Index the bill
    traditional.index_document(bill_id)
    mcp_enhanced.index_document(bill_id)

    # Query both systems
    traditional.query(question, k=5)
    mcp_enhanced.query(question, k=5)

    # Get metrics
    trad_metrics = traditional.get_metrics()
    mcp_metrics = mcp_enhanced.get_metrics()

    return {
        'traditional': trad_metrics,
        'mcp': mcp_metrics
    }


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(json.dumps({'error': 'Usage: run_rag_comparison.py <bill_id> <question>'}))
        sys.exit(1)

    bill_id = sys.argv[1]
    question = sys.argv[2]

    try:
        result = run_comparison(bill_id, question)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
