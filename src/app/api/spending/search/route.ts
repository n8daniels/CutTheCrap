import { NextRequest, NextResponse } from 'next/server';
import { searchAwards } from '@/services/usaspending-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 25);

    if (!keyword.trim()) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    const result = await searchAwards(keyword.trim(), { limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Spending search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search spending' },
      { status: 500 }
    );
  }
}
