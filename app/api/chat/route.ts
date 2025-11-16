import { NextRequest, NextResponse } from 'next/server';
import { cutTheCrapLLM } from '@/lib/cutthecrap-llm';
import { getMCPClient } from '@/services/mcp-client';
import { documentCache } from '@/lib/document-cache';
import type { AIContext } from '@/types';

/**
 * POST /api/chat
 *
 * Chat with CutTheCrapLLM, optionally with bill context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      question,
      billId,
      stream = false,
      conversationHistory = [],
    } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // If billId provided, fetch document context
    let context: AIContext | undefined;
    if (billId) {
      // Check cache first
      const cacheKey = `bill:context:${billId}`;
      let cachedContext = await documentCache.get(cacheKey);

      if (!cachedContext) {
        // Fetch from MCP
        const mcpClient = await getMCPClient();
        const documentGraph = await mcpClient.getBillWithDependencies(billId, 2);

        // Build AI context from document graph
        context = buildAIContextFromGraph(documentGraph);

        // Cache for 24 hours
        await documentCache.set(cacheKey, documentGraph, 86400);
      } else {
        context = buildAIContextFromGraph(cachedContext);
      }
    }

    // Stream response
    if (stream) {
      const textStream = await cutTheCrapLLM.chatStream(
        question,
        context,
        conversationHistory
      );

      // Create streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of textStream) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const response = await cutTheCrapLLM.chat(
      question,
      context,
      conversationHistory
    );

    return NextResponse.json({
      response,
      metadata: context
        ? {
            billId: context.primaryBill.id,
            documentsIncluded: context.metadata.documentsIncluded,
          }
        : null,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Helper: Build AI context from document graph
 */
function buildAIContextFromGraph(documentGraph: any): AIContext {
  const root = documentGraph.root;

  return {
    primaryBill: {
      id: root.id,
      title: root.title,
      fullText: root.content,
      metadata: root.metadata,
    },
    dependencies: Array.from(documentGraph.nodes.values())
      .filter((node: any) => node.id !== root.id)
      .map((node: any) => ({
        id: node.id,
        type: node.type,
        title: node.title,
        summary: node.content.substring(0, 1000),
        relevantSections: [],
        relationship: node.relationship || 'Related document',
        metadata: node.metadata,
      })),
    crossReferences: [],
    timeline: [],
    metadata: {
      documentsIncluded: documentGraph.totalNodes,
      dependencyDepth: documentGraph.maxDepth,
      cacheHits: documentGraph.cacheHits,
      fetchTimeMs: documentGraph.fetchTimeMs,
      totalTokensEstimate: estimateTokens(root.content),
    },
  };
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
