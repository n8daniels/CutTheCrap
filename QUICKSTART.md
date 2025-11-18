# Quick Start Guide

## Get Up and Running in 5 Minutes

### 1. Verify Project Structure

```bash
python verify_setup.py
```

You should see all green checkmarks ✓

### 2. Install Dependencies

```bash
# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (this may take 5-10 minutes)
pip install -r requirements.txt
```

**Note**: The installation includes large ML models like sentence-transformers and FAISS. Be patient!

### 3. Run the Demo

```bash
python src/demo/side_by_side_comparison.py
```

This will:
- Initialize both RAG systems (traditional and MCP-enhanced)
- Run two comparison scenarios
- Generate a detailed performance report
- Show you the MCP advantage with real metrics

### 4. What You'll See

**Scenario 1**: Single document query
- Traditional RAG fetches 1 document
- MCP-Enhanced fetches 1 document + 4 dependencies
- Same number of API calls, 5x more context!

**Scenario 2**: 10 follow-up questions
- Traditional RAG might need 10 separate fetches
- MCP-Enhanced reuses cached context - 0 additional fetches!

### 5. Understanding the Results

The demo will generate a comparison report showing:

| Metric | Traditional | MCP-Enhanced | Improvement |
|--------|-------------|--------------|-------------|
| API Calls | Higher | Lower | 70-90% reduction |
| Documents | 1 | 5+ | Much richer context |
| Follow-up Speed | Requires new fetch | Instant (cached) | Dramatically faster |

## Troubleshooting

**Import errors?**
- Make sure you activated the virtual environment
- Check that all packages installed: `pip list | grep -E "(sentence|faiss|numpy)"`

**Out of memory?**
- The embedding model downloads ~80MB on first run
- Reduce batch size in `src/rag/shared/embeddings.py` if needed

**Can't find documents?**
- Make sure you're in the project root directory
- Check that `data/sample_documents/` exists and has JSON files

## What's Next?

- Read `RAG_COMPARISON_README.md` for full documentation
- Modify parameters in the RAG systems to experiment
- Add your own documents to `data/sample_documents/`
- Create custom comparison scenarios

## For Educators

This project is ready to use in courses teaching:
- RAG architecture
- System design optimization
- Performance analysis
- MCP integration patterns

Students can:
1. Run the demo to see the difference
2. Read the code to understand implementation
3. Modify parameters to see effects
4. Build upon this foundation

## Contact

Questions or issues? Open an issue on GitHub:
https://github.com/n8daniels/CutTheCrap

---

Built by Nate Daniels | MIT License
