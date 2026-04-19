import { NextResponse } from 'next/server';
import { getAPICache, CACHE_TTL } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://api.usaspending.gov/api/v2';

export async function GET() {
  try {
    const cache = getAPICache();
    const cacheKey = 'usa:spending-overview:fy2026';

    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Current fiscal year period (Oct 1 2025 - Sep 30 2026)
    const timePeriod = [{ start_date: '2025-10-01', end_date: '2026-09-30' }];

    // Fetch top agencies by spending and top budget categories in parallel
    const [agencyRes, categoryRes] = await Promise.all([
      fetch(`${BASE_URL}/search/spending_by_category/awarding_agency/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: { time_period: timePeriod },
          limit: 10,
          page: 1,
        }),
        signal: AbortSignal.timeout(20000),
      }),
      fetch(`${BASE_URL}/search/spending_by_category/cfda/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: { time_period: timePeriod },
          limit: 15,
          page: 1,
        }),
        signal: AbortSignal.timeout(20000),
      }),
    ]);

    if (!agencyRes.ok || !categoryRes.ok) {
      throw new Error(`USASpending API error: agency=${agencyRes.status} category=${categoryRes.status}`);
    }

    const [agencyData, categoryData] = await Promise.all([
      agencyRes.json(),
      categoryRes.json(),
    ]);

    const topAgencies = (agencyData.results || []).map((a: any) => ({
      name: a.name || 'Unknown',
      abbreviation: a.code || '',
      obligatedAmount: a.amount || 0,
    }));

    const totalObligated = topAgencies.reduce(
      (sum: number, a: any) => sum + a.obligatedAmount,
      0
    );

    const result = {
      fiscalYear: 2026,
      topAgencies,
      budgetFunctions: (categoryData.results || []).map((b: any) => ({
        name: b.name || 'Unknown',
        obligatedAmount: b.amount || 0,
      })),
      totalObligated,
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
