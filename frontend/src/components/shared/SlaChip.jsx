import React from 'react';
import { Clock, AlertCircle, AlertOctagon } from 'lucide-react';
import { cn } from '../../lib/cn';

export function SlaChip({ slaState, remainingHours, hoursRemaining, className }) {
  const hours = remainingHours !== undefined ? remainingHours : hoursRemaining;
  if (!slaState || slaState === 'none') return null;

  if (slaState === 'breached' || slaState === 'overdue') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300',
          className,
        )}
      >
        <AlertOctagon className="w-3.5 h-3.5" />
        SLA Overdue
      </span>
    );
  }

  if (slaState === 'at_risk') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300',
          className,
        )}
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        SLA At Risk {hours ? `(${Math.round(hours)}h left)` : ''}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200',
        className,
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      SLA On Track {hours ? `(${Math.round(hours)}h left)` : ''}
    </span>
  );
}

export default SlaChip;
