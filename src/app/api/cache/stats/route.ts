/**
 * API endpoint for cache statistics
 * GET /api/cache/stats
 */

import { NextResponse } from 'next/server';
import { billCache } from '@/lib/cache';

export async function GET() {
  const stats = await billCache.getStats();
  return NextResponse.json(stats);
}
