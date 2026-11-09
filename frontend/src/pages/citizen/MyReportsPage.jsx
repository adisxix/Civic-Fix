import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useGetMyReportsQuery } from '../../features/api/civicApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/shared/StatusBadge';
import CategoryBadge from '../../components/shared/CategoryBadge';
import SlaChip from '../../components/shared/SlaChip';

export default function MyReportsPage() {
  const { data: myReportsData, isLoading } = useGetMyReportsQuery();
  const reports = myReportsData?.reports || [];

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter((report) => {
    // Status filter
    if (filterStatus === 'ACTIVE' && ['closed_resolved', 'rejected'].includes(report.status)) {
      return false;
    }
    if (
      filterStatus === 'RESOLVED' &&
      !['closed_resolved', 'resolved_pending_verification'].includes(report.status)
    ) {
      return false;
    }
    if (filterStatus === 'VERIFICATION' && report.status !== 'resolved_pending_verification') {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (report.title || '').toLowerCase().includes(q);
      const matchDesc = (report.description || '').toLowerCase().includes(q);
      const matchAddress = (report.address || '').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchAddress;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Filed Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time progress, municipal updates, and verify completed repairs.
          </p>
        </div>
        <div>
          <Link to="/citizen/report">
            <Button variant="primary" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Report New Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Reports' },
            { id: 'ACTIVE', label: 'In Progress' },
            { id: 'VERIFICATION', label: 'Needs Verification' },
            { id: 'RESOLVED', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search my reports..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="p-12 text-center bg-slate-50 border-dashed border-2 border-slate-200">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">No reports found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No reports matched your search filters.'
              : 'You have not submitted any reports in this category yet.'}
          </p>
          <div className="mt-4">
            <Link to="/citizen/report">
              <Button variant="primary" size="sm">
                File a Report Now
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const isPendingVerification = report.status === 'resolved_pending_verification';

            return (
              <Card
                key={report.id}
                className={`p-5 transition-all shadow-sm ${
                  isPendingVerification
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={report.status} />
                      <CategoryBadge category={report.category_code || report.category_name} />
                      <SlaChip
                        slaState={report.sla_state}
                        hoursRemaining={report.sla_hours_remaining}
                      />
                      {isPendingVerification && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Verify within 72 hrs
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/issues/${report.issue_id || report.id}`}
                      className="font-bold text-slate-900 hover:text-emerald-600 text-base block"
                    >
                      {report.title}
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-2">{report.description}</p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                      <span>{report.address || 'Location registered'}</span>
                      <span>•</span>
                      <span>Filed {new Date(report.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{report.support_count || 0} neighbour supports</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                    <Link to={`/issues/${report.issue_id || report.id}`}>
                      <Button
                        variant={isPendingVerification ? 'primary' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1.5"
                      >
                        {isPendingVerification ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verify Repair
                          </>
                        ) : (
                          <>
                            <span>View</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
