/**
 * USASpending.gov API Client
 * Tracks where federal money actually goes — contracts, grants, loans
 *
 * Base URL: https://api.usaspending.gov/api/v2
 * No API key needed
 * Docs: https://api.usaspending.gov
 */

import { getAPICache, CACHE_TTL } from '@/lib/api-cache';

const BASE_URL = 'https://api.usaspending.gov/api/v2';

async function fetchUSA<T>(path: string, body?: any): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const options: RequestInit = {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
  };

  if (body) {
    options.method = 'POST';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`USASpending API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search for federal awards (contracts, grants, loans) by keyword
 */
export async function searchAwards(keyword: string, options?: {
  limit?: number;
  awardType?: string[];  // 'contracts', 'grants', 'direct_payments', 'loans'
}) {
  const cache = getAPICache();
  const cacheKey = `usa:awards:${keyword}:${options?.awardType?.join(',') || 'all'}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  const limit = options?.limit || 10;

  const data = await fetchUSA<any>('/search/spending_by_award/', {
    filters: {
      keywords: [keyword],
      award_type_codes: options?.awardType
        ? mapAwardTypes(options.awardType)
        : mapAwardTypes(['contracts', 'grants', 'direct_payments', 'loans']),
    },
    fields: [
      'Award ID',
      'Recipient Name',
      'Award Amount',
      'Total Outlays',
      'Description',
      'Start Date',
      'End Date',
      'Awarding Agency',
      'Award Type',
    ],
    limit,
    page: 1,
    sort: 'Award Amount',
    order: 'desc',
  });

  const result = {
    count: data.page_metadata?.total || 0,
    awards: (data.results || []).map((a: any) => ({
      awardId: a['Award ID'],
      recipientName: a['Recipient Name'],
      amount: a['Award Amount'] || 0,
      outlays: a['Total Outlays'] || 0,
      description: a['Description'] || '',
      startDate: a['Start Date'] || '',
      endDate: a['End Date'] || '',
      agency: a['Awarding Agency'] || '',
      type: a['Award Type'] || '',
    })),
  };

  cache.set(cacheKey, result, CACHE_TTL.BILL);
  return result;
}

/**
 * Get spending totals by agency for a keyword
 */
export async function searchSpendingByAgency(keyword: string) {
  const cache = getAPICache();
  const cacheKey = `usa:agency-spending:${keyword}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  const data = await fetchUSA<any>('/search/spending_by_category/awarding_agency/', {
    filters: {
      keywords: [keyword],
    },
    limit: 10,
    page: 1,
  });

  const result = {
    categories: (data.results || []).map((c: any) => ({
      agency: c.name || 'Unknown',
      amount: c.amount || 0,
      count: c.count || 0,
    })),
  };

  cache.set(cacheKey, result, CACHE_TTL.BILL);
  return result;
}

function mapAwardTypes(types: string[]): string[] {
  const mapping: Record<string, string[]> = {
    contracts: ['A', 'B', 'C', 'D'],
    grants: ['02', '03', '04', '05'],
    direct_payments: ['06', '10'],
    loans: ['07', '08'],
  };

  return types.flatMap(t => mapping[t] || []);
}

/**
 * Format a dollar amount for display
 */
export function formatSpendingAmount(amount: number): string {
  if (Math.abs(amount) >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (Math.abs(amount) >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (Math.abs(amount) >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}
