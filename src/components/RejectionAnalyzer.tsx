import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  FileSearch,
  Sparkles,
  CheckCircle2,
  Sliders,
  Send,
  Building,
  TrendingDown,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { RejectionLog } from "../types";

interface RejectionAnalyzerProps {
  rejections: RejectionLog[];
  onAnalyzeCustomEmail: (emailText: string, jobTitle: string, company: string) => Promise<any>;
}

export const RejectionAnalyzer: React.FC<RejectionAnalyzerProps> = ({
  rejections,
  onAnalyzeCustomEmail,
}) => {
  const [inputText, setInputText] = useState("");
  const [inputCompany, setInputCompany] = useState("Vanguard Tech Corp");
  const [inputRole, setInputRole] = useState("Senior Cloud Systems Engineer");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Preset sample rejection emails
  const sampleRejections = [
    {
      label: "High Volume Automated Templated",
      company: "Stripe / Fintech Scale",
      role: "Staff Backend Engineer",
      text: "Thank you so much for taking the time to apply for Staff Backend Engineer. We received an extraordinary volume of over 500 applications in the first 48 hours. After careful consideration, we have decided to advance candidates whose immediate background aligns more closely with our specialized high-throughput ledger systems.",
    },
    {
      label: "ATS Missing Tech Keyword",
      company: "MedTech Cloud",
      role: "Senior Cloud Engineer",
      text: "Hello Alex, thank you for your application. Although your profile is very strong, our compliance review identified that this role requires 3+ years hands-on production experience with HIPAA Title II security controls and Terraform Enterprise modules, which were not explicitly demonstrated on your resume.",
    },
    {
      label: "Hidden Hybrid / Location Mismatch",
      company: "Midwest Logistics",
      role: "Lead Full Stack Developer",
      text: "Hi Alex, thank you for your interest. While this role is listed under remote flex, all team members in this engineering pod must attend mandatory monthly sprint planning sessions at our Chicago, IL operations hub. Because you are located outside the travel corridor, we cannot move forward.",
    },
  ];

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await onAnalyzeCustomEmail(inputText, inputRole, inputCompany);
      setAnalysisResult(res);
    } catch (err) {
      console.error("Error analyzing rejection email:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Rejection category breakdown
  const categoryCounts = rejections.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Rejection Pattern Classifier & Diagnostic Hub
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Autonomous agents fail when they don't know why they were rejected. This subsystem ingests emails, webhook notices, and ATS rejections to isolate exact root causes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              Logged Patterns: <strong className="text-rose-400">{rejections.length}</strong>
            </span>
          </div>
        </div>

        {/* Category Breakdown Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">
              Oversaturated Pool
            </span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {categoryCounts["OVERSATURATED_POOL"] || 0}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">&gt; 250 applicants in &lt; 4h</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">
              ATS Keyword Deficit
            </span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {categoryCounts["ATS_KEYWORD_DEFICIT"] || 0}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Missing domain tags</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block">
              Experience Mismatch
            </span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {categoryCounts["EXPERIENCE_MISMATCH"] || 0}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Hard ceiling on YoE</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-sky-400 block">
              Location / Residency
            </span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {categoryCounts["LOCATION_RESTRICTION"] || 0}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Hidden hybrid stipulations</p>
          </div>
        </div>
      </div>

      {/* Interactive AI Rejection Parser Tool */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-purple-400" />
              Live Rejection Email Analyzer (Powered by Gemini AI)
            </h3>
            <p className="text-xs text-slate-400">
              Paste actual rejection correspondence to diagnose underlying factors and generate immediate query adjustments.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 mr-1">Load Preset:</span>
            {sampleRejections.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputCompany(sample.company);
                  setInputRole(sample.role);
                  setInputText(sample.text);
                }}
                className="text-[11px] px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Company Name</label>
              <input
                type="text"
                value={inputCompany}
                onChange={(e) => setInputCompany(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                placeholder="e.g. Acme Health Corp"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Target Job Title</label>
              <input
                type="text"
                value={inputRole}
                onChange={(e) => setInputRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                placeholder="e.g. Senior Full Stack Engineer"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Rejection Email Body or ATS Feedback
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste email body or recruiter feedback here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAnalyzing || !inputText.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              {isAnalyzing ? "Classifying Root Pattern..." : "Diagnose Rejection Pattern"}
            </button>
          </div>
        </form>

        {/* Diagnosis Result Output */}
        {analysisResult && (
          <div className="mt-4 p-4 rounded-xl bg-purple-950/30 border border-purple-500/50 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Pattern: {analysisResult.category}
              </span>
              <span className="text-xs font-mono text-purple-300 font-semibold">
                Confidence: {analysisResult.confidence}%
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium">Diagnostic Root Cause:</span>
              <p className="text-xs text-slate-200 mt-0.5">{analysisResult.diagnosis}</p>
            </div>

            <div className="pt-2 border-t border-purple-800/50">
              <span className="text-xs font-semibold text-emerald-400 block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Application & Query Strategy:
              </span>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                {analysisResult.recommendedAction}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Historical Rejections Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Ingested Rejection Records in Cosmos DB
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Company & Role</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Snippet Excerpt</th>
                <th className="py-2.5 px-3">Actionable Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {rejections.map((rej) => (
                <tr key={rej.id} className="hover:bg-slate-950/40">
                  <td className="py-3 px-3">
                    <span className="font-bold text-white font-sans block">{rej.company}</span>
                    <span className="text-slate-400 font-sans text-[11px]">{rej.role}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                        rej.platform === "LinkedIn"
                          ? "bg-sky-950 text-sky-300 border border-sky-800/80"
                          : "bg-amber-950 text-amber-300 border border-amber-800/80"
                      }`}
                    >
                      {rej.platform}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80 text-[10px]">
                      {rej.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-xs text-slate-300 font-sans text-xs line-clamp-2">
                    {rej.snippet}
                  </td>
                  <td className="py-3 px-3 max-w-xs text-emerald-300 font-sans text-xs">
                    {rej.recommendedAdjustment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
