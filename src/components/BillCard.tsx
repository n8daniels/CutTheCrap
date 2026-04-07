import Link from 'next/link';

interface BillCardProps {
  id: string;
  title: string;
  type?: string;
  policyArea?: string | null;
  introducedDate?: string;
  latestAction?: string;
}

export default function BillCard({ id, title, type, policyArea, introducedDate, latestAction }: BillCardProps) {
  return (
    <Link href={`/bills?id=${id}`} className="block">
      <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:shadow-sm transition-all bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
              {title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{id.toUpperCase()}</p>
          </div>
          {policyArea && (
            <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs whitespace-nowrap flex-shrink-0">
              {policyArea}
            </span>
          )}
        </div>
        {latestAction && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-1">{latestAction}</p>
        )}
      </div>
    </Link>
  );
}
