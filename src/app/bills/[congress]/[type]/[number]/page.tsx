'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface BillMetadata {
  congress: number;
  billType: string;
  billNumber: number;
  title: string;
  sponsor?: string;
  introducedDate?: string;
  status?: string;
  latestAction?: {
    text: string;
    actionDate: string;
  };
}

interface BillStatus {
  id: string;
  title: string;
  status: string;
  actions: Array<{
    actionDate: string;
    text: string;
    actionCode?: string;
  }>;
}

interface BillData {
  bill: BillMetadata;
  status: BillStatus;
  _meta: {
    cached: boolean;
    fetchTimeMs?: number;
    cacheKey: string;
  };
}

export default function BillPage() {
  const params = useParams();
  const { congress, type, number } = params;

  const [data, setData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBill() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/bills/${congress}/${type}/${number}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch bill');
        }

        const billData = await response.json();
        setData(billData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchBill();
  }, [congress, type, number]);

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Bill</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const { bill, status, _meta } = data;

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </a>
          <h1 className="text-4xl font-bold mb-2">{bill.title}</h1>
          <p className="text-xl text-gray-600">
            {bill.billType.toUpperCase()} {bill.billNumber} - {bill.congress}th Congress
          </p>
        </div>

        {/* Cache indicator */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {_meta.cached ? (
                <span className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Loaded from cache
                </span>
              ) : (
                <span className="flex items-center gap-2 text-blue-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Fetched from Congress.gov ({_meta.fetchTimeMs}ms)
                </span>
              )}
            </div>
            <a
              href="/api/cache/stats"
              target="_blank"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              View cache stats →
            </a>
          </div>
        </div>

        {/* Bill Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Bill Information</h2>
          <dl className="grid grid-cols-1 gap-4">
            {bill.sponsor && (
              <div>
                <dt className="font-medium text-gray-700">Sponsor</dt>
                <dd className="text-gray-900">{bill.sponsor}</dd>
              </div>
            )}
            {bill.introducedDate && (
              <div>
                <dt className="font-medium text-gray-700">Introduced</dt>
                <dd className="text-gray-900">{bill.introducedDate}</dd>
              </div>
            )}
            {bill.latestAction && (
              <div>
                <dt className="font-medium text-gray-700">Latest Action</dt>
                <dd className="text-gray-900">
                  <span className="font-medium">{bill.latestAction.actionDate}:</span>{' '}
                  {bill.latestAction.text}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Recent Actions */}
        {status.actions && status.actions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Recent Actions</h2>
            <div className="space-y-4">
              {status.actions.slice(0, 10).map((action, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="font-medium text-gray-700">{action.actionDate}</div>
                  <div className="text-gray-900">{action.text}</div>
                  {action.actionCode && (
                    <div className="text-sm text-gray-500">Code: {action.actionCode}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* v0.1 Note */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">v0.1 Integration Test</h3>
          <p className="text-yellow-800 text-sm">
            This is a basic integration test. Full dependency graph features coming in future versions.
          </p>
        </div>
      </div>
    </main>
  );
}
