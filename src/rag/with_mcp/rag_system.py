"""
MCP-Enhanced RAG System
Fetches documents WITH full dependency graph for richer context.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import List, Dict, Tuple
from shared.chunker import DocumentChunker
from shared.embeddings import EmbeddingGenerator
from shared.vector_store import VectorStore
from with_mcp.mcp_document_loader import MCPDocumentLoader
import time


class MCPEnhancedRAG:
    """
    MCP-enhanced RAG system that fetches documents with full dependency graphs.

    This represents the advanced approach:
    - Fetches primary document AND all dependencies in ONE operation
    - Builds complete document graph automatically
    - Provides rich context for better answers
    - Reduces redundant API calls through caching
    """

    def __init__(
        self,
        data_dir: str = "data/sample_documents",
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        embedding_model: str = 'all-MiniLM-L6-v2',
        max_depth: int = 2
    ):
        self.loader = MCPDocumentLoader(data_dir, max_depth)
        self.chunker = DocumentChunker(chunk_size, chunk_overlap)
        self.embedder = EmbeddingGenerator(embedding_model)
        self.vector_store = VectorStore(self.embedder.embedding_dim)

        # Metrics tracking
        self.metrics = {
            'documents_loaded': 0,
            'api_calls': 0,  # Initial fetches (not counting cached)
            'chunks_created': 0,
            'total_fetch_time': 0.0,
            'queries_processed': 0,
            'dependencies_fetched': 0,
            'cache_hits': 0,
        }

    def index_document(self, doc_id: str) -> Dict:
        """
        Index a document with full dependency graph (MCP approach).

        Args:
            doc_id: Primary document identifier

        Returns:
            Metrics for this indexing operation
        """
        start_time = time.time()

        # Build document graph with dependencies (MCP's key feature!)
        graph = self.loader.build_document_graph(doc_id)

        # Track metrics
        self.metrics['api_calls'] += 1  # ONE MCP call gets everything
        self.metrics['documents_loaded'] += graph['total_nodes']
        self.metrics['dependencies_fetched'] += (graph['total_nodes'] - 1)
        self.metrics['cache_hits'] += graph['cache_hits']

        # Flatten graph to get all documents
        documents = self.loader.flatten_graph(graph)

        # Chunk all documents
        all_chunks = []
        for doc in documents:
            chunks = self.chunker.chunk_document(doc)
            all_chunks.extend(chunks)

        self.metrics['chunks_created'] += len(all_chunks)

        # Generate embeddings for all chunks
        embeddings = self.embedder.embed_chunks(all_chunks, show_progress=False)

        # Add to vector store
        self.vector_store.add_embeddings(embeddings, all_chunks)

        fetch_time = time.time() - start_time
        self.metrics['total_fetch_time'] += fetch_time

        return {
            'doc_id': doc_id,
            'total_documents': graph['total_nodes'],
            'dependencies_fetched': graph['total_nodes'] - 1,
            'chunks': len(all_chunks),
            'fetch_time': fetch_time,
            'api_calls': 1,  # Just ONE MCP call!
            'cache_hits': graph['cache_hits'],
            'cache_misses': graph['cache_misses'],
        }

    def query(self, question: str, k: int = 5) -> Tuple[List[Dict], Dict]:
        """
        Query the MCP-enhanced RAG system.

        Args:
            question: User's question
            k: Number of chunks to retrieve

        Returns:
            Tuple of (retrieved chunks, query metrics)
        """
        start_time = time.time()

        # Generate query embedding
        query_embedding = self.embedder.embed_text(question)

        # Retrieve relevant chunks (may come from multiple related documents!)
        results = self.vector_store.search(query_embedding, k)

        query_time = time.time() - start_time
        self.metrics['queries_processed'] += 1

        # Count unique documents in results
        unique_docs = set(r[0].get('id', 'unknown') for r in results)

        query_metrics = {
            'query_time': query_time,
            'chunks_retrieved': len(results),
            'documents_in_context': len(unique_docs),
            'document_types': list(set(r[0].get('metadata', {}).get('type', 'unknown') for r in results))
        }

        # Extract chunks from results
        chunks = [{'chunk': r[0], 'distance': r[1]} for r in results]

        return chunks, query_metrics

    def generate_answer(self, question: str, retrieved_chunks: List[Dict]) -> str:
        """
        Generate answer using retrieved chunks from multiple documents.

        Args:
            question: User's question
            retrieved_chunks: Chunks retrieved from vector store

        Returns:
            Generated answer
        """
        # Build context from chunks (with document attribution)
        context_parts = []
        for i, chunk in enumerate(retrieved_chunks):
            doc_title = chunk['chunk'].get('title', 'Unknown')
            doc_type = chunk['chunk'].get('metadata', {}).get('type', 'unknown')
            text = chunk['chunk']['text'][:200]

            context_parts.append(
                f"[Chunk {i+1} - {doc_type}: {doc_title}]\n{text}..."
            )

        context = "\n\n".join(context_parts)

        # Count document types in context
        doc_types = {}
        for chunk in retrieved_chunks:
            doc_type = chunk['chunk'].get('metadata', {}).get('type', 'unknown')
            doc_types[doc_type] = doc_types.get(doc_type, 0) + 1

        # Placeholder response (in production, call LLM here)
        answer = f"""
Based on retrieved context from MULTIPLE related documents:

{context}

[LLM would generate comprehensive answer here based on question: "{question}"]

Note: This is using MCP-ENHANCED RAG:
- Retrieved context from {len(set(c['chunk'].get('id') for c in retrieved_chunks))} different documents
- Document types in context: {doc_types}
- Includes primary document AND dependencies (amendments, referenced laws, etc.)
- All fetched in ONE MCP call, cached for follow-up questions
"""
        return answer

    def get_metrics(self) -> Dict:
        """Return current metrics."""
        return self.metrics.copy()

    def reset_metrics(self):
        """Reset metrics to zero."""
        self.metrics = {
            'documents_loaded': 0,
            'api_calls': 0,
            'chunks_created': 0,
            'total_fetch_time': 0.0,
            'queries_processed': 0,
            'dependencies_fetched': 0,
            'cache_hits': 0,
        }
