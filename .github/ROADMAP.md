# CutTheCrap Roadmap

## ✅ v1.0 - Core Platform (COMPLETE)

- [x] Next.js 14 application with TypeScript
- [x] MCP client service for FedDocMCP
- [x] Document graph builder with dependency resolution
- [x] Intelligent caching (Redis + in-memory)
- [x] AI context optimization
- [x] API endpoints for bill analysis
- [x] Web UI with bill detail pages
- [x] FedDocMCP Python server
- [x] Congress.gov API integration

## 🚧 v1.1 - Better Search UX (NEXT)

### Priority: HIGH
**Issue:** Bill ID format (e.g., `117/hr/3684`) is too technical for most users.

**Goals:**
- [ ] Accept friendly formats:
  - "HR 3684" → auto-convert to `117/hr/3684`
  - "H.R. 3684" → normalize
  - "Infrastructure bill" → search and suggest
- [ ] Add bill search by title/keywords
- [ ] Implement autocomplete as you type
- [ ] Show recent bills on home page (last 30 days)
- [ ] Display popular/trending bills
- [ ] Better error messages when bill not found

**Technical approach:**
- Add `GET /api/bills/search?q=infrastructure` endpoint
- Create `SearchInput` component with autocomplete
- Cache popular searches
- Use Congress API search endpoint
- Add bill title → ID mapping

## 📋 v1.2 - Dependency Graph Visualization

- [ ] Interactive D3.js graph showing bill relationships
- [ ] Click nodes to navigate to dependencies
- [ ] Color-code by document type
- [ ] Zoom/pan controls
- [ ] Export graph as PNG/PDF

## 🤖 v1.3 - AI Chat Integration

- [ ] Chat interface for asking questions about bills
- [ ] Context-aware responses using document graphs
- [ ] Streaming responses
- [ ] Conversation history
- [ ] Export chat transcripts

## 📊 v2.0 - Analytics & Training

- [ ] Analytics dashboard
  - Cache hit rates
  - Popular bills
  - API usage metrics
  - Performance stats
- [ ] Training data export for AI fine-tuning
- [ ] Pre-fetch popular bills (background job)
- [ ] Webhook support for bill updates

## 🔄 v2.1 - Collaboration Features

- [ ] User accounts & authentication
- [ ] Bookmark/favorite bills
- [ ] Share bill analysis links
- [ ] Collaborative annotations
- [ ] Comments on bills
- [ ] Email alerts for bill updates

## 🚀 v3.0 - Advanced Features

- [ ] Bill comparison view (side-by-side)
- [ ] Impact analysis (which laws affected)
- [ ] Legislative timeline visualization
- [ ] Predictive analytics (passage likelihood)
- [ ] Committee tracking
- [ ] Sponsor/co-sponsor networks
- [ ] Public API for third-party access

## 📝 Known Issues / Tech Debt

- [ ] FedDocMCP should be a proper git submodule (currently local copy)
- [ ] Need better error handling for API rate limits
- [ ] Should add request throttling
- [ ] Missing unit tests
- [ ] Need E2E tests with Playwright
- [ ] Should add OpenAPI/Swagger docs for API

## Community Requests

Add feature requests here as they come in!
