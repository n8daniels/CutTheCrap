'use client';

import { useEffect, useState } from 'react';
import { formatSpendingAmount } from '@/services/usaspending-api';

interface Agency {
  name: string;
  abbreviation: string;
  obligatedAmount: number;
  grossOutlayAmount: number;
}

interface BudgetFunction {
  name: string;
  obligatedAmount: number;
  grossOutlayAmount: number;
}

interface SpendingOverview {
  fiscalYear: number;
  topAgencies: Agency[];
  budgetFunctions: BudgetFunction[];
  totalObligated: number;
}

interface Award {
  awardId: string;
  recipientName: string;
  amount: number;
  outlays: number;
  description: string;
  startDate: string;
  endDate: string;
  agency: string;
  type: string;
}

interface SearchResult {
  count: number;
  awards: Award[];
}

export default function SpendingPage() {
  const [overview, setOverview] = useState<SpendingOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await fetch('/api/spending/overview');
        if (!res.ok) throw new Error('Failed to load spending data');
        const data = await res.json();
        setOverview(data);
      } catch (err) {
        setOverviewError(err instanceof Error ? err.message : 'Failed to load spending data');
      } finally {
        setOverviewLoading(false);
      }
    }

    loadOverview();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const res = await fetch(
        `/api/spending/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Follow the Money</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          See where your tax dollars are going right now
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search federal spending by keyword (e.g. defense, healthcare, NASA)..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium shadow-sm"
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchLoading && (
        <div className="max-w-4xl mx-auto mb-12 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {searchError && (
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {searchError}
          </div>
        </div>
      )}

      {searchResults && searchResults.awards.length > 0 && (
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Award Results for &ldquo;{searchQuery}&rdquo;
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {searchResults.count.toLocaleString()} awards found
          </p>
          <div className="space-y-3">
            {searchResults.awards.map((award) => (
              <div
                key={award.awardId}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {award.recipientName || 'Unknown Recipient'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{award.agency}</p>
                    {award.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {award.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {award.type && <span>{award.type}</span>}
                      {award.startDate && <span>Started {award.startDate}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-primary-600">
                      {formatSpendingAmount(award.amount)}
                    </p>
                    {award.outlays > 0 && (
                      <p className="text-xs text-gray-500">
                        {formatSpendingAmount(award.outlays)} spent
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults && searchResults.awards.length === 0 && (
        <div className="max-w-4xl mx-auto mb-12 text-center py-8 text-gray-500">
          No awards found for &ldquo;{searchQuery}&rdquo;. Try a different search term.
        </div>
      )}

      {/* Overview Data */}
      {overviewLoading && (
        <div className="space-y-8">
          {/* Skeleton for top agencies */}
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          </div>
          {/* Skeleton for budget functions */}
          <div>
            <div className="h-6 bg-gray-200 rounded w-56 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-6 bg-gray-200 rounded w-1/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {overviewError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {overviewError}
        </div>
      )}

      {overview && (
        <div className="space-y-10">
          {/* Total Spending Banner */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
              FY{overview.fiscalYear} Federal Obligations (Top Agencies)
            </p>
            <p className="text-3xl font-bold text-primary-600">
              {formatSpendingAmount(overview.totalObligated)}
            </p>
          </div>

          {/* Top Agencies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Top Spending Agencies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.topAgencies.map((agency) => {
                const maxAmount = overview.topAgencies[0]?.obligatedAmount || 1;
                const barWidth = Math.max(
                  (Math.abs(agency.obligatedAmount) / Math.abs(maxAmount)) * 100,
                  2
                );

                return (
                  <div
                    key={agency.name}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm leading-tight">
                          {agency.name}
                        </h3>
                        {agency.abbreviation && (
                          <span className="text-xs text-gray-400">{agency.abbreviation}</span>
                        )}
                      </div>
                      <p className="text-base font-bold text-primary-600 flex-shrink-0">
                        {formatSpendingAmount(agency.obligatedAmount)}
                      </p>
                    </div>
                    <div className="mt-3 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Budget Functions */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Spending by Category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview.budgetFunctions.map((fn) => (
                <div
                  key={fn.name}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                >
                  <h3 className="font-medium text-gray-900 text-sm mb-2">{fn.name}</h3>
                  <p className="text-lg font-bold text-primary-600">
                    {formatSpendingAmount(fn.obligatedAmount)}
                  </p>
                  {fn.grossOutlayAmount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatSpendingAmount(fn.grossOutlayAmount)} outlaid
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Source Attribution */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-500">
          All spending data sourced from <a href="https://usaspending.gov" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">USASpending.gov</a>, the official source for federal spending data maintained by the U.S. Department of the Treasury.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Data reflects FY{overview?.fiscalYear || '2026'} obligations as reported by federal agencies. Updated daily.
        </p>
      </div>
    </div>
  );
}
