import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = body.path || '/';
    const referrer = body.referrer || '';

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const country = request.headers.get('x-vercel-ip-country') || '';
    const region = request.headers.get('x-vercel-ip-country-region') || '';
    const city = decodeURIComponent(request.headers.get('x-vercel-ip-city') || '');

    await getPrisma().visit.create({
      data: { path, referrer, ip, country, region, city },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ ok: true }); // Don't break the page if tracking fails
  }
}
