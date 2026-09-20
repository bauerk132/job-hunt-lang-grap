import React, { useState, useMemo } from "react";
import {
  Rocket,
  Compass,
  Target,
  Zap,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Sliders,
  Building,
  Award,
  BookOpen,
  Send,
  HelpCircle,
  Clock,
  Briefcase,
  FileText,
  PieChart,
} from "lucide-react";
import { JobOpportunity, CandidateProfile, StretchRoleAnalysis, StretchTier } from "../types";

interface StretchAnalysisViewProps {
  candidateProfile: CandidateProfile;
  jobs: JobOpportunity[];
  stretchAnalyses: StretchRoleAnalysis[];
  onApplyStretchJob: (analysis: StretchRoleAnalysis) => void;
  onAddSkillToProfile: (skill: string) => void;
}

export const StretchAnalysisView: React.FC<StretchAnalysisViewProps> = ({
  candidateProfile,
  jobs,
  stretchAnalyses,
  onApplyStretchJob,
  onAddSkillToProfile,
}) => {
  const [selectedTier, setSelectedTier] = useState<"ALL" | StretchTier>("ALL");
  const [activeAnalysisId, setActiveAnalysisId] = useState<string>(stretchAnalyses[0]?.id || "");
  const [showPitchModal, setShowPitchModal] = useState<StretchRoleAnalysis | null>(null);
  const [appliedStretchIds, setAppliedStretchIds] = useState<Set<string>>(new Set());

  // Interactive Simulator State
  const [customTitle, setCustomTitle] = useState("");
  const [customYoE, setCustomYoE] = useState("8");
  const [customKeywords, setCustomKeywords] = useState("Terraform, Apache Kafka, Distributed Systems");
  const [simulationResult, setSimulationResult] = useState<StretchRoleAnalysis | null>(null);

  // Group analyses by tier
  const tierCounts = useMemo(() => {
    return {
      ALL: stretchAnalyses.length,
      MOONSHOT: stretchAnalyses.filter((s) => s.tier === "MOONSHOT").length,
      STEP_UP: stretchAnalyses.filter((s) => s.tier === "STEP_UP").length,
      CORE_TARGET: stretchAnalyses.filter((s) => s.tier === "CORE_TARGET").length,
    };
  }, [stretchAnalyses]);

  // Filtered list
  const filteredAnalyses = useMemo(() => {
    if (selectedTier === "ALL") return stretchAnalyses;
    return stretchAnalyses.filter((s) => s.tier === selectedTier);
  }, [stretchAnalyses, selectedTier]);

  const activeAnalysis = useMemo(() => {
    return stretchAnalyses.find((s) => s.id === activeAnalysisId) || filteredAnalyses[0] || stretchAnalyses[0];
  }, [stretchAnalyses, activeAnalysisId, filteredAnalyses]);

  // Handle stretch apply simulation
  const handleApply = (analysis: StretchRoleAnalysis) => {
    setAppliedStretchIds((prev) => new Set(prev).add(analysis.id));
    onApplyStretchJob(analysis);
  };

  // Run Custom Stretch Role Simulation
  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const reqYoE = parseInt(customYoE, 10) || 6;
    const expDelta = candidateProfile.yearsOfExperience - reqYoE;
    const reqKeywords = customKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const profileSkillsLower = new Set(candidateProfile.skills.map((s) => s.toLowerCase()));
    const missing = reqKeywords.filter((k) => !profileSkillsLower.has(k.toLowerCase()));
    const matched = reqKeywords.filter((k) => profileSkillsLower.has(k.toLowerCase()));

    // Determine tier
    let tier: StretchTier = "CORE_TARGET";
    let estimatedProbability = 82;
    let atsFitScore = 90;

    if (expDelta <= -3 || missing.length >= 3) {
      tier = "MOONSHOT";
      estimatedProbability = 14;
      atsFitScore = Math.max(45, 65 + expDelta * 3 - missing.length * 4);
    } else if (expDelta <= -1 || missing.length >= 1) {
      tier = "STEP_UP";
      estimatedProbability = 44;
      atsFitScore = Math.max(65, 82 + expDelta * 4 - missing.length * 3);
    }

    const sim: StretchRoleAnalysis = {
      id: `sim-${Date.now()}`,
      title: customTitle.trim() || "Prospective Target Role",
      company: "Target Tech Frontier",
      platform: "LinkedIn",
      salaryRange: tier === "MOONSHOT" ? "$190k - $240k" : tier === "STEP_UP" ? "$165k - $195k" : "$150k - $175k",
      tier,
      atsFitScore,
      estimatedProbability,
      experienceRequired: reqYoE,
      experienceDelta: expDelta,
      missingSkills: missing.length > 0 ? missing : ["Deep Domain Specialization"],
      matchedSkills: matched.length > 0 ? matched : candidateProfile.skills.slice(0, 4),
      aspirationalAppeal:
        tier === "MOONSHOT"
          ? "Ambitious leap role outside immediate current qualifications, testing your career ceiling."
          : tier === "STEP_UP"
          ? "Strategic growth stepping-stone offering elevated leadership and salary upside."
          : "High-probability in-pocket match with immediate interview velocity.",
      skillGapsExplanation:
        tier === "MOONSHOT"
          ? `Strict filter on ${reqYoE}+ years tenure (${Math.abs(expDelta)} yrs ahead) and deficit in: ${missing.join(", ")}.`
          : tier === "STEP_UP"
          ? `Requires ${reqYoE} years with moderate deficit in: ${missing.join(", ")}. Highly bridgeable.`
          : "Near-zero skill gap; candidate exceeds baseline requirements.",
      compensatoryStrengths: [
        `Extensive production cloud work on Azure and Cosmos DB (${candidateProfile.yearsOfExperience} yrs)`,
        "High-velocity LangChain agent and modern microservices architecture",
        "Full-stack end-to-end delivery speed and autonomous problem solving",
      ],
      bridgeStrategy:
        tier === "MOONSHOT"
          ? "Reposition 6 years as high-density architecture ownership; emphasize rapid adoption velocity and production deployments."
          : "Address missing tools directly in summary bullet points by presenting functional equivalents (e.g. Cosmos DB event feeds for Kafka).",
      customPitchAngle: `I combine ${candidateProfile.yearsOfExperience} years of proven cloud architecture execution with modern agent orchestration, bridging theoretical design with shipped code.`,
      recommendedApplicationPriority: tier === "STEP_UP" ? "HIGH" : tier === "MOONSHOT" ? "EXPERIMENTAL" : "BALANCED",
    };

    setSimulationResult(sim);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header with Thematic Classy Bold Palette */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-indigo-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold">
              <Rocket className="w-3.5 h-3.5 text-rose-400" />
              Strategic Career Navigation • Stretch & Step-Up Application Matrix
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Stretch Application Feasibility & Bridge Analysis
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Analyze roles that stretch beyond your current skills and tenure. Balance high-aim <strong className="text-rose-400">Moonshots</strong> (aspirational targets not fully aligned with your current profile) with high-ROI <strong className="text-purple-300">Step-Up Roles</strong> (positions you're more likely to land than moonshots, but less easily than core shoe-ins).
            </p>
          </div>

          {/* Quick Portfolio Health Metric */}
          <div className="flex flex-col items-end gap-2">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">
                Recommended Portfolio Ratio
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-xs font-mono font-bold">
                  20% Moonshot
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 text-xs font-mono font-bold">
                  50% Step-Up
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold">
                  30% Core
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stratification Cards: The Three Tiers Explained */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 relative z-10">
          {/* Tier 1: Moonshot */}
          <div
            onClick={() => setSelectedTier("MOONSHOT")}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedTier === "MOONSHOT"
                ? "bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/50"
                : "bg-slate-950/80 border-slate-800 hover:border-rose-500/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold font-mono uppercase">
                Tier 1: Moonshot
              </span>
              <Rocket className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
              Great Aims & Reaches
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Roles not yet lined up with current skills or YoE (e.g. Principal Architect, VP of Infra). High aspiration, testing your ceiling.
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Interview Odds:</span>
              <span className="font-mono font-bold text-rose-400">10% - 20%</span>
            </div>
          </div>

          {/* Tier 2: Step-Up Growth */}
          <div
            onClick={() => setSelectedTier("STEP_UP")}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedTier === "STEP_UP"
                ? "bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50"
                : "bg-slate-950/80 border-slate-800 hover:border-purple-500/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold font-mono uppercase">
                Tier 2: Step-Up Growth
              </span>
              <Compass className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
              The Step-Up Sweet Spot
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              More likely to get than moonshots, but less easy than core shoe-ins (e.g. Lead Cloud Developer, Staff Platform). High ROI.
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Interview Odds:</span>
              <span className="font-mono font-bold text-purple-300">35% - 55%</span>
            </div>
          </div>

          {/* Tier 3: Core Target */}
          <div
            onClick={() => setSelectedTier("CORE_TARGET")}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedTier === "CORE_TARGET"
                ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50"
                : "bg-slate-950/80 border-slate-800 hover:border-emerald-500/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold font-mono uppercase">
                Tier 3: Core Target
              </span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
              In-Pocket Baseline
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Directly aligned with current profile (Senior Full Stack, Azure, Cosmos DB). High velocity, baseline momentum.
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Interview Odds:</span>
              <span className="font-mono font-bold text-emerald-400">75% - 90%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Master List + Detailed Dossier Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Role Selector & Filters (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Categorized Applications ({filteredAnalyses.length})
            </h3>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              {(["ALL", "MOONSHOT", "STEP_UP", "CORE_TARGET"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2 py-1 rounded-lg font-medium transition-all ${
                    selectedTier === tier
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tier === "ALL" ? "All" : tier === "MOONSHOT" ? "Moonshots" : tier === "STEP_UP" ? "Step-Up" : "Core"}
                  <span className="ml-1 text-[10px] opacity-75">({tierCounts[tier]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredAnalyses.map((item) => {
              const isSelected = item.id === activeAnalysis.id;
              const isApplied = appliedStretchIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveAnalysisId(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? item.tier === "MOONSHOT"
                        ? "bg-rose-950/50 border-rose-500 shadow-md shadow-rose-950/40"
                        : item.tier === "STEP_UP"
                        ? "bg-purple-950/50 border-purple-500 shadow-md shadow-purple-950/40"
                        : "bg-emerald-950/50 border-emerald-500 shadow-md shadow-emerald-950/40"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Tier Indicator Pill */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        item.tier === "MOONSHOT"
                          ? "bg-rose-950 text-rose-300 border-rose-800"
                          : item.tier === "STEP_UP"
                          ? "bg-purple-950 text-purple-300 border-purple-800"
                          : "bg-emerald-950 text-emerald-300 border-emerald-800"
                      }`}
                    >
                      {item.tier === "MOONSHOT" ? "🚀 Moonshot Reach" : item.tier === "STEP_UP" ? "⚡ Step-Up Stretch" : "🎯 Core Target"}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-slate-300">
                      {item.salaryRange}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {item.company} • {item.platform}
                  </p>

                  {/* Odds and Experience Delta */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1 font-mono">
                      <span>Odds:</span>
                      <strong
                        className={`font-bold ${
                          item.estimatedProbability < 25
                            ? "text-rose-400"
                            : item.estimatedProbability < 60
                            ? "text-purple-300"
                            : "text-emerald-400"
                        }`}
                      >
                        {item.estimatedProbability}%
                      </strong>
                    </span>

                    <span className="font-mono">
                      {item.experienceDelta < 0 ? (
                        <span className="text-amber-400">
                          {Math.abs(item.experienceDelta)} yr exp stretch
                        </span>
                      ) : (
                        <span className="text-emerald-400">Qualifies ({item.experienceRequired}y req)</span>
                      )}
                    </span>

                    {isApplied && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Tailored Applied
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In-Depth Stretch Analysis Dossier (7 cols) */}
        <div className="lg:col-span-7">
          {activeAnalysis ? (
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                      activeAnalysis.tier === "MOONSHOT"
                        ? "bg-rose-950/80 text-rose-300 border-rose-700"
                        : activeAnalysis.tier === "STEP_UP"
                        ? "bg-purple-950/80 text-purple-300 border-purple-700"
                        : "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                    }`}
                  >
                    {activeAnalysis.tier === "MOONSHOT"
                      ? "TIER 1: MOONSHOT / DREAM REACH"
                      : activeAnalysis.tier === "STEP_UP"
                      ? "TIER 2: STEP-UP GROWTH STRETCH"
                      : "TIER 3: CORE TARGET FIT"}
                  </span>

                  <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/60">
                    ATS Score: {activeAnalysis.atsFitScore}%
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mt-2.5 tracking-tight">
                  {activeAnalysis.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {activeAnalysis.company}
                  </span>
                  <span>•</span>
                  <span>{activeAnalysis.platform}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono font-bold">{activeAnalysis.salaryRange}</span>
                  <span>•</span>
                  <span className="font-mono">
                    Required YoE: <strong className="text-white">{activeAnalysis.experienceRequired} yrs</strong> (You have: {candidateProfile.yearsOfExperience} yrs)
                  </span>
                </div>
              </div>

              {/* Aspirational Why & Appeal */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs space-y-1">
                <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Aspirational Appeal (Why this matters to your trajectory):
                </div>
                <p className="text-slate-200 leading-relaxed italic">
                  "{activeAnalysis.aspirationalAppeal}"
                </p>
              </div>

              {/* The Honest Gap: Skills & Experience Deficit */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  The Stretch Gap (Why ATS filters drop or hesitate)
                </h4>
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-2">
                  <p className="text-slate-300 leading-relaxed">
                    {activeAnalysis.skillGapsExplanation}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-semibold text-rose-400">Missing ATS Criteria:</span>
                    {activeAnalysis.missingSkills.map((ms) => (
                      <span
                        key={ms}
                        className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-mono flex items-center gap-1"
                      >
                        {ms}
                        <button
                          title={`Add ${ms} to candidate profile`}
                          onClick={() => onAddSkillToProfile(ms)}
                          className="hover:text-white"
                        >
                          +
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Your Compensatory Strengths: What you have to offset the gap */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Your Compensatory Strengths (How you counter-balance)
                </h4>
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1.5">
                  {activeAnalysis.compensatoryStrengths.map((cs, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-200">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{cs}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Bridge Strategy: How to frame the application */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  Tactical Bridge Strategy for this Role
                </h4>
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-slate-300 leading-relaxed">
                  {activeAnalysis.bridgeStrategy}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                <button
                  onClick={() => setShowPitchModal(activeAnalysis)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Inspect Tailored Stretch Pitch
                </button>

                <button
                  onClick={() => handleApply(activeAnalysis)}
                  disabled={appliedStretchIds.has(activeAnalysis.id)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                    appliedStretchIds.has(activeAnalysis.id)
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default"
                      : activeAnalysis.tier === "MOONSHOT"
                      ? "bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-rose-600/30"
                      : activeAnalysis.tier === "STEP_UP"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30"
                  }`}
                >
                  {appliedStretchIds.has(activeAnalysis.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Submitted with Compensatory Dossier
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Apply with Compensatory Framing
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              Select a role on the left to inspect the stretch analysis.
            </div>
          )}
        </div>
      </div>

      {/* Interactive Stretch Simulator: "What If?" Evaluator */}
      <div className="bg-slate-900/95 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden space-y-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Interactive Simulator
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Evaluate Any Custom Stretch Role or Title
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Test prospective titles (e.g. "Staff AI Architect", "VP of Engineering") against your profile to calculate its Stretch Tier, odds, and bridge tactics.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunSimulation} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Target Job Title
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Staff AI Infrastructure Architect"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Required YoE
            </label>
            <input
              type="number"
              value={customYoE}
              onChange={(e) => setCustomYoE(e.target.value)}
              min="1"
              max="20"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Key Required Technologies
            </label>
            <input
              type="text"
              value={customKeywords}
              onChange={(e) => setCustomKeywords(e.target.value)}
              placeholder="Kafka, Terraform, Go"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              Evaluate Tier
            </button>
          </div>
        </form>

        {/* Simulation Output Card */}
        {simulationResult && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-purple-500/40 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    simulationResult.tier === "MOONSHOT"
                      ? "bg-rose-950 text-rose-300 border-rose-800"
                      : simulationResult.tier === "STEP_UP"
                      ? "bg-purple-950 text-purple-300 border-purple-800"
                      : "bg-emerald-950 text-emerald-300 border-emerald-800"
                  }`}
                >
                  CLASSIFIED AS: {simulationResult.tier === "MOONSHOT" ? "🚀 TIER 1 MOONSHOT" : simulationResult.tier === "STEP_UP" ? "⚡ TIER 2 STEP-UP" : "🎯 TIER 3 CORE TARGET"}
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {simulationResult.title}
                </h4>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Estimated Odds</span>
                  <span
                    className={`font-bold text-sm ${
                      simulationResult.estimatedProbability < 25
                        ? "text-rose-400"
                        : simulationResult.estimatedProbability < 60
                        ? "text-purple-300"
                        : "text-emerald-400"
                    }`}
                  >
                    {simulationResult.estimatedProbability}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">ATS Fit</span>
                  <span className="font-bold text-sm text-indigo-300">
                    {simulationResult.atsFitScore}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-rose-400 font-bold block mb-1">Identified Deficit & Gaps:</span>
                <p className="text-slate-300">{simulationResult.skillGapsExplanation}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-indigo-400 font-bold block mb-1">Recommended Bridge Angle:</span>
                <p className="text-slate-300">{simulationResult.bridgeStrategy}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Strategic Playbook: Golden Ratio & Rules of Engagement */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          Autonomous Agent Stretch Strategy Playbook
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <strong className="text-rose-300 block font-semibold">1. Cap Moonshots at 20%</strong>
            <p className="text-slate-400 leading-relaxed">
              Moonshots are vital for discovering high-salary ceilings and long-term skill targets, but applying exclusively to them burns daily rate limits and causes false rejection spirals.
            </p>
          </div>

          <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <strong className="text-purple-300 block font-semibold">2. Maximize Step-Up Roles (50%)</strong>
            <p className="text-slate-400 leading-relaxed">
              Step-up roles are the highest ROI for your career. They are realistic promotions (Senior to Lead) where your compensatory strengths (Azure, Cosmos DB, AI agent speed) bridge the delta.
            </p>
          </div>

          <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <strong className="text-emerald-300 block font-semibold">3. Anchor with Core Targets (30%)</strong>
            <p className="text-slate-400 leading-relaxed">
              Core targets guarantee interview call volume and recruiter pipeline velocity, keeping your ATS momentum high while waiting for higher-tier stretch interviews.
            </p>
          </div>
        </div>
      </div>

      {/* Tailored Stretch Pitch Modal */}
      {showPitchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">
                  Compensatory Dossier Preview
                </span>
                <h3 className="text-base font-bold text-white">
                  {showPitchModal.title} @ {showPitchModal.company}
                </h3>
              </div>
              <button
                onClick={() => setShowPitchModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Tailored Executive Summary:</span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed italic">
                  "{showPitchModal.customPitchAngle}"
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Compensatory Highlights Injected into Resume:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  {showPitchModal.compensatoryStrengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300">
                <strong>Why this works:</strong> Instead of hiding the {Math.abs(showPitchModal.experienceDelta)} yr experience or skill delta, the autonomous agent reframes your high-velocity cloud execution as a decisive advantage over passive tenure.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowPitchModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApply(showPitchModal);
                  setShowPitchModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
              >
                Submit Tailored Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
