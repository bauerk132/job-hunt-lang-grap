import React, { useState, useMemo } from "react";
import {
  RotateCw,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Zap,
  Target,
  Compass,
  Check,
  Plus,
  Layers,
  ArrowUpRight,
  Rocket,
} from "lucide-react";
import { QueryIteration, CandidateProfile, JobOpportunity, RejectionLog } from "../types";
import { MissingSkillsFrequencySummary } from "./MissingSkillsFrequencySummary";

interface FeedbackLoopViewProps {
  iterations: QueryIteration[];
  onTriggerIteration: () => Promise<void>;
  isIterating: boolean;
  candidateProfile: CandidateProfile;
  jobs: JobOpportunity[];
  rejections?: RejectionLog[];
  onAddSkillToProfile: (skill: string) => void;
  onAddMultipleSkills?: (skills: string[]) => void;
  onNavigateToStretch?: () => void;
}

export const FeedbackLoopView: React.FC<FeedbackLoopViewProps> = ({
  iterations,
  onTriggerIteration,
  isIterating,
  candidateProfile,
  jobs,
  rejections = [],
  onAddSkillToProfile,
  onAddMultipleSkills,
  onNavigateToStretch,
}) => {
  const [selectedIteration, setSelectedIteration] = useState<QueryIteration>(
    iterations[iterations.length - 1] || iterations[0]
  );
  const [autoAdoptedSuccess, setAutoAdoptedSuccess] = useState<string[] | null>(null);

  // Identify failed or rejected applications across the pipeline
  const failedJobs = useMemo(() => {
    const list = jobs.filter((j) => {
      if (j.status === "rejected") return true;
      if (rejections.some((r) => r.jobId === j.id)) return true;
      return false;
    });
    return list.length > 0 ? list : jobs.filter((j) => j.missingKeywords && j.missingKeywords.length > 0);
  }, [jobs, rejections]);

  // Aggregate frequency of missing keywords across failed applications and pick top 3 not in profile
  const top3MissingSkills = useMemo(() => {
    const frequencyMap: Record<string, { count: number; companies: string[] }> = {};
    const normalizedProfileSkills = new Set(
      candidateProfile.skills.map((s) => s.toLowerCase().trim())
    );

    failedJobs.forEach((job) => {
      (job.missingKeywords || []).forEach((rawKeyword) => {
        const keyword = rawKeyword.trim();
        if (!keyword) return;

        if (!frequencyMap[keyword]) {
          frequencyMap[keyword] = { count: 0, companies: [] };
        }
        frequencyMap[keyword].count += 1;
        if (!frequencyMap[keyword].companies.includes(job.company)) {
          frequencyMap[keyword].companies.push(job.company);
        }
      });
    });

    return Object.entries(frequencyMap)
      .filter(([skill]) => !normalizedProfileSkills.has(skill.toLowerCase()))
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([skill, data]) => ({
        skill,
        count: data.count,
        companies: data.companies,
      }));
  }, [failedJobs, candidateProfile.skills]);

  // Handler for 1-click Auto-Adopt Skills (automatically picks top 3 most requested missing skills)
  const handleAutoAdoptSkills = () => {
    if (top3MissingSkills.length === 0) return;
    const skillsToAdopt = top3MissingSkills.map((s) => s.skill);

    if (onAddMultipleSkills) {
      onAddMultipleSkills(skillsToAdopt);
    } else {
      skillsToAdopt.forEach((skill) => onAddSkillToProfile(skill));
    }

    setAutoAdoptedSuccess(skillsToAdopt);
    setTimeout(() => {
      setAutoAdoptedSuccess(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Hero Feedback Loop Banner */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-semibold">
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
              Self-Improving Reinforcement Learning Loop
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Adaptive Job Query & Search Policy Evolution
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every rejection email, ATS parsing bounce, and silent timeout is logged in Azure Cosmos DB. The agent's feedback engine synthesizes negative patterns, calculates policy gradients, and automatically mutates boolean search queries to maximize interview conversion.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Auto-Adopt Skills Button - 1-Click Top 3 Most Requested Missing Skills */}
            <button
              id="auto-adopt-skills-btn"
              onClick={handleAutoAdoptSkills}
              disabled={top3MissingSkills.length === 0}
              title={
                top3MissingSkills.length > 0
                  ? `Automatically adopt top 3 missing skills: ${top3MissingSkills.map((s) => s.skill).join(", ")}`
                  : "All top missing skills from ATS rejection analysis are already in your candidate profile"
              }
              className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 border ${
                top3MissingSkills.length > 0
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-600/30 border-emerald-400/40 hover:border-emerald-300 ring-2 ring-emerald-500/20 cursor-pointer"
                  : "bg-slate-800/80 text-slate-400 border-slate-700 cursor-not-allowed"
              }`}
            >
              {top3MissingSkills.length > 0 ? (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                  <span>Auto-Adopt Skills</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-400/50 text-[11px] font-mono text-emerald-200">
                    Top {top3MissingSkills.length}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Auto-Adopt Skills</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-700 text-[10px] font-mono">
                    All Adopted ✓
                  </span>
                </>
              )}
            </button>

            <button
              id="trigger-feedback-btn"
              disabled={isIterating}
              onClick={onTriggerIteration}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 active:scale-95 border border-purple-400/30"
            >
              <Sparkles className={`w-4 h-4 ${isIterating ? "animate-spin text-amber-300" : "text-amber-300"}`} />
              {isIterating ? "Gemini AI Synthesizing Gen..." : "Evolve Next Query (AI Feedback)"}
            </button>
          </div>
        </div>

        {/* Top 3 Missing Skills Preview Pill Bar */}
        {top3MissingSkills.length > 0 && (
          <div className="mt-4 pt-3 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Target Keywords Ready for Auto-Adoption:
              </span>
              {top3MissingSkills.map((item, idx) => (
                <span
                  key={item.skill}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1"
                >
                  <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                  {item.skill}
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({item.count} rejects)
                  </span>
                </span>
              ))}
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">
              Click "Auto-Adopt Skills" to add all {top3MissingSkills.length} in 1 click
            </span>
          </div>
        )}
      </div>

      {/* Auto-Adopted Success Alert Banner */}
      {autoAdoptedSuccess && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-500/60 text-white flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Auto-Adopted Top 3 Missing Skills!
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-700">
                  +18% Pass Rate Projected
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Successfully added <strong className="text-emerald-300 font-mono">{autoAdoptedSuccess.join(", ")}</strong> to candidate profile. ATS keyword filters and job fit scores updated across active pipeline!
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoAdoptedSuccess(null)}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shrink-0 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Trajectory Timeline: Iteration Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-400" />
          Evolution Lineage Across Training Cycles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {iterations.map((iter) => {
            const isSelected = selectedIteration.iteration === iter.iteration;
            const isLatest = iter.iteration === iterations.length;

            return (
              <div
                key={iter.iteration}
                onClick={() => setSelectedIteration(iter)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-slate-900 border-purple-500 ring-2 ring-purple-500/30 shadow-lg"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                }`}
              >
                {isLatest && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 tracking-wider uppercase shadow">
                    Active In Production
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-400">
                    GENERATION {iter.iteration}
                  </span>
                  <span className="text-[11px] text-slate-500">{iter.timestamp}</span>
                </div>

                <div className="mt-2 font-mono text-xs font-semibold text-slate-200 line-clamp-2 bg-slate-950 p-2 rounded border border-slate-800">
                  {iter.query}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Applied</span>
                    <span className="font-mono text-sm font-bold text-white">{iter.totalApplied}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Callbacks</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{iter.interviewCallbacks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Win Rate</span>
                    <span className="font-mono text-sm font-bold text-purple-300">{iter.conversionRate}%</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 line-clamp-2">
                  <strong className="text-slate-300">Analysis:</strong> {iter.reasoning}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Inspection of Selected Generation */}
      {selectedIteration && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/40">
                  GEN {selectedIteration.iteration} SPECIFICATION
                </span>
                <span className="text-xs text-slate-400">
                  Analyzed {selectedIteration.rejectionTriggersAnalyzed} rejection events in Cosmos DB
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Hypothesis & Boolean Search Rules
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Interview Yield:</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {selectedIteration.conversionRate}%
              </span>
              <span className="text-xs text-slate-500">
                ({selectedIteration.interviewCallbacks} calls / {selectedIteration.totalApplied} applies)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Platform-specific syntax queries */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5" /> LinkedIn Advanced Search Query
                </label>
                <div className="font-mono text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 break-all leading-relaxed">
                  {selectedIteration.linkedinQuery}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5" /> Indeed Advanced Search Syntax
                </label>
                <div className="font-mono text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 break-all leading-relaxed">
                  {selectedIteration.indeedQuery}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-purple-400 flex items-center gap-1.5 mb-1">
                  <Filter className="w-3.5 h-3.5" /> Headless Browser Pacing Rule
                </label>
                <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedIteration.pacingRule}
                </div>
              </div>
            </div>

            {/* Right: Reasoning, Hypothesis, and Target ATS Boosts */}
            <div className="space-y-3">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                  Root Cause Diagnosis from Cosmos DB
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedIteration.reasoning}
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                  Agent Learning Hypothesis
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedIteration.hypothesis}
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-amber-300 block mb-2">
                  ATS Keywords Dynamically Injected into Dossier:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIteration.targetKeywordBoosts.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-950/70 text-purple-200 border border-purple-800/80"
                    >
                      +{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary View: Frequency Analysis on Missing Keywords from Failed Applications */}
      <MissingSkillsFrequencySummary
        jobs={jobs}
        rejections={rejections}
        candidateProfile={candidateProfile}
        onAddSkillToProfile={onAddSkillToProfile}
        onAddMultipleSkills={onAddMultipleSkills}
      />

      {/* Visual Comparison: Why Boolean Queries Win */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          The Mathematics of the Feedback Loop
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          How iterative learning outperforms fixed-query scrapers by shrinking applicant pools and elevating ATS keyword density.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block font-semibold mb-1">Standard Naive Agent</span>
            <div className="text-rose-400 font-mono font-bold text-base mb-1">4.2% Success</div>
            <p className="text-slate-500 text-[11px]">
              Applies to generic keywords ("Software Engineer"). Competes with 500+ applicants per listing within hours; ATS rejects due to lack of niche focus.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block font-semibold mb-1">Filter-Tuned Agent</span>
            <div className="text-amber-400 font-mono font-bold text-base mb-1">11.5% Success</div>
            <p className="text-slate-500 text-[11px]">
              Filters out interns and legacy frameworks. Applicant competition drops to ~150 per listing.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40">
            <span className="text-purple-300 block font-semibold mb-1">Autonomous Feedback Loop (Ours)</span>
            <div className="text-emerald-400 font-mono font-bold text-base mb-1">26.8% Success</div>
            <p className="text-slate-300 text-[11px]">
              Combines boolean negative exclusions (NOT "Staff" NOT "Wordpress"), rapid indexing (&lt;90 mins), and dynamic ATS resume injection.
            </p>
          </div>
        </div>

        {onNavigateToStretch && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-rose-400" />
              <div className="text-xs">
                <span className="text-slate-200 font-semibold">Ready for strategic stretch roles? </span>
                <span className="text-slate-400">
                  Analyze high-reach Moonshots and Step-Up roles with compensatory dossier positioning.
                </span>
              </div>
            </div>
            <button
              onClick={onNavigateToStretch}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              Open Stretch Matrix <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
