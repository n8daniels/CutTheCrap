"""
Simple Document Loader - Traditional RAG (WITHOUT MCP)
Loads individual documents on-demand without dependency resolution.
"""

from typing import Dict, List
import os
import json


class SimpleDocumentLoader:
    """
    Loads individual documents without fetching dependencies.
    This represents the traditional RAG approach.
    """

    def __init__(self, data_dir: str = "data/sample_documents"):
        self.data_dir = data_dir

    def load_document(self, doc_id: str) -> Dict:
        """
        Load a single document by ID.

        Args:
            doc_id: Document identifier (e.g., "bill_117_hr_3684")

        Returns:
            Dictionary with document content and metadata
        """
        # Simulate loading from file or API
        file_path = os.path.join(self.data_dir, f"{doc_id}.json")

        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        else:
            # Return mock document for demonstration
            return {
                'id': doc_id,
                'title': f'Document {doc_id}',
                'content': f'This is the content of {doc_id}. ' * 50,
                'metadata': {
                    'type': 'bill',
                    'source': 'mock'
                }
            }

    def load_documents(self, doc_ids: List[str]) -> List[Dict]:
        """
        Load multiple documents.

        Args:
            doc_ids: List of document identifiers

        Returns:
            List of document dictionaries
        """
        return [self.load_document(doc_id) for doc_id in doc_ids]
