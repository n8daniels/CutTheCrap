'use client';

import { useState, useEffect } from 'react';

interface RegulationsProps {
  billId: string;
  billTitle: string;
}

export default function Regulations({ billId, billTitle }: RegulationsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const safeBillId = billId.replace(/\//g, '-');
    fetch(`/api/bills/${safeBillId}/regulations`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [billId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Federal Register</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !data || data.count === 0) {
    return null; // Don't show section if no regulations found
  }

  const typeLabel: Record<string, string> = {
    'Rule': 'Final Rule',
    'Proposed Rule': 'Proposed Rule',
    'Notice': 'Notice',
    'Presidential Document': 'Presidential Document',
  };

  const typeColor: Record<string, string> = {
    'Rule': 'bg-green-100 text-green-800',
    'Proposed Rule': 'bg-yellow-100 text-yellow-800',
    'Notice': 'bg-blue-100 text-blue-800',
    'Presidential Document': 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Federal Register</h2>
      <p className="text-sm text-gray-500 mb-4">{data.count} related document{data.count !== 1 ? 's' : ''} found</p>

      <div className="space-y-4">
        {data.documents.map((doc: any, i: number) => (
          <a
            key={i}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{doc.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor[doc.type] || 'bg-gray-100 text-gray-700'}`}>
                    {typeLabel[doc.type] || doc.type}
                  </span>
                  <span className="text-xs text-gray-500">{doc.publicationDate}</span>
                  {doc.agencies?.length > 0 && (
                    <span className="text-xs text-gray-500">{doc.agencies[0]}</span>
                  )}
                </div>
                {doc.abstract && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.abstract}</p>
                )}
              </div>
              <span className="text-gray-400 flex-shrink-0">&#x2197;</span>
            </div>
          </a>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">Source: Federal Register (federalregister.gov)</p>
    </div>
  );
}
