import type { Metadata } from 'next';
import { Suspense } from 'react';
import { normalizeBillId } from '@/lib/bill-id';
import { fetchBillMetadata } from '@/services/congress-api';
import BillsContent from './BillsContent';

interface PageProps {
  searchParams: { id?: string | string[] };
}

function displayBillId(canonicalId: string): string {
  const parts = canonicalId.split('/');
  if (parts.length !== 3) return canonicalId.toUpperCase();
  const typeMap: Record<string, string> = {
    hr: 'H.R.', s: 'S.', hjres: 'H.J.Res.', sjres: 'S.J.Res.',
    hconres: 'H.Con.Res.', sconres: 'S.Con.Res.', hres: 'H.Res.', sres: 'S.Res.',
  };
  const type = typeMap[parts[1]] ?? parts[1].toUpperCase();
  return `${type} ${parts[2]} (${parts[0]}th Congress)`;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const rawId = Array.isArray(searchParams.id) ? searchParams.id[0] : searchParams.id;
  if (!rawId) {
    return { title: 'No bill specified' };
  }

  const billId = normalizeBillId(rawId);
  if (!billId) {
    return {
      title: 'Bill not found',
      description: `"${rawId}" doesn't look like a bill ID. Try a format like "HR 3684" or "119/hr/3684".`,
      robots: { index: false, follow: true },
    };
  }

  const bill = await fetchBillMetadata(billId);
  if (!bill) {
    return {
      title: `Bill not found (${displayBillId(billId)})`,
      description: `We couldn't find ${displayBillId(billId)} on Congress.gov.`,
      robots: { index: false, follow: true },
    };
  }

  const displayId = displayBillId(billId);
  const tail = bill.summary
    ? bill.summary.length > 240
      ? `${bill.summary.slice(0, 240).trimEnd()}…`
      : bill.summary
    : bill.latestAction ?? 'Federal legislation details, sponsors, and money trail.';
  const description = `${displayId}: ${tail}`;
  const canonicalPath = `/bills?id=${billId}`;
  const ogImageUrl = `/api/og/bill?id=${encodeURIComponent(billId)}`;

  return {
    title: bill.title,
    description,
    openGraph: {
      type: 'article',
      url: canonicalPath,
      title: `${bill.title} — CutTheCrap`,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: bill.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: bill.title,
      description,
      images: [ogImageUrl],
    },
    alternates: { canonical: canonicalPath },
  };
}

export default function BillsPage() {
  return (
    <Suspense fallback={<div className="w-full px-4 py-12 text-center text-gray-500">Loading...</div>}>
      <BillsContent />
    </Suspense>
  );
}
