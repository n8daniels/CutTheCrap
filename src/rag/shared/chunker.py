"""
Document Chunking Module
Splits documents into smaller chunks for efficient retrieval.
"""

from typing import List, Dict
import re


class DocumentChunker:
    """
    Splits documents into overlapping chunks for RAG retrieval.

    Args:
        chunk_size: Maximum number of characters per chunk
        chunk_overlap: Number of characters to overlap between chunks
    """

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str, metadata: Dict = None) -> List[Dict]:
        """
        Split text into overlapping chunks.

        Args:
            text: The text to chunk
            metadata: Optional metadata to attach to each chunk

        Returns:
            List of chunks with metadata
        """
        if not text:
            return []

        chunks = []
        start = 0

        while start < len(text):
            # Get chunk end position
            end = start + self.chunk_size

            # If not at the end, try to break at sentence boundary
            if end < len(text):
                # Look for sentence endings near the chunk boundary
                chunk_text = text[start:end]
                last_period = chunk_text.rfind('.')
                last_newline = chunk_text.rfind('\n')

                # Use the last sentence boundary found
                boundary = max(last_period, last_newline)
                if boundary > self.chunk_size // 2:  # Only if it's not too early
                    end = start + boundary + 1

            chunk_text = text[start:end].strip()

            if chunk_text:
                chunk_data = {
                    'text': chunk_text,
                    'start_char': start,
                    'end_char': end,
                    'chunk_id': len(chunks),
                }

                # Add metadata if provided
                if metadata:
                    chunk_data.update(metadata)

                chunks.append(chunk_data)

            # Move to next chunk with overlap
            start = end - self.chunk_overlap

            # Prevent infinite loop
            if start <= chunks[-1]['start_char'] if chunks else False:
                break

        return chunks

    def chunk_document(self, document: Dict) -> List[Dict]:
        """
        Chunk a document with metadata.

        Args:
            document: Dict with 'content' and optional metadata fields

        Returns:
            List of chunks with inherited metadata
        """
        content = document.get('content', '')
        metadata = {k: v for k, v in document.items() if k != 'content'}

        return self.chunk_text(content, metadata)
