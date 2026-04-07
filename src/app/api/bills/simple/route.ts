/**
 * Simple Bill API - Fetches single bill without dependencies
 * GET /api/bills/simple?billId=118/hr/3684
 *
 * SECURITY CONTROLS APPLIED:
 * - Rate limiting: 60 requests/minute
 * - Bill ID format validation
 *
 * See: docs/security/threat_model.md - Scenario 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/services/mcp-client';
import { getDocumentCache } from '@/lib/document-cache';
import { RateLimitPresets } from '@/middleware/rate-limit';
import { config } from '@/lib/config';
import { logAPIRequest, getClientIP } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request.headers);

  // SECURITY FIX: Apply rate limiting
  const rateLimitResponse = await RateLimitPresets.standard(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const billId = searchParams.get('billId');

    if (!billId) {
      // SECURITY: Log validation error
      await logAPIRequest({
        endpoint: '/api/bills/simple',
        method: 'GET',
        parameters: {},
        result: 'failure',
        durationMs: Date.now() - startTime,
        ipAddress: clientIP,
        statusCode: 400,
        error: 'Missing billId parameter',
      });

      return NextResponse.json(
        { error: 'billId parameter is required' },
        { status: 400 }
      );
    }

    // Validate format
    if (!/^\d+\/[a-z]+\/\d+$/.test(billId)) {
      // SECURITY: Log validation error
      await logAPIRequest({
        endpoint: '/api/bills/simple',
        method: 'GET',
        parameters: { billId },
        result: 'failure',
        durationMs: Date.now() - startTime,
        ipAddress: clientIP,
        statusCode: 400,
        error: 'Invalid bill ID format',
      });

      return NextResponse.json(
        { error: 'Invalid bill ID format. Expected: congress/type/number' },
        { status: 400 }
      );
    }

    console.log(`Fetching simple bill data for ${billId}...`);

    const cache = getDocumentCache();
    const cacheKey = `bill:simple:${billId}`;

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached && cached.root) {
      console.log(`Returning cached bill for ${billId}`);
      return NextResponse.json({
        bill: cached.root,
        metadata: {
          cached: true,
        },
      });
    }

    // Fetch from MCP
    const mcpClient = getMCPClient();
    await mcpClient.connect();

    const billText = await mcpClient.getBillText(billId);
    const billStatus = await mcpClient.getBillStatus(billId);

    await mcpClient.disconnect();

    const bill = {
      id: billId,
      type: 'bill' as const,
      title: billStatus.id,
      content: billText.text,
      metadata: {
        status: billStatus.status,
        last_action: billStatus.last_action,
        last_action_date: billStatus.last_action_date,
      },
      dependencies: [],
    };

    // Cache aggressively (7 days)
    const simpleGraph = {
      root: bill,
      nodes: new Map([[billId, bill]]),
      totalNodes: 1,
      maxDepth: 0,
      fetchTimeMs: 0,
      cacheHits: 0,
      cacheMisses: 1,
    };

    await cache.set(cacheKey, simpleGraph, 604800);

    // SECURITY: Log successful API request
    await logAPIRequest({
      endpoint: '/api/bills/simple',
      method: 'GET',
      parameters: { billId },
      result: 'success',
      durationMs: Date.now() - startTime,
      ipAddress: clientIP,
      statusCode: 200,
    });

    return NextResponse.json({
      bill,
      metadata: {
        cached: false,
      },
    });
  } catch (error) {
    console.error('Error fetching bill:', error);

    // SECURITY: Log internal error
    await logAPIRequest({
      endpoint: '/api/bills/simple',
      method: 'GET',
      parameters: {},
      result: 'failure',
      durationMs: Date.now() - startTime,
      ipAddress: clientIP,
      statusCode: 500,
      error: error instanceof Error ? error.message : String(error),
    });

    // SECURITY: Don't expose internal error details in production
    const errorMessage = config.isProduction
      ? 'An error occurred while fetching the bill'
      : String(error);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
