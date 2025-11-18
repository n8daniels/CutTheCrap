# CutTheCrap Setup Guide

## Prerequisites

- Node.js 18+ installed
- Python 3.8+ installed (for FedDocMCP)
- Congress.gov API key ([get one here](https://api.congress.gov/))
- Optional: Redis for production caching

## Installation Steps

### 1. Clone the repository

```bash
git clone https://github.com/n8daniels/CutTheCrap.git
cd CutTheCrap
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up FedDocMCP (Optional but recommended)

If you want to use the full MCP integration:

```bash
# Add FedDocMCP as a submodule
git submodule add https://github.com/yourusername/feddoc-mcp.git packages/feddoc-mcp
git submodule update --init --recursive

# Install Python dependencies for FedDocMCP
cd packages/feddoc-mcp
pip install -r requirements.txt
cd ../..
```

### 4. Configure environment variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Required environment variables:

```env
# Congress API Key (required for MCP)
CONGRESS_API_KEY=your_api_key_here

# FedDocMCP Configuration
FEDDOC_MCP_PATH=./packages/feddoc-mcp/src/server.py
FEDDOC_MCP_ENABLED=true

# Optional: Redis for production caching
REDIS_URL=redis://localhost:6379

# Optional: OpenAI for AI chat features
OPENAI_API_KEY=your_openai_key_here
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
CutTheCrap/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   └── bills/         # Bill-related endpoints
│   │   ├── bills/             # Bill detail pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── lib/                   # Core libraries
│   │   ├── config.ts          # Configuration
│   │   ├── document-cache.ts  # Caching layer
│   │   ├── document-graph.ts  # Graph builder
│   │   ├── dependency-detector.ts  # Dependency extraction
│   │   └── ai-context-builder.ts   # AI context optimization
│   ├── services/              # External services
│   │   └── mcp-client.ts      # MCP client
│   └── types/                 # TypeScript types
│       ├── document.ts        # Document types
│       └── ai-context.ts      # AI context types
├── packages/                   # Git submodules
│   └── feddoc-mcp/            # FedDocMCP server
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Key Features

### 1. Document Graph Building

The system automatically builds a complete dependency graph when you analyze a bill:

```typescript
// Fetches bill + all dependencies in one operation
const graph = await graphBuilder.buildGraph('117/hr/3684', 2);
```

### 2. Intelligent Caching

- In-memory cache for development
- Redis cache for production
- 24-hour TTL for document graphs
- 7-day TTL for simple bill data

### 3. AI Context Optimization

Smart summarization reduces token usage by ~80%:

- Full text for primary bill
- Summaries for dependencies
- Only relevant sections included
- Cross-reference mapping

### 4. API Endpoints

**POST /api/bills/analyze**
```json
{
  "billId": "117/hr/3684",
  "includeDependencies": true,
  "maxDepth": 2
}
```

**GET /api/bills/simple?billId=117/hr/3684**

Returns single bill without dependencies.

## Development Workflow

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Exporting Training Data

```bash
npm run export-training-data -- --start 2024-01-01 --end 2024-12-31
```

## Troubleshooting

### MCP Connection Failed

If you see "MCP connection failed":

1. Check that Python is installed: `python --version`
2. Verify FedDocMCP path in `.env`
3. Ensure Congress API key is set
4. Check Python dependencies are installed

### Cache Issues

If caching isn't working:

1. Check Redis connection (if using Redis)
2. Verify environment variables
3. Clear cache: delete Redis keys or restart server

### API Rate Limits

Congress.gov API limit: 5000 requests/hour

To stay under the limit:
- Use caching aggressively
- Pre-fetch popular bills
- Monitor usage in analytics

## Next Steps

1. **Add FedDocMCP submodule** if you haven't already
2. **Get Congress API key** from api.congress.gov
3. **Set up Redis** for production caching
4. **Configure OpenAI** for AI chat features
5. **Deploy to production** (Vercel recommended)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](LICENSE) for details.
