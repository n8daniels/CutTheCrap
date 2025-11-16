# CutTheCrapLLM Training Workflow

This document explains how to build, train, and deploy your custom CutTheCrapLLM using federal documents fetched via MCP (Model Context Protocol).

## Overview

CutTheCrap uses a complete training pipeline:

1. **Document Fetching** - FedDocMCP fetches bills with full dependency graphs
2. **User Interaction** - Users chat with the AI, asking questions about bills
3. **Training Data Collection** - Every interaction is saved as a training example
4. **Data Export** - Training examples are exported to JSONL format
5. **Fine-tuning** - OpenAI API fine-tunes a custom model
6. **Deployment** - The fine-tuned model is used for inference

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Asks Question                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              FedDocMCP Fetches Bill + Dependencies           │
│  • Primary Bill (H.R. 3684)                                  │
│  • Amendments (SA 2137)                                      │
│  • Referenced Laws (23 U.S.C. § 119)                         │
│  • Related Bills (Public Law 114-94)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Build AI Context with Full Graph                │
│  • Complete legislative context                              │
│  • Smart summarization (not full text for deps)              │
│  • Cross-references and relationships                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│          CutTheCrapLLM Generates Response                    │
│  • Uses GPT-4 (initial) or fine-tuned model                  │
│  • Leverages full document context                           │
│  • Provides accurate, well-cited answers                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Save Training Example (if training mode)        │
│  • Question                                                  │
│  • Full AI Context (document graph)                          │
│  • AI Response                                               │
│  • Metadata (bill ID, timestamp, etc.)                       │
└──────────────────────────────────────────────────────────────┘
```

## Step-by-Step Guide

### Step 1: Initial Setup

```bash
# Clone the repository
git clone https://github.com/n8daniels/CutTheCrap.git
cd CutTheCrap

# Install dependencies
npm install

# Set up FedDocMCP as a submodule
# (You'll need to create this separately or use an existing MCP server)
git submodule add https://github.com/yourusername/feddoc-mcp.git packages/feddoc-mcp
git submodule update --init --recursive

# Configure environment
cp .env.example .env
# Edit .env with your API keys:
# - CONGRESS_API_KEY
# - OPENAI_API_KEY
# - Set CUTTHECRAP_TRAINING_MODE=true
```

### Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Step 3: Collect Training Data

Enable training mode in `.env`:

```bash
CUTTHECRAP_TRAINING_MODE=true
```

Then interact with the API:

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

Each interaction will be saved as a training example in `data/training/`.

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

### Step 5: Export Training Data to JSONL

```bash
# Export all training data
npm run export-training-data

# Export with filters
npm run export-training-data -- \
  --start 2024-01-01 \
  --end 2024-12-31 \
  --min-score 4 \
  --output my_training_data.jsonl
```

This will create a JSONL file in `data/training/` with the format:

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

### Step 6: Fine-tune CutTheCrapLLM

```bash
# Start fine-tuning with your exported data
npm run finetune -- --training-file data/training/training_data.jsonl

# With validation set (recommended)
npm run finetune -- \
  --training-file data/training/training_data.jsonl \
  --validation-file data/training/validation_data.jsonl
```

This will:
1. Upload your training data to OpenAI
2. Create a fine-tuning job
3. Return a job ID for tracking

### Step 7: Monitor Fine-tuning Progress

```bash
# Check specific job status
npm run finetune-status -- --job-id ftjob-xxxxx

# List all fine-tuning jobs
npm run finetune-status
```

Fine-tuning typically takes 1-4 hours depending on dataset size.

### Step 8: Deploy Fine-tuned Model

Once fine-tuning completes, update your `.env`:

```bash
# The fine-tuning script will output the model ID
CUTTHECRAP_MODEL_ID=ft:gpt-4o-mini:your-org:cutthecrap:abc123
```

Now all API requests will use your custom model!

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

## Next Steps

1. **Collect 100+ training examples** from diverse bills
2. **Export and fine-tune** your first model
3. **Deploy and test** with real users
4. **Iterate**: Collect feedback, add examples, retrain
5. **Scale**: Add more document types, improve dependency detection

## Resources

- [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [Congress.gov API](https://api.congress.gov/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Built with focus. No fluff, no BS, just results.**
