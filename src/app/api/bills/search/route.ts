import { NextRequest, NextResponse } from 'next/server';
import { searchBills } from '@/services/congress-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const congress = searchParams.get('congress') ? parseInt(searchParams.get('congress')!) : undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query && !congress) {
      return NextResponse.json({ error: 'Query parameter "q" or "congress" is required' }, { status: 400 });
    }

    const results = await searchBills(query, { congress, limit, offset });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
