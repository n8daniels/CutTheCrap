/**
 * Bill Analysis API - Fetches bill with full dependency graph
 * POST /api/bills/analyze
 *
 * SECURITY CONTROLS APPLIED:
 * - Rate limiting: 10 requests/minute standard, 5 force refreshes/hour
 * - Input validation via Zod schema
 * - Bill ID format validation
 *
 * See: docs/security/threat_model.md - Scenario 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMCPClient } from '@/services/mcp-client';
import { getDocumentCache } from '@/lib/document-cache';
import { DocumentGraphBuilder } from '@/lib/document-graph';
import { AIContextBuilder } from '@/lib/ai-context-builder';
import { rateLimit, RateLimitPresets } from '@/middleware/rate-limit';
import { config } from '@/lib/config';
import { logAPIRequest, getClientIP } from '@/lib/audit-logger';

const requestSchema = z.object({
  billId: z.string().regex(/^\d+\/[a-z]+\/\d+$/, 'Invalid bill ID format'),
  includeDependencies: z.boolean().default(true),
  maxDepth: z.number().min(0).max(3).default(2),
  forceRefresh: z.boolean().default(false),
});

// SECURITY: Rate limiters for this endpoint
const standardLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10,
  message: 'Too many bill analysis requests. Please wait a moment.',
});

const forceRefreshLimiter = RateLimitPresets.cacheBypass;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request.headers);

  // SECURITY FIX: Apply standard rate limiting
  // Prevents API quota exhaustion and DoS
  // See: docs/security/threat_model.md - Scenario 2
  const rateLimitResponse = await standardLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { billId, includeDependencies, maxDepth, forceRefresh } = requestSchema.parse(body);

    console.log(`Analyzing bill ${billId}...`);

    // SECURITY FIX: Extra strict rate limiting for force refresh
    // Prevents cache bypass abuse
    // See: docs/security/llm-rag-mcp-security.md - Section 3
    if (forceRefresh) {
      const forceRefreshResponse = await forceRefreshLimiter(request);
      if (forceRefreshResponse) {
        return forceRefreshResponse;
      }
    }

    const cache = getDocumentCache();
    const cacheKey = `bill:graph:${billId}:${maxDepth}`;

    // Check cache unless force refresh
    if (!forceRefresh) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log(`Returning cached result for ${billId}`);

        const contextBuilder = new AIContextBuilder();
        const aiContext = contextBuilder.buildContext(cached);

        return NextResponse.json({
          bill: cached.root,
          documentGraph: cached,
          aiContext,
          metadata: {
            cached: true,
            fetchTimeMs: cached.fetchTimeMs,
            documentsIncluded: cached.totalNodes,
          },
        });
      }
    }

    // Build fresh graph
    const mcpClient = getMCPClient();
    await mcpClient.connect();

    const graphBuilder = new DocumentGraphBuilder(mcpClient, cache);
    const graph = await graphBuilder.buildGraph(
      billId,
      includeDependencies ? maxDepth : 0
    );

    // Build AI context
    const contextBuilder = new AIContextBuilder();
    const aiContext = contextBuilder.buildContext(graph);

    await mcpClient.disconnect();

    // SECURITY: Log successful API request
    await logAPIRequest({
      endpoint: '/api/bills/analyze',
      method: 'POST',
      parameters: { billId, includeDependencies, maxDepth, forceRefresh },
      result: 'success',
      durationMs: Date.now() - startTime,
      ipAddress: clientIP,
      statusCode: 200,
    });

    return NextResponse.json({
      bill: graph.root,
      documentGraph: graph,
      aiContext,
      metadata: {
        cached: false,
        fetchTimeMs: graph.fetchTimeMs,
        documentsIncluded: graph.totalNodes,
      },
    });
  } catch (error) {
    console.error('Error analyzing bill:', error);

    if (error instanceof z.ZodError) {
      // SECURITY: Log validation error
      await logAPIRequest({
        endpoint: '/api/bills/analyze',
        method: 'POST',
        parameters: {},
        result: 'failure',
        durationMs: Date.now() - startTime,
        ipAddress: clientIP,
        statusCode: 400,
        error: 'Validation error',
      });

      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    // SECURITY: Log internal error
    await logAPIRequest({
      endpoint: '/api/bills/analyze',
      method: 'POST',
      parameters: {},
      result: 'failure',
      durationMs: Date.now() - startTime,
      ipAddress: clientIP,
      statusCode: 500,
      error: error instanceof Error ? error.message : String(error),
    });

    // SECURITY: Don't expose internal error details in production
    const errorMessage = config.isProduction
      ? 'An error occurred while analyzing the bill'
      : String(error);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
