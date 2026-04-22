'use client';

import Link from 'next/link';

interface NewsItem {
  headline: string;
  billId: string;
  billTitle: string;
  summary: string;
  tag: string;
}

const TAG_COLORS: Record<string, string> = {
  Privacy: 'bg-purple-100 text-purple-700',
  Tech: 'bg-sky-100 text-sky-700',
  Economy: 'bg-amber-100 text-amber-700',
  Defense: 'bg-red-100 text-red-700',
  Immigration: 'bg-emerald-100 text-emerald-700',
  Healthcare: 'bg-pink-100 text-pink-700',
};

const CURATED_ITEMS: NewsItem[] = [
  {
    headline: 'FISA Section 702 Surveillance Reauthorization',
    billId: '118/hr/7888',
    billTitle: 'Reforming Intelligence and Securing America Act',
    summary:
      'Extends the government\'s authority to collect foreign intelligence, but critics say it sweeps up Americans\' data too.',
    tag: 'Privacy',
  },
  {
    headline: 'TikTok Ban',
    billId: '118/hr/7521',
    billTitle: 'Protecting Americans from Foreign Adversary Controlled Applications Act',
    summary:
      'Forces ByteDance to sell TikTok or face a ban in the US.',
    tag: 'Tech',
  },
  {
    headline: 'Big Beautiful Bill (Reconciliation)',
    billId: '119/hr/1',
    billTitle: 'One Big Beautiful Bill Act',
    summary:
      'Massive reconciliation bill covering taxes, spending, and the debt limit.',
    tag: 'Economy',
  },
  {
    headline: 'NDAA 2026',
    billId: '119/s/2296',
    billTitle: 'National Defense Authorization Act for Fiscal Year 2026',
    summary:
      'Annual defense spending bill setting military budget and policy priorities.',
    tag: 'Defense',
  },
  {
    headline: 'Border Security',
    billId: '118/hr/2',
    billTitle: 'Secure the Border Act of 2023',
    summary:
      'Overhauls border enforcement, asylum processing, and immigration courts.',
    tag: 'Immigration',
  },
  {
    headline: 'CHIPS Act Implementation',
    billId: '117/hr/4346',
    billTitle: 'CHIPS and Science Act',
    summary:
      'Invests $52 billion in domestic semiconductor manufacturing.',
    tag: 'Tech',
  },
];

export const CURATED_BILL_IDS: readonly string[] = CURATED_ITEMS.map((item) => item.billId);

function TagPill({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-700';
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors}`}
    >
      {tag}
    </span>
  );
}

export default function WhatsHot() {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">In the News</h2>
        <p className="text-sm text-gray-500 mt-1">
          Bills people are talking about right now
        </p>
      </div>

      {/* Desktop: grid, Mobile: horizontal scroll */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CURATED_ITEMS.map((item) => (
          <Card key={item.billId} item={item} />
        ))}
      </div>

      <div className="flex md:hidden gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory">
        {CURATED_ITEMS.map((item) => (
          <div key={item.billId} className="min-w-[280px] snap-start">
            <Card item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Card({ item }: { item: NewsItem }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col h-full">
      <TagPill tag={item.tag} />
      <h3 className="text-base font-bold text-gray-900 mt-3 leading-snug">
        {item.headline}
      </h3>
      <p className="text-sm text-gray-600 mt-2 flex-1">{item.summary}</p>
      <Link
        href={`/bills?id=${item.billId}`}
        className="text-sm font-medium text-primary-600 hover:text-primary-700 mt-4 inline-block"
      >
        See the full picture &rarr;
      </Link>
    </div>
  );
}
