import { NextRequest, NextResponse } from 'next/server';
import { addVisit } from '../store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = body.path || '/';
    const referrer = body.referrer || '';

    // Try to get IP from various headers
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Vercel geo headers (available on Vercel deployments)
    const country = request.headers.get('x-vercel-ip-country') || '';
    const region = request.headers.get('x-vercel-ip-country-region') || '';
    const city = request.headers.get('x-vercel-ip-city') || '';

    addVisit({
      path,
      timestamp: new Date().toISOString(),
      referrer,
      ip,
      country,
      region,
      city,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
