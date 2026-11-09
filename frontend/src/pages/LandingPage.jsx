import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  CheckCircle2,
  Users,
  Compass,
  Wrench,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IllustrativeDataBadge } from '../components/shared/IllustrativeDataBadge';
import { useGetPublicStatsQuery } from '../features/api/civicApi';

export function LandingPage() {
  const navigate = useNavigate();
  const { data: statsData } = useGetPublicStatsQuery();
  const stats = statsData?.data || {
    issuesCount: 42,
    reportsCount: 128,
    supportersCount: 310,
    resolvedCount: 24,
    verifiedClosurePercent: 88,
  };

  return (
    <div className="space-y-16 py-8 md:py-16">
      {/* 1. Hero Section */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-soft text-forest-800 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-forest-700 animate-pulse" />
            01 / Ward 14 Live Pilot
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-ink tracking-tight leading-tight">
            Turning local problems into{' '}
            <span className="underline decoration-lime decoration-4">visible action.</span>
          </h1>

          <p className="text-lg md:text-xl text-moss font-medium">
            Report once. Unite neighbourhood voices. Track every action.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              variant="lime"
              size="lg"
              onClick={() => navigate('/app/report')}
              className="text-ink shadow-md"
            >
              Report an issue <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/issues')}
              className="bg-white"
            >
              <Compass className="w-4 h-4 text-forest-800" /> Browse your ward
            </Button>
          </div>

          {/* Live Platform Stats Pill */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-sage-300 text-left">
            <div>
              <div className="text-2xl font-black text-forest-800">{stats.issuesCount}</div>
              <div className="text-xs text-moss font-medium">Active Issues</div>
            </div>
            <div>
              <div className="text-2xl font-black text-forest-800">{stats.supportersCount}</div>
              <div className="text-xs text-moss font-medium">Neighbour Backers</div>
            </div>
            <div>
              <div className="text-2xl font-black text-forest-800">
                {stats.verifiedClosurePercent}%
              </div>
              <div className="text-xs text-moss font-medium">Verified Closures</div>
            </div>
          </div>
        </div>

        {/* Hero Card Preview #CF-024 */}
        <div className="lg:col-span-5">
          <div className="bg-forest-800 text-paper p-6 rounded-3xl border border-forest-600 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-lime font-bold uppercase tracking-wider">
                Ward 14 / Live Issue Preview
              </span>
              <IllustrativeDataBadge />
            </div>

            <div className="bg-white text-ink p-5 rounded-2xl border border-sage-300 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="code-chip px-2 py-0.5 font-bold bg-mist text-forest-800 rounded">
                  #CF-024
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200">
                  Assigned to Roads
                </span>
              </div>

              <h3 className="font-bold text-base text-ink">
                Large pothole near market junction on 8th Main
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-moss">
                <Users className="w-4 h-4 text-forest-700" />
                <span className="font-bold text-forest-800">12 nearby residents</span> support this
                issue
              </div>

              <div className="p-2.5 rounded-xl bg-mist/60 text-xs text-forest-800 flex items-center justify-between">
                <span className="flex items-center gap-1 font-semibold">
                  <Wrench className="w-3.5 h-3.5 text-forest-700" /> Inspection complete
                </span>
                <span className="text-[11px] font-mono text-moss">SLA on track</span>
              </div>
            </div>

            <div className="text-xs text-sage-200 flex items-center justify-between pt-1">
              <span>Neighbourhood cluster (5 reports merged)</span>
              <span className="text-lime font-mono">Ward 14 Central</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Context Stats Section (Exact wording per SPEC 1) */}
      <section className="bg-white border-y border-sage-300 py-12">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="text-xs font-bold uppercase tracking-widest text-forest-700">
            02 / The Reality of City Grievances
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-sage-200 bg-paper/50 p-6 space-y-2">
              <div className="text-3xl md:text-4xl font-extrabold text-danger">66,459</div>
              <p className="text-sm text-ink font-semibold">
                grievances reopened by Hyderabad citizens after GHMC staff closed them without
                attending to them.
              </p>
            </Card>

            <Card className="border-sage-200 bg-paper/50 p-6 space-y-2">
              <div className="text-3xl md:text-4xl font-extrabold text-signal">3 cities</div>
              <p className="text-sm text-ink font-semibold">
                Hyderabad, Bengaluru and Pune officials have each acknowledged tickets being closed
                without a fix.
              </p>
            </Card>

            <Card className="border-sage-200 bg-paper/50 p-6 space-y-2">
              <div className="text-3xl md:text-4xl font-extrabold text-forest-800">600M people</div>
              <p className="text-sm text-ink font-semibold">
                projected to live in India's towns and cities by 2036 (40% of the population), so
                the load only grows.
              </p>
            </Card>
          </div>

          <p className="text-xs text-moss italic pt-2">
            Source line: Deccan Chronicle (GHMC reopened grievances); Deccan Herald (BBMP Sahaaya
            2.0); Punekar News, 26 Jun 2026 (PMC Care); Economic Survey 2025-26 citing World Bank
            (PIB).
          </p>
        </div>
      </section>

      {/* 3. Where Experience Breaks Down & Callout */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-xs font-bold uppercase tracking-widest text-forest-700">
          03 / Where The Experience Breaks Down
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-sage-300 space-y-2">
            <div className="w-7 h-7 rounded-full bg-lime text-ink font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="font-bold text-sm">Isolated Filing</h4>
            <p className="text-xs text-moss">
              Residents file the same pothole or broken light repeatedly as disconnected tickets.
            </p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-sage-300 space-y-2">
            <div className="w-7 h-7 rounded-full bg-lime text-ink font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="font-bold text-sm">Fragmented Routing</h4>
            <p className="text-xs text-moss">
              Ownership spans several municipal departments with nobody owning the street view.
            </p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-sage-300 space-y-2">
            <div className="w-7 h-7 rounded-full bg-lime text-ink font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="font-bold text-sm">No Area Picture</h4>
            <p className="text-xs text-moss">
              Ward staff cannot see repeat hotspots or cumulative neighbourhood urgency.
            </p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-sage-300 space-y-2">
            <div className="w-7 h-7 rounded-full bg-lime text-ink font-bold flex items-center justify-center text-xs">
              4
            </div>
            <h4 className="font-bold text-sm">Unverified Closures</h4>
            <p className="text-xs text-moss">
              Tickets get marked closed on paper without physical work, forcing citizens to dispute.
            </p>
          </div>
        </div>

        <div className="p-4 bg-lime-soft rounded-xl border border-lime text-forest-800 text-sm font-bold text-center">
          Make the neighbourhood the unit of visibility, not the single ticket.
        </div>
      </section>

      {/* 4. Solution Block: CAPTURE -> CONNECT -> RESOLVE */}
      <section className="bg-forest-800 text-paper py-16">
        <div className="max-w-6xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="text-xs font-mono uppercase tracking-wider text-lime font-semibold">
              04 / One Shared Framework
            </div>
            <h2 className="text-3xl font-extrabold text-white">Capture. Connect. Resolve.</h2>
            <p className="text-sm text-sage-200">
              One shared record per physical issue across all city departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-forest-700/80 p-6 rounded-2xl border border-forest-600 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-lime text-ink flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="text-lg font-bold text-white">CAPTURE</h3>
              <p className="text-xs text-sage-200 leading-relaxed">
                Guided citizen reporting on mobile: single photo, GPS coordinates, category, and
                short description with instant AI assist.
              </p>
            </div>

            <div className="bg-forest-700/80 p-6 rounded-2xl border border-forest-600 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-lime text-ink flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="text-lg font-bold text-white">CONNECT</h3>
              <p className="text-xs text-sage-200 leading-relaxed">
                Similar nearby reports automatically group into one visible neighbourhood issue with
                multiple supporters backing it.
              </p>
            </div>

            <div className="bg-forest-700/80 p-6 rounded-2xl border border-forest-600 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-lime text-ink flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="text-lg font-bold text-white">RESOLVE</h3>
              <p className="text-xs text-sage-200 leading-relaxed">
                Ward console triage with named team ownership, completion photo evidence, and
                citizen-confirmed fix verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 5-Step Workflow with "Assist, don't decide." panel */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-forest-700">
              05 / The Central Workflow
            </div>
            <h2 className="text-2xl font-bold text-ink">
              Report → AI Assist → Cluster → Route → Verify
            </h2>
          </div>
          <div className="p-3 bg-forest-800 text-lime rounded-xl text-xs font-mono font-bold">
            Operating rule: Assist, don't decide.
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="p-4 bg-white rounded-xl border border-sage-300 space-y-1">
            <span className="font-bold text-forest-800">1. Report</span>
            <p className="text-moss">Citizen submits photo and coordinates.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-sage-300 space-y-1">
            <span className="font-bold text-forest-800">2. AI Assist</span>
            <p className="text-moss">AI suggests category & searches duplicates.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-sage-300 space-y-1">
            <span className="font-bold text-forest-800">3. Cluster</span>
            <p className="text-moss">Neighbours back existing ticket instead of new ones.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-sage-300 space-y-1">
            <span className="font-bold text-forest-800">4. Route</span>
            <p className="text-moss">Ward lead assigns to department officer.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-sage-300 space-y-1">
            <span className="font-bold text-forest-800">5. Verify</span>
            <p className="text-moss">Residents confirm fix with before/after evidence.</p>
          </div>
        </div>
      </section>

      {/* 6. Positioning: "Build on what works" */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-xs font-bold uppercase tracking-widest text-forest-700">
          06 / Build On What Works
        </div>
        <Card className="p-6 md:p-8 space-y-4 bg-mist/40">
          <h3 className="text-xl font-bold text-ink">
            CivicFix complements existing civic tools, it does not replace them.
          </h3>
          <p className="text-sm text-moss leading-relaxed">
            City complaint apps (BBMP Sahaaya, MyGHMC, PMC Care), Swachhata (Janaagraha) and
            FixMyStreet (mySociety) are real and effective. CivicFix introduces unified
            cross-department clustering, duplicate detection, resident-verified closure with photo
            proof, and a ward performance scorecard.
          </p>
        </Card>
      </section>

      {/* 7. Four Trust Cards */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-xs font-bold uppercase tracking-widest text-forest-700">
          07 / Principles & Data Integrity
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-5 space-y-2">
            <Lock className="w-5 h-5 text-forest-800" />
            <h4 className="font-bold text-sm">Privacy by Design</h4>
            <p className="text-xs text-moss">
              Public endpoints never leak reporter name, phone, or email. EXIF and GPS stripped from
              uploads.
            </p>
          </Card>
          <Card className="p-5 space-y-2">
            <Sparkles className="w-5 h-5 text-forest-800" />
            <h4 className="font-bold text-sm">Human-Reviewed AI</h4>
            <p className="text-xs text-moss">
              AI only suggests. Ward staff confirm routing, priority, and citizen verification
              confirms closure.
            </p>
          </Card>
          <Card className="p-5 space-y-2">
            <CheckCircle2 className="w-5 h-5 text-forest-800" />
            <h4 className="font-bold text-sm">Evidence & Verification</h4>
            <p className="text-xs text-moss">
              Work proof required before verification. Linked residents confirm or reopen tickets.
            </p>
          </Card>
          <Card className="p-5 space-y-2">
            <Shield className="w-5 h-5 text-forest-800" />
            <h4 className="font-bold text-sm">Abuse Prevention</h4>
            <p className="text-xs text-moss">
              Rate limits, duplicate text spam heuristics, and ward moderation queue protect data
              integrity.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
