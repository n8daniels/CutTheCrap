"""
MCP-Enhanced Document Loader
Fetches documents WITH their full dependency graph using FedDocMCP.
"""

from typing import Dict, List, Set
import os
import json
import time


class MCPDocumentLoader:
    """
    Loads documents with full dependency resolution using MCP.

    This simulates the FedDocMCP approach:
    - Fetches primary document
    - Detects and fetches all dependencies (amendments, referenced laws, etc.)
    - Builds complete document graph in ONE operation
    - Caches everything for reuse
    """

    def __init__(self, data_dir: str = "data/sample_documents", max_depth: int = 2):
        self.data_dir = data_dir
        self.max_depth = max_depth
        self.cache = {}  # Simulate document cache

    def _detect_dependencies(self, content: str) -> List[str]:
        """
        Detect dependencies referenced in document content.

        In production, this would use regex patterns to find:
        - Bill references (H.R. 1234, S. 5678)
        - USC references (42 U.S.C. § 1983)
        - Public Law references (P.L. 117-58)
        - Amendments (SA 2137)

        For demo, we simulate some dependencies.
        """
        # Simulated dependency detection
        dependencies = []

        if 'infrastructure' in content.lower():
            dependencies.extend(['amendment_sa_2137', 'usc_23_119', 'pl_114_94'])

        if 'transportation' in content.lower():
            dependencies.extend(['usc_23_119'])

        if 'funding' in content.lower():
            dependencies.extend(['pl_114_94'])

        return list(set(dependencies))  # Remove duplicates

    def _load_single_document(self, doc_id: str) -> Dict:
        """Load a single document from file or API."""
        # Check cache first
        if doc_id in self.cache:
            return self.cache[doc_id]

        file_path = os.path.join(self.data_dir, f"{doc_id}.json")

        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                doc = json.load(f)
        else:
            # Create mock document
            doc = {
                'id': doc_id,
                'title': f'Document {doc_id}',
                'content': self._generate_mock_content(doc_id),
                'metadata': {
                    'type': self._infer_type(doc_id),
                    'source': 'mock'
                }
            }

        # Cache it
        self.cache[doc_id] = doc
        return doc

    def _generate_mock_content(self, doc_id: str) -> str:
        """Generate realistic mock content based on document type."""
        if 'bill' in doc_id:
            return (
                f"Infrastructure Investment and Jobs Act. "
                f"This bill provides funding for transportation infrastructure projects. "
                f"Section 1: Definitions. Section 2: Authorization of appropriations. "
                f"Section 3: This section references 23 U.S.C. § 119 for highway funding formulas. "
                f"Section 4: This section amends Public Law 114-94 (FAST Act). "
            ) * 20
        elif 'amendment' in doc_id:
            return (
                f"Amendment SA 2137 to H.R. 3684. "
                f"This amendment modifies Section 11003 regarding broadband deployment. "
                f"It adds new provisions for rural broadband funding. "
            ) * 15
        elif 'usc' in doc_id:
            return (
                f"23 U.S.C. § 119 - National Highway Performance Program. "
                f"Establishes funding formulas for highway projects. "
                f"Subsection (a): Purpose. Subsection (b): Eligible projects. "
            ) * 15
        elif 'pl' in doc_id:
            return (
                f"Public Law 114-94 (FAST Act). "
                f"Fixing America's Surface Transportation Act. "
                f"Authorizes federal surface transportation programs. "
            ) * 15
        else:
            return f"Content for {doc_id}. " * 50

    def _infer_type(self, doc_id: str) -> str:
        """Infer document type from ID."""
        if 'bill' in doc_id:
            return 'bill'
        elif 'amendment' in doc_id:
            return 'amendment'
        elif 'usc' in doc_id:
            return 'usc_section'
        elif 'pl' in doc_id:
            return 'public_law'
        else:
            return 'unknown'

    def load_with_dependencies(
        self,
        doc_id: str,
        depth: int = 0,
        visited: Set[str] = None
    ) -> Dict:
        """
        Load document with full dependency graph (MCP approach).

        Args:
            doc_id: Primary document ID
            depth: Current recursion depth
            visited: Set of already-visited documents (for cycle detection)

        Returns:
            Document graph with all dependencies
        """
        if visited is None:
            visited = set()

        # Prevent cycles and limit depth
        if doc_id in visited or depth > self.max_depth:
            return None

        visited.add(doc_id)

        # Load primary document
        document = self._load_single_document(doc_id)

        # Detect dependencies
        dep_ids = self._detect_dependencies(document['content'])

        # Recursively load dependencies
        dependencies = []
        for dep_id in dep_ids:
            dep_doc = self.load_with_dependencies(dep_id, depth + 1, visited)
            if dep_doc:
                dependencies.append(dep_doc)

        # Build document graph node
        return {
            'id': document['id'],
            'title': document['title'],
            'content': document['content'],
            'metadata': document['metadata'],
            'dependencies': dependencies,
            'depth': depth
        }

    def build_document_graph(self, doc_id: str) -> Dict:
        """
        Build complete document graph with metrics (MCP approach).

        Args:
            doc_id: Primary document ID

        Returns:
            Document graph with metadata and metrics
        """
        start_time = time.time()
        cache_hits = len(self.cache)

        # Build graph
        root = self.load_with_dependencies(doc_id)

        # Count nodes
        total_nodes = self._count_nodes(root)

        cache_misses = total_nodes - cache_hits
        fetch_time = time.time() - start_time

        return {
            'root': root,
            'total_nodes': total_nodes,
            'max_depth': self.max_depth,
            'fetch_time_ms': fetch_time * 1000,
            'cache_hits': cache_hits,
            'cache_misses': cache_misses,
        }

    def _count_nodes(self, node: Dict) -> int:
        """Recursively count nodes in document graph."""
        if not node:
            return 0

        count = 1  # Count this node
        for dep in node.get('dependencies', []):
            count += self._count_nodes(dep)

        return count

    def flatten_graph(self, graph: Dict) -> List[Dict]:
        """
        Flatten document graph into list of documents.

        Args:
            graph: Document graph from build_document_graph()

        Returns:
            List of all documents in the graph
        """
        documents = []
        self._flatten_recursive(graph['root'], documents)
        return documents

    def _flatten_recursive(self, node: Dict, documents: List[Dict]):
        """Recursively flatten graph."""
        if not node:
            return

        # Add this document
        documents.append({
            'id': node['id'],
            'title': node['title'],
            'content': node['content'],
            'metadata': node['metadata'],
            'depth': node['depth']
        })

        # Add dependencies
        for dep in node.get('dependencies', []):
            self._flatten_recursive(dep, documents)
