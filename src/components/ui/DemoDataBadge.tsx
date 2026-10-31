import React from 'react';

interface DemoDataBadgeProps {
  className?: string;
  tooltip?: string;
}

export function DemoDataBadge({
  className = '',
  tooltip = 'Backend service currently provides static demo metrics',
}: DemoDataBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}
      title={tooltip}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      DEMO DATA
    </span>
  );
}

export default DemoDataBadge;
