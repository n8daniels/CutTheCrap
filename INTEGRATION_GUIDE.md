# Integration Guide: RAG Comparison with CutTheCrap

This guide explains how to integrate the RAG comparison system into the broader CutTheCrap platform.

## Overview

The RAG comparison system demonstrates two approaches to document retrieval:
1. **Traditional RAG** - Simple document fetching
2. **MCP-Enhanced RAG** - Automatic dependency resolution

This can be integrated into CutTheCrap to power the AI training pipeline and user-facing analysis features.

---

## Architecture Integration

### Current CutTheCrap Goals

From `CutTheCrap_Integration_Plan.md`:
- Build trainable AI models
- Create intelligent analysis pipelines
- Focus on training AI effectively
- Process federal documentation with FedDocMCP

### How RAG Fits In

```
┌─────────────────────────────────────────────────────────┐
│            CutTheCrap Platform                          │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │  User Interface      │  │  Training Pipeline   │   │
│  │  (React/TypeScript)  │  │  (Python)            │   │
│  └──────────┬───────────┘  └──────────┬───────────┘   │
│             │                          │               │
│             └──────────┬───────────────┘               │
│                        │                               │
│                        ▼                               │
│             ┌──────────────────────┐                   │
│             │   RAG System Layer   │◄──────────────┐   │
│             │                      │               │   │
│             │  • Document Retrieval│               │   │
│             │  • Context Building  │               │   │
│             │  • Answer Generation │               │   │
│             └──────────┬───────────┘               │   │
│                        │                           │   │
│           ┌────────────┴─────────────┐             │   │
│           │                          │             │   │
│           ▼                          ▼             │   │
│  ┌────────────────┐       ┌──────────────────┐    │   │
│  │ Traditional    │       │ MCP-Enhanced     │    │   │
│  │ RAG            │       │ RAG with FedDoc  │────┘   │
│  └────────────────┘       └──────────────────┘        │
│                                     │                 │
│                                     ▼                 │
│                          ┌──────────────────┐         │
│                          │   FedDocMCP      │         │
│                          │   Server         │         │
│                          └──────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Options

### Option 1: Use RAG for Training Data Collection (Recommended First Step)

**Purpose**: Collect high-quality question-answer pairs for training CutTheCrapAI

**Implementation**:

```python
# src/training/data_collector.py

from rag.with_mcp.rag_system import MCPEnhancedRAG
from rag.shared.llm_generator import LLMGenerator

class TrainingDataCollector:
    """Collect training data using MCP-Enhanced RAG."""

    def __init__(self):
        self.rag = MCPEnhancedRAG(max_depth=2)
        self.llm = LLMGenerator(model="gpt-4")

    def collect_qa_pair(self, bill_id: str, question: str) -> dict:
        """
        Collect a question-answer pair with full context.

        Returns training example with:
        - Question
        - Full document graph context
        - High-quality answer from GPT-4
        - Metadata (documents used, dependencies, etc.)
        """
        # Index bill with dependencies
        metrics = self.rag.index_document(bill_id)

        # Retrieve relevant chunks
        chunks, query_metrics = self.rag.query(question, k=10)

        # Generate answer
        answer_result = self.llm.generate_answer(question, chunks, "mcp")

        return {
            'input': question,
            'context': {
                'bill_id': bill_id,
                'documents_included': metrics['total_documents'],
                'dependencies': metrics['dependencies_fetched'],
                'chunks_retrieved': len(chunks)
            },
            'output': answer_result['answer'],
            'metadata': {
                'model_used': answer_result['model'],
                'tokens': answer_result['tokens_used'],
                'sources': answer_result['sources_used']
            }
        }
```

**Benefit**: Creates training data with RICH context (bill + dependencies) for better model learning.

---

### Option 2: Use RAG in Production for User Queries

**Purpose**: Answer user questions about legislation

**Implementation**:

```python
# app/api/bills/analyze/route.ts (Next.js API route)

import { MCPEnhancedRAG } from '@/lib/rag/mcp_rag';
import { LLMGenerator } from '@/lib/rag/llm_generator';

export async function POST(request: Request) {
  const { billId, question } = await request.json();

  // Initialize RAG system
  const rag = new MCPEnhancedRAG({ maxDepth: 2 });

  // Check cache first
  const cacheKey = `rag:${billId}:${question}`;
  let answer = await redis.get(cacheKey);

  if (!answer) {
    // Index bill (or load from cache)
    await rag.indexDocument(billId);

    // Query
    const chunks = await rag.query(question, { k: 5 });

    // Generate answer
    const llm = new LLMGenerator({ model: 'gpt-4' });
    answer = await llm.generateAnswer(question, chunks, 'mcp');

    // Cache for 24h
    await redis.set(cacheKey, answer, { ex: 86400 });
  }

  return Response.json({
    answer,
    billId,
    question
  });
}
```

---

### Option 3: Hybrid Approach (Use Both)

**Best of both worlds:**

1. **Development/Training Phase**: Use RAG to collect training data
2. **Production Phase**: Use fine-tuned CutTheCrapAI + RAG for retrieval

```
User Question
     │
     ▼
┌──────────────────┐
│  RAG Retrieval   │  ← Get relevant context
│  (MCP-Enhanced)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CutTheCrapAI    │  ← Your fine-tuned model
│  (Fine-tuned)    │
└────────┬─────────┘
         │
         ▼
    Answer
```

**Why this works:**
- RAG provides current document context
- Fine-tuned model has learned reasoning patterns
- Best answer quality

---

## Step-by-Step Integration

### Step 1: Add RAG to CutTheCrap Repository

```bash
# CutTheCrap/
├── frontend/          # React app
├── backend/           # API
├── ai/               # NEW: AI components
│   ├── rag/          # Copy from this project
│   │   ├── shared/
│   │   ├── without_mcp/
│   │   └── with_mcp/
│   ├── training/     # NEW: Training pipeline
│   └── models/       # NEW: Fine-tuned models
└── mcp/              # FedDocMCP integration
```

### Step 2: Connect RAG to FedDocMCP

Replace simulated MCP loader with real FedDocMCP:

```python
# ai/rag/with_mcp/feddoc_loader.py

from mcp import StdioClient

class FedDocMCPLoader:
    """Real FedDocMCP integration."""

    def __init__(self, server_path: str):
        self.client = StdioClient(server_path)

    async def load_with_dependencies(self, bill_id: str):
        """Use actual FedDocMCP tools."""
        # Call real MCP tools
        result = await self.client.call_tool(
            'get_bill_with_dependencies',
            {
                'bill_id': bill_id,
                'max_depth': 2
            }
        )
        return result
```

### Step 3: Build Training Data Collection Pipeline

```python
# ai/training/collect.py

from ai.rag.with_mcp.rag_system import MCPEnhancedRAG
import json

async def collect_training_data(bill_ids: list, questions_per_bill: int = 10):
    """
    Collect training data for fine-tuning.

    For each bill:
    1. Fetch with dependencies (MCP)
    2. Generate diverse questions
    3. Collect answers with full context
    4. Export as JSONL
    """
    rag = MCPEnhancedRAG()
    training_examples = []

    for bill_id in bill_ids:
        # Get bill with dependencies
        await rag.index_document(bill_id)

        # Generate questions (or use curated list)
        questions = generate_questions_about_bill(bill_id)

        for question in questions:
            chunks, _ = await rag.query(question, k=10)
            answer = await generate_answer(question, chunks)

            training_examples.append({
                'messages': [
                    {'role': 'system', 'content': 'You are CutTheCrapAI...'},
                    {'role': 'user', 'content': question},
                    {'role': 'assistant', 'content': answer}
                ]
            })

    # Export for fine-tuning
    with open('training_data.jsonl', 'w') as f:
        for example in training_examples:
            f.write(json.dumps(example) + '\n')
```

### Step 4: Use for User-Facing Features

Add to frontend:

```typescript
// frontend/components/BillAnalysis.tsx

async function analyzeBill(billId: string, question: string) {
  const response = await fetch('/api/bills/analyze', {
    method: 'POST',
    body: JSON.stringify({ billId, question }),
  });

  const { answer, metadata } = await response.json();

  return {
    answer,
    documentsAnalyzed: metadata.documents_included,
    dependencies: metadata.dependencies_fetched,
    confidence: metadata.confidence
  };
}
```

---

## Configuration

### Environment Variables

Add to `.env`:

```bash
# RAG Configuration
RAG_EMBEDDING_MODEL=all-MiniLM-L6-v2
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
RAG_MAX_DEPTH=2

# MCP Configuration
FEDDOC_MCP_SERVER=./mcp/feddoc_server.py
CONGRESS_API_KEY=your_key_here

# LLM Configuration (for training data)
OPENAI_API_KEY=your_key_here
LLM_MODEL=gpt-4

# Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL=86400
```

---

## Benefits of Integration

### For Development

- **Faster prototyping**: Use RAG immediately while training models
- **Training data quality**: Rich context improves fine-tuning
- **Cost efficiency**: MCP reduces API calls by 70-90%

### For Production

- **Better answers**: Full legislative context
- **Lower latency**: Cached dependency graphs
- **Scalability**: Efficient document retrieval

### For Users

- **Comprehensive analysis**: AI sees bills + amendments + laws
- **Instant follow-ups**: Cached context enables fast responses
- **Trustworthy answers**: Sources are transparent

---

## Migration Path

### Phase 1: Current (Week 1-2)
- Keep RAG as standalone comparison demo
- Use for educational purposes
- Evaluate performance

### Phase 2: Integration (Week 3-4)
- Move RAG code into main CutTheCrap repo
- Connect to real FedDocMCP
- Build training data collection pipeline

### Phase 3: Production (Week 5-8)
- Collect 10,000+ high-quality training examples
- Fine-tune CutTheCrapAI
- Deploy RAG + fine-tuned model in production

### Phase 4: Optimization (Ongoing)
- Monitor performance metrics
- Improve chunking strategies
- Expand to more document types

---

## Next Steps

1. **Review this integration plan** with the team
2. **Choose integration option** (Training data / Production / Hybrid)
3. **Set up FedDocMCP** connection
4. **Start collecting** training examples
5. **Monitor metrics** from comparison system

---

## Questions?

See also:
- `RAG_COMPARISON_README.md` - Technical details
- `CutTheCrap_Integration_Plan.md` - Original platform vision
- `DELIVERY_SUMMARY.md` - What we built

---

*This RAG comparison system is a foundation. Integrate it thoughtfully to maximize the value for CutTheCrap users.*
