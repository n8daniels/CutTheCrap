"""
Embedding Generation Module
Creates vector embeddings from text using sentence transformers.
"""

from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer


class EmbeddingGenerator:
    """
    Generates embeddings for text chunks using sentence transformers.

    Args:
        model_name: Name of the sentence transformer model to use
    """

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize the embedding model.

        Common models:
        - 'all-MiniLM-L6-v2': Fast, good quality (384 dimensions)
        - 'all-mpnet-base-v2': Better quality, slower (768 dimensions)
        """
        print(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        print(f"Model loaded. Embedding dimension: {self.embedding_dim}")

    def embed_text(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.

        Args:
            text: The text to embed

        Returns:
            Numpy array of embeddings
        """
        return self.model.encode(text, convert_to_numpy=True)

    def embed_batch(self, texts: List[str], show_progress: bool = True) -> np.ndarray:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed
            show_progress: Whether to show progress bar

        Returns:
            Numpy array of embeddings (shape: [n_texts, embedding_dim])
        """
        return self.model.encode(
            texts,
            convert_to_numpy=True,
            show_progress_bar=show_progress,
            batch_size=32
        )

    def embed_chunks(self, chunks: List[dict], show_progress: bool = True) -> np.ndarray:
        """
        Generate embeddings for document chunks.

        Args:
            chunks: List of chunk dicts with 'text' field
            show_progress: Whether to show progress bar

        Returns:
            Numpy array of embeddings
        """
        texts = [chunk['text'] for chunk in chunks]
        return self.embed_batch(texts, show_progress)
