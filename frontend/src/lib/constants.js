export const STATUS_CONFIG = {
  reported: { label: 'Reported', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  assigned: { label: 'Assigned', color: 'bg-teal-50 text-teal-700 border-teal-300' },
  in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  awaiting_verification: {
    label: 'Awaiting Verification',
    color: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  reopened: { label: 'Reopened', color: 'bg-red-50 text-red-700 border-red-300' },
  rejected: { label: 'Rejected', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Medium', color: 'bg-blue-50 text-blue-700' },
  high: { label: 'High', color: 'bg-amber-50 text-amber-700' },
  critical: { label: 'Critical', color: 'bg-red-50 text-red-700 font-bold' },
};

export const CATEGORY_ICONS = {
  pothole: 'construction',
  streetlight: 'lamp',
  garbage: 'trash-2',
  drainage: 'waves',
  water_leakage: 'droplets',
};
