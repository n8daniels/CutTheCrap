/**
 * FEC (Federal Election Commission) API Client
 * Provides donor data, campaign financials, PAC spending
 *
 * Base URL: https://api.open.fec.gov/v1
 * Rate limit: 1,000 requests/hour
 * Docs: https://api.open.fec.gov/developers/
 */

import { config } from '@/lib/config';
import { getAPICache, CACHE_TTL } from '@/lib/api-cache';

const BASE_URL = 'https://api.open.fec.gov/v1';

async function fetchFEC<T>(path: string): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${separator}api_key=${config.fecApiKey}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`FEC API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search for a candidate by name
 */
export async function searchCandidate(name: string, options?: { state?: string; party?: string }) {
  const cache = getAPICache();
  const cacheKey = `fec:search:${name}:${options?.state || ''}:${options?.party || ''}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  let path = `/candidates/search/?q=${encodeURIComponent(name)}&sort=-election_years&per_page=5`;
  if (options?.state) path += `&state=${options.state}`;
  if (options?.party) path += `&party=${options.party}`;

  const data = await fetchFEC<any>(path);
  const results = (data.results || []).map((c: any) => ({
    candidateId: c.candidate_id,
    name: c.name,
    party: c.party_full || c.party,
    state: c.state,
    office: c.office_full || c.office,
    district: c.district,
    electionYears: c.election_years || [],
    active: c.candidate_status === 'C',
  }));

  cache.set(cacheKey, results, CACHE_TTL.DONORS);
  return results;
}

/**
 * Get candidate financial totals
 */
export async function fetchCandidateFinancials(candidateId: string) {
  const cache = getAPICache();
  const cacheKey = `fec:financials:${candidateId}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  const data = await fetchFEC<any>(`/candidate/${candidateId}/totals/?sort_null_only=false&per_page=1&sort=-cycle`);
  const totals = data.results?.[0];

  if (!totals) return null;

  const result = {
    candidateId,
    cycle: totals.cycle,
    totalReceipts: totals.receipts || 0,
    totalDisbursements: totals.disbursements || 0,
    cashOnHand: totals.cash_on_hand_end_period || 0,
    debts: totals.debts_owed_by_committee || 0,
    individualContributions: totals.individual_contributions || 0,
    pacContributions: totals.other_political_committee_contributions || 0,
    partyContributions: totals.political_party_committee_contributions || 0,
  };

  cache.set(cacheKey, result, CACHE_TTL.DONORS);
  return result;
}

/**
 * Get top donors by employer for a candidate
 */
export async function fetchTopDonors(candidateId: string) {
  const cache = getAPICache();
  const cacheKey = `fec:donors:${candidateId}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  // First get the candidate's principal campaign committee
  const committees = await fetchFEC<any>(`/candidate/${candidateId}/committees/?designation=P&per_page=1`);
  const committeeId = committees.results?.[0]?.committee_id;

  if (!committeeId) return { employers: [], total: 0 };

  // Get top donors aggregated by employer
  const data = await fetchFEC<any>(
    `/schedules/schedule_a/by_employer/?committee_id=${committeeId}&per_page=10&sort=-total`
  );

  const result = {
    committeeId,
    employers: (data.results || []).map((d: any) => ({
      employer: d.employer || 'Unknown',
      total: d.total || 0,
      count: d.count || 0,
    })),
    total: data.pagination?.count || 0,
  };

  cache.set(cacheKey, result, CACHE_TTL.DONORS);
  return result;
}

/**
 * Get independent expenditures for/against a candidate (Super PAC spending)
 */
export async function fetchIndependentExpenditures(candidateId: string) {
  const cache = getAPICache();
  const cacheKey = `fec:ie:${candidateId}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  const data = await fetchFEC<any>(
    `/schedules/schedule_e/?candidate_id=${candidateId}&per_page=10&sort=-expenditure_amount`
  );

  const result = {
    expenditures: (data.results || []).map((e: any) => ({
      committee: e.committee?.name || 'Unknown',
      amount: e.expenditure_amount || 0,
      supportOppose: e.support_oppose_indicator === 'S' ? 'Support' : 'Oppose',
      description: e.expenditure_description || '',
      date: e.expenditure_date || '',
    })),
    total: data.pagination?.count || 0,
  };

  cache.set(cacheKey, result, CACHE_TTL.DONORS);
  return result;
}

/**
 * Full donor profile for a candidate — combines financials + top donors + independent expenditures
 */
export async function fetchFullDonorProfile(candidateId: string) {
  const [financials, donors, ie] = await Promise.all([
    fetchCandidateFinancials(candidateId).catch(() => null),
    fetchTopDonors(candidateId).catch(() => ({ employers: [], total: 0 })),
    fetchIndependentExpenditures(candidateId).catch(() => ({ expenditures: [], total: 0 })),
  ]);

  return {
    candidateId,
    financials,
    topDonors: donors,
    independentExpenditures: ie,
  };
}
