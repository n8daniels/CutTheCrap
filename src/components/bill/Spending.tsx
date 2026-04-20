'use client';

import { useState, useEffect } from 'react';

interface SpendingProps {
  billId: string;
  billTitle: string;
}

function formatAmount(amount: number): string {
  if (Math.abs(amount) >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (Math.abs(amount) >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (Math.abs(amount) >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
}

export default function Spending({ billId, billTitle }: SpendingProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const safeBillId = billId.replace(/\//g, '-');
    fetch(`/api/bills/${safeBillId}/spending`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [billId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Federal Spending</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  const awards = error ? [] : (data?.awards?.awards || []);
  const agencies = error ? [] : (data?.agencySpending?.categories || []);
  const totalAwards = error ? 0 : (data?.awards?.count || 0);
  const hasData = awards.length > 0 || agencies.length > 0;

  const maxAgencyAmount = agencies.length > 0 ? agencies[0].amount : 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Where the Money Goes</h2>
      <p className="text-sm text-gray-500 mb-6">Federal awards and spending related to this legislation</p>

      {!hasData && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No federal spending data tied to this bill.</p>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            This bill may not directly authorize federal contracts, grants, or loans &mdash; or related spending is classified (common for intelligence and national security legislation).
            <br />
            <a
              href={`https://www.usaspending.gov/search/?keywords=${encodeURIComponent(billTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline mt-2 inline-block"
            >
              Search USASpending.gov directly &rarr;
            </a>
          </p>
        </div>
      )}

      {/* Agency Spending Breakdown */}
      {agencies.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-4">Spending by Agency</h3>
          <div className="space-y-3">
            {agencies.map((a: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-4">{a.agency}</span>
                  <span className="text-sm font-bold text-gray-900">{formatAmount(a.amount)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                    style={{ width: `${Math.max(2, (a.amount / maxAgencyAmount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Awards */}
      {awards.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-4">
            Top Awards <span className="text-gray-400 font-normal text-sm">({totalAwards.toLocaleString()} total)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Recipient</th>
                  <th className="text-right py-2 pr-4 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 hidden md:table-cell">Agency</th>
                  <th className="text-left py-2 font-medium text-gray-500 hidden lg:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {awards.slice(0, 10).map((a: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{a.recipientName || 'Unknown'}</td>
                    <td className="py-3 pr-4 text-right font-bold text-emerald-700">{formatAmount(a.amount)}</td>
                    <td className="py-3 pr-4 text-gray-600 hidden md:table-cell">{a.agency || ''}</td>
                    <td className="py-3 text-gray-500 text-xs hidden lg:table-cell max-w-xs truncate">{a.description || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">Source: USASpending.gov</p>
    </div>
  );
}
