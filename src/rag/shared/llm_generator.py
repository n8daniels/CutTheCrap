"""
LLM Answer Generator (Optional)
Generates actual answers using LLM APIs (OpenAI, Anthropic, etc.)
"""

from typing import List, Dict, Optional
import os


class LLMGenerator:
    """
    Generates answers using LLM APIs.

    Supports:
    - OpenAI (GPT-4, GPT-3.5)
    - Anthropic Claude (when API key available)
    - Fallback to mock responses
    """

    def __init__(
        self,
        provider: str = "openai",
        model: str = "gpt-4",
        api_key: Optional[str] = None
    ):
        self.provider = provider
        self.model = model
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = None

        # Try to initialize client
        if self.api_key:
            self._initialize_client()

    def _initialize_client(self):
        """Initialize the LLM client."""
        if self.provider == "openai":
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                print(f"✓ OpenAI client initialized with model: {self.model}")
            except ImportError:
                print("⚠ OpenAI package not installed. Using mock responses.")
                self.client = None
            except Exception as e:
                print(f"⚠ Failed to initialize OpenAI client: {e}")
                self.client = None

    def generate_answer(
        self,
        question: str,
        retrieved_chunks: List[Dict],
        system_type: str = "traditional"
    ) -> Dict:
        """
        Generate an answer using LLM.

        Args:
            question: User's question
            retrieved_chunks: Chunks retrieved from vector store
            system_type: "traditional" or "mcp" for context labeling

        Returns:
            Dict with answer, metadata, and token usage
        """
        # Build context from chunks
        context = self._build_context(retrieved_chunks, system_type)

        # Generate answer
        if self.client:
            return self._generate_with_llm(question, context, system_type)
        else:
            return self._generate_mock_answer(question, context, system_type)

    def _build_context(self, retrieved_chunks: List[Dict], system_type: str) -> str:
        """Build context string from retrieved chunks."""
        context_parts = []

        for i, chunk_data in enumerate(retrieved_chunks, 1):
            chunk = chunk_data.get('chunk', {})
            text = chunk.get('text', '')

            # For MCP, include document type and title
            if system_type == "mcp":
                doc_type = chunk.get('metadata', {}).get('type', 'unknown')
                title = chunk.get('title', 'Unknown')
                context_parts.append(
                    f"[Source {i} - {doc_type}: {title}]\n{text}"
                )
            else:
                context_parts.append(f"[Source {i}]\n{text}")

        return "\n\n".join(context_parts)

    def _generate_with_llm(
        self,
        question: str,
        context: str,
        system_type: str
    ) -> Dict:
        """Generate answer using actual LLM API."""
        try:
            system_prompt = f"""You are a helpful assistant analyzing federal legislation.
You have access to retrieved document context from a {system_type.upper()} RAG system.

{f"Note: This system uses MCP to automatically fetch related documents (amendments, referenced laws, etc.), so the context includes comprehensive information from multiple sources." if system_type == "mcp" else "Note: This is a traditional RAG system with limited context from a single document."}

Provide a clear, accurate answer based on the context provided. Cite specific sources when possible."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n\n{context}\n\nQuestion: {question}"}
                ],
                temperature=0.3,
                max_tokens=500
            )

            return {
                'answer': response.choices[0].message.content,
                'model': self.model,
                'tokens_used': response.usage.total_tokens,
                'sources_used': context.count('[Source'),
                'system_type': system_type,
                'using_real_llm': True
            }

        except Exception as e:
            print(f"⚠ LLM generation failed: {e}")
            return self._generate_mock_answer(question, context, system_type)

    def _generate_mock_answer(
        self,
        question: str,
        context: str,
        system_type: str
    ) -> Dict:
        """Generate mock answer (fallback when no API key)."""
        num_sources = context.count('[Source')

        # Count document types in MCP context
        doc_types_str = ""
        if system_type == "mcp":
            doc_types = []
            if 'bill' in context.lower():
                doc_types.append("bill")
            if 'amendment' in context.lower():
                doc_types.append("amendment")
            if 'usc_section' in context.lower() or 'u.s.c' in context.lower():
                doc_types.append("law")
            if 'public_law' in context.lower():
                doc_types.append("public law")

            if doc_types:
                doc_types_str = f"\n- Document types: {', '.join(set(doc_types))}"

        answer = f"""[MOCK ANSWER - Install OpenAI package and set API key for real LLM responses]

Based on the retrieved context from {system_type.upper()} RAG system:

Question: {question}

Context Summary:
- Retrieved {num_sources} text chunk(s){doc_types_str}
- System: {system_type.upper()} RAG

{f"✅ MCP Advantage: This system automatically fetched related documents (amendments, laws, etc.), providing comprehensive context from multiple sources." if system_type == "mcp" else "⚠ Limited Context: Traditional RAG retrieved only from the primary document."}

[In production, the LLM would analyze the full context and generate a detailed answer here]

To enable real LLM responses:
1. Install OpenAI: pip install openai
2. Set API key: export OPENAI_API_KEY=your_key_here
3. Run again
"""

        return {
            'answer': answer,
            'model': 'mock',
            'tokens_used': 0,
            'sources_used': num_sources,
            'system_type': system_type,
            'using_real_llm': False
        }

    def compare_answers(
        self,
        question: str,
        traditional_chunks: List[Dict],
        mcp_chunks: List[Dict]
    ) -> Dict:
        """
        Generate and compare answers from both systems.

        Returns:
            Dict with both answers and comparison
        """
        trad_result = self.generate_answer(question, traditional_chunks, "traditional")
        mcp_result = self.generate_answer(question, mcp_chunks, "mcp")

        return {
            'question': question,
            'traditional': trad_result,
            'mcp': mcp_result,
            'comparison': {
                'sources_difference': mcp_result['sources_used'] - trad_result['sources_used'],
                'tokens_difference': mcp_result['tokens_used'] - trad_result['tokens_used'],
                'both_used_llm': trad_result['using_real_llm'] and mcp_result['using_real_llm']
            }
        }
