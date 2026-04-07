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
          body: JSON.stringify({
            billId,
            includeDependencies: true,
            maxDepth: 2,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bill: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No bill specified</h1>
          <p className="text-gray-600 mb-6">Please provide a bill ID in the format: congress/type/number</p>
          <button onClick={() => router.push('/')} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Go Home</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-3 mt-6">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
            <p className="text-center text-gray-600 mt-6">Analyzing bill and fetching related documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { bill, aiContext, metadata } = data;
  const sponsors = bill.metadata?.sponsors || [];
  const cosponsors = aiContext?.metadata?.cosponsors || [];
  const amendments = aiContext?.dependencies?.filter((d: any) => d.type === 'amendment') || [];
  const relatedBills = aiContext?.dependencies?.filter((d: any) => d.type === 'bill') || [];
  const becameLaw = bill.metadata?.becameLaw;

  // Clean HTML from summary
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

          {/* Quick Stats */}
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

        {/* Sponsors */}
        {sponsors.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sponsor</h2>
            {sponsors.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-sm font-bold ${s.party === 'D' ? 'bg-blue-100 text-blue-800' : s.party === 'R' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                  {s.party}
                </span>
                <span className="font-semibold text-gray-900">{s.fullName}</span>
              </div>
            ))}

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
        )}

        {/* Summary */}
        {cleanSummary && cleanSummary !== 'No summary available. Check Congress.gov for full text.' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
            <div className="prose max-w-none text-gray-700 leading-relaxed">
              {cleanSummary.length > 1500
                ? cleanSummary.substring(0, 1500) + '...'
                : cleanSummary
              }
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
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  </div>
                  <p className="text-sm text-gray-700">{a.summary}</p>
                </div>
              ))}
              {amendments.filter((a: any) => a.summary && a.summary !== 'No description').length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  Showing 10 of {amendments.filter((a: any) => a.summary && a.summary !== 'No description').length} amendments with descriptions
                </p>
              )}
              {amendments.filter((a: any) => !a.summary || a.summary === 'No description').length > 0 && (
                <p className="text-sm text-gray-400 text-center">
                  + {amendments.filter((a: any) => !a.summary || a.summary === 'No description').length} amendments without descriptions
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
                <div key={i} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{rb.title}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs whitespace-nowrap ml-2">
                      {rb.relationship}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{rb.id}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {aiContext?.timeline?.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3">
              {aiContext.timeline.map((event: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="text-sm text-gray-500 w-28 flex-shrink-0">
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{event.event}</div>
                  </div>
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
