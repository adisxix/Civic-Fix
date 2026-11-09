import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Search,
  ArrowRight,
  AlertCircle,
  Clock,
  UserPlus,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import { useGetWardQueueQuery, useGetMetaQuery } from '../../features/api/civicApi';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import StatusBadge from '../../components/shared/StatusBadge';
import CategoryBadge from '../../components/shared/CategoryBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import SlaChip from '../../components/shared/SlaChip';

export default function WardQueuePage() {
  const { data: meta } = useGetMetaQuery();
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Determine query parameters based on active tab
  const getQueryParams = () => {
    const params = {};
    if (selectedWard) params.ward_id = selectedWard;
    if (selectedCategory) params.category_id = selectedCategory;
    if (selectedPriority) params.priority = selectedPriority;

    if (activeTab === 'NEEDS_ASSIGNMENT') {
      params.unassigned = true;
      params.status = 'reported,acknowledged';
    } else if (activeTab === 'IN_PROGRESS') {
      params.status = 'assigned,in_progress';
    } else if (activeTab === 'AWAITING_VERIFICATION') {
      params.status = 'resolved_pending_verification';
    } else if (activeTab === 'OVERDUE') {
      params.overdue = true;
    }
    return params;
  };

  const { data: queueData, isLoading } = useGetWardQueueQuery(getQueryParams());
  const issues = queueData?.issues || queueData || [];

  const filteredIssues = issues.filter((issue) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (issue.title || '').toLowerCase().includes(q) ||
      (issue.description || '').toLowerCase().includes(q) ||
      (issue.address || '').toLowerCase().includes(q) ||
      String(issue.id).includes(q)
    );
  });

  const wardOptions = (meta?.wards || []).map((w) => ({
    value: w.id,
    label: `${w.name} (Ward ${w.code || w.id})`,
  }));

  const categoryOptions = (meta?.categories || []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const priorityOptions = [
    { value: 'P1', label: 'P1 - Critical (24h)' },
    { value: 'P2', label: 'P2 - High (48h)' },
    { value: 'P3', label: 'P3 - Medium (72h)' },
    { value: 'P4', label: 'P4 - Low (7d)' },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Ward Triage Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {filteredIssues.length} issues
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritize neighbourhood issues, assign municipal work crews, and monitor SLA deadlines.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All Open Issues', icon: Inbox },
          { id: 'NEEDS_ASSIGNMENT', label: 'Needs Assignment', icon: UserPlus },
          { id: 'IN_PROGRESS', label: 'Active in Field', icon: Clock },
          { id: 'AWAITING_VERIFICATION', label: 'Awaiting Verification', icon: CheckCircle2 },
          { id: 'OVERDUE', label: 'SLA Overdue', icon: AlertCircle, color: 'text-rose-600' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color || ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search reference # or keywords..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            placeholder="All Wards"
            options={wardOptions}
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
          />

          <Select
            placeholder="All Categories"
            options={categoryOptions}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          />

          <Select
            placeholder="All Priorities"
            options={priorityOptions}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          />
        </div>
      </Card>

      {/* Triage Table */}
      <Card className="overflow-hidden shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ref & Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">SLA Deadline</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4 h-12 bg-slate-50/50" />
                  </tr>
                ))
              ) : filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">
                      No issues found in this triage queue
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust filter criteria or select a different tab.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[10px] text-slate-400">#{issue.id}</span>
                        {issue.support_count > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded">
                            <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                            {issue.support_count}
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/ward/issues/${issue.id}`}
                        className="hover:text-emerald-600 block line-clamp-1 font-semibold"
                      >
                        {issue.title}
                      </Link>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <CategoryBadge category={issue.category_code || issue.category_name} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {issue.ward_name || `Ward ${issue.ward_id}`}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={issue.priority} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={issue.status} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <SlaChip
                        slaState={issue.sla_state}
                        hoursRemaining={issue.sla_hours_remaining}
                      />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {issue.assigned_name || (
                        <span className="text-amber-600 italic font-medium">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/ward/issues/${issue.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
