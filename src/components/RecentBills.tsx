'use client';

import { useState, useEffect } from 'react';
import BillCard from './BillCard';

interface RecentBillsProps {
  title: string;
  congress?: number;
  limit?: number;
  excludeIds?: readonly string[];
}

export default function RecentBills({ title, congress = 119, limit = 8, excludeIds }: RecentBillsProps) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBills() {
      try {
        // Over-fetch so dedupe doesn't shrink the visible count below `limit`.
        const excludeCount = excludeIds?.length ?? 0;
        const fetchLimit = Math.min(limit + excludeCount, 25);
        const res = await fetch(`/api/bills/recent?congress=${congress}&limit=${fetchLimit}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const excludeSet = new Set(excludeIds ?? []);
        const filtered = (data.bills || []).filter((b: any) => !excludeSet.has(b.id)).slice(0, limit);
        setBills(filtered);
      } catch (err) {
        setError('Unable to load bills');
      } finally {
        setLoading(false);
      }
    }
    fetchBills();
  }, [congress, limit, excludeIds]);

  if (error) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">{error}</div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      {loading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {bills.map((bill) => (
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
    </div>
  );
}
