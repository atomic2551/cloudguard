import clsx from 'clsx';
import type { Severity } from '@/lib/api/types';

const severityConfig: Record<Severity, { label: string; className: string; dot: string }> = {
  CRITICAL: {
    label: 'CRITICAL',
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-500',
  },
  HIGH: {
    label: 'HIGH',
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-500',
  },
  MEDIUM: {
    label: 'MEDIUM',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    dot: 'bg-yellow-500',
  },
  LOW: {
    label: 'LOW',
    className: 'bg-green-500/15 text-green-400 border-green-500/30',
    dot: 'bg-green-500',
  },
  INFO: {
    label: 'INFO',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-500',
  },
};

export default function SeverityBadge({
  severity,
  size = 'sm',
}: {
  severity: Severity;
  size?: 'xs' | 'sm' | 'md';
}) {
  const config = severityConfig[severity];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold border rounded px-2 py-0.5',
        config.className,
        size === 'xs' && 'text-xs',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm px-2.5 py-1'
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)}></span>
      {config.label}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: Severity }) {
  const config = severityConfig[severity];
  return (
    <span className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0 inline-block', config.dot)}></span>
  );
}
