import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Building2,
  MapPin,
  DollarSign,
  Users,
  Target,
  FileCheck,
  Send,
  Zap,
  Terminal,
  Rocket,
  SlidersHorizontal,
  FilterX,
  ShieldCheck,
  Copy,
  Info,
  Trash2,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { JobOpportunity, AgentExecutionStep, CandidateProfile } from "../types";
import { SalaryCompensationTrendChart } from "./SalaryCompensationTrendChart";
import { DailyGoalsWidget } from "./DailyGoalsWidget";
import { ThemeId, THEMES } from "../types/theme";

export function parseSalaryRange(salaryStr?: string): { min: number; max: number; average: number } | null {
  if (!salaryStr) return null;
  const matches = [...salaryStr.matchAll(/\$?\s*(\d+(?:[.,]\d+)?)\s*(k|K|thousand)?/gi)];
  if (!matches || matches.length === 0) return null;

  const numbers: number[] = [];
  for (const m of matches) {
    const raw = m[1].replace(/,/g, "");
    let num = parseFloat(raw);
    if (isNaN(num)) continue;
    if (m[2] || num < 1000) {
      num = num * 1000;
    }
    numbers.push(num);
  }

  if (numbers.length === 0) return null;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return { min, max, average: Math.round((min + max) / 2) };
}

interface AgentConsoleProps {
  jobs: JobOpportunity[];
  steps: AgentExecutionStep[];
  isRunning: boolean;
  onRunCycle: () => void;
  candidateProfile: CandidateProfile;
  currentQuery: string;
  onApplySingleJob: (jobId: string) => void;
  activePlatforms: { linkedin: boolean; indeed: boolean };
  setActivePlatforms: React.Dispatch<React.SetStateAction<{ linkedin: boolean; indeed: boolean }>>;
  onNavigateToStretch?: () => void;
  onOpenDailyDigest?: () => void;
  batchApplyEnabled?: boolean;
  setBatchApplyEnabled?: React.Dispatch<React.SetStateAction<boolean>>;
  onExecuteBatchApply?: () => Promise<void>;
  activeThemeId?: ThemeId;
}

export const AgentConsole: React.FC<AgentConsoleProps> = ({
  jobs,
  steps,
  isRunning,
  onRunCycle,
  candidateProfile,
  currentQuery,
  onApplySingleJob,
  activePlatforms,
  setActivePlatforms,
  onNavigateToStretch,
  onOpenDailyDigest,
  batchApplyEnabled,
  setBatchApplyEnabled,
  onExecuteBatchApply,
  activeThemeId,
}) => {
  const currentTheme = THEMES[activeThemeId || "azure"] || THEMES.azure;
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(jobs[0] || null);
  const [filterPlatform, setFilterPlatform] = useState<"ALL" | "LinkedIn" | "Indeed">("ALL");
  const [minSalaryThreshold, setMinSalaryThreshold] = useState<number>(120000);
  const [salaryFilterMode, setSalaryFilterMode] = useState<"base" | "potential">("base");
  const [showDismissedDrawer, setShowDismissedDrawer] = useState<boolean>(false);
  const [internalBatchApply, setInternalBatchApply] = useState<boolean>(true);

  const isBatchApplyActive = batchApplyEnabled !== undefined ? batchApplyEnabled : internalBatchApply;
  const toggleBatchApply = () => {
    if (setBatchApplyEnabled) {
      setBatchApplyEnabled(!isBatchApplyActive);
    } else {
      setInternalBatchApply(!isBatchApplyActive);
    }
  };

  // Qualified unapplied jobs exceeding the 85% ATS score threshold
  const qualifiedBatchJobs = jobs.filter(
    (j) => (j.status === "discovered" || j.status === "tailoring") && j.atsFitScore > 85
  );

  const candidateSalaryBounds = parseSalaryRange(candidateProfile.desiredSalary);
  const candidateFloor = candidateSalaryBounds?.min || 150000;

  const appliedCount = jobs.filter((j) => j.status === "applied" || j.status === "interview").length;
  const interviewCount = jobs.filter((j) => j.status === "interview").length;
  const dismissedCount = jobs.filter((j) => j.status === "dismissed").length;
  const avgAts = Math.round(
    jobs.filter((j) => j.status !== "dismissed").reduce((acc, j) => acc + j.atsFitScore, 0) /
      (jobs.filter((j) => j.status !== "dismissed").length || 1)
  );

  // PRIMARY DISCOVERY LIST: Automatically hides dismissed jobs (<60% ATS or duplicates)
  const primaryDiscoveryJobs = jobs.filter((j) => j.status !== "dismissed");
  const dismissedJobs = jobs.filter((j) => j.status === "dismissed");

  const platformFiltered = primaryDiscoveryJobs.filter(
    (j) => filterPlatform === "ALL" || j.platform === filterPlatform
  );

  const filteredJobs = platformFiltered.filter((job) => {
    if (minSalaryThreshold <= 120000) return true;
    const bounds = parseSalaryRange(job.salaryRange);
    if (!bounds) return true;
    if (salaryFilterMode === "base") {
      return bounds.min >= minSalaryThreshold;
    } else {
      return bounds.max >= minSalaryThreshold;
    }
  });

  const hiddenJobsCount = platformFiltered.length - filteredJobs.length;
  const activeSelectedJob = filteredJobs.find((j) => j.id === selectedJob?.id) || filteredJobs[0] || null;
  const sliderPercent = Math.min(
    100,
    Math.max(0, ((minSalaryThreshold - 120000) / (220000 - 120000)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Jobs Discovered</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono">{jobs.length}</span>
            <span className="text-[10px] text-sky-400 font-semibold">Live Scrape</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">LinkedIn & Indeed</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Auto-Applied</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">{appliedCount}</span>
            <span className="text-[10px] text-emerald-300 font-medium">Unattended</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Zero human input</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Interview Screenings</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-purple-300 font-mono">{interviewCount}</span>
            <span className="text-[10px] text-purple-400 font-semibold">Active Pipeline</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">High conversion</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Avg ATS Fit Score</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">{avgAts}%</span>
            <span className="text-[10px] text-amber-300 font-semibold">Tailored</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Keyword matched</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Local Store Logs</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">{steps.length + 8}</span>
            <span className="text-[10px] text-emerald-300 font-semibold">$0.00 / Free</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">LocalStorage Key-Value</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Auto-Dismissed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-rose-400 font-mono">{dismissedCount}</span>
            <span className="text-[10px] text-rose-300 font-semibold">&lt;60% / Dupes</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Purged from queue</p>
        </div>
      </div>

      {/* Daily Application Goal & Quota Tracker Widget */}
      <DailyGoalsWidget
        jobs={jobs}
        onRunCycle={onRunCycle}
        onExecuteBatchApply={onExecuteBatchApply}
        qualifiedBatchJobsCount={qualifiedBatchJobs.length}
        isRunning={isRunning}
        activeThemeId={activeThemeId}
      />

      {/* Control Banner & Active Search Policy */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Active Feedback-Evolved Query
              </span>
              <span className="text-xs text-slate-400 font-mono">Platform: LinkedIn Easy Apply + Indeed</span>
            </div>
            <p className="font-mono text-sm sm:text-base text-sky-200 font-semibold bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
              {currentQuery}
            </p>
            <p className="text-xs text-slate-400">
              Agent filters out oversaturated postings (&gt;100 applicants), enforces minimum ATS score threshold of 80%, and tailors candidate credentials per posting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium mr-1">Target Sites:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={activePlatforms.linkedin}
                  onChange={(e) =>
                    setActivePlatforms((prev) => ({ ...prev, linkedin: e.target.checked }))
                  }
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-sky-400 font-semibold">LinkedIn</span>
              </label>
              <span className="text-slate-600">|</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={activePlatforms.indeed}
                  onChange={(e) =>
                    setActivePlatforms((prev) => ({ ...prev, indeed: e.target.checked }))
                  }
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-amber-400 font-semibold">Indeed</span>
              </label>
            </div>

            {/* Thematic, Classy & Colorful Bold Batch Apply Toggle Pod */}
            <div
              id="batch-apply-toggle-pod"
              className={`flex items-center gap-2.5 p-2 px-3 rounded-xl border transition-all duration-300 ${
                isBatchApplyActive
                  ? "bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/70 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30"
                  : "bg-slate-950/80 border-slate-800 text-slate-400"
              }`}
            >
              {/* Custom Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isBatchApplyActive}
                id="batch-apply-toggle-switch"
                onClick={toggleBatchApply}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  isBatchApplyActive
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-sm shadow-emerald-500/50"
                    : "bg-slate-800"
                }`}
                title={
                  isBatchApplyActive
                    ? "Batch Apply is ACTIVE (>85% ATS jobs auto-submit simultaneously). Click to disable."
                    : "Batch Apply is OFF. Click to enable parallel auto-submission for >85% ATS jobs."
                }
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isBatchApplyActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold tracking-tight ${
                      isBatchApplyActive ? "text-white" : "text-slate-400"
                    }`}
                  >
                    Batch Apply
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isBatchApplyActive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    &gt;85% ATS
                  </span>
                </div>
                <span className="text-[10px] leading-tight">
                  {isBatchApplyActive ? (
                    qualifiedBatchJobs.length > 0 ? (
                      <span className="text-emerald-300 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {qualifiedBatchJobs.length} qualified roles ready
                      </span>
                    ) : (
                      <span className="text-slate-400">Auto-submits &gt;85% matches</span>
                    )
                  ) : (
                    <span className="text-slate-500">Single-review mode</span>
                  )}
                </span>
              </div>

              {/* Instant Simultaneous Trigger button if qualified jobs exist */}
              {isBatchApplyActive && qualifiedBatchJobs.length > 0 && onExecuteBatchApply && (
                <button
                  id="execute-batch-apply-btn"
                  onClick={onExecuteBatchApply}
                  disabled={isRunning}
                  className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                  title="Simultaneously auto-submit to all qualified jobs with ATS score above 85%"
                >
                  <Zap className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : "fill-current"}`} />
                  <span>Submit ({qualifiedBatchJobs.length})</span>
                </button>
              )}
            </div>

            {onOpenDailyDigest && (
              <button
                id="console-daily-digest-btn"
                onClick={onOpenDailyDigest}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-white border border-indigo-500/40 hover:border-indigo-400 text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95"
                title="View 24-Hour Autonomous Daily Digest"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Daily Digest</span>
              </button>
            )}

            <button
              id="console-scroll-to-salary-chart-btn"
              onClick={() => {
                const el = document.getElementById("salary-compensation-trend-container");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-emerald-300 hover:text-white border border-emerald-500/40 hover:border-emerald-400 text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95"
              title="Inspect 30-Day D3.js Salary Compensation Trends"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Salary Trends</span>
            </button>

            <button
              id="quick-run-cycle-btn"
              onClick={onRunCycle}
              disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg transition-all disabled:opacity-50 ${
                isBatchApplyActive
                  ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-emerald-950/40"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
              }`}
            >
              <Zap className={`w-4 h-4 ${isRunning ? "animate-spin" : isBatchApplyActive ? "fill-white" : ""}`} />
              {isRunning
                ? "Autonomous Cycle In Flight..."
                : isBatchApplyActive
                ? "Trigger Batch Apply (>85% ATS)"
                : "Trigger Single Apply"}
            </button>
          </div>
        </div>
      </div>

      {/* D3.js 30-Day Market Compensation Trendline Chart */}
      <SalaryCompensationTrendChart jobs={jobs} />

      {/* Main Split Console: Left: LangGraph Execution Terminal, Right: Harvested Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: LangGraph Execution Trace & Node State */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col h-[740px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="font-mono text-xs font-semibold text-slate-300 ml-2">
                  LangGraph StateGraph Engine
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                {isRunning ? "STATE: EXECUTING_NODES" : "STATE: IDLE_AWAITING_CRON"}
              </span>
            </div>

            {/* StateGraph Flow Representation */}
            <div className="py-2.5 px-3 bg-slate-950/70 border border-slate-800/60 rounded-xl my-3 text-[11px] font-mono text-slate-400 flex items-center justify-between overflow-x-auto gap-1">
              <span className="text-indigo-400 font-semibold">QuerySynth</span>
              <span className="text-slate-600">→</span>
              <span className="text-sky-400 font-semibold">JobHarvester</span>
              <span className="text-slate-600">→</span>
              <span className="text-amber-400 font-semibold">ATSMatcher</span>
              <span className="text-slate-600">→</span>
              <span className="text-emerald-400 font-semibold">AutoApplier</span>
              <span className="text-slate-600">→</span>
              <span className="text-pink-400 font-semibold">CosmosLog</span>
            </div>

            {/* Terminal Stream */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs text-slate-300">
              {steps.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
                  <Terminal className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
                  <p>Agent is primed for execution.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Click "Execute Agent Cycle" or "Trigger Batch Apply" to initiate headless browser automation.
                  </p>
                </div>
              ) : (
                steps.map((step) => {
                  const isSuccess = step.status === "success";
                  const isRunningStep = step.status === "running";
                  const isWarning = step.status === "warning";
                  return (
                    <div
                      key={step.id}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        isRunningStep
                          ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-200 animate-pulse"
                          : isSuccess
                          ? "bg-slate-950/60 border-slate-800/80 text-slate-300"
                          : isWarning
                          ? "bg-amber-950/30 border-amber-800/50 text-amber-200"
                          : "bg-slate-950/40 border-slate-800/40 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-semibold text-slate-400 flex items-center gap-1">
                          {isRunningStep && <RotateCw className="w-2.5 h-2.5 animate-spin text-indigo-400" />}
                          {isSuccess && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                          {isWarning && <AlertCircle className="w-2.5 h-2.5 text-amber-400" />}
                          [{step.phase}]
                        </span>
                        <span>{step.timestamp}</span>
                      </div>
                      <div className="font-medium text-slate-200">{step.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{step.detail}</div>
                      {step.metadata && (
                        <div className="mt-1.5 p-1.5 bg-slate-900/90 rounded text-[10px] text-sky-300 border border-slate-800">
                          {Object.entries(step.metadata).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-slate-500">{k}:</span> {String(v)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Cosmos DB Status Bar */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cosmos DB Stream: <strong className="text-emerald-400">ONLINE</strong></span>
              </span>
              <span className="font-mono text-slate-500">Latency: 18ms | RU/s: ~3.4</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Job Discovered Feed & Application Status */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col h-[740px]">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  Discovered Target Opportunities
                  <span className="text-[11px] font-normal text-slate-400 font-mono">
                    ({filteredJobs.length} of {jobs.length})
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Headless browser scans, ATS fit calculations, and tailored dossier status.
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  {(["ALL", "LinkedIn", "Indeed"] as const).map((plat) => (
                    <button
                      key={plat}
                      onClick={() => setFilterPlatform(plat)}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        filterPlatform === plat
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>

                {/* Dismissed Drawer Toggle */}
                {dismissedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDismissedDrawer(!showDismissedDrawer)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      showDismissedDrawer
                        ? "bg-rose-950 border-rose-500 text-rose-300 shadow-sm"
                        : "bg-slate-950 border-rose-900/60 text-rose-400 hover:bg-rose-950/40 hover:border-rose-700"
                    }`}
                  >
                    <FilterX className="w-3.5 h-3.5" />
                    <span>Auto-Dismissed</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                      {dismissedCount}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Thematic & Bold Minimum Salary Threshold Slider */}
            <div className="mt-3 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-lg relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Slider Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                        Min. Expected Salary Threshold
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Filter discovered postings by minimum required compensation
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {/* Mode switch: Base Floor vs Upper Ceiling */}
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSalaryFilterMode("base")}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        salaryFilterMode === "base"
                          ? "bg-emerald-600 text-white font-bold shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      title="Requires the job's starting salary floor to meet threshold"
                    >
                      Base Floor
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalaryFilterMode("potential")}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        salaryFilterMode === "potential"
                          ? "bg-emerald-600 text-white font-bold shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      title="Requires the job's maximum salary ceiling to reach threshold"
                    >
                      Max Ceiling
                    </button>
                  </div>

                  {/* Threshold value badge */}
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/60 shadow-inner flex items-center gap-1.5">
                    <span className="text-xs font-mono font-extrabold text-emerald-300">
                      {minSalaryThreshold <= 120000 ? "Any / No Floor" : `$${Math.round(minSalaryThreshold / 1000)}k+ / yr`}
                    </span>
                  </div>

                  {minSalaryThreshold > 120000 && (
                    <button
                      type="button"
                      onClick={() => setMinSalaryThreshold(120000)}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors font-medium"
                      title="Reset salary filter"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Slider Track */}
              <div className="space-y-1.5">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    id="min-salary-slider"
                    min={120000}
                    max={220000}
                    step={5000}
                    value={minSalaryThreshold}
                    onChange={(e) => setMinSalaryThreshold(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${sliderPercent}%, #334155 ${sliderPercent}%, #1e293b 100%)`,
                    }}
                  />
                </div>

                {/* Tick markers */}
                <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                  <span className={minSalaryThreshold <= 120000 ? "text-emerald-400 font-bold" : ""}>$120k (All)</span>
                  <span className={minSalaryThreshold === candidateFloor ? "text-amber-400 font-bold" : "text-slate-400"}>
                    Target ${Math.round(candidateFloor / 1000)}k
                  </span>
                  <span>$180k</span>
                  <span className={minSalaryThreshold >= 210000 ? "text-emerald-400 font-bold" : ""}>$220k+</span>
                </div>

                {/* Quick Presets & Status */}
                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setMinSalaryThreshold(120000)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                      minSalaryThreshold <= 120000
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All Salaries
                  </button>

                  <button
                    type="button"
                    onClick={() => setMinSalaryThreshold(candidateFloor)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-colors ${
                      minSalaryThreshold === candidateFloor
                        ? "bg-amber-950/90 border-amber-500 text-amber-300 font-bold"
                        : "bg-slate-900/90 border-slate-800 text-amber-400/90 hover:text-amber-300"
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    Target (${Math.round(candidateFloor / 1000)}k)
                  </button>

                  {[160000, 175000, 190000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setMinSalaryThreshold(amt)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                        minSalaryThreshold === amt
                          ? "bg-emerald-950 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      ${Math.round(amt / 1000)}k+
                    </button>
                  ))}

                  {/* Filtered jobs feedback badge */}
                  {hiddenJobsCount > 0 ? (
                    <span className="ml-auto text-[10px] font-mono font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      {hiddenJobsCount} {hiddenJobsCount === 1 ? "job" : "jobs"} hidden below ${Math.round(minSalaryThreshold / 1000)}k
                    </span>
                  ) : (
                    <span className="ml-auto text-[10px] font-mono text-emerald-400/80">
                      Showing all {filteredJobs.length} eligible
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stretch Matrix Quick Callout */}
            {onNavigateToStretch && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-slate-300">
                    Looking for <strong className="text-rose-400">Moonshots</strong> or <strong className="text-purple-300">Step-Up Stretch</strong> roles?
                  </span>
                </div>
                <button
                  onClick={onNavigateToStretch}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-[11px] flex items-center gap-1 transition-all shrink-0"
                >
                  View Stretch Matrix <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Auto-Dismissed Low-Fit & Duplicates Drawer (if toggled) */}
            {showDismissedDrawer ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mt-2">
                <div className="p-3 rounded-xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/40 border border-rose-500/40 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold shrink-0">
                        <FilterX className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-rose-200">
                          Auto-Dismissed Garbage Filter ({dismissedJobs.length} Removed)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Low ATS fit (&lt;60%) and duplicate postings are automatically purged from the primary queue.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDismissedDrawer(false)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                    >
                      Back to Queue
                    </button>
                  </div>
                </div>

                {dismissedJobs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No dismissed jobs recorded yet.
                  </div>
                ) : (
                  dismissedJobs.map((job) => {
                    const isLowAts = job.atsFitScore < 60;
                    return (
                      <div
                        key={job.id}
                        className="p-3 rounded-xl border border-rose-900/40 bg-slate-950/70 text-slate-300 space-y-2 opacity-85 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                  job.platform === "LinkedIn"
                                    ? "bg-sky-950/80 text-sky-400 border border-sky-800/60"
                                    : "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                                }`}
                              >
                                {job.platform}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                                <FilterX className="w-3 h-3 text-rose-400" />
                                {isLowAts ? "Dismissed: ATS Below 60%" : "Dismissed: Duplicate Posting"}
                              </span>
                            </div>

                            <h4 className="text-sm font-semibold text-white mt-1">
                              {job.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                              <span className="text-slate-300 font-medium">{job.company}</span>
                              <span>{job.location}</span>
                              <span className="font-mono text-emerald-400">{job.salaryRange}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="inline-flex flex-col items-center justify-center w-11 h-11 rounded-xl border bg-rose-950/80 border-rose-600/60 text-rose-300">
                              <span className="text-xs font-mono font-bold">{job.atsFitScore}%</span>
                              <span className="text-[8px] uppercase tracking-tighter opacity-80">ATS</span>
                            </div>
                          </div>
                        </div>

                        {/* Dismissal Reason */}
                        <div className="bg-slate-900/80 border border-rose-900/40 rounded-lg p-2 text-xs flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-rose-300">Auto-Dismissal Reason: </span>
                            <span className="text-slate-300">
                              {job.dismissalReason || (isLowAts ? "ATS score below 60% quality baseline." : "Identified as redundant duplicate.")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
            /* Jobs List */
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mt-2">
              {/* Thematic, Classy & Colorful Bold Batch Apply Alert Banner */}
              {isBatchApplyActive && qualifiedBatchJobs.length > 0 && (
                <div
                  id="batch-apply-status-banner"
                  className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/50 shadow-md flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0 shadow-inner">
                      <Zap className="w-4 h-4 fill-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          Batch Apply Active
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          &gt;85% ATS Matches ({qualifiedBatchJobs.length})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Agent automatically submits all roles simultaneously once they hit the 85% ATS threshold.
                      </p>
                    </div>
                  </div>

                  {onExecuteBatchApply && (
                    <button
                      id="batch-apply-banner-action-btn"
                      onClick={onExecuteBatchApply}
                      disabled={isRunning}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : "fill-slate-950"}`} />
                      <span>Submit All ({qualifiedBatchJobs.length})</span>
                    </button>
                  )}
                </div>
              )}

              {filteredJobs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      No jobs meet the ${Math.round(minSalaryThreshold / 1000)}k+ minimum threshold
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      All discovered opportunities under this platform fall below your current{" "}
                      {salaryFilterMode === "base" ? "guaranteed base salary" : "maximum potential"} requirement.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setMinSalaryThreshold(candidateFloor)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                    >
                      Reset to Target (${Math.round(candidateFloor / 1000)}k)
                    </button>
                    <button
                      onClick={() => setMinSalaryThreshold(120000)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                      Show All Salaries
                    </button>
                  </div>
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const isSelected = activeSelectedJob?.id === job.id;
                  const isApplied = job.status === "applied";
                  const isInterview = job.status === "interview";
                  const isRejected = job.status === "rejected";
                  const parsedSalary = parseSalaryRange(job.salaryRange);
                  const meetsThreshold =
                    parsedSalary &&
                    minSalaryThreshold > 120000 &&
                    (salaryFilterMode === "base"
                      ? parsedSalary.min >= minSalaryThreshold
                      : parsedSalary.max >= minSalaryThreshold);

                  const isQualifiedForBatch =
                    isBatchApplyActive &&
                    (job.status === "discovered" || job.status === "tailoring") &&
                    job.atsFitScore > 85;

                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-slate-850 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30"
                          : isQualifiedForBatch
                          ? "bg-slate-950/80 border-emerald-500/40 hover:border-emerald-400 hover:bg-slate-900/80 shadow-sm shadow-emerald-950/30"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                job.platform === "LinkedIn"
                                   ? "bg-sky-950 text-sky-300 border border-sky-800/80"
                                   : "bg-amber-950 text-amber-300 border border-amber-800/80"
                              }`}
                            >
                              {job.platform} Easy Apply
                            </span>

                            {isInterview && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 animate-pulse">
                                ★ Interview Callback
                              </span>
                            )}
                            {isApplied && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Auto-Applied
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/80 flex items-center gap-1">
                                <AlertCircle className="w-2.5 h-2.5" /> Rejected Pattern Logged
                              </span>
                            )}
                            {job.status === "discovered" && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                Discovered (In Queue)
                              </span>
                            )}
                            {isQualifiedForBatch && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-emerald-950 to-cyan-950 text-emerald-300 border border-emerald-500/60 shadow-sm flex items-center gap-1 animate-pulse">
                                <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                                &gt;85% ATS • Batch Apply Ready
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-semibold text-white mt-1.5 hover:text-indigo-300 transition-colors">
                            {job.title}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1 text-slate-300 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {job.company}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {job.location}
                            </span>
                            <span
                              className={`flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border transition-colors ${
                                meetsThreshold
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/60 font-bold shadow-sm"
                                  : "bg-slate-900/80 text-emerald-400 border-slate-800"
                              }`}
                            >
                              <DollarSign className="w-3 h-3 text-emerald-400" />
                              {job.salaryRange}
                              {meetsThreshold && (
                                <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-emerald-300 ml-1">
                                  {salaryFilterMode === "base" && parsedSalary.min > minSalaryThreshold
                                    ? `+$${Math.round((parsedSalary.min - minSalaryThreshold) / 1000)}k above`
                                    : "Meets Target"}
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <Users className="w-3 h-3" />
                              {job.applicantCount} applicants
                            </span>
                          </div>
                        </div>

                        {/* ATS Fit Circle Badge */}
                        <div className="text-right shrink-0">
                          <div
                            className={`inline-flex flex-col items-center justify-center w-12 h-12 rounded-xl border ${
                              job.atsFitScore >= 90
                                ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300"
                                : job.atsFitScore >= 80
                                ? "bg-sky-950/60 border-sky-500/60 text-sky-300"
                                : "bg-rose-950/60 border-rose-500/60 text-rose-300"
                            }`}
                          >
                            <span className="text-xs font-mono font-bold leading-none">{job.atsFitScore}%</span>
                            <span className="text-[9px] uppercase tracking-tighter opacity-80 mt-0.5">ATS</span>
                          </div>
                        </div>
                      </div>

                      {/* Tailored Dossier Snippet / Action info */}
                      {job.tailoredSummarySnippet && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-amber-300">Agent Tailoring:</strong> {job.tailoredSummarySnippet}
                          </span>
                        </div>
                      )}

                      {/* Keywords preview */}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {job.matchedKeywords.slice(0, 4).map((kw) => (
                          <span
                            key={kw}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                        {job.missingKeywords.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/50 text-rose-300 border border-rose-800/60">
                            - {job.missingKeywords[0]}
                          </span>
                        )}
                        {job.status === "discovered" && (
                          <div className="ml-auto flex items-center gap-1.5">
                            {isQualifiedForBatch && onExecuteBatchApply && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExecuteBatchApply();
                                }}
                                disabled={isRunning}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 flex items-center gap-1 shadow-sm transition-all disabled:opacity-50"
                                title="Auto-submit this and all other qualified jobs (>85% ATS) simultaneously in parallel"
                              >
                                <Zap className="w-2.5 h-2.5 fill-slate-950" /> Batch Submit All
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onApplySingleJob(job.id);
                              }}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors"
                            >
                              <Send className="w-2.5 h-2.5" /> Single Apply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            )}

            {/* Selected Job Drawer Detail */}
            {activeSelectedJob && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{activeSelectedJob.title}</span>
                  <span className="text-slate-400">at {activeSelectedJob.company}</span>
                  <span className="text-emerald-400 font-mono font-bold">({activeSelectedJob.salaryRange})</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={activeSelectedJob.easyApplyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    Listing Link <ExternalLink className="w-3 h-3" />
                  </a>
                  {activeSelectedJob.status === "discovered" && (
                    <button
                      onClick={() => onApplySingleJob(activeSelectedJob.id)}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px]"
                    >
                      Trigger Headless Easy Apply
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
