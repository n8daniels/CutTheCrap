'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DocumentGraph } from '@/types/document';
import { AIContext } from '@/types/ai-context';

export default function BillsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const billId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    bill: any;
    documentGraph: DocumentGraph;
    aiContext: AIContext;
    metadata: any;
  } | null>(null);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            No bill specified
          </h1>
          <p className="text-gray-600 mb-6">
            Please provide a bill ID in the format: congress/type/number
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go Home
          </button>
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
            <p className="text-center text-gray-600 mt-6">
              Analyzing bill and fetching dependencies...
            </p>
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
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Bill Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {data.bill.title}
              </h1>
              <p className="text-gray-600">Bill ID: {data.bill.id}</p>
            </div>
            <span className="px-4 py-2 bg-primary-100 text-primary-800 rounded-lg font-semibold">
              {data.bill.metadata.status}
            </span>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Documents Analyzed</div>
              <div className="text-2xl font-bold text-primary-600">
                {data.metadata.documentsIncluded}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Fetch Time</div>
              <div className="text-2xl font-bold text-primary-600">
                {data.metadata.fetchTimeMs}ms
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Cached</div>
              <div className="text-2xl font-bold text-primary-600">
                {data.metadata.cached ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Cache Hits</div>
              <div className="text-2xl font-bold text-primary-600">
                {data.aiContext.metadata.cacheHits}
              </div>
            </div>
          </div>
        </div>

        {/* Dependencies */}
        {data.aiContext.dependencies.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Related Documents ({data.aiContext.dependencies.length})
            </h2>
            <div className="space-y-4">
              {data.aiContext.dependencies.map((dep) => (
                <div
                  key={dep.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{dep.title}</h3>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {dep.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{dep.relationship}</p>
                  <p className="text-sm text-gray-700">{dep.summary}</p>
                  {dep.relevantSections && dep.relevantSections.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Relevant sections:</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {dep.relevantSections.map((section, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {data.aiContext.timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3">
              {data.aiContext.timeline.map((event, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="text-sm text-gray-500 w-32 flex-shrink-0">
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{event.event}</div>
                    <div className="text-sm text-gray-600">{event.document}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bill Content Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bill Content</h2>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
              {data.bill.content.substring(0, 5000)}
              {data.bill.content.length > 5000 && '\n\n... (truncated)'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
