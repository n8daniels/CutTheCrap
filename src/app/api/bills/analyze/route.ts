/**
 * Bill Analysis API - Fetches bill with full dependency graph
 * POST /api/bills/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMCPClient } from '@/services/mcp-client';
import { getDocumentCache } from '@/lib/document-cache';
import { DocumentGraphBuilder } from '@/lib/document-graph';
import { AIContextBuilder } from '@/lib/ai-context-builder';

const requestSchema = z.object({
  billId: z.string().regex(/^\d+\/[a-z]+\/\d+$/, 'Invalid bill ID format'),
  includeDependencies: z.boolean().default(true),
  maxDepth: z.number().min(0).max(3).default(2),
  forceRefresh: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billId, includeDependencies, maxDepth, forceRefresh } = requestSchema.parse(body);

    console.log(`Analyzing bill ${billId}...`);

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
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze bill', details: String(error) },
      { status: 500 }
    );
  }
}
