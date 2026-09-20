import React, { useState } from "react";
import {
  Calendar,
  Sparkles,
  TrendingUp,
  X,
  Target,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Zap,
  BarChart3,
  Award,
  Layers,
  ArrowUpRight,
  Filter,
  DollarSign,
  Briefcase,
  Copy,
  Clock,
  Send,
  Building2,
} from "lucide-react";
import { JobOpportunity, CandidateProfile, QueryIteration, RejectionLog, StretchRoleAnalysis } from "../types";

interface DailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobOpportunity[];
  rejections: RejectionLog[];
  iterations: QueryIteration[];
  candidateProfile: CandidateProfile;
  stretchAnalyses: StretchRoleAnalysis[];
  onNavigateToTab?: (tab: string) => void;
}

export const DailyDigestModal: React.FC<DailyDigestModalProps> = ({
  isOpen,
  onClose,
  jobs,
  rejections,
  iterations,
  candidateProfile,
  stretchAnalyses,
  onNavigateToTab,
}) => {
  const [activeDigestSection, setActiveDigestSection] = useState<"all" | "applications" | "ats" | "rejections">("all");
  const [copiedKeyMetrics, setCopiedKeyMetrics] = useState(false);

  if (!isOpen) return null;

  // Filter 24h activity
  // Applications submitted or interviewed in the cycle/24h period
  const applied24h = jobs.filter(
    (j) => j.status === "applied" || j.status === "interview"
  );
  const interview24h = jobs.filter((j) => j.status === "interview");
  const dismissed24h = jobs.filter((j) => j.status === "dismissed");
  const discovered24h = jobs.filter((j) => j.status !== "dismissed");

  // Rejections from recent logs (within the latest iteration cycle / last 24h)
  const recentRejections = rejections.slice(0, 5);

  // Group rejections by category
  const rejectionsByCategory = recentRejections.reduce((acc, rej) => {
    acc[rej.category] = (acc[rej.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ATS Calculations: average ATS of submitted vs queued vs initial
  const appliedAtsAvg = Math.round(
    applied24h.reduce((sum, j) => sum + j.atsFitScore, 0) / (applied24h.length || 1)
  );
  const overallAtsAvg = Math.round(
    discovered24h.reduce((sum, j) => sum + j.atsFitScore, 0) / (discovered24h.length || 1)
  );

  // ATS uplift computation
  const baseAts = 72; // baseline before LangChain prompt evolution
  const currentAts = appliedAtsAvg || 92;
  const atsImprovementDelta = Math.max(0, currentAts - baseAts);

  // Key keywords added or compensated
  const currentIter = iterations[iterations.length - 1] || iterations[0];
  const boostedKeywords = currentIter?.targetKeywordBoosts || ["Terraform", "Apache Kafka", "Kubernetes Helm"];

  const handleCopySummary = () => {
    const text = `=== Autonomous Job Agent: 24h Executive Digest ===
Candidate: ${candidateProfile.name} (${candidateProfile.role})
Time Horizon: Last 24 Hours
- Applications Submitted: ${applied24h.length} (${interview24h.length} interview callbacks)
- Average Applied ATS Score: ${currentAts}% (+${atsImprovementDelta}% uplift vs baseline)
- Jobs Scanned & Filtered: ${jobs.length} (${dismissed24h.length} low-fit/duplicates purged)
- Query Generation: Iteration ${currentIter.iteration} ("${currentIter.query}")
- Top Rejection Reason: ${recentRejections[0]?.category.replace(/_/g, " ") || "Oversaturated Pool"}
- Auto-Boosted Keywords: ${boostedKeywords.join(", ")}
===================================================`;
    navigator.clipboard.writeText(text);
    setCopiedKeyMetrics(true);
    setTimeout(() => setCopiedKeyMetrics(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-0.5 shadow-lg shadow-indigo-500/25 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  24-Hour Autonomous Agent Daily Digest
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Live Snapshot
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consolidated audit of headless applications, ATS keyword evolution, and rejection learning loops.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/80"
              title="Copy executive summary to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedKeyMetrics ? "Copied Digest!" : "Copy Report"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-2 overflow-x-auto text-xs relative z-10">
          <div className="flex items-center gap-1.5">
            {[
              { id: "all", label: "Executive Overview", icon: BarChart3 },
              { id: "applications", label: `Applications (${applied24h.length})`, icon: Send },
              { id: "ats", label: `ATS & Feedback (+${atsImprovementDelta}%)`, icon: TrendingUp },
              { id: "rejections", label: `Rejection Patterns (${recentRejections.length})`, icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDigestSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDigestSection(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
            Cycle: <strong className="text-white">Iteration #{currentIter.iteration}</strong>
          </span>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative z-10">
          {/* Top 4 Key Metric Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Metric 1: Applied */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Applications Sent</span>
                <Send className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-black text-emerald-400 font-mono">{applied24h.length}</span>
                <span className="text-[11px] text-emerald-300 font-semibold">100% Tailored</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {interview24h.length} converted to interview screens
              </p>
            </div>

            {/* Metric 2: ATS Improvement */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Avg Tailored ATS</span>
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-black text-indigo-300 font-mono">{currentAts}%</span>
                <span className="text-[11px] text-emerald-400 font-bold font-mono">+{atsImprovementDelta}% uplift</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">vs 72% baseline unoptimized resume</p>
            </div>

            {/* Metric 3: Rejections Evolved */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Rejections Analyzed</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-black text-rose-300 font-mono">{recentRejections.length}</span>
                <span className="text-[10px] text-rose-400 font-semibold font-mono">Patterns Classed</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Fed into query evolver loop</p>
            </div>

            {/* Metric 4: Auto-Dismissed Noise */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Noise Purged</span>
                <Filter className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-black text-purple-300 font-mono">{dismissed24h.length}</span>
                <span className="text-[10px] text-purple-300 font-semibold font-mono">&lt;60% / Dupes</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Preserved high candidate conversion</p>
            </div>
          </div>

          {/* Section 1: Executive Summary Callout */}
          {(activeDigestSection === "all" || activeDigestSection === "applications") && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      24-Hour Autonomous Operational Summary
                    </h4>
                    <span className="text-xs text-slate-400">
                      System running continuously on Azure Container Apps with Cosmos DB checkpointing
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                    Win Rate: {currentIter.conversionRate}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-sky-400" />
                    Target Discovery Velocity
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Evaluated <strong>{jobs.length} postings</strong> across LinkedIn and Indeed. Dismissed <strong>{dismissed24h.length} low-fit items</strong> (&lt;60% ATS or duplicates) to keep the pipeline pristine.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    Adaptive ATS Tuning
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Elevated ATS pass rate from <strong>72% to {currentAts}%</strong> (+{atsImprovementDelta}% improvement) by dynamically injecting <em>{boostedKeywords.slice(0, 2).join(" and ")}</em>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    Step-Up Growth Momentum
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Identified <strong>{stretchAnalyses.filter((s) => s.tier === "STEP_UP").length} Step-Up Stretch opportunities</strong> with average 44% conversion probability and +$25k salary upside.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Applications Activity Log */}
          {(activeDigestSection === "all" || activeDigestSection === "applications") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  Applications Executed in the Last 24 Hours ({applied24h.length})
                </h4>
                {onNavigateToTab && (
                  <button
                    onClick={() => {
                      onNavigateToTab("agent");
                      onClose();
                    }}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
                  >
                    Open Live Feed <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {applied24h.map((job) => {
                  const isInterview = job.status === "interview";
                  return (
                    <div
                      key={job.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isInterview
                          ? "bg-purple-950/40 border-purple-500/70 shadow-md shadow-purple-950/30"
                          : "bg-slate-950/70 border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
                                job.platform === "LinkedIn"
                                  ? "bg-sky-950 text-sky-300 border border-sky-800/80"
                                  : "bg-amber-950 text-amber-300 border border-amber-800/80"
                              }`}
                            >
                              {job.platform}
                            </span>
                            {isInterview ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 animate-pulse">
                                ★ Interview Callback
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Auto-Applied ({job.appliedTimestamp || "24h ago"})
                              </span>
                            )}
                          </div>

                          <h5 className="text-sm font-bold text-white mt-1.5">
                            {job.title}
                          </h5>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="text-slate-300 font-medium flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {job.company}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400">{job.salaryRange}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="inline-flex flex-col items-center justify-center w-11 h-11 rounded-xl border bg-emerald-950/80 border-emerald-500/60 text-emerald-300">
                            <span className="text-xs font-mono font-bold leading-none">{job.atsFitScore}%</span>
                            <span className="text-[8px] uppercase tracking-tighter opacity-80 mt-0.5">ATS</span>
                          </div>
                        </div>
                      </div>

                      {/* Tailored Summary Snippet */}
                      {job.tailoredSummarySnippet && (
                        <div className="mt-2.5 p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 italic">
                          "{job.tailoredSummarySnippet}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: ATS Improvements & Evolution */}
          {(activeDigestSection === "all" || activeDigestSection === "ats") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  ATS Optimization & Keyword Evolution Breakdown
                </h4>
                {onNavigateToTab && (
                  <button
                    onClick={() => {
                      onNavigateToTab("feedback");
                      onClose();
                    }}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
                  >
                    View Feedback Loop <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                {/* Progress bar comparison */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Candidate Baseline Profile Match:</span>
                    <span className="font-mono text-slate-400">72% ATS baseline</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600 rounded-full" style={{ width: "72%" }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-indigo-300 font-semibold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      Current Autonomous Tailored Average:
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{currentAts}% ATS (+{atsImprovementDelta}% uplift)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-indigo-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full"
                      style={{ width: `${currentAts}%` }}
                    />
                  </div>
                </div>

                {/* Key Boosted Technologies Injected */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    Compensatory Keywords Automatically Synthesized into Dossier:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {boostedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-200 border border-indigo-700/60 text-xs font-mono font-medium flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {kw}
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 text-xs font-mono">
                      + Azure Container Apps
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 text-xs font-mono">
                      + Cosmos DB Partitioning
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Rejection Analyses & Countermeasures */}
          {(activeDigestSection === "all" || activeDigestSection === "rejections") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Rejection Pattern Ingestion & Corrective Strategy
                </h4>
                {onNavigateToTab && (
                  <button
                    onClick={() => {
                      onNavigateToTab("rejections");
                      onClose();
                    }}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
                  >
                    Open Classifier <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Categorization distribution badges */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(rejectionsByCategory).map(([cat, count]) => (
                  <span
                    key={cat}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/60 text-xs font-mono flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <strong>{cat.replace(/_/g, " ")}</strong>: {count} {count === 1 ? "flag" : "flags"}
                  </span>
                ))}
              </div>

              {/* Detailed rejection items */}
              <div className="space-y-2">
                {recentRejections.map((rej) => (
                  <div
                    key={rej.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-rose-900/40 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{rej.role}</span>
                          <span className="text-slate-400">at {rej.company}</span>
                          <span className="font-mono text-[10px] text-slate-500">({rej.platform})</span>
                        </div>
                        <p className="text-slate-300 italic text-[11px] mt-0.5">
                          "{rej.snippet}"
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono shrink-0">
                        {rej.confidence}% Match Confidence
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300">Automated System Adjustment: </strong>
                        <span className="text-slate-300">{rej.recommendedAdjustment}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800/90 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 relative z-10 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry logged to Azure Cosmos DB: partitionKey = '{candidateProfile.email}'</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close Digest
            </button>
            {onNavigateToTab && (
              <button
                onClick={() => {
                  onNavigateToTab("feedback");
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>Review Next Evolved Query</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
