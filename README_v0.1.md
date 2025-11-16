# CutTheCrap v0.1 - Basic MCP Integration

## What's in v0.1?

This is a **simplified proof-of-concept** to validate the FedDocMCP integration approach.

### ✅ Implemented Features

- **Next.js 15** with TypeScript and Tailwind CSS
- **MCP Client Service** that fetches bills from Congress.gov API
- **Simple in-memory caching** (1 hour TTL)
- **API endpoint** for bill data: `/api/bills/:congress/:type/:number`
- **Bill detail page** with basic information and recent actions
- **Cache statistics** endpoint: `/api/cache/stats`
- **FedDocMCP as git submodule** (ready for future integration)

### ❌ Not Yet Implemented

- Dependency graph building
- Recursive document fetching
- AI integration
- Training data export
- Redis caching
- Full MCP protocol connection

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Congress.gov API Key

1. Sign up at https://api.congress.gov/sign-up/
2. You'll receive an API key via email

### 3. Configure Environment

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add your API key
CONGRESS_API_KEY=your_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Test Bill Fetching

Navigate to: http://localhost:3000/bills/118/hr/3684

This will fetch the Infrastructure Investment and Jobs Act.

## Testing

### Test Different Bills

- **H.R. 3684** (118th Congress): http://localhost:3000/bills/118/hr/3684
- **S. 1** (118th Congress): http://localhost:3000/bills/118/s/1

### Bill Type Format

- `hr` = House Bill
- `s` = Senate Bill
- `hjres` = House Joint Resolution
- `sjres` = Senate Joint Resolution
- `hconres` = House Concurrent Resolution
- `sconres` = Senate Concurrent Resolution
- `hres` = House Resolution
- `sres` = Senate Resolution

### Check Cache Statistics

Visit: http://localhost:3000/api/cache/stats

Shows:
- Cache hits/misses
- Hit rate percentage
- Number of cached items

## Architecture

```
┌─────────────────────────────────────┐
│  Frontend (Next.js/React)           │
│  /bills/:congress/:type/:number     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  API Route                          │
│  /api/bills/:congress/:type/:number │
└──────────────┬──────────────────────┘
               │
        ┌──────┴────────┐
        │               │
        ▼               ▼
┌─────────────┐  ┌──────────────┐
│  Cache      │  │ MCP Client   │
│ (In-Memory) │  │  Service     │
└─────────────┘  └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ Congress.gov │
                 │     API      │
                 └──────────────┘
```

## What's Next?

### v0.2 - Dependency Detection

- Parse bill text for references to other documents
- Extract USC, CFR, Public Law references
- Display list of dependencies

### v0.3 - Document Graph

- Fetch referenced documents
- Build document graph
- Visualize relationships

### v1.0 - Full Integration

- Complete dependency graph system
- Redis caching
- AI context optimization
- Training data export
- All features from CutTheCrap_Integration_Plan.md

## Project Structure

```
CutTheCrap/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/
│   │   │   ├── bills/          # Bill API endpoints
│   │   │   └── cache/          # Cache stats endpoint
│   │   ├── bills/              # Bill pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── cache.ts            # In-memory cache
│   │   ├── config.ts           # Configuration
│   │   └── types.ts            # TypeScript types
│   └── services/
│       └── mcp-client.ts       # MCP client (Congress.gov wrapper)
├── packages/
│   └── feddoc-mcp/             # Git submodule (FedDocMCP)
├── .env.local                  # Your API keys (gitignored)
├── .env.example                # Example env file
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README_v0.1.md              # This file
```

## Notes

- **MCP Client**: Currently wraps Congress.gov API directly. Future versions will connect to actual FedDocMCP server.
- **Caching**: In-memory only. Data lost on server restart. Future: Redis.
- **Error Handling**: Basic. Future: Retries, exponential backoff, better UX.
- **Rate Limiting**: None yet. Congress.gov allows 5000 requests/hour.

## Troubleshooting

### "CONGRESS_API_KEY is required"

Make sure you:
1. Created `.env.local` file
2. Added your API key: `CONGRESS_API_KEY=your_key_here`
3. Restarted the dev server

### "Failed to fetch bill"

- Check if the bill exists (congress number, type, bill number)
- Verify your API key is valid
- Check internet connection
- Check Congress.gov API status

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Contributing

This is v0.1 - a proof of concept. Feedback welcome!

## License

MIT - See LICENSE file
