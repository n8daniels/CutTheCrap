/**
 * Load Inter OTFs for next/og ImageResponse.
 * Fetched once per week per deploy via Next's data cache. Degrades to the
 * default system font if jsDelivr is unreachable — OG image still renders.
 */

const INTER_BASE = 'https://cdn.jsdelivr.net/gh/rsms/inter@master/docs/font-files';

type InterFont = {
  name: 'Inter';
  data: ArrayBuffer;
  weight: 600 | 800;
  style: 'normal';
};

async function fetchFont(file: string): Promise<ArrayBuffer> {
  const res = await fetch(`${INTER_BASE}/${file}`, { next: { revalidate: 604800 } });
  if (!res.ok) throw new Error(`Font ${file} returned ${res.status}`);
  return res.arrayBuffer();
}

export async function loadInterFonts(): Promise<InterFont[]> {
  try {
    const [semiBold, extraBold] = await Promise.all([
      fetchFont('Inter-SemiBold.otf'),
      fetchFont('Inter-ExtraBold.otf'),
    ]);
    return [
      { name: 'Inter', data: semiBold, weight: 600, style: 'normal' },
      { name: 'Inter', data: extraBold, weight: 800, style: 'normal' },
    ];
  } catch {
    return [];
  }
}

export const INTER_STACK = 'Inter, system-ui, -apple-system, sans-serif';
