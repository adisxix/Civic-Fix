import React from 'react';
import { cn } from '../../lib/cn';

const PRIORITY_MAP = {
  P1: { label: 'P1 - Critical', style: 'bg-rose-50 text-rose-700 border-rose-300 font-bold' },
  critical: { label: 'P1 - Critical', style: 'bg-rose-50 text-rose-700 border-rose-300 font-bold' },
  P2: { label: 'P2 - High', style: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' },
  high: { label: 'P2 - High', style: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' },
  P3: { label: 'P3 - Medium', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  medium: { label: 'P3 - Medium', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  P4: { label: 'P4 - Low', style: 'bg-slate-100 text-slate-700 border-slate-200' },
  low: { label: 'P4 - Low', style: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export function PriorityBadge({ priority = 'P3', className }) {
  const conf = PRIORITY_MAP[priority] || PRIORITY_MAP.P3;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] border font-medium uppercase tracking-wider',
        conf.style,
        className,
      )}
    >
      {conf.label}
    </span>
  );
}

export default PriorityBadge;
