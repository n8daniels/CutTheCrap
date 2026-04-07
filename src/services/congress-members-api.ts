/**
 * Congress.gov Member & Vote API
 * Replaces the defunct ProPublica Congress API
 *
 * Endpoints: /member, /member/{bioguideId}, bill actions/votes
 * Rate limit: 5,000 req/hour (shared with bill endpoints)
 */

import { config } from '@/lib/config';
import { getAPICache, CACHE_TTL } from '@/lib/api-cache';

const BASE_URL = 'https://api.congress.gov/v3';

async function fetchJSON<T>(path: string): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${separator}api_key=${config.congressApiKey}&format=json`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Congress API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch member details by Bioguide ID
 */
export async function fetchMember(bioguideId: string) {
  const cache = getAPICache();
  const cacheKey = `congress:member:${bioguideId}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  const data = await fetchJSON<any>(`/member/${bioguideId}`);
  const member = data.member;

  if (!member) return null;

  const currentTerm = member.terms?.item?.[member.terms.item.length - 1];

  const result = {
    bioguideId: member.bioguideId,
    name: member.directOrderName || `${member.firstName} ${member.lastName}`,
    firstName: member.firstName,
    lastName: member.lastName,
    party: currentTerm?.party || member.partyName || 'Unknown',
    state: member.state || currentTerm?.state || 'Unknown',
    district: currentTerm?.district || null,
    chamber: currentTerm?.chamber || 'Unknown',
    imageUrl: member.depiction?.imageUrl || null,
    birthYear: member.birthYear || null,
    terms: (member.terms?.item || []).map((t: any) => ({
      chamber: t.chamber,
      startYear: t.startYear,
      endYear: t.endYear,
      state: t.stateCode || t.state,
      district: t.district,
      party: t.partyName || t.party,
    })),
    sponsoredLegislation: member.sponsoredLegislation?.count || 0,
    cosponsoredLegislation: member.cosponsoredLegislation?.count || 0,
  };

  cache.set(cacheKey, result, CACHE_TTL.MEMBER);
  return result;
}

/**
 * Fetch bills sponsored by a member
 */
export async function fetchMemberBills(bioguideId: string, limit: number = 10) {
  const cache = getAPICache();
  const cacheKey = `congress:member-bills:${bioguideId}:${limit}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  const data = await fetchJSON<any>(`/member/${bioguideId}/sponsored-legislation?limit=${limit}`);

  const result = (data.sponsoredLegislation || []).map((b: any) => ({
    id: `${b.congress}/${b.type?.toLowerCase()}/${b.number}`,
    title: b.title,
    congress: b.congress,
    type: b.type,
    number: b.number,
    introducedDate: b.introducedDate,
    latestAction: b.latestAction?.text || '',
    policyArea: b.policyArea?.name || null,
  }));

  cache.set(cacheKey, result, CACHE_TTL.MEMBER);
  return result;
}

/**
 * Fetch all actions (full timeline) for a bill
 */
export async function fetchBillActions(congress: number, type: string, number: number) {
  const cache = getAPICache();
  const cacheKey = `congress:actions:${congress}/${type}/${number}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  const data = await fetchJSON<any>(`/bill/${congress}/${type}/${number}/actions?limit=250`);

  const result = (data.actions || []).map((a: any) => ({
    date: a.actionDate,
    text: a.text,
    type: a.type || 'Action',
    chamber: a.actionCode?.startsWith('H') ? 'House' :
             a.actionCode?.startsWith('S') ? 'Senate' : null,
    rollCallNumber: a.recordedVotes?.[0]?.rollNumber || null,
    rollCallUrl: a.recordedVotes?.[0]?.url || null,
  }));

  cache.set(cacheKey, result, CACHE_TTL.BILL);
  return result;
}

/**
 * Fetch vote details for a specific roll call
 */
export async function fetchVoteDetails(congress: number, chamber: string, rollNumber: number) {
  const cache = getAPICache();
  const cacheKey = `congress:vote:${congress}/${chamber}/${rollNumber}`;

  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  // Congress.gov doesn't have a direct vote-by-member endpoint in the same way ProPublica did
  // But we can get the roll call from the actions and link to congress.gov/roll-call-votes
  // For now, return the roll call reference
  const chamberPath = chamber.toLowerCase() === 'senate' ? 'senate' : 'house';

  const result = {
    congress,
    chamber: chamberPath,
    rollNumber,
    url: `https://www.congress.gov/roll-call-votes/119th-congress-${chamberPath}/vote-${rollNumber}`,
  };

  cache.set(cacheKey, result, CACHE_TTL.BILL);
  return result;
}
