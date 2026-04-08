/**
 * Bill Spending API — USASpending data for federal awards related to a bill
 * GET /api/bills/119-hr-1/spending
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchAwards, searchSpendingByAgency } from '@/services/usaspending-api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const { billId } = params;

    if (!billId) {
      return NextResponse.json({ error: 'billId is required' }, { status: 400 });
    }

    // Convert billId to search terms
    const parts = billId.split('-');
    let keyword = billId;
    if (parts.length >= 3) {
      keyword = `${parts[1].toUpperCase()} ${parts[2]}`;
    }

    // Fetch awards and agency spending in parallel
    const [awards, agencySpending] = await Promise.all([
      searchAwards(keyword, { limit: 10 }).catch(() => ({ count: 0, awards: [] })),
      searchSpendingByAgency(keyword).catch(() => ({ categories: [] })),
    ]);

    return NextResponse.json({
      awards,
      agencySpending,
    });
  } catch (error) {
    console.error('Spending API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch spending data' },
      { status: 500 }
    );
  }
}
