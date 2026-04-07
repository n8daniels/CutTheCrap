/**
 * Direct Congress.gov API client for Vercel deployment
 * Bypasses MCP server (which requires spawning Python process)
 * Uses the same free Congress.gov API
 */

import { config } from '@/lib/config';

const BASE_URL = 'https://api.congress.gov/v3';

interface CongressBill {
  bill: {
    number: string;
    title: string;
    type: string;
    congress: number;
    originChamber: string;
    introducedDate: string;
    policyArea?: { name: string };
    latestAction?: { actionDate: string; text: string };
    sponsors?: Array<{ fullName: string; party: string; state: string; bioguideId: string }>;
    cosponsors?: { count: number; url: string };
    amendments?: { count: number; url: string };
    relatedBills?: { count: number; url: string };
    summaries?: { count: number; url: string };
    textVersions?: { count: number; url: string };
    laws?: Array<{ type: string; number: string }>;
    committees?: { url: string };
    subjects?: { url: string };
  };
}

interface CongressSummary {
  summaries: Array<{
    text: string;
    actionDate: string;
    actionDesc: string;
    versionCode: string;
  }>;
}

interface CongressTextVersions {
  textVersions: Array<{
    date: string;
    type: string;
    url: string;
    formats: Array<{ type: string; url: string }>;
  }>;
}

interface CongressAmendments {
  amendments: Array<{
    number: string;
    type: string;
    congress: number;
    description?: string;
    latestAction?: { actionDate: string; text: string };
    purpose?: string;
  }>;
}

interface CongressRelatedBills {
  relatedBills: Array<{
    number: number;
    type: string;
    congress: number;
    title: string;
    latestAction?: { actionDate: string; text: string };
    relationshipDetails: Array<{ type: string; identifiedBy: string }>;
  }>;
}

interface CongressCosponsors {
  cosponsors: Array<{
    fullName: string;
    party: string;
    state: string;
    bioguideId: string;
    sponsorshipDate: string;
  }>;
}

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
 * Search bills by keyword
 */
export async function searchBills(query: string, options?: {
  congress?: number;
  limit?: number;
  offset?: number;
}) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  let path = `/bill?limit=${limit}&offset=${offset}`;

  if (query) {
    path += `&query=${encodeURIComponent(query)}`;
  }
  // Default to current congress for more relevant results
  const congress = options?.congress || 119;
  path = `/bill/${congress}?limit=${limit}&offset=${offset}`;
  if (query) path += `&query=${encodeURIComponent(query)}`;

  const data = await fetchJSON<{ bills: CongressBillListItem[]; pagination: { count: number } }>(path);

  return {
    bills: (data.bills || []).map(b => ({
      id: `${b.congress}/${b.type.toLowerCase()}/${b.number}`,
      title: b.title,
      congress: b.congress,
      type: b.type,
      number: b.number,
      introducedDate: b.latestAction?.actionDate || '',
      latestAction: b.latestAction?.text || '',
      policyArea: b.policyArea?.name || null,
      url: b.url,
    })),
    totalCount: data.pagination?.count || 0,
  };
}

/**
 * Fetch recently introduced or active bills
 */
export async function fetchRecentBills(options?: {
  congress?: number;
  limit?: number;
  sort?: string;
}) {
  const congress = options?.congress || 119;
  const limit = options?.limit || 10;
  const path = `/bill/${congress}?limit=${limit}&sort=updateDate+desc`;

  const data = await fetchJSON<{ bills: CongressBillListItem[] }>(path);

  return (data.bills || []).map(b => ({
    id: `${b.congress}/${b.type.toLowerCase()}/${b.number}`,
    title: b.title,
    congress: b.congress,
    type: b.type,
    number: b.number,
    introducedDate: b.latestAction?.actionDate || '',
    latestAction: b.latestAction?.text || '',
    policyArea: b.policyArea?.name || null,
  }));
}

interface CongressBillListItem {
  congress: number;
  type: string;
  number: number;
  title: string;
  url: string;
  latestAction?: { actionDate: string; text: string };
  policyArea?: { name: string };
}

/**
 * Parse a bill ID like "117/hr/3684" into components
 */
function parseBillId(billId: string): { congress: string; type: string; number: string } {
  const [congress, type, number] = billId.split('/');
  return { congress, type, number };
}

/**
 * Fetch complete bill data with all available context
 */
export async function fetchBillComplete(billId: string) {
  const { congress, type, number } = parseBillId(billId);
  const basePath = `/bill/${congress}/${type}/${number}`;

  // Fetch bill details and summaries in parallel
  const [billData, summaryData] = await Promise.all([
    fetchJSON<CongressBill>(basePath),
    fetchJSON<CongressSummary>(`${basePath}/summaries`).catch(() => ({ summaries: [] })),
  ]);

  const bill = billData.bill;

  // Fetch additional data in parallel
  const [amendments, relatedBills, cosponsors] = await Promise.all([
    bill.amendments && bill.amendments.count > 0
      ? fetchJSON<CongressAmendments>(`${basePath}/amendments?limit=20`).catch(() => ({ amendments: [] }))
      : Promise.resolve({ amendments: [] }),
    bill.relatedBills && bill.relatedBills.count > 0
      ? fetchJSON<CongressRelatedBills>(`${basePath}/relatedbills?limit=20`).catch(() => ({ relatedBills: [] }))
      : Promise.resolve({ relatedBills: [] }),
    bill.cosponsors && bill.cosponsors.count > 0
      ? fetchJSON<CongressCosponsors>(`${basePath}/cosponsors?limit=50`).catch(() => ({ cosponsors: [] }))
      : Promise.resolve({ cosponsors: [] }),
  ]);

  // Get the most recent summary
  const latestSummary = summaryData.summaries?.length > 0
    ? summaryData.summaries[summaryData.summaries.length - 1]
    : null;

  return {
    bill: {
      id: billId,
      title: bill.title,
      type: bill.type,
      congress: bill.congress,
      number: bill.number,
      originChamber: bill.originChamber,
      introducedDate: bill.introducedDate,
      policyArea: bill.policyArea?.name || 'Unknown',
      status: bill.latestAction?.text || 'Unknown',
      statusDate: bill.latestAction?.actionDate || '',
      sponsors: bill.sponsors || [],
      becameLaw: bill.laws && bill.laws.length > 0 ? bill.laws[0] : null,
    },
    summary: latestSummary ? latestSummary.text : null,
    cosponsors: cosponsors.cosponsors || [],
    amendments: (amendments.amendments || []).map(a => ({
      number: a.number,
      type: a.type,
      purpose: a.purpose || a.description || 'No description',
      status: a.latestAction?.text || 'Unknown',
    })),
    relatedBills: (relatedBills.relatedBills || []).map(rb => ({
      id: `${rb.congress}/${rb.type.toLowerCase()}/${rb.number}`,
      title: rb.title,
      relationship: rb.relationshipDetails?.map(r => r.type).join(', ') || 'Related',
      status: rb.latestAction?.text || 'Unknown',
    })),
    metadata: {
      amendmentCount: bill.amendments?.count || 0,
      relatedBillCount: bill.relatedBills?.count || 0,
      cosponsorCount: bill.cosponsors?.count || 0,
      summaryCount: bill.summaries?.count || 0,
      textVersionCount: bill.textVersions?.count || 0,
    },
  };
}
