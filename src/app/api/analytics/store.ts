// Shared in-memory analytics store
// Uses globalThis to persist across module boundaries in Next.js dev/prod

export interface Visit {
  path: string;
  timestamp: string;
  referrer: string;
  ip: string;
  country: string;
  region: string;
  city: string;
}

const MAX_ENTRIES = 10000;

const globalStore = globalThis as unknown as { __analyticsVisits?: Visit[] };
if (!globalStore.__analyticsVisits) {
  globalStore.__analyticsVisits = [];
}

export function addVisit(visit: Visit) {
  globalStore.__analyticsVisits!.push(visit);
  if (globalStore.__analyticsVisits!.length > MAX_ENTRIES) {
    globalStore.__analyticsVisits!.splice(0, globalStore.__analyticsVisits!.length - MAX_ENTRIES);
  }
}

export function getVisits(): Visit[] {
  return globalStore.__analyticsVisits!;
}
