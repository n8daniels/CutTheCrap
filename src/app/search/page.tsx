'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import BillCard from '@/components/BillCard';
import SearchBar from '@/components/SearchBar';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [results, setResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;
  const offset = (page - 1) * limit;

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    async function search() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bills/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.bills || []);
        setTotalCount(data.totalCount || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [query, offset]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-6">
          <SearchBar />
        </div>

        {query && (
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Results for &ldquo;{query}&rdquo;
          </h1>
        )}
        {totalCount > 0 && (
          <p className="text-sm text-gray-500 mb-6">{totalCount.toLocaleString()} bills found</p>
        )}

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="text-center py-12 text-gray-500">
            No bills found for &ldquo;{query}&rdquo;. Try a different search term.
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((bill) => (
              <BillCard
                key={bill.id}
                id={bill.id}
                title={bill.title}
                policyArea={bill.policyArea}
                latestAction={bill.latestAction}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <button
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&page=${page - 1}`)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Previous
              </button>
            )}
            <span className="px-4 py-2 text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <button
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&page=${page + 1}`)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
