'use client';

import { useState } from 'react';
import InfoTooltip from '@/components/InfoTooltip';

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
                  <a href={`/members/${sponsor.bioguideId}`} className="text-xl font-bold text-white hover:underline">
                    {sponsor.fullName}
                  </a>
                  <p className="text-white/80 text-sm">Sponsor — click for full profile</p>
                </div>
              </div>
            </div>

            {fin && (
              <div className="p-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">{formatMoney(fin.totalReceipts)}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Raised <InfoTooltip text="Total money received by the candidate's campaign committee from all sources — individuals, PACs, party committees, and self-funding." /></div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatMoney(fin.individualContributions)}</div>
                    <div className="text-xs text-gray-500 mt-1">Individual <InfoTooltip text="Donations from individual people (not organizations). FEC requires donors giving over $200 to be listed by name — see the Individual Donors section below for those names." /></div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatMoney(fin.pacContributions)}</div>
                    <div className="text-xs text-gray-500 mt-1">PAC Money <InfoTooltip text="Political Action Committee contributions. PACs pool donations from employees, members, or shareholders of corporations, unions, or trade groups and donate to candidates. They are limited to $5,000 per candidate per election." /></div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatMoney(fin.cashOnHand)}</div>
                    <div className="text-xs text-gray-500 mt-1">Cash on Hand <InfoTooltip text="Money the campaign has in the bank at the end of the most recent reporting period. A large war chest can deter challengers and fund future campaigns." /></div>
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

                {/* Individual Donors — actual names */}
                {(donorProfile as any)?.individualDonors?.donors?.length > 0 && (
                  <IndividualDonorsSection donors={(donorProfile as any).individualDonors.donors} total={(donorProfile as any).individualDonors.total} />
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

function IndividualDonorsSection({ donors, total }: { donors: any[]; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 20;
  const totalPages = Math.ceil(total / perPage);

  // For now we only have the initial 20 donors from the API
  // Pagination UI is ready for when we add server-side paging
  const startIdx = 0;
  const displayDonors = donors;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="font-bold text-gray-900">
          Individual Donors
          <InfoTooltip text="FEC requires anyone donating over $200 to a federal candidate to be listed by name, employer, and occupation. This is public record." />
          <span className="text-gray-400 font-normal text-sm ml-2">({total.toLocaleString()} total)</span>
        </h4>
        <span className="text-gray-400 text-sm">{expanded ? 'Hide' : 'Show'} &#9662;</span>
      </button>

      {expanded && (
        <div className="mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 pr-3 font-medium text-gray-500">Name</th>
                  <th className="py-2 pr-3 font-medium text-gray-500 hidden sm:table-cell">Employer</th>
                  <th className="py-2 pr-3 font-medium text-gray-500 hidden md:table-cell">Occupation</th>
                  <th className="py-2 pr-3 font-medium text-gray-500 hidden lg:table-cell">Location</th>
                  <th className="py-2 pr-3 font-medium text-gray-500 hidden lg:table-cell">Date</th>
                  <th className="py-2 font-medium text-gray-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayDonors.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-3 font-medium text-gray-900">{d.name}</td>
                    <td className="py-2 pr-3 text-gray-600 hidden sm:table-cell">{d.employer || '—'}</td>
                    <td className="py-2 pr-3 text-gray-500 hidden md:table-cell">{d.occupation || '—'}</td>
                    <td className="py-2 pr-3 text-gray-500 text-xs hidden lg:table-cell">
                      {d.city && d.state ? `${d.city}, ${d.state}` : d.state || ''}
                    </td>
                    <td className="py-2 pr-3 text-gray-500 text-xs hidden lg:table-cell">{d.date || ''}</td>
                    <td className="py-2 text-right font-bold text-gray-900">${d.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > perPage && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {displayDonors.length} of {total.toLocaleString()} donors (sorted by amount)
              </p>
              <p className="text-xs text-gray-400">
                Full pagination coming soon — currently showing top {perPage}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            Donations over $200 are public record per FEC regulations.
          </p>
        </div>
      )}
    </div>
  );
}
