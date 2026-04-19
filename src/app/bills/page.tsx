'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { WhatThisBillDoes, LeftRightImpact } from '@/components/bill/AISummaryCard';
import SponsorFinancials from '@/components/bill/SponsorFinancials';
import VoteHemicycle from '@/components/bill/VoteHemicycle';
import Regulations from '@/components/bill/Regulations';
import Spending from '@/components/bill/Spending';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function BillsPage() {
  return (
    <Suspense fallback={<div className="w-full px-4 py-12 text-center text-gray-500">Loading...</div>}>
      <BillsContent />
    </Suspense>
  );
}

function BillsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const billId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!billId) return;
    setLoading(true);
    setError(null);

    fetch('/api/bills/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billId, includeDependencies: true, maxDepth: 2 }),
    })
      .then(r => { if (!r.ok) throw new Error(`Failed: ${r.statusText}`); return r.json(); })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [billId]);

  if (!billId) {
    return (
      <div className="w-full px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">No bill specified</h1>
        <button onClick={() => router.push('/')} className="px-6 py-3 bg-primary-600 text-white rounded-lg text-lg">Search Bills</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-10">
            <div className="animate-pulse space-y-5">
              <div className="h-10 bg-gray-200 rounded-lg w-3/4" />
              <div className="h-5 bg-gray-200 rounded w-1/2" />
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="h-20 bg-gray-200 rounded-lg" />
                <div className="h-20 bg-gray-200 rounded-lg" />
                <div className="h-20 bg-gray-200 rounded-lg" />
              </div>
              <div className="space-y-3 mt-6">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
            <p className="text-center text-gray-500 mt-8 text-lg">Analyzing bill and connecting the dots...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-20">
        <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-3">Something went wrong</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-red-600 text-white rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { bill, aiSummary, sponsorDonors, aiContext, metadata } = data;
  const amendments = aiContext?.dependencies?.filter((d: any) => d.type === 'amendment') || [];
  const relatedBills = aiContext?.dependencies?.filter((d: any) => d.type === 'bill') || [];
  const timeline = aiContext?.timeline || [];
  const cosponsors = aiContext?.metadata?.cosponsors || [];
  const becameLaw = bill.metadata?.becameLaw;

  const cleanSummary = bill.content
    ? bill.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : null;

  // Mock vote data for hemicycle demo (will be replaced with real data)
  const mockVotes = generateMockVotes();

  return (
    <div className="w-full">

      {/* Hero Header — Full Width */}
      <div className={`w-full ${becameLaw ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-primary-600 to-primary-700'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{bill.title}</h1>
              <p className="text-white/80 mt-2 text-lg" title={`${bill.id.split('/')[0]}th Congress / ${bill.id.split('/')[1].toUpperCase() === 'HR' ? 'House Bill' : bill.id.split('/')[1].toUpperCase() === 'S' ? 'Senate Bill' : bill.id.split('/')[1].toUpperCase()} / Number ${bill.id.split('/')[2]}`}>
                {formatBillId(bill.id)}
              </p>
            </div>
            {becameLaw && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 flex-shrink-0">
                <div className="text-sm text-white/80">Became Law</div>
                <div className="text-xl font-bold">{becameLaw.type} {becameLaw.number}</div>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-white/20">
            <div>
              <div className="text-sm text-white/70">Introduced</div>
              <div className="text-xl font-bold">{bill.metadata?.introduced || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Policy Area</div>
              <div className="text-xl font-bold">{bill.metadata?.policyArea || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Amendments</div>
              <div className="text-xl font-bold">{aiContext?.metadata?.amendmentCount || 0}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Related Bills</div>
              <div className="text-xl font-bold">{aiContext?.metadata?.relatedBillCount || 0}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Cosponsors</div>
              <div className="text-xl font-bold">{aiContext?.metadata?.cosponsorCount || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content — Wide container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* === READING SECTION === */}

        {/* 1. What this bill does */}
        {aiSummary && (
          <section>
            <WhatThisBillDoes summary={aiSummary.summary} />
          </section>
        )}

        {/* 2. CRS Summary */}
        {cleanSummary && cleanSummary !== 'No summary available. Check Congress.gov for full text.' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Congressional Research Service Summary</h2>
            <p className="text-gray-700 leading-relaxed">
              {cleanSummary.length > 2000 ? cleanSummary.substring(0, 2000) + '...' : cleanSummary}
            </p>
          </section>
        )}

        {/* 3. Left vs Right impact */}
        {aiSummary && (
          <section>
            <LeftRightImpact
              supportersView={aiSummary.supportersView}
              opponentsView={aiSummary.opponentsView}
              model={aiSummary.model}
              generatedAt={aiSummary.generatedAt}
              disclaimer={aiSummary.disclaimer}
            />
          </section>
        )}

        {/* === VOTING === */}

        {/* 4. How Congress Voted */}
        <ErrorBoundary sectionName="Vote visualization">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How Congress Voted</h2>
            <p className="text-sm text-gray-500 mb-6">Vote data shown is representative &mdash; full roll call integration coming soon</p>
            <div className="grid lg:grid-cols-2 gap-8">
              <VoteHemicycle title="House" members={mockVotes.house} totalSeats={435} />
              <VoteHemicycle title="Senate" members={mockVotes.senate} totalSeats={100} />
            </div>
          </section>
        </ErrorBoundary>

        {/* === MONEY SECTION === */}

        {/* 5. Where the money goes (federal spending tied to bill) */}
        <ErrorBoundary sectionName="spending data">
          <Spending billId={bill.id} billTitle={bill.title} />
        </ErrorBoundary>

        {/* 6. Follow the money (donor data) */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Follow the Money</h2>
          {sponsorDonors && sponsorDonors.some((sd: any) => sd.donorProfile) ? (
            <SponsorFinancials
              sponsorDonors={sponsorDonors}
              cosponsors={cosponsors}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <p className="text-gray-500 mb-1">
                Donor data unavailable for this bill&rsquo;s sponsor.
              </p>
              <p className="text-sm text-gray-400">
                FEC campaign finance data could not be loaded. This can happen when a sponsor has no active campaign committee or when the FEC API is temporarily unavailable.
              </p>
            </div>
          )}
        </section>

        {/* === CONTEXT SECTION === */}

        {/* 7. Amendments + Related Bills (two-column) */}
        <div className="grid lg:grid-cols-2 gap-8">
          {amendments.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Amendments <span className="text-gray-400 font-normal text-base">({aiContext?.metadata?.amendmentCount || amendments.length})</span>
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {amendments
                  .filter((a: any) => a.summary && a.summary !== 'No description')
                  .slice(0, 15)
                  .map((a: any, i: number) => (
                    <div key={i} className="border-l-4 border-orange-300 pl-4 py-2">
                      <div className="font-semibold text-gray-900 text-sm">{a.title}</div>
                      <p className="text-sm text-gray-600 mt-1">{a.summary}</p>
                    </div>
                  ))}
              </div>
              {amendments.filter((a: any) => !a.summary || a.summary === 'No description').length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  + {amendments.filter((a: any) => !a.summary || a.summary === 'No description').length} amendments without descriptions
                </p>
              )}
            </section>
          )}

          {relatedBills.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Related Bills <span className="text-gray-400 font-normal text-base">({aiContext?.metadata?.relatedBillCount || relatedBills.length})</span>
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {relatedBills.map((rb: any, i: number) => (
                  <a key={i} href={`/bills?id=${rb.id}`} className="block border-l-4 border-primary-300 pl-4 py-2 hover:bg-gray-50 transition-colors rounded-r">
                    <div className="font-semibold text-gray-900 text-sm">{rb.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{rb.id}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{rb.relationship}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 8. Timeline */}
        {timeline.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Legislative Timeline <span className="text-gray-400 font-normal text-base">({timeline.length} actions)</span>
            </h2>
            <div className="relative max-h-[500px] overflow-y-auto pr-2">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4 pl-10">
                {timeline.map((event: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[26px] w-3 h-3 rounded-full border-2 border-white ${
                      event.event?.includes('Signed') || event.event?.includes('Became') ? 'bg-green-500' :
                      event.event?.includes('Passed') || event.event?.includes('Agreed') ? 'bg-blue-500' :
                      event.event?.includes('Vetoed') || event.event?.includes('Failed') ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                      <div className="text-sm text-gray-500 w-24 flex-shrink-0">
                        {event.date ? new Date(event.date).toLocaleDateString() : ''}
                      </div>
                      <div className="flex-1">
                        {event.chamber && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${
                            event.chamber === 'House' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {event.chamber}
                          </span>
                        )}
                        <span className="text-sm text-gray-700">{event.event}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 9. Federal Register / Regulations */}
        <ErrorBoundary sectionName="Federal Register data">
          <Regulations billId={bill.id} billTitle={bill.title} />
        </ErrorBoundary>

        {/* Footer Stats */}
        <div className="text-center text-sm text-gray-400 py-4">
          Analyzed in {metadata?.fetchTimeMs}ms | {metadata?.documentsIncluded} documents connected |
          Data from Congress.gov, FEC, Federal Register, USASpending.gov
        </div>
      </div>
    </div>
  );
}

/**
 * Generate mock vote data for hemicycle demo
 * Will be replaced with real Congress.gov roll call data
 */
function formatBillId(id: string): string {
  const parts = id.split('/');
  if (parts.length !== 3) return id.toUpperCase();
  const congress = parts[0];
  const typeMap: Record<string, string> = {
    hr: 'H.R.', s: 'S.', hjres: 'H.J.Res.', sjres: 'S.J.Res.',
    hconres: 'H.Con.Res.', sconres: 'S.Con.Res.', hres: 'H.Res.', sres: 'S.Res.',
  };
  const type = typeMap[parts[1]] || parts[1].toUpperCase();
  return `${congress}th Congress — ${type} ${parts[2]}`;
}

function generateMockVotes() {
  const house: Array<{ name: string; party: string; state: string; vote: 'Yea' | 'Nay' | 'Not Voting' }> = [];
  const senate: Array<{ name: string; party: string; state: string; vote: 'Yea' | 'Nay' | 'Not Voting' }> = [];

  // House: 220R, 215D
  for (let i = 0; i < 220; i++) {
    house.push({
      name: `Rep. Republican ${i + 1}`,
      party: 'R',
      state: 'US',
      vote: Math.random() > 0.15 ? 'Yea' : Math.random() > 0.5 ? 'Nay' : 'Not Voting',
    });
  }
  for (let i = 0; i < 215; i++) {
    house.push({
      name: `Rep. Democrat ${i + 1}`,
      party: 'D',
      state: 'US',
      vote: Math.random() > 0.6 ? 'Nay' : Math.random() > 0.3 ? 'Yea' : 'Not Voting',
    });
  }

  // Senate: 53R, 47D
  for (let i = 0; i < 53; i++) {
    senate.push({
      name: `Sen. Republican ${i + 1}`,
      party: 'R',
      state: 'US',
      vote: Math.random() > 0.1 ? 'Yea' : 'Nay',
    });
  }
  for (let i = 0; i < 47; i++) {
    senate.push({
      name: `Sen. Democrat ${i + 1}`,
      party: 'D',
      state: 'US',
      vote: Math.random() > 0.5 ? 'Nay' : Math.random() > 0.3 ? 'Yea' : 'Not Voting',
    });
  }

  return { house, senate };
}
