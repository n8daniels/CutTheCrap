'use client';

import { useEffect, useState } from 'react';
import { Bill, ApiResponse } from '@/types';
import Link from 'next/link';

export default function BillManagement() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchBills();
  }, [page]);

  async function fetchBills() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bills?page=${page}&pageSize=${pageSize}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }

      const result: ApiResponse<Bill[]> = await response.json();

      if (result.success && result.data) {
        setBills(result.data);
        setTotal(result.meta?.total || 0);
      } else {
        setError(result.error?.message || 'Failed to fetch bills');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dem-blue mx-auto mb-4"></div>
          <p className="text-text-muted">Loading bills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button onClick={fetchBills} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bill Management</h2>
          <p className="text-sm text-text-muted">{total} total bills</p>
        </div>
        <button className="btn-primary">
          ➕ Add Bill
        </button>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-xl font-semibold mb-2">No bills yet</h3>
          <p className="text-text-muted mb-4">
            Start by adding your first bill to the system
          </p>
          <button className="btn-primary">
            Add Your First Bill
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Congress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Sections
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-bg-secondary">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-medium text-dem-blue">{bill.number}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-md">
                        <div className="font-medium text-text-primary truncate">
                          {bill.title}
                        </div>
                        <div className="text-sm text-text-muted">
                          {bill.sponsor}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                        {bill.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {bill.congress}th
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {bill.sections?.length || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/bills/${bill.id}`}
                        className="text-dem-blue hover:text-blue-700 mr-3"
                      >
                        View
                      </Link>
                      <button className="text-text-muted hover:text-text-primary mr-3">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-bg-secondary border-t flex items-center justify-between">
              <div className="text-sm text-text-muted">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} bills
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-white border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-white border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
