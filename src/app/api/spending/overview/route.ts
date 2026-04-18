import { NextResponse } from 'next/server';
import { getAPICache, CACHE_TTL } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://api.usaspending.gov/api/v2';

async function fetchUSA<T>(path: string, body: any): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`USASpending API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function GET() {
  try {
    const cache = getAPICache();
    const cacheKey = 'usa:spending-overview:2026';

    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const [agencyData, budgetData] = await Promise.all([
      fetchUSA<any>('/spending/agency/', {
        fiscal_year: 2026,
        limit: 10,
        page: 1,
        sort: 'obligated_amount',
        order: 'desc',
      }),
      fetchUSA<any>('/spending/budget_function/', {
        fiscal_year: 2026,
        limit: 20,
        page: 1,
        sort: 'obligated_amount',
        order: 'desc',
      }),
    ]);

    const result = {
      fiscalYear: 2026,
      topAgencies: (agencyData.results || []).map((a: any) => ({
        name: a.name || a.agency_name || 'Unknown',
        abbreviation: a.abbreviation || '',
        obligatedAmount: a.obligated_amount || 0,
        grossOutlayAmount: a.gross_outlay_amount || 0,
      })),
      budgetFunctions: (budgetData.results || []).map((b: any) => ({
        name: b.name || b.budget_function_title || 'Unknown',
        obligatedAmount: b.obligated_amount || 0,
        grossOutlayAmount: b.gross_outlay_amount || 0,
      })),
      totalObligated: (agencyData.results || []).reduce(
        (sum: number, a: any) => sum + (a.obligated_amount || 0),
        0
      ),
    };

    cache.set(cacheKey, result, CACHE_TTL.HOMEPAGE);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Spending overview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch spending overview' },
      { status: 500 }
    );
  }
}
