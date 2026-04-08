/**
 * Federal Register API Client
 * Finds regulations, rules, and executive orders related to legislation
 *
 * Base URL: https://www.federalregister.gov/api/v1
 * No API key needed
 * Rate limit: ~1,000 req/hour (soft limit)
 * Docs: https://www.federalregister.gov/developers/api/v1
 */

import { getAPICache, CACHE_TTL } from '@/lib/api-cache';

const BASE_URL = 'https://www.federalregister.gov/api/v1';

async function fetchFR<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Federal Register API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

interface FRDocument {
  title: string;
  type: string;
  documentNumber: string;
  publicationDate: string;
  agencies: Array<{ name: string }>;
  abstract?: string;
  htmlUrl: string;
  pdfUrl?: string;
  commentCount?: number;
  startPage?: number;
  endPage?: number;
}

interface FRSearchResponse {
  count: number;
  results: FRDocument[];
}

/**
 * Search for Federal Register documents related to a bill or public law
 */
export async function searchRegulations(query: string, options?: {
  type?: string[];  // 'RULE', 'PRORULE', 'NOTICE', 'PRESDOCU'
  limit?: number;
}) {
  const cache = getAPICache();
  const cacheKey = `fr:search:${query}:${options?.type?.join(',') || 'all'}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  const limit = options?.limit || 10;
  let path = `/documents.json?conditions[term]=${encodeURIComponent(query)}&per_page=${limit}&order=relevance`;

  if (options?.type && options.type.length > 0) {
    options.type.forEach(t => {
      path += `&conditions[type][]=${t}`;
    });
  }

  const data = await fetchFR<FRSearchResponse>(path);

  const result = {
    count: data.count || 0,
    documents: (data.results || []).map(doc => ({
      title: doc.title,
      type: doc.type,
      documentNumber: doc.documentNumber,
      publicationDate: doc.publicationDate,
      agencies: (doc.agencies || []).map(a => a.name),
      abstract: doc.abstract || null,
      url: doc.htmlUrl,
      pdfUrl: doc.pdfUrl || null,
      pages: doc.startPage && doc.endPage ? `${doc.startPage}-${doc.endPage}` : null,
    })),
  };

  cache.set(cacheKey, result, CACHE_TTL.BILL);
  return result;
}

/**
 * Search for regulations specifically related to a public law
 */
export async function searchByPublicLaw(lawNumber: string) {
  return searchRegulations(`"Public Law ${lawNumber}"`, {
    type: ['RULE', 'PRORULE'],
    limit: 10,
  });
}

/**
 * Search for executive orders and presidential documents
 */
export async function searchExecutiveOrders(query: string) {
  return searchRegulations(query, {
    type: ['PRESDOCU'],
    limit: 5,
  });
}
