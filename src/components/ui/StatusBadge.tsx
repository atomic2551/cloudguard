import clsx from 'clsx';
import type { AlertStatus, IncidentStatus, FindingStatus } from '@/lib/mock-data';

type Status = AlertStatus | IncidentStatus | FindingStatus | string;

const statusConfig: Record<string, { label: string; className: string }> = {
  // Alert statuses
  NEW: { label: 'New', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ACKNOWLEDGED: { label: 'Acknowledged', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  INVESTIGATING: { label: 'Investigating', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  RESOLVED: { label: 'Resolved', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  FALSE_POSITIVE: { label: 'False Positive', className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  // Incident statuses
  OPEN: { label: 'Open', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  CONTAINED: { label: 'Contained', className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  CLOSED: { label: 'Closed', className: 'bg-gray-600/15 text-gray-500 border-gray-600/30' },
  // Finding statuses
  REMEDIATED: { label: 'Remediated', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  SUPPRESSED: { label: 'Suppressed', className: 'bg-gray-500/15 text-gray-500 border-gray-600/30' },
  // Cloud account statuses
  CONNECTED: { label: 'Connected', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  DISCONNECTED: { label: 'Disconnected', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  ERROR: { label: 'Error', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  SYNCING: { label: 'Syncing', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  // User statuses
  ACTIVE: { label: 'Active', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  INACTIVE: { label: 'Inactive', className: 'bg-gray-500/15 text-gray-400 border-gray-600/30' },
  LOCKED: { label: 'Locked', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  // Result
  SUCCESS: { label: 'Success', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  FAILURE: { label: 'Failure', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };
  return (
    <span className={clsx('inline-flex items-center text-xs font-medium border rounded px-2 py-0.5', config.className)}>
      {config.label}
    </span>
  );
}
