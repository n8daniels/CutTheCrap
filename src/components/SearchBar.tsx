'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const BILL_ID_PATTERN = /^\d+\/[a-z]+\/\d+$/;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query || query.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // If it looks like a bill ID, don't search — they'll submit directly
    if (BILL_ID_PATTERN.test(query)) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bills/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setResults(data.bills || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    if (BILL_ID_PATTERN.test(query.trim())) {
      router.push(`/bills?id=${query.trim()}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    setShowDropdown(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search bills (e.g. "infrastructure") or enter bill ID (119/hr/1234)'
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Search
        </button>
      </form>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {results.map((bill: any) => (
            <button
              key={bill.id}
              onClick={() => {
                router.push(`/bills?id=${bill.id}`);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-gray-900 text-sm line-clamp-1">{bill.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {bill.id.toUpperCase()}
                {bill.policyArea && ` · ${bill.policyArea}`}
              </div>
            </button>
          ))}
          <button
            onClick={() => {
              router.push(`/search?q=${encodeURIComponent(query)}`);
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-3 text-primary-600 hover:bg-primary-50 text-sm font-medium"
          >
            See all results for &ldquo;{query}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}
