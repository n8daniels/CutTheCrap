# Building Your Custom CutTheCrapLLM

This guide walks you through building a custom fine-tuned language model specialized in analyzing federal legislation using documents fetched via Model Context Protocol (MCP).

## Why a Custom LLM?

General-purpose LLMs like GPT-4 are powerful, but they:
- Don't understand the specific structure of federal legislation
- Lack knowledge of recent bills and laws
- Can't leverage the full context of bill dependencies
- Aren't optimized for legislative analysis

**CutTheCrapLLM solves this by:**
- Training on real legislative documents with full dependency graphs
- Learning from high-quality human-AI interactions
- Understanding bill structure, amendments, and cross-references
- Providing accurate, well-cited legislative analysis

## The Training Pipeline

```
User Question → MCP Fetches Bill + Dependencies → AI Responds → Save Training Example
                                                        ↓
                                                  (Repeat 100s of times)
                                                        ↓
                                          Export to JSONL → Fine-tune → Deploy
```

## Quick Start

### 1. Prerequisites

```bash
# Required
- Node.js 18+
- Congress.gov API key (free at https://api.congress.gov/sign-up/)
- OpenAI API key with fine-tuning access

# Optional
- FedDocMCP server (or build your own MCP server)
```

### 2. Installation

```bash
git clone https://github.com/n8daniels/CutTheCrap.git
cd CutTheCrap
npm install
cp .env.example .env
```

### 3. Configure Environment

Edit `.env`:

```bash
# Required
CONGRESS_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here

# Enable training mode
CUTTHECRAP_TRAINING_MODE=true

# Optional (for production)
CUTTHECRAP_MODEL_ID=gpt-4o-mini  # Will update after fine-tuning
```

### 4. Start Collecting Training Data

```bash
npm run dev
```

Then interact with your API to collect training examples:

```bash
# Ask about a bill (training data automatically saved)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the Infrastructure Investment and Jobs Act?",
    "billId": "117/hr/3684"
  }'
```

**Every interaction is automatically saved as a training example!**

### 5. Build Your Training Dataset

Collect **100-500 diverse examples**:

- Different bills (H.R., S., resolutions)
- Different question types (summaries, comparisons, specific sections)
- Different congresses (117th, 118th, etc.)
- High-quality responses (review and filter)

### 6. Export Training Data

```bash
# Export all examples with good feedback
npm run export-training-data -- --min-score 4

# This creates: data/training/training_data.jsonl
```

### 7. Fine-tune Your Model

```bash
npm run finetune -- --training-file data/training/training_data.jsonl
```

This returns a job ID like `ftjob-abc123`.

### 8. Monitor Fine-tuning

```bash
# Check status
npm run finetune-status -- --job-id ftjob-abc123

# Fine-tuning takes 1-4 hours
```

### 9. Deploy Your Model

When complete, update `.env`:

```bash
CUTTHECRAP_MODEL_ID=ft:gpt-4o-mini:your-org:cutthecrap:abc123
```

**Done! Your custom model is now live!**

## How It Works

### Document Fetching with MCP

When a user asks about a bill, the system:

1. **Fetches the primary bill** from Congress.gov
2. **Detects dependencies** (amendments, referenced laws, related bills)
3. **Recursively fetches dependencies** (up to depth 2)
4. **Builds a document graph** with all related documents
5. **Caches everything** for 24 hours

Example: Asking about H.R. 3684 fetches:
- H.R. 3684 (Infrastructure Bill)
- Amendment SA 2137
- 23 U.S.C. § 119 (Highway funding law)
- Public Law 114-94 (FAST Act)
- Previous bill versions

### AI Context Building

The document graph is converted to AI context:

```typescript
{
  primaryBill: {
    id: "117/hr/3684",
    title: "Infrastructure Investment and Jobs Act",
    fullText: "...",  // Full bill text
  },
  dependencies: [
    {
      id: "SA2137",
      type: "amendment",
      summary: "...",  // Summary only, not full text
      relationship: "Amends Section 11003"
    }
  ],
  metadata: {
    documentsIncluded: 5,
    totalTokensEstimate: 85000
  }
}
```

**Key insight**: Primary bill gets full text, dependencies get summaries to save tokens.

### Training Data Format

Each saved training example includes:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are CutTheCrapLLM...\n=== DOCUMENT CONTEXT ===\nPrimary Bill: H.R. 3684...\nRelated Documents:\n- Amendment SA 2137...\n- 23 U.S.C. § 119..."
    },
    {
      "role": "user",
      "content": "What is the Infrastructure Investment and Jobs Act?"
    },
    {
      "role": "assistant",
      "content": "The Infrastructure Investment and Jobs Act (H.R. 3684) is..."
    }
  ]
}
```

The model learns to:
- Use document context effectively
- Cite specific sections and documents
- Understand bill structure and relationships
- Provide accurate, concise analysis

## Best Practices

### 1. Quality Training Data

**DO:**
- ✅ Ask diverse questions about different bills
- ✅ Review AI responses for accuracy
- ✅ Include feedback scores (1-5)
- ✅ Cover different question types
- ✅ Filter for high-quality examples (score 4+)

**DON'T:**
- ❌ Include examples with hallucinations
- ❌ Accept low-quality or incorrect responses
- ❌ Use duplicate questions
- ❌ Train on bills without context

### 2. Dataset Size

- **Minimum**: 100 examples for basic fine-tuning
- **Good**: 200-500 examples for solid performance
- **Excellent**: 1000+ examples for production

### 3. Context Richness

Always fetch bills with dependencies:

```javascript
{
  "billId": "117/hr/3684",  // This triggers dependency fetching
  "question": "..."
}
```

The richer the context, the better the model learns!

### 4. Continuous Improvement

After deployment:
1. Collect user feedback on responses
2. Add new high-quality examples monthly
3. Retrain quarterly with updated dataset
4. Track performance metrics

## Cost Breakdown

### Training Costs

Using `gpt-4o-mini` as base model:

| Dataset Size | Tokens | Cost |
|--------------|--------|------|
| 100 examples | ~1M | $0.30 |
| 500 examples | ~5M | $1.50 |
| 1000 examples | ~10M | $3.00 |

### Inference Costs

Similar to base model pricing:
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

With caching, expect **$10-50/month** for moderate usage.

## Advanced Features

### Custom Dependency Detection

Extend `src/lib/dependency-detector.ts` to detect:
- State laws referenced in federal bills
- Executive orders
- Court cases
- Regulations (CFR)

### Multi-model Training

Train different models for different purposes:
- `cutthecrap-summarizer` - Bill summaries
- `cutthecrap-analyzer` - Deep analysis
- `cutthecrap-comparator` - Bill comparisons

### Validation Sets

Split your data 90/10:

```bash
# Create validation set
npm run export-training-data -- \
  --start 2024-01-01 \
  --end 2024-10-31 \
  --output training_data.jsonl

npm run export-training-data -- \
  --start 2024-11-01 \
  --end 2024-11-30 \
  --output validation_data.jsonl

# Fine-tune with validation
npm run finetune -- \
  --training-file data/training/training_data.jsonl \
  --validation-file data/training/validation_data.jsonl
```

This helps prevent overfitting!

## Troubleshooting

### "No training examples found"

- Check `CUTTHECRAP_TRAINING_MODE=true` in `.env`
- Verify `data/training/` directory exists
- Make sure you've interacted with the API

### "Fine-tuning failed: Invalid JSONL"

- Run export script again
- Check for JSON syntax errors
- Ensure one JSON object per line

### "Model not using context"

- Verify `billId` is in API request
- Check FedDocMCP connection
- Review system message in training data

### "Token limit exceeded"

- Reduce bill text length
- Summarize dependencies more aggressively
- Use dependency summaries, not full text

## Example Workflow

Here's a complete example from start to finish:

```bash
# 1. Start development
npm run dev

# 2. Collect 100 examples (ask questions via API)
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"question\": \"...\", \"billId\": \"...\"}"
done

# 3. Review training data
curl http://localhost:3000/api/training/export

# 4. Export to JSONL
npm run export-training-data

# 5. Fine-tune
npm run finetune -- --training-file data/training/training_data.jsonl

# 6. Monitor (every 10 minutes)
npm run finetune-status -- --job-id ftjob-abc123

# 7. Deploy (when complete)
# Update .env with new model ID
# Restart server
npm run dev

# 8. Test your custom model
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Analyze the infrastructure bill",
    "billId": "117/hr/3684"
  }'
```

## Performance Metrics

Track these to evaluate your model:

1. **Response Quality**
   - User feedback scores
   - Citation accuracy
   - Factual correctness

2. **Context Usage**
   - % responses citing dependencies
   - Cross-reference accuracy

3. **Efficiency**
   - Average response time
   - Tokens per response
   - Cache hit rate

4. **Training Data**
   - Examples per bill
   - Question diversity
   - Feedback distribution

## Next Steps

1. ✅ Collect your first 100 training examples
2. ✅ Export and fine-tune your model
3. ✅ Deploy and test with real users
4. ✅ Iterate based on feedback
5. ✅ Scale to production

## Resources

- [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [Congress.gov API Docs](https://api.congress.gov/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [CutTheCrap Training Workflow](./TRAINING_WORKFLOW.md)

---

**Questions?** Open an issue or check the docs!

**Built with focus. No fluff, no BS, just results.**
