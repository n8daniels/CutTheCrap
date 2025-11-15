# CutTheCrap Integration Plan - FedDocMCP

## Overview
Integrate FedDocMCP into CutTheCrap to provide comprehensive federal documentation access. The MCP will intelligently fetch bills AND all related dependencies (amendments, related bills, committee reports, referenced laws) to reduce duplicative AI calls.

**Key Innovation**: Don't just fetch a document - fetch the entire dependency graph to provide complete context for AI analysis and reduce redundant API calls.

---

## Architecture Philosophy

### The Problem
Traditional approach: User asks about a bill → System fetches only that bill → AI lacks context about referenced laws, amendments, related bills → User asks follow-up → System makes another API call → Repeat.

**Result**: Lots of API calls, incomplete context, poor AI responses, high costs.

### Our Solution
User asks about a bill → System fetches bill + all dependencies in ONE operation → Build complete document graph → Cache everything → AI has full context → Answer current question + next 10 questions with ZERO additional fetches.

**Result**: One fetch, complete context, excellent AI responses, 70-90% cost reduction.

---

## Phase 1: Basic MCP Integration

### Task 1.1: Add FedDocMCP as Git Submodule
- [ ] In CutTheCrap repo: `git submodule add https://github.com/yourusername/feddoc-mcp.git packages/feddoc-mcp`
- [ ] Initialize submodule: `git submodule update --init --recursive`
- [ ] Verify `.gitmodules` file created
- [ ] Test submodule: `cd packages/feddoc-mcp && python src/server.py`

### Task 1.2: Create MCP Client Service
- [ ] Install MCP client SDK: `npm install @modelcontextprotocol/sdk`
- [ ] Create `src/services/mcp-client.ts` with:
  ```typescript
  import { Client } from '@modelcontextprotocol/sdk/client/index.js';
  import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
  
  export class FedDocMCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    
    async connect(): Promise<void>;
    async disconnect(): Promise<void>;
    async searchBills(params: SearchBillsParams): Promise<Bill[]>;
    async getBillWithDependencies(billId: string, depth?: number): Promise<DocumentGraph>;
    async getBillText(billId: string): Promise<BillText>;
    async getBillStatus(billId: string): Promise<BillStatus>;
  }
  ```
- [ ] Implement connection pooling to reuse server process
- [ ] Add retry logic with exponential backoff
- [ ] Add comprehensive error handling
- [ ] Add request/response logging

### Task 1.3: Environment Configuration
- [ ] Add to `.env`:
  ```
  CONGRESS_API_KEY=your_congress_api_key_here
  FEDDOC_MCP_PATH=./packages/feddoc-mcp/src/server.py
  FEDDOC_MCP_ENABLED=true
  ```
- [ ] Update `.env.example` with these variables
- [ ] Add validation in `src/lib/config.ts`:
  ```typescript
  export const config = {
    congressApiKey: process.env.CONGRESS_API_KEY!,
    fedDocMcpPath: process.env.FEDDOC_MCP_PATH!,
    fedDocMcpEnabled: process.env.FEDDOC_MCP_ENABLED === 'true',
  };
  ```
- [ ] Add startup validation to check required env vars exist

---

## Phase 2: Document Dependency Resolution

### Task 2.1: Create Document Graph Builder
- [ ] Create `src/lib/document-graph.ts`
- [ ] Define TypeScript interfaces:
  ```typescript
  export type DocumentType = 
    | 'bill' 
    | 'amendment' 
    | 'committee_report' 
    | 'referenced_law' 
    | 'public_law'
    | 'usc_section'
    | 'cfr_section';
  
  export interface DocumentNode {
    id: string;                    // e.g., "117/hr/3684"
    type: DocumentType;
    title: string;
    content: string;               // Full text or summary
    metadata: {
      sponsor?: string;
      introduced_date?: string;
      status?: string;
      congress?: number;
      bill_type?: string;
      bill_number?: number;
      [key: string]: any;
    };
    dependencies: DocumentNode[];  // Related documents
    relationship?: string;          // How this relates to parent
  }
  
  export interface DocumentGraph {
    root: DocumentNode;            // Primary document
    nodes: Map<string, DocumentNode>;  // All nodes indexed by ID
    totalNodes: number;
    maxDepth: number;
    fetchTimeMs: number;
    cacheHits: number;
    cacheMisses: number;
  }
  ```
- [ ] Implement `DocumentGraphBuilder` class:
  ```typescript
  export class DocumentGraphBuilder {
    constructor(private mcpClient: FedDocMCPClient, private cache: DocumentCache);
    
    async buildGraph(billId: string, maxDepth: number = 2): Promise<DocumentGraph>;
    private async fetchNode(id: string, depth: number, visited: Set<string>): Promise<DocumentNode>;
    private detectCycles(node: DocumentNode, visited: Set<string>): boolean;
  }
  ```
- [ ] Add cycle detection to prevent infinite loops
- [ ] Add depth limiting (default max depth = 2)

### Task 2.2: Dependency Detection Logic
- [ ] Create `src/lib/dependency-detector.ts`
- [ ] Implement regex patterns for detecting references:
  ```typescript
  export const REFERENCE_PATTERNS = {
    // Bills: "H.R. 1234", "S. 5678", "H.J.Res. 99"
    bill: /(?:H\.R\.|S\.|H\.J\.Res\.|S\.J\.Res\.|H\.Con\.Res\.|S\.Con\.Res\.|H\.Res\.|S\.Res\.)\s*(\d+)/gi,
    
    // US Code: "42 U.S.C. § 1983", "42 USC 1983"
    usc: /(\d+)\s*U\.?S\.?C\.?\s*§?\s*(\d+[a-z]?(?:-\d+)?)/gi,
    
    // CFR: "40 CFR 52.21", "40 C.F.R. § 52.21"
    cfr: /(\d+)\s*C\.?F\.?R\.?\s*§?\s*([\d.]+)/gi,
    
    // Public Laws: "Public Law 117-58", "Pub. L. 117-58"
    publicLaw: /(?:Public Law|Pub\.?\s*L\.?)\s*(\d+)-(\d+)/gi,
    
    // Amendments: "Amendment SA 2137", "Amendment No. 2137"
    amendment: /Amendment\s*(?:SA|No\.?)\s*(\d+)/gi,
  };
  ```
- [ ] Implement `extractDependencies(text: string): Dependency[]`
- [ ] Parse and categorize each reference type
- [ ] Deduplicate references (same bill mentioned multiple times)
- [ ] Return structured list of dependencies to fetch

### Task 2.3: Recursive Fetching Strategy
- [ ] Implement `fetchWithDependencies()` in `DocumentGraphBuilder`:
  ```typescript
  async buildGraph(billId: string, maxDepth: number = 2): Promise<DocumentGraph> {
    const startTime = Date.now();
    const visited = new Set<string>();
    const nodes = new Map<string, DocumentNode>();
    let cacheHits = 0;
    let cacheMisses = 0;
    
    // Fetch root node
    const root = await this.fetchNode(billId, 0, visited);
    nodes.set(billId, root);
    
    // Recursively fetch dependencies
    await this.fetchDependencies(root, maxDepth, 1, visited, nodes);
    
    return {
      root,
      nodes,
      totalNodes: nodes.size,
      maxDepth,
      fetchTimeMs: Date.now() - startTime,
      cacheHits,
      cacheMisses,
    };
  }
  
  private async fetchDependencies(
    node: DocumentNode,
    maxDepth: number,
    currentDepth: number,
    visited: Set<string>,
    nodes: Map<string, DocumentNode>
  ): Promise<void> {
    if (currentDepth >= maxDepth) return;
    
    // Extract dependencies from node content
    const deps = this.dependencyDetector.extractDependencies(node.content);
    
    // Fetch each dependency in parallel
    const depNodes = await Promise.all(
      deps.map(dep => this.fetchNode(dep.id, currentDepth, visited))
    );
    
    // Add to graph and recurse
    for (const depNode of depNodes) {
      if (!nodes.has(depNode.id)) {
        nodes.set(depNode.id, depNode);
        node.dependencies.push(depNode);
        await this.fetchDependencies(depNode, maxDepth, currentDepth + 1, visited, nodes);
      }
    }
  }
  ```
- [ ] Check cache before fetching (see Phase 3)
- [ ] Fetch dependencies in parallel for performance
- [ ] Track visited nodes to prevent cycles
- [ ] Add timeout handling (max 30s per fetch)

---

## Phase 3: Caching & Deduplication

### Task 3.1: Document Cache Implementation
- [ ] Create `src/lib/document-cache.ts`
- [ ] Choose caching strategy:
  - **Development**: In-memory Map with TTL
  - **Production**: Redis for persistence
- [ ] Implement cache interface:
  ```typescript
  export interface DocumentCache {
    get(key: string): Promise<DocumentGraph | null>;
    set(key: string, value: DocumentGraph, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    getStats(): Promise<CacheStats>;
  }
  
  export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  }
  ```
- [ ] Implement in-memory cache:
  ```typescript
  export class InMemoryDocumentCache implements DocumentCache {
    private cache = new Map<string, { value: DocumentGraph; expiresAt: number }>();
    private stats = { hits: 0, misses: 0 };
    
    async get(key: string): Promise<DocumentGraph | null> {
      const entry = this.cache.get(key);
      if (!entry || Date.now() > entry.expiresAt) {
        this.stats.misses++;
        return null;
      }
      this.stats.hits++;
      return entry.value;
    }
    
    async set(key: string, value: DocumentGraph, ttlSeconds = 86400): Promise<void> {
      this.cache.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000),
      });
    }
  }
  ```
- [ ] Implement Redis cache (for production):
  ```typescript
  export class RedisDocumentCache implements DocumentCache {
    constructor(private redis: Redis);
    // Implementation using ioredis
  }
  ```
- [ ] Cache key format: `bill:graph:{congress}/{type}/{number}:{depth}`
- [ ] Default TTL: 24 hours (bills don't change frequently)

### Task 3.2: Dependency Deduplication
- [ ] Before fetching any document, check cache first
- [ ] Track fetched documents in current request to avoid duplicates:
  ```typescript
  private async fetchNode(
    id: string, 
    depth: number, 
    visited: Set<string>
  ): Promise<DocumentNode> {
    // Check if already visited in this request
    if (visited.has(id)) {
      return this.nodes.get(id)!;
    }
    
    // Check cache
    const cached = await this.cache.get(id);
    if (cached) {
      this.cacheHits++;
      return cached.root;
    }
    
    // Fetch from MCP
    this.cacheMisses++;
    const node = await this.mcpClient.getBill(id);
    visited.add(id);
    
    return node;
  }
  ```
- [ ] Log deduplication stats for monitoring
- [ ] Add metrics: cache hit rate, duplicates prevented, time saved

### Task 3.3: Pre-fetch Popular Bills
- [ ] Create background job: `src/jobs/prefetch-popular-bills.ts`
- [ ] Identify "hot" bills:
  - Bills with most page views (track in analytics)
  - Recently introduced bills (last 30 days)
  - Bills in active committees
  - Bills mentioned in news/social media
- [ ] Schedule nightly job (use cron or Vercel Cron):
  ```typescript
  export async function prefetchPopularBills() {
    const popularBills = await getPopularBills();
    
    for (const billId of popularBills) {
      try {
        const graph = await documentGraphBuilder.buildGraph(billId, 2);
        await cache.set(`bill:graph:${billId}:2`, graph);
        console.log(`Pre-fetched: ${billId}`);
      } catch (error) {
        console.error(`Failed to pre-fetch ${billId}:`, error);
      }
    }
  }
  ```
- [ ] Run pre-fetch during off-peak hours (2-4 AM)
- [ ] Store in persistent Redis cache
- [ ] Monitor pre-fetch success rate

---

## Phase 4: AI Context Optimization

### Task 4.1: Create Context Builder
- [ ] Create `src/lib/ai-context-builder.ts`
- [ ] Define AI context structure:
  ```typescript
  export interface AIContext {
    primaryBill: {
      id: string;
      title: string;
      fullText: string;
      metadata: BillMetadata;
    };
    dependencies: {
      id: string;
      type: DocumentType;
      title: string;
      summary: string;           // NOT full text (save tokens)
      relevantSections: string[]; // Only sections referenced
      relationship: string;       // How it relates to primary
      metadata: any;
    }[];
    crossReferences: {
      from: string;
      to: string;
      context: string;            // Why this reference exists
    }[];
    timeline: {
      date: string;
      event: string;
      document: string;
    }[];
    metadata: {
      documentsIncluded: number;
      dependencyDepth: number;
      cacheHits: number;
      fetchTimeMs: number;
      totalTokensEstimate: number;
    };
  }
  ```
- [ ] Implement `buildContextFromGraph()`:
  ```typescript
  export class AIContextBuilder {
    buildContext(graph: DocumentGraph): AIContext {
      return {
        primaryBill: this.formatPrimaryBill(graph.root),
        dependencies: this.formatDependencies(graph.nodes),
        crossReferences: this.buildCrossReferences(graph),
        timeline: this.buildTimeline(graph),
        metadata: this.buildMetadata(graph),
      };
    }
  }
  ```
- [ ] Optimize for token efficiency (goal: <100k tokens total)

### Task 4.2: Smart Summarization
- [ ] For dependency documents, include ONLY:
  - Title and identifier (e.g., "H.R. 1234 - Infrastructure Investment Act")
  - Document type and status
  - Key sections referenced by primary bill (not entire document)
  - Relationship to primary bill (e.g., "Amends Section 3(b)")
  - Current status if relevant
- [ ] Skip full text unless explicitly requested by user
- [ ] Example summarization:
  ```typescript
  formatDependency(node: DocumentNode, referencedBy: string): DependencySummary {
    return {
      id: node.id,
      title: node.title,
      type: node.type,
      summary: this.extractRelevantSections(node, referencedBy), // Only what's needed
      relationship: `Referenced in ${referencedBy}, Section 5(a)`,
      status: node.metadata.status,
    };
  }
  ```
- [ ] This reduces token usage by ~80% vs full text
- [ ] Track token savings in metadata

### Task 4.3: Context Metadata
- [ ] Add comprehensive metadata to every AI context:
  ```typescript
  metadata: {
    documentsIncluded: graph.totalNodes,
    dependencyDepth: graph.maxDepth,
    cacheHits: graph.cacheHits,
    cacheMisses: graph.cacheMisses,
    fetchTimeMs: graph.fetchTimeMs,
    totalTokensEstimate: estimateTokens(context),
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24h
  }
  ```
- [ ] Use metadata for:
  - Monitoring performance
  - Debugging issues
  - Optimizing token usage
  - Tracking cache effectiveness
- [ ] Log metadata to analytics

---

## Phase 5: API Layer

### Task 5.1: Create Bill Analysis Endpoint
- [ ] Create `app/api/bills/analyze/route.ts`
- [ ] POST endpoint with schema:
  ```typescript
  // Request
  {
    billId: string;              // "118/hr/3684"
    includeDependencies: boolean; // default: true
    maxDepth?: number;           // default: 2
    forceRefresh?: boolean;      // bypass cache
  }
  
  // Response
  {
    bill: BillData;
    documentGraph: DocumentGraph;
    aiContext: AIContext;
    metadata: {
      cached: boolean;
      fetchTimeMs: number;
      documentsIncluded: number;
    };
  }
  ```
- [ ] Implementation flow:
  ```typescript
  export async function POST(request: Request) {
    const { billId, includeDependencies = true, maxDepth = 2 } = await request.json();
    
    // 1. Check cache
    const cacheKey = `bill:graph:${billId}:${maxDepth}`;
    let graph = await documentCache.get(cacheKey);
    
    // 2. If not cached, build graph
    if (!graph) {
      const mcpClient = new FedDocMCPClient();
      await mcpClient.connect();
      
      const graphBuilder = new DocumentGraphBuilder(mcpClient, documentCache);
      graph = await graphBuilder.buildGraph(billId, maxDepth);
      
      // Cache result
      await documentCache.set(cacheKey, graph, 86400); // 24h
      
      await mcpClient.disconnect();
    }
    
    // 3. Build AI context
    const contextBuilder = new AIContextBuilder();
    const aiContext = contextBuilder.buildContext(graph);
    
    // 4. Return everything
    return Response.json({
      bill: graph.root,
      documentGraph: graph,
      aiContext,
      metadata: {
        cached: !!graph,
        fetchTimeMs: graph.fetchTimeMs,
        documentsIncluded: graph.totalNodes,
      },
    });
  }
  ```
- [ ] Add rate limiting: 100 requests/hour per user
- [ ] Add request validation with Zod
- [ ] Add error handling with proper status codes

### Task 5.2: Create Simplified Bill Endpoint
- [ ] Create `app/api/bills/simple/route.ts`
- [ ] GET endpoint for single bill (no dependencies):
  ```typescript
  // GET /api/bills/simple?billId=118/hr/3684
  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const billId = searchParams.get('billId');
    
    // Check cache first
    const cacheKey = `bill:simple:${billId}`;
    let bill = await cache.get(cacheKey);
    
    if (!bill) {
      const mcpClient = new FedDocMCPClient();
      await mcpClient.connect();
      bill = await mcpClient.getBill(billId);
      await mcpClient.disconnect();
      
      // Cache aggressively (7 days - bills rarely change)
      await cache.set(cacheKey, bill, 604800);
    }
    
    return Response.json(bill);
  }
  ```
- [ ] Use for bill lists, quick lookups, search results
- [ ] Cache very aggressively (7 days)
- [ ] Add ETag support for browser caching

### Task 5.3: Create AI Chat Endpoint
- [ ] Create `app/api/chat/route.ts`
- [ ] Streaming endpoint for chat with CutTheCrapAI:
  ```typescript
  export async function POST(request: Request) {
    const { question, billId, conversationHistory } = await request.json();
    
    // 1. Build full document graph if billId provided
    let context: AIContext | undefined;
    if (billId) {
      const graph = await documentGraphBuilder.buildGraph(billId, 2);
      context = aiContextBuilder.buildContext(graph);
    }
    
    // 2. Build messages for AI
    const messages = [
      {
        role: 'system',
        content: `You are CutTheCrapAI. You help users understand federal legislation.
        ${context ? `Context: ${JSON.stringify(context)}` : ''}`,
      },
      ...conversationHistory,
      { role: 'user', content: question },
    ];
    
    // 3. Call CutTheCrapAI (future: your fine-tuned model)
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      stream: true,
    });
    
    // 4. Stream response back
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }
  ```
- [ ] Pass optimized context (not full graph) to AI
- [ ] Stream response for better UX
- [ ] Track which context was used for analytics

---

## Phase 6: Frontend Integration

### Task 6.1: Bill Detail Page with Dependencies
- [ ] Create `app/bills/[congress]/[type]/[number]/page.tsx`
- [ ] Fetch bill with dependencies on load:
  ```typescript
  export default async function BillPage({ params }) {
    const billId = `${params.congress}/${params.type}/${params.number}`;
    const { bill, documentGraph, aiContext } = await fetch(
      `/api/bills/analyze`,
      {
        method: 'POST',
        body: JSON.stringify({ billId, includeDependencies: true }),
      }
    ).then(r => r.json());
    
    return (
      <div className="container mx-auto p-6">
        <BillHeader bill={bill} />
        <BillContent content={bill.content} />
        <DependencyTree graph={documentGraph} />
        <RelatedDocuments dependencies={aiContext.dependencies} />
      </div>
    );
  }
  ```
- [ ] Show primary bill content prominently
- [ ] Display dependency tree as expandable sections
- [ ] Add loading states with skeleton screens
- [ ] Show "Fetching dependencies..." progress

### Task 6.2: Dependency Graph Visualization
- [ ] Install visualization library: `npm install react-force-graph-2d d3`
- [ ] Create `components/DependencyGraph.tsx`:
  ```typescript
  import { ForceGraph2D } from 'react-force-graph-2d';
  
  export function DependencyGraph({ graph }: { graph: DocumentGraph }) {
    const graphData = {
      nodes: Array.from(graph.nodes.values()).map(node => ({
        id: node.id,
        name: node.title,
        type: node.type,
        val: node.type === 'bill' ? 20 : 10, // Size based on type
      })),
      links: buildLinks(graph),
    };
    
    return (
      <div className="w-full h-96 border rounded-lg">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeColor={node => getColorByType(node.type)}
          onNodeClick={node => navigateTo(node.id)}
        />
      </div>
    );
  }
  ```
- [ ] Color code by type:
  - Primary bill: Blue (large node)
  - Amendments: Green
  - Referenced laws: Red
  - Committee reports: Yellow
- [ ] Make nodes clickable to view that document
- [ ] Add zoom/pan controls
- [ ] Add legend explaining colors

### Task 6.3: Smart Context Indicator
- [ ] Create `components/ContextIndicator.tsx`:
  ```typescript
  export function ContextIndicator({ metadata }) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <FileIcon className="w-4 h-4" />
          Analyzing with {metadata.documentsIncluded} related documents
        </span>
        
        {metadata.cached && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckIcon className="w-4 h-4" />
            Using cached analysis (fetched {formatTime(metadata.cachedAt)})
          </span>
        )}
        
        <button
          onClick={refreshDependencies}
          className="text-blue-600 hover:underline"
        >
          Refresh dependencies
        </button>
      </div>
    );
  }
  ```
- [ ] Show badge with document count
- [ ] Display cache status
- [ ] Add "Refresh" button to bypass cache
- [ ] Show last updated timestamp
- [ ] Indicate if dependencies are stale (>24h)

---

## Phase 7: CutTheCrapAI Training Optimization

### Task 7.1: Create Training Data Exporter
- [ ] Create `src/lib/training-data-exporter.ts`
- [ ] Export all user interactions as training data:
  ```typescript
  export interface TrainingExample {
    input: string;              // User question
    context: AIContext;         // Document graph context
    output: string;             // AI response
    metadata: {
      billId: string;
      documentsIncluded: number;
      timestamp: string;
      userFeedback?: 'helpful' | 'not_helpful';
    };
  }
  
  export async function exportTrainingData(
    startDate: Date,
    endDate: Date
  ): Promise<TrainingExample[]> {
    const interactions = await db.query(`
      SELECT 
        question,
        bill_id,
        ai_response,
        context,
        user_feedback,
        created_at
      FROM chat_interactions
      WHERE created_at BETWEEN $1 AND $2
    `, [startDate, endDate]);
    
    return interactions.map(i => ({
      input: i.question,
      context: JSON.parse(i.context),
      output: i.ai_response,
      metadata: {
        billId: i.bill_id,
        documentsIncluded: JSON.parse(i.context).metadata.documentsIncluded,
        timestamp: i.created_at,
        userFeedback: i.user_feedback,
      },
    }));
  }
  ```
- [ ] Format as JSONL for fine-tuning:
  ```typescript
  export async function exportAsJSONL(examples: TrainingExample[]): Promise<string> {
    return examples.map(ex => JSON.stringify({
      messages: [
        {
          role: 'system',
          content: `You are CutTheCrapAI. Context: ${JSON.stringify(ex.context)}`,
        },
        { role: 'user', content: ex.input },
        { role: 'assistant', content: ex.output },
      ],
    })).join('\n');
  }
  ```
- [ ] Create export CLI: `npm run export-training-data -- --start 2024-01-01 --end 2024-12-31`
- [ ] Store exports in `data/training/` directory
- [ ] Only include examples with positive user feedback

### Task 7.2: Deduplication Tracking
- [ ] Create analytics table:
  ```sql
  CREATE TABLE mcp_analytics (
    id SERIAL PRIMARY KEY,
    bill_id VARCHAR(50) NOT NULL,
    operation VARCHAR(50) NOT NULL, -- 'fetch', 'cache_hit', 'cache_miss'
    dependencies_fetched INT,
    cache_hits INT,
    cache_misses INT,
    fetch_time_ms INT,
    tokens_saved INT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Log every MCP operation:
  ```typescript
  async function logMCPOperation(data: {
    billId: string;
    operation: string;
    dependenciesFetched: number;
    cacheHits: number;
    cacheMisses: number;
    fetchTimeMs: number;
    tokensSaved: number;
  }) {
    await db.query(`
      INSERT INTO mcp_analytics 
      (bill_id, operation, dependencies_fetched, cache_hits, cache_misses, fetch_time_ms, tokens_saved)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      data.billId,
      data.operation,
      data.dependenciesFetched,
      data.cacheHits,
      data.cacheMisses,
      data.fetchTimeMs,
      data.tokensSaved,
    ]);
  }
  ```
- [ ] Generate weekly report:
  ```typescript
  export async function generateWeeklyReport() {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_operations,
        SUM(cache_hits) as total_cache_hits,
        SUM(cache_misses) as total_cache_misses,
        AVG(fetch_time_ms) as avg_fetch_time,
        SUM(tokens_saved) as total_tokens_saved,
        AVG(dependencies_fetched) as avg_dependencies
      FROM mcp_analytics
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    
    const cacheHitRate = (stats.total_cache_hits / 
      (stats.total_cache_hits + stats.total_cache_misses) * 100).toFixed(2);
    
    console.log(`
      === Weekly MCP Report ===
      Total Operations: ${stats.total_operations}
      Cache Hit Rate: ${cacheHitRate}%
      Avg Fetch Time: ${stats.avg_fetch_time}ms
      Total Tokens Saved: ${stats.total_tokens_saved}
      Avg Dependencies/Bill: ${stats.avg_dependencies}
    `);
  }
  ```
- [ ] Email report to team weekly
- [ ] Create dashboard for real-time metrics

### Task 7.3: Context Reuse Pattern
- [ ] Track conversation context in session:
  ```typescript
  interface ConversationSession {
    sessionId: string;
    billId: string | null;
    documentGraph: DocumentGraph | null;
    lastUpdated: Date;
    messageCount: number;
  }
  ```
- [ ] Reuse context for follow-up questions:
  ```typescript
  export async function handleChatMessage(
    sessionId: string,
    message: string
  ) {
    let session = await getSession(sessionId);
    
    // Check if context is still fresh (<24h old)
    const contextAge = Date.now() - session.lastUpdated.getTime();
    const contextStale = contextAge > 86400000; // 24 hours
    
    if (session.documentGraph && !contextStale) {
      // Reuse existing context - NO new MCP call!
      console.log('Reusing context from session');
      return generateResponse(message, session.documentGraph);
    } else if (session.billId) {
      // Refresh context if stale
      session.documentGraph = await fetchDocumentGraph(session.billId);
      session.lastUpdated = new Date();
      await saveSession(session);
    }
    
    return generateResponse(message, session.documentGraph);
  }
  ```
- [ ] Track context reuse metrics:
  - Total messages per session
  - Context reuse rate (messages using cached context / total messages)
  - Average session length
  - MCP calls saved through reuse
- [ ] Log savings: "Reused context for 8 follow-up questions, saved 8 MCP calls"

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│           CutTheCrap Frontend (Next.js/React)           │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Bill Detail   │  │ Dependency   │  │ AI Chat      │ │
│  │ Pages         │  │ Graph Viz    │  │ Interface    │ │
│  └───────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└──────────┼──────────────────┼──────────────────┼─────────┘
           │                  │                  │
           └──────────────────┴──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                 API Routes (Next.js)                    │
│  ┌─────────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ /api/bills/     │ │ /api/bills/  │ │ /api/chat   │ │
│  │ analyze         │ │ simple       │ │             │ │
│  │ (with deps)     │ │ (single)     │ │ (AI)        │ │
│  └────────┬────────┘ └──────┬───────┘ └──────┬──────┘ │
└───────────┼──────────────────┼──────────────────┼────────┘
            │                  │                  │
            └──────────────────┴──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│          Document Graph Builder (TypeScript)            │
│  ┌────────────────────────────────────────────────────┐ │
│  │ • Dependency Detection                             │ │
│  │ • Recursive Fetching                               │ │
│  │ • Cycle Prevention                                 │ │
│  │ • Graph Construction                               │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┴────────┐
        │               │
        ▼               ▼
┌──────────────┐ ┌─────────────────────────┐
│  Document    │ │  MCP Client Service     │
│  Cache       │ │  (TypeScript)           │
│  (Redis)     │ │                         │
│              │ │  ┌───────────────────┐  │
│  24h TTL     │ │  │ Connection Pool   │  │
│  Hit Rate:   │ │  │ Retry Logic       │  │
│  80%+        │ │  │ Error Handling    │  │
│              │ │  └─────────┬─────────┘  │
└──────────────┘ └────────────┼────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   FedDocMCP Server    │
                  │   (Python)            │
                  │                       │
                  │   Tools:              │
                  │   • search_bills      │
                  │   • get_bill_text     │
                  │   • get_bill_status   │
                  └──────────┬────────────┘
                             │
                             ▼
                  ┌───────────────────────┐
                  │   Congress.gov API    │
                  │                       │
                  │   Rate Limit:         │
                  │   5000 req/hour       │
                  └───────────────────────┘
```

---

## Example Flow: User Asks About Infrastructure Bill

### Detailed Step-by-Step Flow

**User Action**: "Explain H.R. 3684 (Infrastructure Investment and Jobs Act)"

#### Step 1: API Request
```
POST /api/bills/analyze
{
  "billId": "117/hr/3684",
  "includeDependencies": true,
  "maxDepth": 2
}
```

#### Step 2: Cache Check
```typescript
const cacheKey = "bill:graph:117/hr/3684:2";
let graph = await documentCache.get(cacheKey);
// Result: null (not in cache)
```

#### Step 3: FedDocMCP Connection
```typescript
const mcpClient = new FedDocMCPClient();
await mcpClient.connect(); // Spawns Python process
```

#### Step 4: Fetch Primary Bill
```typescript
const primaryBill = await mcpClient.callTool('get_bill_text', {
  congress: 117,
  bill_type: 'hr',
  bill_number: 3684
});
// Returns: H.R. 3684 full text (2,702 pages!)
```

#### Step 5: Dependency Detection
```typescript
const dependencies = dependencyDetector.extractDependencies(primaryBill.text);
// Finds:
// 1. Amendment SA 2137 (Infrastructure amendments)
// 2. Reference to "23 U.S.C. § 119" (Highway funding law)
// 3. Reference to "Public Law 114-94" (FAST Act)
// 4. H.R. 3684 previous version
```

#### Step 6: Recursive Dependency Fetching
```typescript
// Fetch all 4 dependencies in parallel
const [amendment, uscSection, publicLaw, previousVersion] = await Promise.all([
  mcpClient.callTool('get_amendment', { id: 'SA2137' }),
  mcpClient.callTool('get_usc_section', { title: 23, section: 119 }),
  mcpClient.callTool('get_public_law', { congress: 114, number: 94 }),
  mcpClient.callTool('get_bill_text', { congress: 117, bill_type: 'hr', bill_number: 3684, version: 'ih' })
]);

// Each dependency may have its own dependencies (depth 2)
// But we limit to avoid explosion
```

#### Step 7: Build Document Graph
```typescript
const graph = {
  root: primaryBill, // H.R. 3684 (current version)
  nodes: new Map([
    ['117/hr/3684', primaryBill],
    ['SA2137', amendment],
    ['23-USC-119', uscSection],
    ['PL-114-94', publicLaw],
    ['117/hr/3684/ih', previousVersion],
  ]),
  totalNodes: 5,
  maxDepth: 2,
  fetchTimeMs: 3420, // ~3.4 seconds
  cacheHits: 0,
  cacheMisses: 5,
};
```

#### Step 8: Cache the Graph
```typescript
await documentCache.set('bill:graph:117/hr/3684:2', graph, 86400);
// Cached for 24 hours
```

#### Step 9: Build AI Context
```typescript
const context = {
  primaryBill: {
    id: '117/hr/3684',
    title: 'Infrastructure Investment and Jobs Act',
    fullText: primaryBill.text, // 2,702 pages
    metadata: {
      sponsor: 'Rep. DeFazio, Peter A.',
      introduced: '2021-06-04',
      status: 'Became Public Law 117-58',
    },
  },
  dependencies: [
    {
      id: 'SA2137',
      type: 'amendment',
      title: 'Infrastructure Amendments',
      summary: 'Modifies Section 11003 regarding broadband deployment...', // Summary, not full text!
      relationship: 'Amends Section 11003 of primary bill',
    },
    {
      id: '23-USC-119',
      type: 'usc_section',
      title: '23 U.S.C. § 119 - National Highway Performance Program',
      summary: 'Establishes funding formulas for highway projects...',
      relevantSections: ['§ 119(a)', '§ 119(d)(2)'], // Only sections referenced
      relationship: 'Referenced in Section 1106 of primary bill',
    },
    {
      id: 'PL-114-94',
      type: 'public_law',
      title: 'FAST Act (Fixing America\'s Surface Transportation)',
      summary: 'Previous surface transportation authorization...',
      relationship: 'Predecessor law being amended/extended',
    },
    {
      id: '117/hr/3684/ih',
      type: 'bill',
      title: 'Infrastructure Investment and Jobs Act (Introduced Version)',
      summary: 'Original bill as introduced, before amendments...',
      relationship: 'Previous version of primary bill',
    },
  ],
  metadata: {
    documentsIncluded: 5,
    dependencyDepth: 2,
    totalTokensEstimate: 85000, // ~500KB instead of 3MB
  },
};
```

#### Step 10: Return to Frontend
```typescript
return Response.json({
  bill: primaryBill,
  documentGraph: graph,
  aiContext: context,
  metadata: {
    cached: false,
    fetchTimeMs: 3420,
    documentsIncluded: 5,
  },
});
```

#### Step 11: User Asks Follow-Up Questions

**User**: "How does this differ from the FAST Act?"

```typescript
// NO new MCP calls!
// We already have PL 114-94 (FAST Act) in context
// AI can compare directly

const response = await callAI({
  question: "How does this differ from the FAST Act?",
  context: context, // Already includes FAST Act summary
});

// AI responds instantly with comparison
```

**User**: "What did Amendment 2137 change?"

```typescript
// Again, NO new MCP calls!
// We already have SA 2137 in context

const response = await callAI({
  question: "What did Amendment 2137 change?",
  context: context, // Already includes amendment
});
```

**User**: "Explain the highway funding formula in Section 1106"

```typescript
// Still NO new MCP calls!
// We have 23 USC 119 which Section 1106 references

const response = await callAI({
  question: "Explain the highway funding formula in Section 1106",
  context: context, // Already includes 23 USC 119
});
```

#### Result: 10 Questions, 1 Fetch!

- **Initial fetch**: 1 MCP session, 5 documents, 3.4 seconds
- **Cached for**: 24 hours
- **Next 10 questions**: 0 MCP calls, instant responses
- **Token savings**: 80% (85k tokens vs 400k+ without summarization)
- **Cost savings**: 90% (vs fetching each document separately)

---

## Key Benefits

### 1. Reduces AI Calls by 70-90%
**Before**: Every question triggers separate bill fetch
- Q1: "Tell me about H.R. 3684" → Fetch bill
- Q2: "What's the FAST Act?" → Fetch FAST Act
- Q3: "What did Amendment 2137 change?" → Fetch amendment
- **Total**: 3 separate fetches

**After**: Fetch once with dependencies, reuse context
- Q1-Q10: All answered from single initial fetch
- **Total**: 1 fetch with dependency graph

**Savings**: 90% fewer API calls

### 2. Smarter Analysis
**Before**: AI sees only primary bill, missing context
- User asks: "How does this compare to previous law?"
- AI: "I don't have information about previous laws"
- Poor user experience

**After**: AI has full legislative context
- User asks: "How does this compare to previous law?"
- AI: "Compared to the FAST Act (PL 114-94), this bill increases funding by 23% and adds new provisions for..."
- Excellent user experience

### 3. Better UX
**Before**: 
- User asks about amendment → System doesn't have it → "Please specify which amendment"
- User specifies → New fetch → 3-5 second wait
- Frustrating experience

**After**: 
- Dependencies pre-fetched
- All amendments already in context
- Instant answers
- Delightful experience

### 4. Cost Optimization
**Before**: 
- 100 users × 10 questions each = 1,000 API calls
- Each call costs ~$0.02 = $20

**After**: 
- 100 users × 1 initial fetch + 9 cached = 100 API calls
- 100 calls × $0.02 = $2
- **Savings**: $18 (90% reduction)

### 5. Training Data Quality
**Before**: 
- Training data has incomplete context
- "User asked about amendment but system didn't have it"
- Poor quality examples

**After**: 
- Training data includes full dependency graphs
- AI learns to reason across related documents
- High quality examples for fine-tuning
- Better fine-tuned model performance

---

## Success Metrics

### Target Metrics (3 months after launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Cache hit rate** | >80% | % of requests served from cache |
| **Average dependencies/bill** | 3-5 | Avg # of related docs fetched |
| **Context reuse rate** | >60% | % of questions using cached context |
| **API cost reduction** | 70%+ | Savings vs naive fetching |
| **Average fetch time** | <4s | Time to build full document graph |
| **User satisfaction** | >4.5/5 | User ratings on answer quality |
| **Documents pre-fetched** | >100 | Popular bills cached nightly |
| **Training examples exported** | >10,000 | High-quality training data collected |

### Monitoring Dashboard

Create dashboard tracking:
- Real-time cache hit/miss rate
- Most frequently accessed bills
- Average dependencies per request
- Cost savings (estimated)
- Response times
- Error rates
- Top 10 bills by access count

---

## Timeline & Milestones

### Week 1: Foundation
- **Days 1-2**: Phase 1 (MCP integration, submodule setup)
- **Days 3-5**: Phase 2 (Dependency detection, graph builder)
- **Milestone**: Can fetch bill with dependencies

### Week 2: Caching & Context
- **Days 1-3**: Phase 3 (Caching implementation)
- **Days 4-5**: Phase 4 (AI context optimization)
- **Milestone**: Full document graph with optimized context

### Week 3: APIs & Frontend
- **Days 1-2**: Phase 5 (API endpoints)
- **Days 3-5**: Phase 6 (Frontend components, visualization)
- **Milestone**: User can view bill with dependency graph

### Week 4: Training & Polish
- **Days 1-2**: Phase 7 (Training data export, analytics)
- **Days 3-4**: Testing, bug fixes, optimization
- **Day 5**: Deploy to production
- **Milestone**: v1.0 launch with full dependency support

---

## Risk Mitigation

### Risk 1: API Rate Limits
**Risk**: Hit Congress.gov rate limits (5000/hour)
**Mitigation**: 
- Aggressive caching (24h TTL)
- Pre-fetch popular bills nightly
- Monitor usage and warn at 80%

### Risk 2: Dependency Explosion
**Risk**: Bill has 50+ dependencies, takes forever to fetch
**Mitigation**:
- Hard limit max depth to 2
- Hard limit max dependencies to 20
- Timeout at 30 seconds
- Cache partial graphs

### Risk 3: Cache Invalidation
**Risk**: Bill gets updated but cache shows old version
**Mitigation**:
- Check bill status (last action date)
- If action within 24h, bypass cache
- Add manual refresh button
- Nightly cache cleanup

### Risk 4: Token Limits
**Risk**: Full context exceeds model token limit
**Mitigation**:
- Smart summarization (80% reduction)
- Include only relevant sections
- Truncate if needed with warning
- Monitor token usage

---

## Future Enhancements

### v2.0 Features
- [ ] Real-time bill updates via webhooks
- [ ] Collaborative annotations on bills
- [ ] Bill comparison view (side-by-side)
- [ ] Export dependency graphs as PDF/PNG
- [ ] Public API for third-party access

### v3.0 Features
- [ ] AI-generated summaries of dependencies
- [ ] Automatic bill tracking/notifications
- [ ] Legislative timeline visualization
- [ ] Impact analysis (which laws affected)
- [ ] Predictive analytics (passage likelihood)

---

## End Goal

**User asks ONE question about ANY bill** → CutTheCrap:
1. ✅ Fetches bill + all dependencies in ONE MCP session
2. ✅ Builds complete document graph with cross-references
3. ✅ Caches everything for 24 hours
4. ✅ Optimizes context for AI (smart summarization)
5. ✅ Answers that question + next 10 with ZERO additional fetches
6. ✅ Exports high-quality training data with full context
7. ✅ Provides excellent UX with dependency visualization

**Result**: 
- 🎯 Smarter AI (full legislative context)
- 💰 Lower costs (90% fewer API calls)
- ⚡ Better UX (instant follow-up answers)
- 🚀 Higher quality training data
- 📊 Actionable analytics

**This is how we CutTheCrap and make federal legislation actually understandable!** 🇺🇸
