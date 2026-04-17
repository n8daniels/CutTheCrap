'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  totalVisits: number;
  uniquePages: number;
  byPage: Record<string, number>;
  byDay: Record<string, number>;
  byReferrer: Record<string, number>;
  byCountry: Record<string, number>;
  byRegion: Record<string, number>;
  byCity: Record<string, number>;
}

function sortedEntries(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

function BreakdownTable({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = sortedEntries(data);
  if (entries.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm">No data yet.</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 text-gray-600 font-medium">Name</th>
              <th className="text-right py-2 text-gray-600 font-medium">Visits</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, count]) => (
              <tr key={key} className="border-b border-gray-100">
                <td className="py-1.5 pr-4 text-gray-700">{key}</td>
                <td className="py-1.5 text-right text-gray-900 font-medium">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-primary-600 mb-6">Analytics Dashboard</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Visits</p>
          <p className="text-3xl font-bold text-primary-700">{data.totalVisits}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Unique Pages</p>
          <p className="text-3xl font-bold text-primary-700">{data.uniquePages}</p>
        </div>
      </div>

      {/* Breakdown sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <BreakdownTable title="Visits by Page" data={data.byPage} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <BreakdownTable title="Visits by Day" data={data.byDay} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <BreakdownTable title="Visits by Referrer" data={data.byReferrer} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <BreakdownTable title="Visits by Country" data={data.byCountry} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <BreakdownTable title="Visits by Region" data={data.byRegion} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <BreakdownTable title="Visits by City" data={data.byCity} />
        </div>
      </div>
    </div>
  );
}
