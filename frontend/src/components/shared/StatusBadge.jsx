import React from 'react';
import {
  FileText,
  UserCheck,
  Wrench,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '../../lib/cn';

const STATUS_MAP = {
  reported: {
    label: 'Reported',
    icon: FileText,
    style: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  acknowledged: {
    label: 'Acknowledged',
    icon: Clock,
    style: 'bg-indigo-50 text-indigo-700 border-indigo-300',
  },
  assigned: {
    label: 'Assigned',
    icon: UserCheck,
    style: 'bg-teal-50 text-teal-800 border-teal-300',
  },
  in_progress: {
    label: 'In Progress',
    icon: Wrench,
    style: 'bg-blue-50 text-blue-800 border-blue-300',
  },
  awaiting_verification: {
    label: 'Needs Verification',
    icon: HelpCircle,
    style: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  resolved_pending_verification: {
    label: 'Needs Verification',
    icon: HelpCircle,
    style: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    style: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  closed_resolved: {
    label: 'Closed (Resolved)',
    icon: CheckCircle2,
    style: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  reopened: {
    label: 'Reopened',
    icon: AlertTriangle,
    style: 'bg-red-50 text-red-800 border-red-300',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    style: 'bg-gray-100 text-gray-700 border-gray-300',
  },
};

export function StatusBadge({ status, className }) {
  const conf = STATUS_MAP[status] || STATUS_MAP.reported;
  const Icon = conf.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        conf.style,
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {conf.label}
    </span>
  );
}

export default StatusBadge;
