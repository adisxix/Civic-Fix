import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Compass,
  TrendingUp,
  Sparkles,
  Layers,
  Clock,
  ThumbsUp,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useGetPublicStatsQuery } from '../features/api/civicApi';
import { CivicFixLogo } from '../components/shared/CivicFixLogo';

export function LandingPage() {
  const navigate = useNavigate();
  const { data: statsData } = useGetPublicStatsQuery();
  const stats = statsData?.data || {
    issuesCount: 47,
    reportsCount: 104,
    supportersCount: 97,
    resolvedCount: 28,
    verifiedClosurePercent: 91,
  };

  return (
    <div className="space-y-20 py-6 md:py-12">
      {/* 1. Modern Civic Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-soft text-forest-800 text-xs font-bold border border-lime/50 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Ward 14 Pilot • Real-Time Civic Transparency</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink tracking-tight leading-tight">
              Turning local problems into{' '}
              <span className="relative inline-block text-forest-800 underline decoration-lime decoration-wavy decoration-2">
                verified action.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-moss font-medium leading-relaxed max-w-2xl">
              Report potholes, streetlights, and civic bottlenecks in seconds. Groq AI unites
              duplicate complaints into powerful neighbourhood voices, and city workers prove their
              fixes with before/after photos.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="lime"
                size="lg"
                onClick={() => navigate('/citizen/report')}
                className="text-ink font-bold shadow-md hover:shadow-lg transition-all"
              >
                Report an Issue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/feed')}
                className="bg-white hover:bg-mist text-ink border-sage-300 font-semibold"
              >
                <Compass className="w-4 h-4 text-forest-800 mr-1" /> Explore Live Map
              </Button>
            </div>

            {/* Quick Stats Pill */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-sage-200">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-forest-800">
                  {stats.issuesCount}
                </div>
                <div className="text-xs text-moss font-medium mt-0.5">Tracked Issues</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-forest-800">
                  {stats.supportersCount}
                </div>
                <div className="text-xs text-moss font-medium mt-0.5">Neighbour Upvotes</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-forest-800">
                  {stats.verifiedClosurePercent}%
                </div>
                <div className="text-xs text-moss font-medium mt-0.5">Citizen-Verified</div>
              </div>
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Subtle background glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-lime/40 to-emerald-500/30 rounded-3xl blur-xl opacity-70 -z-10" />

              <div className="bg-white text-ink p-6 rounded-3xl border border-sage-300 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-mist text-forest-800 rounded-lg border border-sage-300">
                      #CF-024
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      Assigned to Roads
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-moss font-mono">Ward 14 Central</span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-lg text-ink leading-snug">
                    Large road crater on 8th Main near Market junction
                  </h3>
                  <p className="text-xs text-moss leading-relaxed">
                    Heavy monsoon runoff washed away asphalt; two two-wheelers skidded this morning.
                  </p>
                </div>

                {/* Groq AI Badge */}
                <div className="p-3 rounded-xl bg-lime-soft/70 border border-lime/60 flex items-center justify-between text-xs text-forest-800">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-forest-700" />
                    Groq AI Cluster
                  </span>
                  <span className="font-semibold text-[11px]">5 duplicate reports merged</span>
                </div>

                {/* Community Signal Indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-sage-200 text-xs">
                  <div className="flex items-center gap-1.5 text-forest-800 font-bold">
                    <Users className="w-4 h-4 text-forest-700" />
                    <span>12 residents backed this issue</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Work in progress
                  </div>
                </div>

                {/* Interactive CTA simulation */}
                <button
                  onClick={() => navigate('/issues/24')}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-forest-800 hover:bg-forest-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-lime" /> Support this neighbourhood issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Pillars / Product Features */}
      <section className="bg-white border-y border-sage-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-forest-700">
              Why CivicFix Works
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
              Fixing the broken loop between citizens & city halls
            </p>
            <p className="text-sm sm:text-base text-moss">
              Traditional municipal portals isolate complaints into separate tickets that get
              silently closed. CivicFix changes the game with four key innovations:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 space-y-3 bg-paper/50 border-sage-200 hover:shadow-lg transition-all rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-forest-800 text-lime flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-ink">AI Duplicate Clustering</h3>
              <p className="text-xs text-moss leading-relaxed">
                Groq AI analyzes GPS coordinates and natural language descriptions to group
                duplicate tickets into unified neighbourhood problems.
              </p>
            </Card>

            <Card className="p-6 space-y-3 bg-paper/50 border-sage-200 hover:shadow-lg transition-all rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-forest-800 text-lime flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-ink">Citizen-Verified Closure</h3>
              <p className="text-xs text-moss leading-relaxed">
                Tickets cannot be closed from behind a desk. Officers upload completion photos, and
                residents confirm the resolution before tickets close.
              </p>
            </Card>

            <Card className="p-6 space-y-3 bg-paper/50 border-sage-200 hover:shadow-lg transition-all rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-forest-800 text-lime flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-ink">Strict SLA Accountability</h3>
              <p className="text-xs text-moss leading-relaxed">
                Real-time timers by category (potholes: 72h, lights: 48h). Overdue tickets trigger
                automatic department escalations visible to the ward lead.
              </p>
            </Card>

            <Card className="p-6 space-y-3 bg-paper/50 border-sage-200 hover:shadow-lg transition-all rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-forest-800 text-lime flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-ink">Community Voice Multiplier</h3>
              <p className="text-xs text-moss leading-relaxed">
                Instead of filing 20 tickets for the same problem, neighbours tap "Support". Higher
                backing ranks issues directly to the top of the triage queue.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. The 3-Step Guided Citizen Journey */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-forest-700">
            How It Works
          </h2>
          <p className="text-3xl font-extrabold text-ink tracking-tight">
            From complaint to confirmed fix in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="p-6 bg-white rounded-2xl border border-sage-300 shadow-sm space-y-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-lime text-ink font-black flex items-center justify-center text-sm shadow-xs">
              1
            </div>
            <h3 className="font-bold text-base text-ink">Snap & Drop Pin</h3>
            <p className="text-xs text-moss leading-relaxed">
              Capture a photo, pick your exact street on the map, and write a quick description.
              Groq AI auto-detects the category and prechecks for nearby duplicates.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-sage-300 shadow-sm space-y-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-lime text-ink font-black flex items-center justify-center text-sm shadow-xs">
              2
            </div>
            <h3 className="font-bold text-base text-ink">Neighbours Rally</h3>
            <p className="text-xs text-moss leading-relaxed">
              Your issue appears instantly on the ward map. Nearby neighbours back the complaint
              with 1 click, turning isolated reports into high-priority community tasks.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-sage-300 shadow-sm space-y-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-lime text-ink font-black flex items-center justify-center text-sm shadow-xs">
              3
            </div>
            <h3 className="font-bold text-base text-ink">Inspect & Verify</h3>
            <p className="text-xs text-moss leading-relaxed">
              The assigned municipal team works on site and uploads proof. You inspect the
              before/after photos and give the final sign-off, or reopen if unfinished.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Municipal Operations Banner */}
      <section className="bg-forest-800 text-white rounded-3xl max-w-7xl mx-auto p-8 sm:p-12 border border-forest-600 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-700 text-lime text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-lime" /> Built for Ward Teams
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Are you a municipal officer or field worker?
            </h2>
            <p className="text-sm text-sage-200 leading-relaxed max-w-2xl">
              Access the triage console to assign departments (Roads, Sanitation, Lighting, Water),
              manage SLAs, publish public updates, and attach closure evidence.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
            <Button
              variant="lime"
              size="lg"
              onClick={() => navigate('/login')}
              className="text-ink font-bold w-full"
            >
              Open Ward Console <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/ward/analytics')}
              className="bg-forest-700/60 hover:bg-forest-700 text-white border-forest-600 w-full font-semibold"
            >
              <TrendingUp className="w-4 h-4 text-lime mr-1" /> View Ward Scorecard
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Clean Footer CTA */}
      <section className="text-center py-8 space-y-4 max-w-2xl mx-auto px-4">
        <CivicFixLogo size={42} showText={true} />
        <p className="text-sm text-moss font-medium">
          Report once. Unite neighbourhood voices. Track every action.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="lime"
            onClick={() => navigate('/citizen/report')}
            className="text-ink font-bold"
          >
            Report an Issue Now
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            className="bg-white text-ink border-sage-300"
          >
            Sign In with Demo Account
          </Button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
