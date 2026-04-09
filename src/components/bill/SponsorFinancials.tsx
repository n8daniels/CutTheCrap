'use client';

interface SponsorFinancialsProps {
  sponsorDonors: Array<{
    sponsor: { fullName: string; party: string; state: string; bioguideId: string };
    donorProfile: {
      financials: {
        totalReceipts: number;
        individualContributions: number;
        pacContributions: number;
        cashOnHand: number;
        cycle: number;
      } | null;
      topDonors: {
        employers: Array<{ employer: string; total: number; count: number }>;
      };
      independentExpenditures: {
        expenditures: Array<{
          committee: string;
          amount: number;
          supportOppose: string;
        }>;
      };
    } | null;
    memberIds: { fecIds: string[] } | null;
  }>;
  cosponsors: Array<{ fullName: string; party: string; state: string }>;
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function SponsorFinancials({ sponsorDonors, cosponsors }: SponsorFinancialsProps) {
  return (
    <div className="w-full space-y-6">
      {sponsorDonors.map((sd, i) => {
        const { sponsor, donorProfile } = sd;
        const fin = donorProfile?.financials;
        const donors = donorProfile?.topDonors?.employers || [];
        const ie = donorProfile?.independentExpenditures?.expenditures || [];
        const partyColor = sponsor.party === 'D' ? 'blue' : sponsor.party === 'R' ? 'red' : 'gray';

        return (
          <div key={i} className={`bg-white rounded-xl shadow-sm border-2 border-${partyColor}-200 overflow-hidden`}>
            {/* Sponsor Header */}
            <div className={`bg-gradient-to-r ${sponsor.party === 'D' ? 'from-blue-600 to-blue-700' : sponsor.party === 'R' ? 'from-red-600 to-red-700' : 'from-gray-600 to-gray-700'} px-6 py-4`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{sponsor.party}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{sponsor.fullName}</h3>
                  <p className="text-white/80 text-sm">Sponsor</p>
                </div>
              </div>
            </div>

            {fin && (
              <div className="p-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">{formatMoney(fin.totalReceipts)}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Raised</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatMoney(fin.individualContributions)}</div>
                    <div className="text-xs text-gray-500 mt-1">Individual</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatMoney(fin.pacContributions)}</div>
                    <div className="text-xs text-gray-500 mt-1">PAC Money</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatMoney(fin.cashOnHand)}</div>
                    <div className="text-xs text-gray-500 mt-1">Cash on Hand</div>
                  </div>
                </div>

                {/* Top Donors */}
                {donors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 mb-3">Top Donors (by employer)</h4>
                    <p className="text-xs text-gray-500 mb-3">
                      FEC reports donations by the contributor&apos;s self-reported employer. &quot;Retired,&quot; &quot;Self Employed,&quot; and &quot;Homemaker&quot; are occupations, not organizations.
                    </p>
                    <div className="space-y-2">
                      {donors.slice(0, 7).map((d, j) => {
                        const isOccupation = ['RETIRED', 'SELF EMPLOYED', 'SELF-EMPLOYED', 'HOMEMAKER', 'NOT EMPLOYED', 'STUDENT', 'NONE'].includes(d.employer?.toUpperCase());
                        return (
                        <div key={j} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {d.employer}
                                {isOccupation && <span className="text-xs text-gray-400 ml-1">(individual donors)</span>}
                              </span>
                              <span className="text-sm font-bold text-gray-900 ml-2">{formatMoney(d.total)}</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${sponsor.party === 'D' ? 'bg-blue-400' : sponsor.party === 'R' ? 'bg-red-400' : 'bg-gray-400'}`}
                                style={{ width: `${Math.min(100, (d.total / (donors[0]?.total || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Super PAC Spending */}
                {ie.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Outside Spending (Super PACs)</h4>
                    <div className="space-y-2">
                      {ie.slice(0, 5).map((e, j) => (
                        <div key={j} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${e.supportOppose === 'Support' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {e.supportOppose === 'Support' ? 'FOR' : 'AGAINST'}
                            </span>
                            <span className="text-gray-700 truncate">{e.committee}</span>
                          </div>
                          <span className="font-bold text-gray-900 ml-2">{formatMoney(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                  Source: Federal Election Commission (FEC) | Cycle: {fin.cycle}
                </p>
              </div>
            )}

            {!fin && (
              <div className="p-6 text-center text-gray-400 text-sm">
                No FEC financial data available for this member
              </div>
            )}
          </div>
        );
      })}

      {/* Cosponsors */}
      {cosponsors.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Cosponsors ({cosponsors.length})</h3>
          <div className="flex flex-wrap gap-2">
            {cosponsors.map((c, i) => (
              <span
                key={i}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  c.party === 'D' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                  c.party === 'R' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-gray-50 text-gray-800 border border-gray-200'
                }`}
              >
                {c.fullName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
