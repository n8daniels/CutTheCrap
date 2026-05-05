import { ImageResponse } from 'next/og';
import { INTER_STACK, loadInterFonts } from '@/lib/og-fonts';

export const alt = 'CutTheCrap — Federal Legislation, Connected';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const fonts = await loadInterFonts();
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
          padding: 80,
          fontFamily: INTER_STACK,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
            CutTheCrap
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.03, letterSpacing: '-0.03em' }}>
            See what Congress
          </div>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.03, letterSpacing: '-0.03em' }}>
            is actually doing
          </div>
          <div style={{ fontSize: 32, marginTop: 28, opacity: 0.92, fontWeight: 500, lineHeight: 1.3 }}>
            Search any federal bill. See what it changes, who sponsored it,
          </div>
          <div style={{ fontSize: 32, opacity: 0.92, fontWeight: 500, lineHeight: 1.3 }}>
            and how it connects to everything else.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, opacity: 0.85 }}>
          <div>Free · Non-partisan · 100% public data</div>
          <div style={{ fontWeight: 600 }}>cutthecrap</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
