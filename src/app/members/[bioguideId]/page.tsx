'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BillCard from '@/components/BillCard';

export default function MemberPage() {
  const params = useParams();
  const router = useRouter();
  const bioguideId = params.bioguideId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bioguideId) return;

    fetch(`/api/members/${bioguideId}`)
      .then(r => { if (!r.ok) throw new Error('Member not found'); return r.json(); })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [bioguideId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full" />
            <div className="space-y-3 flex-1">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.member) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'Could not find this member of Congress.'}</p>
        <button onClick={() => router.push('/')} className="px-6 py-2 bg-primary-600 text-white rounded-lg">Go Home</button>
      </div>
    );
  }

  const { member, donorProfile, sponsoredBills, ids } = data;
  const fin = donorProfile?.financials;
  const donors = donorProfile?.topDonors?.employers || [];
  const individuals = donorProfile?.individualDonors?.donors || [];
  const ie = donorProfile?.independentExpenditures?.expenditures || [];
  const partyColor = member.party === 'Democrat' || member.party === 'D' ? 'blue' : member.party === 'Republican' || member.party === 'R' ? 'red' : 'gray';

  function formatMoney(amount: number): string {
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`w-full bg-gradient-to-r ${partyColor === 'blue' ? 'from-blue-600 to-blue-700' : partyColor === 'red' ? 'from-red-600 to-red-700' : 'from-gray-600 to-gray-700'} text-white`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            {member.imageUrl && (
              <img
                src={member.imageUrl}
                alt={member.name}
                className="w-24 h-24 rounded-full border-4 border-white/30 object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{member.name}</h1>
              <p className="text-white/80 text-lg">
                {member.party} — {member.state} {member.district ? `District ${member.district}` : ''} — {member.chamber}
              </p>
              {member.birthYear && (
                <p className="text-white/60 text-sm">Born {member.birthYear}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div>
              <div className="text-sm text-white/70">Bills Sponsored</div>
              <div className="text-xl font-bold">{member.sponsoredLegislation || 0}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Bills Cosponsored</div>
              <div className="text-xl font-bold">{member.cosponsoredLegislation || 0}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Terms Served</div>
              <div className="text-xl font-bold">{member.terms?.length || 0}</div>
            </div>
            {fin && (
              <div>
                <div className="text-sm text-white/70">Total Raised</div>
                <div className="text-xl font-bold">{formatMoney(fin.totalReceipts)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Campaign Financials */}
        {fin && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Financials</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{formatMoney(fin.totalReceipts)}</div>
                <div className="text-xs text-gray-500">Total Raised</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{formatMoney(fin.individualContributions)}</div>
                <div className="text-xs text-gray-500">Individual</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{formatMoney(fin.pacContributions)}</div>
                <div className="text-xs text-gray-500">PAC Money</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{formatMoney(fin.cashOnHand)}</div>
                <div className="text-xs text-gray-500">Cash on Hand</div>
              </div>
            </div>

            {/* Top Donors by Employer */}
            {donors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">Top Donors (by employer)</h3>
                <div className="space-y-2">
                  {donors.slice(0, 10).map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{d.employer}</span>
                      <span className="text-sm font-bold text-gray-900">{formatMoney(d.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Super PAC */}
            {ie.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-3">Outside Spending</h3>
                <div className="space-y-2">
                  {ie.slice(0, 5).map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${e.supportOppose === 'Support' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {e.supportOppose === 'Support' ? 'FOR' : 'AGAINST'}
                        </span>
                        <span className="text-gray-700">{e.committee}</span>
                      </div>
                      <span className="font-bold">{formatMoney(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">Source: FEC | Cycle: {fin.cycle}</p>
          </section>
        )}

        {/* Sponsored Bills */}
        {sponsoredBills && sponsoredBills.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recently Sponsored Bills</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {sponsoredBills.map((bill: any) => (
                <BillCard
                  key={bill.id}
                  id={bill.id}
                  title={bill.title}
                  policyArea={bill.policyArea}
                  latestAction={bill.latestAction}
                />
              ))}
            </div>
          </section>
        )}

        {/* Service History */}
        {member.terms && member.terms.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Service History</h2>
            <div className="space-y-2">
              {member.terms.slice().reverse().map((term: any, i: number) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500 w-24">{term.startYear}–{term.endYear || 'present'}</span>
                  <span className="text-sm font-medium text-gray-900">{term.chamber}</span>
                  <span className="text-sm text-gray-600">{term.state} {term.district ? `(District ${term.district})` : ''}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${term.party?.includes('Democrat') ? 'bg-blue-100 text-blue-800' : term.party?.includes('Republican') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                    {term.party}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="text-center text-sm text-gray-400 py-4">
          Data from Congress.gov and Federal Election Commission
        </div>
      </div>
    </div>
  );
}
