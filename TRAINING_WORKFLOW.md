# CutTheCrapLLM Training Workflow

## 🎓 Educational Purpose

This document is a **learning guide** for building and training custom LLMs. It demonstrates a complete production-ready training pipeline using federal legislation as example data.

**What you'll learn:**
- Complete LLM training workflow from scratch
- How to use Model Context Protocol (MCP) for data fetching
- Training data collection and quality management
- Fine-tuning with OpenAI's API
- Model deployment and versioning

**Note:** While this uses federal legislation data, the techniques apply to **any specialized domain** (healthcare, legal, finance, etc.).

## Overview

This learning project demonstrates a complete training pipeline:

1. **Document Fetching** - FedDocMCP fetches bills with full dependency graphs
2. **User Interaction** - Users chat with the AI, asking questions about bills
3. **Training Data Collection** - Every interaction is saved as a training example
4. **Data Export** - Training examples are exported to JSONL format
5. **Fine-tuning** - OpenAI API fine-tunes a custom model
6. **Deployment** - The fine-tuned model is used for inference

## Architecture (What You'll Build)

This architecture demonstrates key LLM training concepts:

```
┌─────────────────────────────────────────────────────────────┐
│  User Asks Question                                          │
│  (Learning: User interaction triggers data collection)       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  FedDocMCP Fetches Bill + Dependencies                       │
│  (Learning: MCP provides rich external data)                 │
│  • Primary Bill (H.R. 3684)                                  │
│  • Amendments (SA 2137)                                      │
│  • Referenced Laws (23 U.S.C. § 119)                         │
│  • Related Bills (Public Law 114-94)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Build AI Context with Full Graph                            │
│  (Learning: Context engineering for better responses)        │
│  • Complete document context                                 │
│  • Smart summarization (optimize token usage)                │
│  • Cross-references and relationships                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  CutTheCrapLLM Generates Response                            │
│  (Learning: Inference with rich context)                     │
│  • Uses GPT-4 (initial) or fine-tuned model (after training) │
│  • Leverages full document context                           │
│  • Provides accurate, well-cited answers                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Save Training Example (if training mode enabled)            │
│  (Learning: Automatic training data collection)              │
│  • Question                                                  │
│  • Full AI Context (document graph)                          │
│  • AI Response                                               │
│  • Metadata (bill ID, timestamp, feedback)                   │
└──────────────────────────────────────────────────────────────┘

After collecting 100-500 examples:
Export → Fine-tune → Deploy custom model
```

**Key Learning:** This architecture shows how to automatically collect high-quality training data from real user interactions.

## Step-by-Step Learning Guide

### Step 1: Initial Setup (Learning: Project Configuration)

```bash
# Clone the repository
git clone https://github.com/n8daniels/CutTheCrap.git
cd CutTheCrap

# Install dependencies
npm install

# Set up FedDocMCP as a submodule
# LEARNING NOTE: FedDocMCP is a companion project that demonstrates
# how to build MCP servers. This teaches MCP implementation.
git submodule add https://github.com/yourusername/feddoc-mcp.git packages/feddoc-mcp
git submodule update --init --recursive

# Configure environment
cp .env.example .env
# Edit .env with your API keys:
# - CONGRESS_API_KEY (free from https://api.congress.gov)
# - OPENAI_API_KEY (for fine-tuning)
# - Set CUTTHECRAP_TRAINING_MODE=true (enables automatic data collection)
```

**What you're learning:**
- Project structure and dependencies
- Environment configuration for LLM training
- MCP server integration

### Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Step 3: Collect Training Data (Learning: Automated Data Collection)

Enable training mode in `.env`:

```bash
CUTTHECRAP_TRAINING_MODE=true
```

**What this does:** Every API interaction is automatically saved as a training example. This teaches you how to build automated data collection pipelines.

Then interact with the API to generate training examples:

```bash
# Example 1: Ask about Infrastructure Bill
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is H.R. 3684 and what does it do?",
    "billId": "117/hr/3684"
  }'

# Example 2: Ask about a specific section
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain the broadband funding provisions",
    "billId": "117/hr/3684"
  }'

# Example 3: Compare bills
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How does this differ from the FAST Act?",
    "billId": "117/hr/3684"
  }'
```

**What's happening behind the scenes:**
1. MCP fetches the bill and dependencies
2. System builds rich context with full document graph
3. AI generates response using that context
4. Entire interaction (question + context + response) saved as training example

Each interaction is saved in `data/training/` as a JSON file.

**Learning objective:** Understand how to automatically capture high-quality training data from production interactions.

### Step 4: Review Training Data

Check your training data statistics:

```bash
# Get statistics on collected training data
curl http://localhost:3000/api/training/export
```

This will show:
- Total examples collected
- Unique bills covered
- Average documents per example
- Feedback distribution
- Date range

### Step 5: Export Training Data to JSONL (Learning: Data Formatting)

```bash
# Export all training data
npm run export-training-data

# Export with quality filters (recommended)
npm run export-training-data -- \
  --start 2024-01-01 \
  --end 2024-12-31 \
  --min-score 4 \
  --output my_training_data.jsonl
```

**What you're learning:**
- How to format training data for OpenAI fine-tuning
- Quality filtering strategies (feedback scores, deduplication)
- JSONL format requirements

This creates a JSONL file in `data/training/` with OpenAI's required format:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are CutTheCrapLLM...\n=== DOCUMENT CONTEXT ===\n..."
    },
    {
      "role": "user",
      "content": "What is H.R. 3684 and what does it do?"
    },
    {
      "role": "assistant",
      "content": "H.R. 3684, the Infrastructure Investment and Jobs Act..."
    }
  ]
}
```

### Step 6: Fine-tune CutTheCrapLLM (Learning: Model Fine-tuning)

```bash
# Start fine-tuning with your exported data
npm run finetune -- --training-file data/training/training_data.jsonl

# With validation set (recommended for preventing overfitting)
npm run finetune -- \
  --training-file data/training/training_data.jsonl \
  --validation-file data/training/validation_data.jsonl
```

**What you're learning:**
- How to use OpenAI's fine-tuning API
- Uploading training data to OpenAI
- Managing fine-tuning jobs
- Validation sets and overfitting prevention

This will:
1. Upload your training data to OpenAI
2. Create a fine-tuning job
3. Return a job ID for tracking

**Estimated time:** 1-4 hours depending on dataset size

### Step 7: Monitor Fine-tuning Progress

```bash
# Check specific job status
npm run finetune-status -- --job-id ftjob-xxxxx

# List all fine-tuning jobs
npm run finetune-status
```

Fine-tuning typically takes 1-4 hours depending on dataset size.

### Step 8: Deploy Fine-tuned Model (Learning: Model Deployment)

Once fine-tuning completes, update your `.env`:

```bash
# The fine-tuning script will output the model ID
CUTTHECRAP_MODEL_ID=ft:gpt-4o-mini:your-org:cutthecrap:abc123
```

**What you're learning:**
- Model versioning and deployment
- Switching between base and fine-tuned models
- A/B testing strategies (compare base vs. fine-tuned performance)

Now all API requests will use your custom model! Your LLM training journey is complete.

## Training Data Best Practices

### 1. Quality Over Quantity

- Aim for **100-500 high-quality examples** minimum
- Filter for helpful feedback (min score 4+)
- Deduplicate similar questions
- Remove examples with errors or hallucinations

### 2. Diverse Coverage

- Cover different bill types (H.R., S., resolutions)
- Include various question types:
  - Summaries: "What does this bill do?"
  - Specific sections: "Explain Section 1103"
  - Comparisons: "How does this differ from the previous law?"
  - Impact: "Who does this affect?"
  - Timeline: "When does this take effect?"

### 3. Context Richness

- Always fetch bills with dependencies (maxDepth=2)
- Include related amendments, laws, and bills
- The richer the context, the better the model learns

### 4. Feedback Loop

After deployment:
- Collect user feedback on responses
- Continuously add high-quality examples
- Re-train periodically (monthly or quarterly)
- Track model performance metrics

## Training Data Format

Each training example consists of:

```typescript
{
  input: "User question",
  context: {
    primaryBill: {
      id: "117/hr/3684",
      title: "Infrastructure Investment and Jobs Act",
      fullText: "...",
      metadata: { ... }
    },
    dependencies: [
      {
        id: "SA2137",
        type: "amendment",
        title: "Infrastructure Amendments",
        summary: "...",
        relationship: "Amends Section 11003"
      }
    ],
    metadata: {
      documentsIncluded: 5,
      dependencyDepth: 2,
      totalTokensEstimate: 85000
    }
  },
  output: "AI response",
  metadata: {
    billId: "117/hr/3684",
    timestamp: "2024-11-16T...",
    userFeedback: 5
  }
}
```

## API Endpoints

### Chat with CutTheCrapLLM

```bash
POST /api/chat
{
  "question": "Your question",
  "billId": "117/hr/3684",  // Optional
  "stream": false,           // Optional, default false
  "conversationHistory": []  // Optional
}
```

### Export Training Data

```bash
GET /api/training/export
# Returns statistics

POST /api/training/export
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "minFeedbackScore": 4,
  "outputFilename": "training_data.jsonl"
}
```

### Fine-tuning Management

```bash
POST /api/training/finetune
{
  "trainingFilePath": "data/training/training_data.jsonl",
  "validationFilePath": "data/training/validation_data.jsonl"
}

GET /api/training/finetune?jobId=ftjob-xxxxx
# Check job status

GET /api/training/finetune
# List all jobs
```

## Cost Estimation

### Training Costs (OpenAI)

Based on gpt-4o-mini base model:

- **Training**: ~$0.30 per 1M tokens
- **Typical dataset**: 100 examples × 10k tokens = 1M tokens = **$0.30**
- **Usage**: Similar to base model pricing

### MCP/API Costs

- **Congress API**: Free (5000 requests/hour)
- **Caching**: Reduces repeat fetches by 80-90%

### Total Estimated Cost

- Initial training: **$0.30 - $3.00** (depending on dataset size)
- Monthly usage: **$10 - $50** (depending on traffic)

## Performance Metrics

Track these metrics to evaluate your model:

1. **Response Quality**
   - User feedback scores (1-5)
   - Response accuracy (fact-checked)
   - Citation quality

2. **Context Utilization**
   - % of responses citing dependencies
   - Depth of analysis
   - Cross-reference accuracy

3. **Efficiency**
   - Tokens per response
   - Response time
   - Cache hit rate

4. **Training Data Quality**
   - Examples per bill (diversity)
   - Feedback distribution
   - Deduplication ratio

## Troubleshooting

### Training Data Not Saving

- Check `CUTTHECRAP_TRAINING_MODE=true` in `.env`
- Verify `data/training/` directory exists and is writable
- Check logs for errors

### Fine-tuning Fails

- Ensure JSONL format is correct (one JSON object per line)
- Check for minimum example count (10+ examples)
- Verify OpenAI API key has fine-tuning permissions
- Check for token limits (max 65k tokens per example)

### Model Not Using Context

- Verify billId is provided in API request
- Check that FedDocMCP is connected and working
- Review system message construction
- Ensure context is not truncated due to token limits

## Next Steps in Your Learning Journey

1. ✅ **Collect 100+ training examples** - Learn data collection at scale
2. ✅ **Export and fine-tune** your first model - Complete the full pipeline
3. ✅ **Deploy and test** - See your custom model in action
4. ✅ **Iterate** - Collect feedback, add examples, retrain
5. ✅ **Experiment** - Try different approaches and optimizations
6. ✅ **Apply to your domain** - Use these techniques for your own projects

## What You've Learned

By completing this workflow, you now understand:

### LLM Training Fundamentals
- ✅ How to collect training data from user interactions
- ✅ How to format data for fine-tuning (JSONL)
- ✅ How to use OpenAI's fine-tuning API
- ✅ How to manage model versions and deployments
- ✅ Quality filtering and deduplication strategies

### MCP Integration
- ✅ How MCP servers fetch external data
- ✅ Building document dependency graphs
- ✅ Context engineering for better LLM responses
- ✅ Caching strategies for performance

### Production Best Practices
- ✅ Automated training data collection
- ✅ Streaming AI responses
- ✅ User feedback loops
- ✅ A/B testing base vs. fine-tuned models
- ✅ Continuous model improvement

## Companion Learning Project: FedDocMCP

This project (CutTheCrap) demonstrates **training custom LLMs**.

The companion project **FedDocMCP** demonstrates **building MCP servers**.

Together, they teach:
- **FedDocMCP**: How to build MCP servers that fetch and organize external data
- **CutTheCrap**: How to use that data to train domain-specific LLMs

Both are educational projects designed for hands-on learning.

## Apply These Techniques Elsewhere

The MCP + LLM training pipeline you've learned works for any domain:

- **Healthcare** - Train on medical literature, clinical guidelines
- **Legal** - Train on case law, contracts, regulations
- **Finance** - Train on SEC filings, financial reports
- **Research** - Train on academic papers, patents
- **Customer Support** - Train on product docs, support tickets

The architecture and workflow remain the same - just swap out the data source!

## Resources

**Learning Materials:**
- [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Congress.gov API Documentation](https://api.congress.gov/)

**Related Projects:**
- [FedDocMCP](https://github.com/yourusername/feddoc-mcp) - Companion MCP server learning project

---

**Built to learn. Built to teach. Built with focus.**

*This is an educational project demonstrating LLM training and MCP integration. The techniques learned here apply to building any domain-specific AI system.*
