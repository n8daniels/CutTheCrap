/**
 * API endpoint for fetching bill data
 * GET /api/bills/:congress/:type/:number
 */

import { NextRequest, NextResponse } from 'next/server';
import { FedDocMCPClient } from '@/services/mcp-client';
import { billCache } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { congress: string; type: string; number: string } }
) {
  try {
    const congress = parseInt(params.congress, 10);
    const billType = params.type.toLowerCase();
    const billNumber = parseInt(params.number, 10);

    // Validate parameters
    if (isNaN(congress) || isNaN(billNumber)) {
      return NextResponse.json(
        { error: 'Invalid congress or bill number' },
        { status: 400 }
      );
    }

    if (!['hr', 's', 'hjres', 'sjres', 'hconres', 'sconres', 'hres', 'sres'].includes(billType)) {
      return NextResponse.json(
        { error: 'Invalid bill type' },
        { status: 400 }
      );
    }

    const billId = `${congress}/${billType}/${billNumber}`;
    const cacheKey = `bill:${billId}`;

    // Check cache first
    const cached = await billCache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${billId}`);
      return NextResponse.json({
        ...cached,
        _meta: {
          cached: true,
          cacheKey,
        },
      });
    }

    console.log(`Cache miss for ${billId}, fetching from API`);

    // Fetch from Congress.gov
    const mcpClient = new FedDocMCPClient();
    await mcpClient.connect();

    const startTime = Date.now();

    // Get bill metadata and status
    const [bill, status] = await Promise.all([
      mcpClient.getBill(congress, billType, billNumber),
      mcpClient.getBillStatus(congress, billType, billNumber),
    ]);

    const fetchTimeMs = Date.now() - startTime;

    const result = {
      bill,
      status,
      _meta: {
        cached: false,
        fetchTimeMs,
        cacheKey,
      },
    };

    // Cache for 1 hour (3600 seconds)
    await billCache.set(cacheKey, result, 3600);

    await mcpClient.disconnect();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bill',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
