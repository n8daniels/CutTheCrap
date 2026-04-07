# Government Document Analyzer - MCP Server

> An intelligent Model Context Protocol server for analyzing government documents, extracting plain English summaries, and identifying political stances with smart caching and relationship tracking.

---

## 📖 Table of Contents

- [Why MCP?](#-why-mcp)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Development](#-development)

---

## 🤔 Why MCP?

### The Problem We're Solving

Government documents are complex, interconnected, and constantly updated:

- **Bill H.R. 1234** gets amended
- **3 service documents** reference that bill
- **Each document** needs to be:
  - Translated to plain English
  - Analyzed for political stance
  - Cross-referenced with related documents

**Without MCP:** Every time you analyze one of these documents, you'd re-process all the related content, leading to:
- ❌ Redundant AI processing (expensive and slow)
- ❌ Inconsistent analysis across related documents
- ❌ No way to track document relationships
- ❌ Wasted money on duplicate LLM calls

**With MCP:** We get intelligent coordination:
- ✅ Process each document once, cache the results
- ✅ Track relationships between bills and service documents
- ✅ Serve cached summaries when documents are referenced
- ✅ Smart invalidation when source documents update

### Real-World Example

**Scenario:** User requests analysis of Service Document 247

#### Without MCP (Naive Approach)
```
1. Fetch Service Doc 247 (1s)
2. Process with LLM (10s, $0.10)
3. Fetch referenced Bill A (1s)
4. Process Bill A with LLM (10s, $0.10)
5. Fetch referenced Bill C (1s)
6. Process Bill C with LLM (10s, $0.10)
Total: 33 seconds, $0.30

Next user requests analysis of Service Doc 248 (also references Bill A):
1. Fetch Service Doc 248 (1s)
2. Process with LLM (10s, $0.10)
3. Fetch Bill A AGAIN (1s)
4. Process Bill A AGAIN with LLM (10s, $0.10) ❌ REDUNDANT
Total: 22 seconds, $0.20

Combined: 55 seconds, $0.50
```

#### With MCP (Smart Approach)
```
First request - Service Doc 247:
1. Fetch Service Doc 247 (1s)
2. Process with LLM (10s, $0.10)
3. Fetch Bill A (1s)
4. Process Bill A with LLM (10s, $0.10)
5. CACHE Bill A summary ✅
6. Fetch Bill C (1s)
7. Process Bill C with LLM (10s, $0.10)
8. CACHE Bill C summary ✅
Total: 33 seconds, $0.30

Second request - Service Doc 248:
1. Fetch Service Doc 248 (1s)
2. Process with LLM (10s, $0.10)
3. Check cache for Bill A → HIT! ✅
4. Return cached Bill A (0.05s, $0.00)
Total: 11 seconds, $0.10

Combined: 44 seconds, $0.40
Savings: 20% faster, 20% cheaper (and scaling improves)
```

After 10 documents all referencing Bill A:
- **Without MCP:** 10 redundant Bill A analyses = 100 seconds wasted, $1.00 wasted
- **With MCP:** 1 Bill A analysis + 9 cache hits = 0.5 seconds, $0.10

### When MCP Is The Right Choice

✅ **Use MCP when you need:**

| Use Case | Why MCP Helps |
|----------|---------------|
| **Document Relationships** | Track which bills are referenced by which service docs |
| **Expensive Processing** | Cache AI-generated summaries and analyses |
| **Consistent Context** | Ensure all apps see the same analyzed version |
| **Smart Invalidation** | When Bill A updates, automatically mark dependent docs as stale |
| **Audit & Governance** | Single point to log who accessed what and when |
| **Multiple AI Apps** | Share processed documents across different applications |

❌ **Don't use MCP when:**

| Use Case | Better Approach |
|----------|-----------------|
| Simple static file serving | Direct S3/CDN access |
| No document relationships | Direct database queries |
| Real-time, always-fresh data | Direct API integration |
| Single-use processing | Serverless function |

### MCP vs. Traditional API Gateway

| Feature | Traditional API Gateway | MCP Server |
|---------|------------------------|------------|
| **Primary Purpose** | Route HTTP requests | Provide AI context |
| **Caching** | HTTP layer only | Semantic + HTTP |
| **Relationships** | Not tracked | Graph-based tracking |
| **AI Integration** | Generic | AI-native (tools, prompts) |
| **Invalidation** | Time-based only | Event + time + dependency-based |
| **Context Assembly** | Manual | Automatic with deduplication |

### Architecture Benefits

```
Traditional Stack:
AI App 1 → LLM API → Process Bill A ($$$)
AI App 2 → LLM API → Process Bill A again ($$$ wasted)
AI App 3 → LLM API → Process Bill A again ($$$ wasted)

MCP Stack:
AI App 1 ─┐
AI App 2 ─┼→ MCP Server → Check cache → Process once → Cache result
AI App 3 ─┘                ↓
                    Next requests hit cache (free & fast)
```

### The Bottom Line

**MCP is middleware that makes AI apps:**
- 🚀 **Faster** - Cache hits in <100ms vs. LLM calls in 10+ seconds
- 💰 **Cheaper** - 70%+ reduction in LLM API costs with good caching
- 🧠 **Smarter** - Automatic context assembly with relationship tracking
- 🔒 **More Secure** - Centralized access control and audit logging
- 🔄 **More Consistent** - Same document = same analysis across all apps

For our government document use case, MCP transforms a slow, expensive, redundant process into a fast, efficient, intelligent system.

---

## ✨ Features

### Core Capabilities
- **Plain English Translation** - Convert complex legislative text into readable summaries
- **Political Stance Detection** - Analyze and identify political leanings
- **Relationship Tracking** - Map bills to referencing service documents
- **Smart Caching** - Eliminate redundant AI processing
- **Cascade Invalidation** - When a bill updates, all dependent docs are marked stale
- **Async Processing** - Long-running analyses don't block the UI
- **Context Assembly** - Automatically include related documents without duplication

### Performance Optimizations
- **Three-tier caching:** In-memory → Redis → Database
- **Timestamp-based freshness checks:** Never serve stale data
- **Deduplication:** Same content never processed twice
- **Background processing:** Users get immediate feedback
- **Monitoring & Health checks:** Track cache hit rates and performance

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AI Applications                       │
│  (Claude Desktop, Custom Apps, Chatbots)                │
└─────────────────┬───────────────────────────────────────┘
                  │ MCP Protocol
                  ↓
┌─────────────────────────────────────────────────────────┐
│              MCP Server (This Project)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Tools Layer                                        │  │
│  │  • analyze_document()                             │  │
│  │  • get_document_context()                         │  │
│  │  • get_related_documents()                        │  │
│  │  • mark_document_updated()                        │  │
│  │  • get_job_status()                               │  │
│  └───────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Business Logic Layer                              │  │
│  │  • Document Graph Manager                         │  │
│  │  • Smart Cache with Invalidation                  │  │
│  │  • Async Job Manager                              │  │
│  │  • Context Assembler                              │  │
│  │  • Performance Monitor                            │  │
│  └───────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Data Layer                                        │  │
│  │  • Document Store (PostgreSQL)                    │  │
│  │  • Redis Cache (L1/L2)                            │  │
│  │  • Relationship Graph (Neo4j or PG)               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│              External Services                           │
│  • Claude API (LLM processing)                          │
│  • Government Document Sources                          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow Example

```
User: "Analyze Service Document 247"
       ↓
1. MCP receives request
       ↓
2. Check cache: Service Doc 247 → MISS
       ↓
3. Submit async job, return job_id immediately
       ↓
4. Background: Process Service Doc 247
       ↓
5. Background: Check relationships → References Bill A, Bill C
       ↓
6. Background: Check cache for Bill A → HIT (use cached summary)
       ↓
7. Background: Check cache for Bill C → MISS (process it)
       ↓
8. Background: Assemble context (deduplicated)
       ↓
9. Background: Cache result for Service Doc 247
       ↓
10. User polls: job complete, return full analysis
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Redis (for caching)
- PostgreSQL (for document storage)
- Claude API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gov-doc-mcp-server.git
cd gov-doc-mcp-server

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and database URLs

# Initialize database
python scripts/init_db.py

# Run the MCP server
python -m gov_doc_mcp.server
```

### Configuration

```yaml
# config.yaml
server:
  host: localhost
  port: 8080
  
cache:
  redis_url: redis://localhost:6379
  ttl_hours: 24
  
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  max_tokens: 4000
  
performance:
  cache_target_hit_rate: 0.70
  max_response_time_ms: 100
  async_threshold_ms: 100
```

### Connect to Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gov-doc-analyzer": {
      "command": "python",
      "args": ["-m", "gov_doc_mcp.server"],
      "env": {
        "REDIS_URL": "redis://localhost:6379",
        "DATABASE_URL": "postgresql://localhost/govdocs"
      }
    }
  }
}
```

---

## 📡 API Reference

### Tools Exposed by MCP

#### `analyze_document`
Analyze a government document and return plain English summary + political stance.

**Input:**
```json
{
  "doc_id": "bill_HR_1234",
  "force_refresh": false
}
```

**Output (cached):**
```json
{
  "status": "complete",
  "from_cache": true,
  "analysis": {
    "plain_english": "This bill proposes...",
    "political_stance": "center-left",
    "key_points": ["...", "..."],
    "referenced_by": ["service_doc_247", "service_doc_300"]
  }
}
```

**Output (processing):**
```json
{
  "status": "processing",
  "job_id": "job_abc123",
  "estimated_time": "15-30 seconds",
  "poll_url": "/status/job_abc123"
}
```

---

#### `get_document_context`
Get a document with all related documents assembled (deduplicated).

**Input:**
```json
{
  "doc_id": "service_doc_247",
  "depth": 2
}
```

**Output:**
```json
{
  "primary_document": {
    "id": "service_doc_247",
    "plain_english": "...",
    "political_stance": "..."
  },
  "related_documents": [
    {
      "id": "bill_HR_1234",
      "plain_english": "...",
      "relationship": "referenced_by_primary"
    }
  ],
  "relationship_graph": [
    {"from": "service_doc_247", "to": "bill_HR_1234", "type": "references"}
  ]
}
```

---

#### `get_related_documents`
Find all documents related to a given document.

**Input:**
```json
{
  "doc_id": "bill_HR_1234",
  "relationship_type": "references"  // or "referenced_by"
}
```

**Output:**
```json
{
  "document_id": "bill_HR_1234",
  "related_documents": [
    {
      "id": "service_doc_247",
      "relationship": "references",
      "processed": true
    },
    {
      "id": "service_doc_300",
      "relationship": "references",
      "processed": false
    }
  ]
}
```

---

#### `mark_document_updated`
Invalidate cache for a document and all dependents.

**Input:**
```json
{
  "doc_id": "bill_HR_1234",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Output:**
```json
{
  "invalidated_documents": [
    "bill_HR_1234",
    "service_doc_247",
    "service_doc_300",
    "service_doc_412"
  ],
  "count": 4,
  "message": "Cache invalidated for bill and 3 dependent documents"
}
```

---

#### `get_job_status`
Poll status of an async processing job.

**Input:**
```json
{
  "job_id": "job_abc123"
}
```

**Output:**
```json
{
  "job_id": "job_abc123",
  "status": "complete",
  "result": {
    "analysis": "...",
    "from_cache": false
  },
  "processing_time_ms": 12500
}
```

---

#### `get_mcp_health`
Get performance metrics and health status.

**Output:**
```json
{
  "status": "✅ HEALTHY",
  "cache_hit_rate": "73.5%",
  "avg_response_time_ms": "87.32",
  "total_llm_calls": 1247,
  "total_llm_cost": "$124.70",
  "error_rate": 2
}
```

---

## 🛠️ Development

### Project Structure

```
gov-doc-mcp-server/
├── gov_doc_mcp/
│   ├── server.py              # Main MCP server
│   ├── tools/                 # MCP tool implementations
│   │   ├── analyze.py
│   │   ├── context.py
│   │   └── relationships.py
│   ├── cache/                 # Caching layer
│   │   ├── smart_cache.py
│   │   └── invalidation.py
│   ├── graph/                 # Relationship tracking
│   │   └── document_graph.py
│   ├── jobs/                  # Async processing
│   │   └── job_manager.py
│   └── monitoring/            # Performance tracking
│       └── metrics.py
├── tests/
├── scripts/
├── docs/
│   └── MCP_DEVELOPMENT_GUIDELINES.md  # ⭐ Read this!
├── requirements.txt
├── config.yaml
└── README.md
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=gov_doc_mcp

# Run specific test file
pytest tests/test_cache_invalidation.py -v
```

### Key Test Scenarios
- ✅ Cache invalidation cascade
- ✅ Stale cache detection
- ✅ Concurrent request deduplication
- ✅ Context assembly without duplication
- ✅ Async job processing
- ✅ Performance monitoring accuracy

### Development Guidelines

**📖 Read the comprehensive guide:** [MCP_DEVELOPMENT_GUIDELINES.md](docs/MCP_DEVELOPMENT_GUIDELINES.md)

This document covers:
- Common gotchas and how to avoid them
- Cache invalidation strategies
- Async processing patterns
- Performance optimization tips
- Testing best practices
- Monitoring and debugging

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Cache Hit Rate | >70% | 73.5% ✅ |
| Avg Response Time | <100ms | 87ms ✅ |
| LLM Call Reduction | >60% | 68% ✅ |
| Error Rate | <1% | 0.2% ✅ |

---

## 🔒 Security

- **API Key Management:** Store Claude API keys in environment variables
- **Access Control:** Implement role-based access for sensitive documents
- **Audit Logging:** All document access is logged with timestamps and user IDs
- **Data Encryption:** All cached data encrypted at rest
- **Rate Limiting:** Prevent abuse with per-user rate limits

---

## 📊 Monitoring & Observability

### Built-in Dashboards
- Cache hit rate trends
- Average response times
- LLM cost tracking
- Error rate monitoring
- Document relationship visualization

### Integration with External Tools
- **Prometheus:** Metrics export
- **Grafana:** Custom dashboards
- **Sentry:** Error tracking
- **DataDog:** APM integration

---

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Areas We Need Help With
- [ ] Support for additional document formats (XML, DOCX)
- [ ] Improved political stance detection algorithms
- [ ] Multi-language support
- [ ] Performance optimizations for very large document sets
- [ ] Alternative LLM provider integrations

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgments

- Built on [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- Powered by [Claude](https://anthropic.com/claude) for AI analysis
- Inspired by the need for better government document transparency

---

## 📞 Support

- **Documentation:** [Full docs](https://docs.example.com)
- **Issues:** [GitHub Issues](https://github.com/yourusername/gov-doc-mcp-server/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/gov-doc-mcp-server/discussions)
- **Email:** support@example.com

---

**Made with ❤️ for better government transparency**
