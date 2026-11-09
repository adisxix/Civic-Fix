import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  Heart,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useGetMyReportsQuery, useGetIssuesQuery } from '../../features/api/civicApi';
import { useAppSelector } from '../../app/hooks';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatCard from '../../components/shared/StatCard';
import StatusBadge from '../../components/shared/StatusBadge';
import CategoryBadge from '../../components/shared/CategoryBadge';
import SlaChip from '../../components/shared/SlaChip';

export default function CitizenDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: myReportsData, isLoading: loadingReports } = useGetMyReportsQuery();
  const myReports = myReportsData?.reports || [];

  // Filter nearby issues in user's ward or default
  const { data: wardIssuesData } = useGetIssuesQuery({
    ward_id: user?.ward_id || undefined,
    limit: 4,
  });
  const nearbyIssues = wardIssuesData?.issues || [];

  // Calculations for StatCards
  const totalReports = myReports.length;
  const resolvedReports = myReports.filter((r) =>
    ['closed_resolved', 'resolved_pending_verification'].includes(r.status),
  ).length;
  const inProgressReports = myReports.filter((r) =>
    ['acknowledged', 'assigned', 'in_progress'].includes(r.status),
  ).length;
  const totalSupports = myReports.reduce((acc, r) => acc + (r.support_count || 0), 0);

  // Issues pending citizen verification
  const pendingVerificationIssues = myReports.filter(
    (r) => r.status === 'resolved_pending_verification',
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 mb-2">
            Citizen Dashboard • {user?.ward_name || `Ward ${user?.ward_id || 'All'}`}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.full_name || 'Citizen'}!
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Track your neighbourhood reports, verify repairs carried out by municipal crews, and
            help improve your city.
          </p>
        </div>
        <div>
          <Link to="/citizen/report">
            <Button
              variant="secondary"
              className="bg-white text-emerald-800 hover:bg-emerald-50 border-0 shadow-lg shadow-black/10 flex items-center gap-2 font-semibold px-5 py-3"
            >
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              Report Civic Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Verification Alert Banner if any issue is pending verification */}
      {pendingVerificationIssues.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-5 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-amber-900">
                Action Required: {pendingVerificationIssues.length} report
                {pendingVerificationIssues.length > 1 ? 's' : ''} marked resolved!
              </h3>
              <p className="text-sm text-amber-800 mt-0.5">
                Municipal crews have finished repairs. Please review the after photos and confirm or
                reopen within 72 hours.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingVerificationIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    to={`/issues/${issue.issue_id || issue.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold transition-colors"
                  >
                    <span>{issue.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports Filed"
          value={totalReports}
          icon={FileText}
          description="Reports created by you"
        />
        <StatCard
          title="Resolved by Crew"
          value={resolvedReports}
          icon={CheckCircle2}
          description="Fixed & completed issues"
        />
        <StatCard
          title="In Active Progress"
          value={inProgressReports}
          icon={Clock}
          description="Currently scheduled / ongoing"
        />
        <StatCard
          title="Community Support"
          value={totalSupports}
          icon={Heart}
          description="Upvotes from neighbours"
        />
      </div>

      {/* Main Split: My Reports vs Ward Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: My Reports */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">My Recent Reports</h2>
            <Link
              to="/citizen/reports"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View all ({totalReports}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingReports ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : myReports.length === 0 ? (
            <Card className="p-8 text-center bg-slate-50 border-dashed border-2 border-slate-200">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-700">No reports filed yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Spotted a pothole, broken streetlight, or garbage dump? Submit a report in 60
                seconds with photo & location.
              </p>
              <div className="mt-4">
                <Link to="/citizen/report">
                  <Button variant="primary" size="sm">
                    Report an Issue
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {myReports.slice(0, 5).map((report) => (
                <Card
                  key={report.id}
                  className="p-4 hover:border-slate-300 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={report.status} />
                        <CategoryBadge category={report.category_code || report.category_name} />
                        <SlaChip
                          slaState={report.sla_state}
                          hoursRemaining={report.sla_hours_remaining}
                        />
                      </div>
                      <Link
                        to={`/issues/${report.issue_id || report.id}`}
                        className="font-semibold text-slate-900 hover:text-emerald-600 line-clamp-1 block text-sm"
                      >
                        {report.title}
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {report.address || 'Location registered'} • Filed{' '}
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <Link
                      to={`/issues/${report.issue_id || report.id}`}
                      className="shrink-0 p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="View issue details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Ward Overview & Fast Actions */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Around Your Ward</h3>
            <p className="text-xs text-slate-500 mb-4">
              Issues recently reported in your neighbourhood. Support existing issues to speed up
              municipal prioritization.
            </p>

            <div className="space-y-3">
              {nearbyIssues.map((issue) => (
                <Link
                  key={issue.id}
                  to={`/issues/${issue.id}`}
                  className="block p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-700">
                      {issue.ward_name || `Ward ${issue.ward_id}`}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                      {issue.support_count || 0}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 line-clamp-1">
                    {issue.title}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <Link
                to="/feed"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Browse Public Community Feed →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
