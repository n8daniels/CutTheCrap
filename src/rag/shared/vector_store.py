"""
Vector Store Module
Stores and retrieves document embeddings using FAISS.
"""

from typing import List, Tuple
import numpy as np
import faiss
import pickle
import os


class VectorStore:
    """
    FAISS-based vector store for similarity search.

    Args:
        embedding_dim: Dimension of the embeddings
    """

    def __init__(self, embedding_dim: int):
        self.embedding_dim = embedding_dim
        self.index = faiss.IndexFlatL2(embedding_dim)  # L2 distance
        self.chunks = []  # Store original chunks

    def add_embeddings(self, embeddings: np.ndarray, chunks: List[dict]):
        """
        Add embeddings and their corresponding chunks to the store.

        Args:
            embeddings: Numpy array of embeddings
            chunks: List of chunk dictionaries
        """
        if embeddings.shape[0] != len(chunks):
            raise ValueError("Number of embeddings must match number of chunks")

        # Ensure embeddings are float32 (required by FAISS)
        embeddings = embeddings.astype('float32')

        # Add to FAISS index
        self.index.add(embeddings)

        # Store chunks
        self.chunks.extend(chunks)

        print(f"Added {len(chunks)} chunks. Total chunks in store: {len(self.chunks)}")

    def search(self, query_embedding: np.ndarray, k: int = 5) -> List[Tuple[dict, float]]:
        """
        Search for most similar chunks.

        Args:
            query_embedding: Query embedding vector
            k: Number of results to return

        Returns:
            List of (chunk, distance) tuples
        """
        if len(self.chunks) == 0:
            return []

        # Ensure query is 2D and float32
        query_embedding = query_embedding.astype('float32').reshape(1, -1)

        # Search
        k = min(k, len(self.chunks))  # Don't request more than we have
        distances, indices = self.index.search(query_embedding, k)

        # Return chunks with distances
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            results.append((self.chunks[idx], float(distance)))

        return results

    def save(self, path: str):
        """Save the vector store to disk."""
        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else '.', exist_ok=True)

        # Save FAISS index
        faiss.write_index(self.index, f"{path}.faiss")

        # Save chunks
        with open(f"{path}.chunks.pkl", 'wb') as f:
            pickle.dump(self.chunks, f)

        print(f"Vector store saved to {path}")

    def load(self, path: str):
        """Load the vector store from disk."""
        # Load FAISS index
        self.index = faiss.read_index(f"{path}.faiss")

        # Load chunks
        with open(f"{path}.chunks.pkl", 'rb') as f:
            self.chunks = pickle.load(f)

        print(f"Vector store loaded from {path}. Total chunks: {len(self.chunks)}")

    @property
    def size(self) -> int:
        """Return the number of chunks in the store."""
        return len(self.chunks)
