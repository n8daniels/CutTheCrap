"""
Traditional RAG System WITHOUT MCP
Fetches only the requested document without dependencies.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import List, Dict, Tuple
from shared.chunker import DocumentChunker
from shared.embeddings import EmbeddingGenerator
from shared.vector_store import VectorStore
from without_mcp.document_loader import SimpleDocumentLoader
import time


class TraditionalRAG:
    """
    Traditional RAG system that fetches individual documents without dependencies.

    This represents the baseline approach:
    - Fetches only the requested document
    - No dependency resolution
    - Requires separate fetch for each related document
    """

    def __init__(
        self,
        data_dir: str = "data/sample_documents",
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        embedding_model: str = 'all-MiniLM-L6-v2'
    ):
        self.loader = SimpleDocumentLoader(data_dir)
        self.chunker = DocumentChunker(chunk_size, chunk_overlap)
        self.embedder = EmbeddingGenerator(embedding_model)
        self.vector_store = VectorStore(self.embedder.embedding_dim)

        # Metrics tracking
        self.metrics = {
            'documents_loaded': 0,
            'api_calls': 0,
            'chunks_created': 0,
            'total_fetch_time': 0.0,
            'queries_processed': 0,
        }

    def index_document(self, doc_id: str) -> Dict:
        """
        Index a single document (traditional approach).

        Args:
            doc_id: Document identifier

        Returns:
            Metrics for this indexing operation
        """
        start_time = time.time()

        # Simulate API call
        self.metrics['api_calls'] += 1

        # Load document
        document = self.loader.load_document(doc_id)
        self.metrics['documents_loaded'] += 1

        # Chunk document
        chunks = self.chunker.chunk_document(document)
        self.metrics['chunks_created'] += len(chunks)

        # Generate embeddings
        embeddings = self.embedder.embed_chunks(chunks, show_progress=False)

        # Add to vector store
        self.vector_store.add_embeddings(embeddings, chunks)

        fetch_time = time.time() - start_time
        self.metrics['total_fetch_time'] += fetch_time

        return {
            'doc_id': doc_id,
            'chunks': len(chunks),
            'fetch_time': fetch_time,
            'api_calls': 1,
            'documents_loaded': 1
        }

    def query(self, question: str, k: int = 5) -> Tuple[List[Dict], Dict]:
        """
        Query the RAG system.

        Args:
            question: User's question
            k: Number of chunks to retrieve

        Returns:
            Tuple of (retrieved chunks, query metrics)
        """
        start_time = time.time()

        # Generate query embedding
        query_embedding = self.embedder.embed_text(question)

        # Retrieve relevant chunks
        results = self.vector_store.search(query_embedding, k)

        query_time = time.time() - start_time
        self.metrics['queries_processed'] += 1

        query_metrics = {
            'query_time': query_time,
            'chunks_retrieved': len(results),
            'documents_in_context': len(set(r[0].get('id', 'unknown') for r in results))
        }

        # Extract chunks from results
        chunks = [{'chunk': r[0], 'distance': r[1]} for r in results]

        return chunks, query_metrics

    def generate_answer(self, question: str, retrieved_chunks: List[Dict]) -> str:
        """
        Generate answer using retrieved chunks.

        Note: This is a placeholder. In production, this would call an LLM.

        Args:
            question: User's question
            retrieved_chunks: Chunks retrieved from vector store

        Returns:
            Generated answer
        """
        # Build context from chunks
        context = "\n\n".join([
            f"[Chunk {i+1}] {chunk['chunk']['text'][:200]}..."
            for i, chunk in enumerate(retrieved_chunks)
        ])

        # Placeholder response (in production, call LLM here)
        answer = f"""
Based on the retrieved context:

{context}

[LLM would generate answer here based on question: "{question}"]

Note: This is using TRADITIONAL RAG without MCP.
- Only fetched the specific document requested
- No dependencies or related documents included
- May lack context from referenced laws, amendments, etc.
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
        }
