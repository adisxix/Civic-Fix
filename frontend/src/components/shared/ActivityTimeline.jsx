import React from 'react';
import { Clock, CheckCircle2, User, Wrench, Shield, AlertCircle } from 'lucide-react';
import { formatDateExact } from '../../lib/format';
import { cn } from '../../lib/cn';

const ICON_MAP = {
  reported: AlertCircle,
  report_added: AlertCircle,
  support_added: User,
  triage: Shield,
  assignment: User,
  status_changed: Wrench,
  note: Clock,
  evidence_added: CheckCircle2,
  verification: CheckCircle2,
  reopened: AlertCircle,
  moderation: Shield,
};

export function ActivityTimeline({ items = [], updates = [], className }) {
  const timelineItems = items.length > 0 ? items : updates;

  if (!timelineItems || timelineItems.length === 0) {
    return <div className="text-xs text-slate-400 py-4">No activity updates recorded yet.</div>;
  }

  return (
    <div
      className={cn(
        'relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200',
        className,
      )}
    >
      {timelineItems.map((item, idx) => {
        const type = item.updateType || item.update_type;
        const Icon = ICON_MAP[type] || Clock;
        const isInternal = item.visibility === 'internal';

        return (
          <div key={item.id || idx} className="relative group">
            {/* Timeline bullet dot */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center text-emerald-700 shadow-xs">
              <Icon className="w-2.5 h-2.5" />
            </div>

            <div
              className={cn(
                'p-3 rounded-xl border transition-colors text-xs',
                isInternal ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  {item.actorName || item.actor_name || 'System / Automated'}
                  {isInternal && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-semibold uppercase">
                      Internal Staff
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatDateExact(item.createdAt || item.created_at)}
                </span>
              </div>

              {item.note && <p className="text-slate-700 mt-1 whitespace-pre-wrap">{item.note}</p>}
              {item.nextStep && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  Next step: {item.nextStep}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ActivityTimeline;
