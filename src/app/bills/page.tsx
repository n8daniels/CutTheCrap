'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

export default function BillsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading...</div>}>
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

    const fetchBill = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/bills/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billId, includeDependencies: true, maxDepth: 2 }),
        });

        if (!response.ok) throw new Error(`Failed to fetch bill: ${response.statusText}`);
        setData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [billId]);

  if (!billId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">No bill specified</h1>
        <button onClick={() => router.push('/')} className="px-6 py-2 bg-primary-600 text-white rounded-lg">Go Home</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="space-y-3 mt-6">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
            </div>
          </div>
          <p className="text-center text-gray-600 mt-6">Analyzing bill, fetching connections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Go Home</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { bill, aiSummary, sponsorDonors, aiContext, metadata } = data;
  const sponsors = bill.metadata?.sponsors || [];
  const cosponsors = aiContext?.metadata?.cosponsors || [];
  const amendments = aiContext?.dependencies?.filter((d: any) => d.type === 'amendment') || [];
  const relatedBills = aiContext?.dependencies?.filter((d: any) => d.type === 'bill') || [];
  const timeline = aiContext?.timeline || [];
  const becameLaw = bill.metadata?.becameLaw;

  const cleanSummary = bill.content
    ? bill.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Bill Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{bill.title}</h1>
              <p className="text-gray-500">Bill ID: {bill.id}</p>
            </div>
            {becameLaw ? (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold whitespace-nowrap">
                Became {becameLaw.type} {becameLaw.number}
              </span>
            ) : (
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold whitespace-nowrap">
                {bill.metadata?.chamber || 'Congress'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Introduced</div>
              <div className="text-lg font-bold text-gray-900">{bill.metadata?.introduced || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Policy Area</div>
              <div className="text-lg font-bold text-gray-900">{bill.metadata?.policyArea || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Amendments</div>
              <div className="text-lg font-bold text-primary-600">{aiContext?.metadata?.amendmentCount || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Related Bills</div>
              <div className="text-lg font-bold text-primary-600">{aiContext?.metadata?.relatedBillCount || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Cosponsors</div>
              <div className="text-lg font-bold text-primary-600">{aiContext?.metadata?.cosponsorCount || 0}</div>
            </div>
          </div>
        </div>

        {/* AI Summary (2026+ bills only) */}
        {aiSummary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-6 border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What This Bill Does</h2>
            <p className="text-gray-800 text-lg leading-relaxed mb-4">{aiSummary.summary}</p>

            {(aiSummary.supportersView || aiSummary.opponentsView) && (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {aiSummary.supportersView && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="font-bold text-blue-800 mb-2">Supporters say:</div>
                    <p className="text-gray-700 text-sm">{aiSummary.supportersView}</p>
                  </div>
                )}
                {aiSummary.opponentsView && (
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="font-bold text-red-800 mb-2">Opponents say:</div>
                    <p className="text-gray-700 text-sm">{aiSummary.opponentsView}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-500">{aiSummary.disclaimer}</p>
              <p className="text-xs text-gray-400 mt-1">
                Generated by {aiSummary.model} on {new Date(aiSummary.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Sponsors + Follow the Money */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sponsor</h2>
          {sponsors.map((s: any, i: number) => {
            const donorData = sponsorDonors?.find((sd: any) => sd.sponsor?.bioguideId === s.bioguideId);
            return (
              <div key={i} className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded text-sm font-bold ${s.party === 'D' ? 'bg-blue-100 text-blue-800' : s.party === 'R' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {s.party}
                  </span>
                  <span className="font-semibold text-gray-900">{s.fullName}</span>
                </div>

                {/* Donor data for this sponsor */}
                {donorData?.donorProfile?.financials && (
                  <div className="ml-8 mt-2 bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-bold text-gray-700 mb-2">Campaign Financials</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs text-gray-500">Total Raised</div>
                        <div className="font-bold text-green-700">
                          ${(donorData.donorProfile.financials.totalReceipts / 1000000).toFixed(1)}M
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Individual Contributions</div>
                        <div className="font-bold text-gray-900">
                          ${(donorData.donorProfile.financials.individualContributions / 1000000).toFixed(1)}M
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">PAC Contributions</div>
                        <div className="font-bold text-gray-900">
                          ${(donorData.donorProfile.financials.pacContributions / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Cash on Hand</div>
                        <div className="font-bold text-gray-900">
                          ${(donorData.donorProfile.financials.cashOnHand / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>

                    {/* Top Donors */}
                    {donorData.donorProfile.topDonors?.employers?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-bold text-gray-700 mb-2">Top Donors (by employer)</div>
                        <div className="space-y-1">
                          {donorData.donorProfile.topDonors.employers.slice(0, 5).map((d: any, j: number) => (
                            <div key={j} className="flex justify-between text-sm">
                              <span className="text-gray-700">{d.employer}</span>
                              <span className="font-medium text-gray-900">${d.total.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Independent Expenditures (Super PAC) */}
                    {donorData.donorProfile.independentExpenditures?.expenditures?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-bold text-gray-700 mb-2">Super PAC Spending</div>
                        <div className="space-y-1">
                          {donorData.donorProfile.independentExpenditures.expenditures.slice(0, 3).map((e: any, j: number) => (
                            <div key={j} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {e.committee}
                                <span className={`ml-2 text-xs ${e.supportOppose === 'Support' ? 'text-green-600' : 'text-red-600'}`}>
                                  ({e.supportOppose})
                                </span>
                              </span>
                              <span className="font-medium text-gray-900">${e.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">Source: Federal Election Commission (FEC)</p>
                  </div>
                )}
              </div>
            );
          })}

          {cosponsors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-bold text-gray-700 mb-3">Cosponsors ({cosponsors.length})</h3>
              <div className="flex flex-wrap gap-2">
                {cosponsors.map((c: any, i: number) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-sm ${c.party === 'D' ? 'bg-blue-50 text-blue-700' : c.party === 'R' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                    {c.fullName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CRS Summary */}
        {cleanSummary && cleanSummary !== 'No summary available. Check Congress.gov for full text.' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Congressional Research Service Summary</h2>
            <div className="prose max-w-none text-gray-700 leading-relaxed">
              {cleanSummary.length > 1500 ? cleanSummary.substring(0, 1500) + '...' : cleanSummary}
            </div>
          </div>
        )}

        {/* Amendments */}
        {amendments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Amendments ({amendments.length} of {aiContext?.metadata?.amendmentCount || amendments.length})
            </h2>
            <div className="space-y-3">
              {amendments
                .filter((a: any) => a.summary && a.summary !== 'No description')
                .slice(0, 10)
                .map((a: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{a.summary}</p>
                  </div>
                ))}
              {amendments.filter((a: any) => a.summary && a.summary !== 'No description').length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  Showing 10 of {amendments.filter((a: any) => a.summary && a.summary !== 'No description').length} amendments with descriptions
                </p>
              )}
            </div>
          </div>
        )}

        {/* Related Bills */}
        {relatedBills.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Related Bills ({relatedBills.length} of {aiContext?.metadata?.relatedBillCount || relatedBills.length})
            </h2>
            <div className="space-y-3">
              {relatedBills.map((rb: any, i: number) => (
                <a key={i} href={`/bills?id=${rb.id}`} className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{rb.title}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs whitespace-nowrap ml-2">{rb.relationship}</span>
                  </div>
                  <p className="text-sm text-gray-500">{rb.id}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Full Timeline */}
        {timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Legislative Timeline ({timeline.length} actions)</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timeline.map((event: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4 py-2 border-b border-gray-100 last:border-0">
                  <div className="text-sm text-gray-500 w-24 flex-shrink-0">
                    {event.date ? new Date(event.date).toLocaleDateString() : ''}
                  </div>
                  {event.chamber && (
                    <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${event.chamber === 'House' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {event.chamber}
                    </span>
                  )}
                  <div className="flex-1 text-sm text-gray-700">{event.event}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer stats */}
        <div className="text-center text-sm text-gray-400 mt-8">
          Fetched in {metadata?.fetchTimeMs}ms | {metadata?.documentsIncluded} documents analyzed
        </div>
      </div>
    </div>
  );
}
