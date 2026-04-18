import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const visits = await getPrisma().visit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const totalVisits = visits.length;

    const byPage: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const byReferrer: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byCity: Record<string, number> = {};

    for (const v of visits) {
      byPage[v.path] = (byPage[v.path] || 0) + 1;

      const day = v.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;

      const ref = v.referrer || '(direct)';
      byReferrer[ref] = (byReferrer[ref] || 0) + 1;

      const country = v.country || '(unknown)';
      byCountry[country] = (byCountry[country] || 0) + 1;

      const region = v.region ? `${v.country}/${v.region}` : '(unknown)';
      byRegion[region] = (byRegion[region] || 0) + 1;

      const city = v.city || '(unknown)';
      byCity[city] = (byCity[city] || 0) + 1;
    }

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
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
