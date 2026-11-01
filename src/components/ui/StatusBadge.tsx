'use client';

import clsx from 'clsx';
import type { AlertStatus, IncidentStatus, FindingStatus } from '@/lib/api/types';
import { useLanguage } from '@/lib/i18n';

type Status = AlertStatus | IncidentStatus | FindingStatus | string;

const statusConfig: Record<string, { key: string; fallback: string; className: string }> = {
  // Alert statuses
  NEW: { key: 'status.new', fallback: 'New', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ACKNOWLEDGED: { key: 'status.acknowledged', fallback: 'Acknowledged', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  INVESTIGATING: { key: 'status.investigating', fallback: 'Investigating', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  RESOLVED: { key: 'status.resolved', fallback: 'Resolved', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  FALSE_POSITIVE: { key: 'status.false_positive', fallback: 'False Positive', className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  // Incident statuses
  OPEN: { key: 'status.new', fallback: 'Open', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  CONTAINED: { key: 'status.acknowledged', fallback: 'Contained', className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  CLOSED: { key: 'status.resolved', fallback: 'Closed', className: 'bg-gray-600/15 text-gray-400 border-gray-600/30' },
  // Finding statuses
  REMEDIATED: { key: 'status.resolved', fallback: 'Remediated', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  SUPPRESSED: { key: 'status.disabled', fallback: 'Suppressed', className: 'bg-gray-500/15 text-gray-400 border-gray-600/30' },
  // Cloud account statuses
  CONNECTED: { key: 'status.connected', fallback: 'Connected', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  DISCONNECTED: { key: 'status.disabled', fallback: 'Disconnected', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  ERROR: { key: 'common.delete', fallback: 'Error', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  SYNCING: { key: 'common.loading', fallback: 'Syncing', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  // User statuses
  ACTIVE: { key: 'status.active', fallback: 'Active', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  INACTIVE: { key: 'status.disabled', fallback: 'Inactive', className: 'bg-gray-500/15 text-gray-400 border-gray-600/30' },
  LOCKED: { key: 'login.err_locked', fallback: 'Locked', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  // Result
  SUCCESS: { key: 'status.resolved', fallback: 'Success', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  FAILURE: { key: 'common.delete', fallback: 'Failure', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { t } = useLanguage();
  const config = statusConfig[status] ?? { key: '', fallback: status, className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };
  const label = config.key ? t(config.key, config.fallback) : config.fallback;

  return (
    <span className={clsx('inline-flex items-center text-[11px] font-semibold border rounded-md px-2 py-0.5 select-none', config.className)}>
      {label}
    </span>
  );
}
