import { NextResponse } from 'next/server';
import { getVisits } from '../store';

export async function GET() {
  const visits = getVisits();

  const totalVisits = visits.length;

  // Visits by page
  const byPage: Record<string, number> = {};
  for (const v of visits) {
    byPage[v.path] = (byPage[v.path] || 0) + 1;
  }

  // Visits by day
  const byDay: Record<string, number> = {};
  for (const v of visits) {
    const day = v.timestamp.slice(0, 10); // YYYY-MM-DD
    byDay[day] = (byDay[day] || 0) + 1;
  }

  // Visits by referrer
  const byReferrer: Record<string, number> = {};
  for (const v of visits) {
    const ref = v.referrer || '(direct)';
    byReferrer[ref] = (byReferrer[ref] || 0) + 1;
  }

  // Visits by country
  const byCountry: Record<string, number> = {};
  for (const v of visits) {
    const c = v.country || '(unknown)';
    byCountry[c] = (byCountry[c] || 0) + 1;
  }

  // Visits by region
  const byRegion: Record<string, number> = {};
  for (const v of visits) {
    const r = v.region ? `${v.country}/${v.region}` : '(unknown)';
    byRegion[r] = (byRegion[r] || 0) + 1;
  }

  // Visits by city
  const byCity: Record<string, number> = {};
  for (const v of visits) {
    const c = v.city || '(unknown)';
    byCity[c] = (byCity[c] || 0) + 1;
  }

  // Unique pages
  const uniquePages = Object.keys(byPage).length;

  return NextResponse.json({
    totalVisits,
    uniquePages,
    byPage,
    byDay,
    byReferrer,
    byCountry,
    byRegion,
    byCity,
  });
}
