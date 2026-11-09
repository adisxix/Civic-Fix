import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { BarChart3, CheckCircle2, Clock, MapPin, Award } from 'lucide-react';
import {
  useGetAnalyticsOverviewQuery,
  useGetAnalyticsCategoriesQuery,
  useGetAnalyticsTimeseriesQuery,
  useGetAnalyticsScorecardQuery,
  useGetAnalyticsHotspotsQuery,
  useGetAnalyticsAgeingQuery,
} from '../../features/api/civicApi';
import Card from '../../components/ui/Card';
import StatCard from '../../components/shared/StatCard';
import IllustrativeDataBadge from '../../components/shared/IllustrativeDataBadge';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function WardAnalyticsPage() {
  const { data: overviewData } = useGetAnalyticsOverviewQuery();
  const { data: categoriesData } = useGetAnalyticsCategoriesQuery();
  const { data: timeseriesData } = useGetAnalyticsTimeseriesQuery(30);
  const { data: scorecardData } = useGetAnalyticsScorecardQuery();
  const { data: hotspotsData } = useGetAnalyticsHotspotsQuery();
  const { data: ageingData } = useGetAnalyticsAgeingQuery();

  const overview = overviewData?.data || overviewData || {};
  const categories = categoriesData?.data || categoriesData || [];
  const timeseries = timeseriesData?.data || timeseriesData || [];
  const scorecard = scorecardData?.data || scorecardData || {};
  const hotspots = hotspotsData?.data || hotspotsData || [];
  const ageing = ageingData?.data || ageingData || {};

  // Doughnut: Category Distribution
  const categoryLabels = categories.map((c) => c.category_name || c.name || 'Other');
  const categoryCounts = categories.map((c) => c.issue_count || c.count || 0);

  const doughnutData = {
    labels:
      categoryLabels.length > 0
        ? categoryLabels
        : ['Roads & Potholes', 'Sanitation', 'Streetlights', 'Water Supply'],
    datasets: [
      {
        data: categoryCounts.length > 0 ? categoryCounts : [45, 30, 20, 15],
        backgroundColor: [
          '#10b981', // emerald
          '#06b6d4', // cyan
          '#f59e0b', // amber
          '#6366f1', // indigo
          '#ec4899', // pink
          '#8b5cf6', // purple
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Line: 30-Day Activity Trend
  const timeLabels = timeseries.map((t) => t.date || t.day);
  const reportedCounts = timeseries.map((t) => t.reported_count || t.reported || 0);
  const resolvedCounts = timeseries.map((t) => t.resolved_count || t.resolved || 0);

  const lineData = {
    labels:
      timeLabels.length > 0
        ? timeLabels
        : ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
    datasets: [
      {
        label: 'Issues Reported',
        data: reportedCounts.length > 0 ? reportedCounts : [12, 19, 15, 25, 22, 30, 28],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Issues Resolved',
        data: resolvedCounts.length > 0 ? resolvedCounts : [8, 14, 18, 20, 26, 29, 32],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Bar: Issue Ageing Buckets
  const ageingDataConfig = {
    labels: ['< 24 Hours', '24 - 72 Hours', '3 - 7 Days', '> 7 Days'],
    datasets: [
      {
        label: 'Unresolved Issues in Queue',
        data: [
          ageing.under_24h || 14,
          ageing.between_24_72h || 22,
          ageing.between_3_7d || 8,
          ageing.over_7d || 3,
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Ward Operations Analytics</h1>
            <IllustrativeDataBadge />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time performance metrics, SLA compliance, ageing queues, and neighbourhood
            hotspots.
          </p>
        </div>
      </div>

      {/* Overview StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Issues Logged"
          value={overview.total_issues || 184}
          icon={BarChart3}
          description="Cumulative ward tickets"
        />
        <StatCard
          title="SLA Compliance Rate"
          value={`${overview.sla_compliance_rate || 91.4}%`}
          icon={CheckCircle2}
          description="Resolved within SLA limit"
        />
        <StatCard
          title="Avg. Resolution Time"
          value={`${overview.avg_resolution_hours || 34.2}h`}
          icon={Clock}
          description="From report to citizen signoff"
        />
        <StatCard
          title="Citizen Verification Rate"
          value={`${scorecard.citizen_verification_rate || 88.5}%`}
          icon={Award}
          description="Confirmed fixed by residents"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown Doughnut */}
        <Card className="p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Issue Volume by Category</h3>
          <p className="text-xs text-slate-400">Department distribution breakdown</p>
          <div className="h-64 flex items-center justify-center pt-2">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* 30-Day Activity Trend */}
        <Card className="p-5 shadow-sm space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                30-Day Trend: Reported vs Resolved
              </h3>
              <p className="text-xs text-slate-400">
                Comparing intake rate to crew resolution output
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Net Positive Closure
            </span>
          </div>
          <div className="h-64 pt-2">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 11 } },
                  },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* Second Row: Ageing Buckets & Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ageing Queue Bar Chart */}
        <Card className="p-5 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Queue Ageing Breakdown</h3>
            <p className="text-xs text-slate-400">Identifies stalled or high-delay civic issues</p>
          </div>
          <div className="h-60 pt-2">
            <Bar
              data={ageingDataConfig}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </Card>

        {/* Hotspots Ranking Table */}
        <Card className="p-5 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Problem Hotspots</h3>
            <p className="text-xs text-slate-400">
              Neighbourhood areas with highest density of reports
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Location / Area</th>
                  <th className="py-2.5 px-3">Top Category</th>
                  <th className="py-2.5 px-3 text-right">Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(hotspots.length > 0
                  ? hotspots
                  : [
                      { area: '100 Feet Road, Indiranagar', category: 'Potholes', count: 28 },
                      { area: 'CMH Road Metro Junction', category: 'Streetlights', count: 19 },
                      { area: 'Old Airport Road Bus Bay', category: 'Garbage Dump', count: 14 },
                      { area: 'Defence Colony Main Gate', category: 'Water Supply', count: 9 },
                    ]
                ).map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{h.area || h.address}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{h.category || h.category_name}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {h.count || h.issue_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
