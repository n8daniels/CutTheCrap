import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { normalizeBillId } from '@/lib/bill-id';
import { fetchBillMetadata } from '@/services/congress-api';
import { INTER_STACK, loadInterFonts } from '@/lib/og-fonts';

const SIZE = { width: 1200, height: 630 };

function displayBillId(canonicalId: string): string {
  const parts = canonicalId.split('/');
  if (parts.length !== 3) return canonicalId.toUpperCase();
  const typeMap: Record<string, string> = {
    hr: 'H.R.', s: 'S.', hjres: 'H.J.Res.', sjres: 'S.J.Res.',
    hconres: 'H.Con.Res.', sconres: 'S.Con.Res.', hres: 'H.Res.', sres: 'S.Res.',
  };
  const type = typeMap[parts[1]] ?? parts[1].toUpperCase();
  return `${type} ${parts[2]} · ${parts[0]}th Congress`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

export async function GET(req: NextRequest) {
  const rawId = new URL(req.url).searchParams.get('id') ?? '';
  const billId = normalizeBillId(rawId);
  const [bill, fonts] = await Promise.all([
    billId ? fetchBillMetadata(billId) : Promise.resolve(null),
    loadInterFonts(),
  ]);

  const title = bill?.title ?? (billId ? 'Bill not found on Congress.gov' : 'CutTheCrap');
  const subline = billId ? displayBillId(billId) : 'Federal Legislation, Connected';
  const policyArea = bill?.policyArea ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: 'white',
          padding: 72,
          fontFamily: INTER_STACK,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
            CutTheCrap
          </div>
          {policyArea && (
            <div
              style={{
                display: 'flex',
                padding: '10px 22px',
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {truncate(policyArea, 40)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 18, fontWeight: 600 }}>
            {subline}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            {truncate(title, 180)}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, opacity: 0.85 }}>
          <div>See what this bill does →</div>
          <div>Non-partisan · Public data</div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}
