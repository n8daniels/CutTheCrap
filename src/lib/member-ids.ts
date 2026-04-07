/**
 * Member ID Crosswalk
 * Maps Bioguide IDs (Congress.gov) → FEC Candidate IDs
 * Uses the @unitedstates/congress-legislators dataset from GitHub
 */

import { getAPICache, CACHE_TTL } from './api-cache';

const LEGISLATORS_URL = 'https://unitedstates.github.io/congress-legislators/legislators-current.json';

interface LegislatorEntry {
  id: {
    bioguide: string;
    fec?: string[];
    opensecrets?: string;
    thomas?: string;
    govtrack?: number;
  };
  name: {
    first: string;
    last: string;
    official_full?: string;
  };
  terms: Array<{
    type: string;  // 'sen' or 'rep'
    start: string;
    end: string;
    state: string;
    district?: number;
    party: string;
  }>;
}

interface MemberIds {
  bioguide: string;
  fecIds: string[];
  opensecrets: string | null;
  thomas: string | null;
  govtrack: number | null;
  name: string;
  currentParty: string;
  currentState: string;
  currentChamber: string;
}

let legislatorsData: LegislatorEntry[] | null = null;

/**
 * Fetch and cache the legislators dataset
 */
async function getLegislators(): Promise<LegislatorEntry[]> {
  const cache = getAPICache();
  const cacheKey = 'crosswalk:legislators';

  const cached = cache.get<LegislatorEntry[]>(cacheKey);
  if (cached) return cached;

  if (legislatorsData) return legislatorsData;

  try {
    const response = await fetch(LEGISLATORS_URL, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch legislators: ${response.status}`);
    }

    legislatorsData = await response.json();
    cache.set(cacheKey, legislatorsData, CACHE_TTL.CROSSWALK);
    return legislatorsData!;
  } catch (error) {
    console.error('Failed to fetch legislator crosswalk:', error);
    return [];
  }
}

/**
 * Look up a member by Bioguide ID and get all their IDs
 */
export async function resolveMemberIds(bioguideId: string): Promise<MemberIds | null> {
  const cache = getAPICache();
  const cacheKey = `member-ids:${bioguideId}`;

  const cached = cache.get<MemberIds>(cacheKey);
  if (cached) return cached;

  const legislators = await getLegislators();
  const member = legislators.find(l => l.id.bioguide === bioguideId);

  if (!member) return null;

  const currentTerm = member.terms[member.terms.length - 1];

  const result: MemberIds = {
    bioguide: bioguideId,
    fecIds: member.id.fec || [],
    opensecrets: member.id.opensecrets || null,
    thomas: member.id.thomas || null,
    govtrack: member.id.govtrack || null,
    name: member.name.official_full || `${member.name.first} ${member.name.last}`,
    currentParty: currentTerm?.party || 'Unknown',
    currentState: currentTerm?.state || 'Unknown',
    currentChamber: currentTerm?.type === 'sen' ? 'Senate' : 'House',
  };

  cache.set(cacheKey, result, CACHE_TTL.CROSSWALK);
  return result;
}

/**
 * Batch resolve multiple members
 */
export async function resolveMemberIdsBatch(bioguideIds: string[]): Promise<Map<string, MemberIds>> {
  const results = new Map<string, MemberIds>();

  // Fetch the dataset once, then resolve all
  await getLegislators();

  const promises = bioguideIds.map(async (id) => {
    const resolved = await resolveMemberIds(id);
    if (resolved) results.set(id, resolved);
  });

  await Promise.all(promises);
  return results;
}
