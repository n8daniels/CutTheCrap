"""
Tests for document chunking module
"""

import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from rag.shared.chunker import DocumentChunker


def test_chunker_initialization():
    """Test DocumentChunker can be initialized."""
    chunker = DocumentChunker(chunk_size=100, chunk_overlap=20)
    assert chunker.chunk_size == 100
    assert chunker.chunk_overlap == 20


def test_chunk_text_basic():
    """Test basic text chunking."""
    chunker = DocumentChunker(chunk_size=50, chunk_overlap=10)
    text = "This is a test. " * 10  # 160 characters
    chunks = chunker.chunk_text(text)

    assert len(chunks) > 0
    assert all('text' in chunk for chunk in chunks)
    assert all('chunk_id' in chunk for chunk in chunks)


def test_chunk_text_with_metadata():
    """Test chunking with metadata."""
    chunker = DocumentChunker()
    text = "Test document content."
    metadata = {'id': 'test_doc', 'type': 'bill'}

    chunks = chunker.chunk_text(text, metadata)

    assert len(chunks) > 0
    assert chunks[0]['id'] == 'test_doc'
    assert chunks[0]['type'] == 'bill'


def test_chunk_document():
    """Test chunking a full document."""
    chunker = DocumentChunker()
    document = {
        'id': 'doc1',
        'title': 'Test Document',
        'content': 'This is test content. ' * 50,
        'metadata': {'type': 'test'}
    }

    chunks = chunker.chunk_document(document)

    assert len(chunks) > 0
    assert all('text' in chunk for chunk in chunks)
    assert all(chunk['id'] == 'doc1' for chunk in chunks)


def test_empty_text():
    """Test handling of empty text."""
    chunker = DocumentChunker()
    chunks = chunker.chunk_text("")

    assert chunks == []
