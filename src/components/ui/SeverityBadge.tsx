'use client';

import clsx from 'clsx';
import type { Severity } from '@/lib/api/types';
import { useLanguage } from '@/lib/i18n';

const severityConfig: Record<Severity, { key: string; fallback: string; className: string; dot: string }> = {
  CRITICAL: {
    key: 'severity.critical',
    fallback: 'CRITICAL',
    className: 'bg-red-500/15 text-red-400 border-red-500/40 shadow-xs shadow-red-500/20',
    dot: 'bg-red-500 shadow-xs shadow-red-500 animate-pulse',
  },
  HIGH: {
    key: 'severity.high',
    fallback: 'HIGH',
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/40 shadow-xs shadow-orange-500/20',
    dot: 'bg-orange-500 shadow-xs shadow-orange-500',
  },
  MEDIUM: {
    key: 'severity.medium',
    fallback: 'MEDIUM',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40 shadow-xs shadow-yellow-500/20',
    dot: 'bg-yellow-500 shadow-xs shadow-yellow-500',
  },
  LOW: {
    key: 'severity.low',
    fallback: 'LOW',
    className: 'bg-green-500/15 text-green-400 border-green-500/40 shadow-xs shadow-green-500/20',
    dot: 'bg-green-500',
  },
  INFO: {
    key: 'severity.info',
    fallback: 'INFO',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/40 shadow-xs shadow-blue-500/20',
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
  const { t } = useLanguage();
  const config = severityConfig[severity] ?? severityConfig.INFO;
  const label = t(config.key, config.fallback);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-bold uppercase tracking-wider border rounded-md select-none',
        config.className,
        size === 'xs' && 'text-[10px] px-1.5 py-0.5',
        size === 'sm' && 'text-[11px] px-2 py-0.5',
        size === 'md' && 'text-xs px-2.5 py-1'
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)}></span>
      {label}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: Severity }) {
  const config = severityConfig[severity] ?? severityConfig.INFO;
  return (
    <span className={clsx('w-2 h-2 rounded-full flex-shrink-0 inline-block', config.dot)}></span>
  );
}
