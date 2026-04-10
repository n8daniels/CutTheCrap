'use client';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function BillCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export function BillCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <BillCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function VisualizationSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto mb-4" />
      <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading visualization...</div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="space-y-4 pl-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
