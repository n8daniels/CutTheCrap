/**
 * Bill Regulations API — Federal Register documents related to a bill
 * GET /api/bills/119-hr-1/regulations
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchRegulations, searchByPublicLaw } from '@/services/federal-register-api';

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

    // Convert URL-safe billId (119-hr-1) to readable format
    const parts = billId.split('-');
    const searchTerms: string[] = [];

    if (parts.length >= 3) {
      searchTerms.push(`${parts[1].toUpperCase()} ${parts[2]}`);
      searchTerms.push(`H.R. ${parts[2]}`);
    }

    // Search Federal Register for related documents
    const results = await searchRegulations(searchTerms[0] || billId, { limit: 10 });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Regulations API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch regulations' },
      { status: 500 }
    );
  }
}
