"""
Tests for RAG systems
"""

import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from rag.without_mcp.rag_system import TraditionalRAG
from rag.with_mcp.rag_system import MCPEnhancedRAG


def test_traditional_rag_initialization():
    """Test Traditional RAG can be initialized."""
    rag = TraditionalRAG()
    assert rag is not None
    assert rag.metrics['api_calls'] == 0


def test_mcp_rag_initialization():
    """Test MCP-Enhanced RAG can be initialized."""
    rag = MCPEnhancedRAG()
    assert rag is not None
    assert rag.metrics['api_calls'] == 0


def test_traditional_rag_metrics():
    """Test metrics tracking in Traditional RAG."""
    rag = TraditionalRAG()
    metrics = rag.get_metrics()

    assert 'api_calls' in metrics
    assert 'documents_loaded' in metrics
    assert 'chunks_created' in metrics
    assert 'queries_processed' in metrics


def test_mcp_rag_metrics():
    """Test metrics tracking in MCP-Enhanced RAG."""
    rag = MCPEnhancedRAG()
    metrics = rag.get_metrics()

    assert 'api_calls' in metrics
    assert 'documents_loaded' in metrics
    assert 'chunks_created' in metrics
    assert 'queries_processed' in metrics
    assert 'dependencies_fetched' in metrics


def test_reset_metrics():
    """Test metrics can be reset."""
    rag = TraditionalRAG()
    rag.metrics['api_calls'] = 10
    rag.reset_metrics()

    assert rag.metrics['api_calls'] == 0
