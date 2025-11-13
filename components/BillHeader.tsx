import { Bill, BillStatus } from '@/types';

interface BillHeaderProps {
  bill: Bill;
}

const statusColors: Record<BillStatus, string> = {
  [BillStatus.INTRODUCED]: 'bg-blue-100 text-blue-800',
  [BillStatus.IN_COMMITTEE]: 'bg-yellow-100 text-yellow-800',
  [BillStatus.PASSED_HOUSE]: 'bg-green-100 text-green-800',
  [BillStatus.PASSED_SENATE]: 'bg-green-100 text-green-800',
  [BillStatus.PASSED_BOTH]: 'bg-green-200 text-green-900',
  [BillStatus.SENT_TO_PRESIDENT]: 'bg-purple-100 text-purple-800',
  [BillStatus.SIGNED]: 'bg-emerald-200 text-emerald-900',
  [BillStatus.VETOED]: 'bg-red-100 text-red-800',
  [BillStatus.BECAME_LAW]: 'bg-emerald-300 text-emerald-950',
  [BillStatus.FAILED]: 'bg-gray-200 text-gray-800',
};

const statusLabels: Record<BillStatus, string> = {
  [BillStatus.INTRODUCED]: 'Introduced',
  [BillStatus.IN_COMMITTEE]: 'In Committee',
  [BillStatus.PASSED_HOUSE]: 'Passed House',
  [BillStatus.PASSED_SENATE]: 'Passed Senate',
  [BillStatus.PASSED_BOTH]: 'Passed Both Chambers',
  [BillStatus.SENT_TO_PRESIDENT]: 'Sent to President',
  [BillStatus.SIGNED]: 'Signed',
  [BillStatus.VETOED]: 'Vetoed',
  [BillStatus.BECAME_LAW]: 'Became Law',
  [BillStatus.FAILED]: 'Failed',
};

export default function BillHeader({ bill }: BillHeaderProps) {
  return (
    <header className="card mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="text-sm text-text-muted mb-1">
            {bill.number} • {bill.congress}th Congress
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight">
            {bill.title}
          </h1>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            statusColors[bill.status]
          }`}
        >
          {statusLabels[bill.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-text-muted">Sponsor:</span>
          <span className="ml-2 font-medium">{bill.sponsor}</span>
        </div>
        <div>
          <span className="text-text-muted">Introduced:</span>
          <span className="ml-2 font-medium">
            {new Date(bill.introducedDate).toLocaleDateString()}
          </span>
        </div>
        <div>
          <span className="text-text-muted">Chamber:</span>
          <span className="ml-2 font-medium capitalize">{bill.chamber}</span>
        </div>
        <div>
          <span className="text-text-muted">Last Action:</span>
          <span className="ml-2 font-medium">
            {new Date(bill.lastActionDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </header>
  );
}
