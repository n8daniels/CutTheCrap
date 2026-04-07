import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentBills } from '@/services/congress-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const congress = parseInt(searchParams.get('congress') || '119');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 25);

    const bills = await fetchRecentBills({ congress, limit });
    return NextResponse.json({ bills });
  } catch (error) {
    console.error('Recent bills error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recent bills' },
      { status: 500 }
    );
  }
}
