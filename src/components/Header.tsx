import React from "react";
import {
  Cpu,
  Database,
  Cloud,
  Layers,
  RotateCw,
  Terminal,
  Activity,
  Code2,
  Settings,
  ShieldCheck,
  TrendingUp,
  Rocket,
  Calendar,
  Sparkles,
  Palette,
  Check,
} from "lucide-react";
import { ThemeId, THEMES } from "../types/theme";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isRunning: boolean;
  onRunCycle: () => void;
  onOpenProfile: () => void;
  onOpenDailyDigest: () => void;
  currentIteration: number;
  winRate: number;
  activeThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  onOpenThemeModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isRunning,
  onRunCycle,
  onOpenProfile,
  onOpenDailyDigest,
  currentIteration,
  winRate,
  activeThemeId,
  onSelectTheme,
  onOpenThemeModal,
}) => {
  const currentTheme = THEMES[activeThemeId] || THEMES.azure;

  return (
    <header className={`border-b backdrop-blur-md sticky top-0 z-40 transition-colors duration-300 ${currentTheme.headerBg}`}>
      {/* Top Banner / System Status & Theme Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-white/5 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400 tracking-wide">AZURE HOSTED AGENT</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 flex items-center gap-1">
            <Cloud className="w-3.5 h-3.5 text-sky-400" /> Container Apps (East US 2)
          </span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-400" /> Cosmos DB: AutonomousJobAgentDB
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          {/* Chromatic 3-Theme Switcher Pod */}
          <div
            id="theme-quick-switcher-pod"
            className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner"
          >
            <button
              onClick={onOpenThemeModal}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Open Theme Palette Variations Modal"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold hidden sm:inline">Theme:</span>
            </button>

            {/* Variation 1: Quantum Azure */}
            <button
              id="theme-btn-azure"
              type="button"
              onClick={() => onSelectTheme("azure")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeThemeId === "azure"
                  ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400"
                  : "text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80"
              }`}
              title="Variation 1: Quantum Azure (Indigo & Cyan Cloud AI)"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="hidden md:inline">Azure</span>
            </button>

            {/* Variation 2: Emerald Matrix */}
            <button
              id="theme-btn-emerald"
              type="button"
              onClick={() => onSelectTheme("emerald")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeThemeId === "emerald"
                  ? "bg-emerald-600 text-slate-950 font-bold shadow-sm ring-1 ring-emerald-300"
                  : "text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80"
              }`}
              title="Variation 2: Emerald Matrix (Algorithmic FinTech & Mint)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="hidden md:inline">Emerald</span>
            </button>

            {/* Variation 3: Nebula Crimson */}
            <button
              id="theme-btn-crimson"
              type="button"
              onClick={() => onSelectTheme("crimson")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeThemeId === "crimson"
                  ? "bg-rose-600 text-white font-bold shadow-sm ring-1 ring-rose-400"
                  : "text-slate-400 hover:text-rose-300 hover:bg-slate-800/80"
              }`}
              title="Variation 3: Nebula Crimson (Cyberpunk Velvet & Solar Rose)"
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="hidden md:inline">Crimson</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
            <span className="text-slate-500">Schedule:</span>
            <span className="font-mono text-amber-300 font-semibold">cron(0 */4 * * *)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-800/60 text-indigo-200">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Gen {currentIteration} Win Rate:</span>
            <span className="font-bold text-emerald-300">{winRate}%</span>
          </div>

          <button
            onClick={onOpenDailyDigest}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950 hover:from-indigo-900 hover:to-purple-900 text-indigo-200 hover:text-white px-2.5 py-1 rounded-md border border-indigo-500/40 text-xs font-semibold shadow-sm transition-all"
            title="Open 24-Hour Autonomous Daily Digest"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Daily Digest</span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
            </span>
          </button>

          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 hover:text-white transition-colors text-slate-400 hover:bg-slate-900 px-2 py-1 rounded border border-transparent hover:border-slate-800"
            title="Candidate Profile & Automation Credentials"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile & ATS</span>
          </button>
        </div>
      </div>

      {/* Main Brand & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl p-0.5 shadow-lg transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.secondaryHex}, ${currentTheme.accentHex})`,
            }}
          >
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5" style={{ color: currentTheme.primaryHex }} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                LangChain AutoAgent
                <span
                  className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border transition-colors"
                  style={{
                    backgroundColor: `${currentTheme.primaryHex}20`,
                    borderColor: `${currentTheme.primaryHex}50`,
                    color: currentTheme.secondaryHex,
                  }}
                >
                  {currentTheme.name}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous LinkedIn & Indeed Applier • Rejection Pattern Learning Engine • Self-Optimizing Feedback Loop
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="header-open-daily-digest-btn"
            onClick={onOpenDailyDigest}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm tracking-wide bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-500 shadow-md transition-all active:scale-95"
            title="Open 24-Hour Autonomous Daily Digest"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Daily Digest</span>
          </button>

          <button
            id="run-autonomous-cycle-btn"
            disabled={isRunning}
            onClick={onRunCycle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm tracking-wide shadow-lg transition-all ${
              isRunning
                ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                : `${currentTheme.primaryGradient} ${currentTheme.primaryButtonText} ${currentTheme.glowShadow} active:scale-95`
            }`}
          >
            <RotateCw className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Running Autonomous Cycle..." : "Execute Agent Cycle"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
        {[
          { id: "agent", label: "Agent Live Console", icon: Terminal, badge: isRunning ? "ACTIVE" : undefined },
          { id: "stretch", label: "Stretch Application Matrix", icon: Rocket, badge: "Aspirational" },
          { id: "feedback", label: "Feedback Loop & Queries", icon: RotateCw, badge: `Gen ${currentIteration}` },
          { id: "rejections", label: "Rejection Classifier", icon: Activity },
          { id: "cosmos", label: "Azure Cosmos DB", icon: Database, badge: "NoSQL" },
          { id: "code", label: "Agent Code & Azure Bicep", icon: Code2, badge: "Python" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? `${currentTheme.navActive} ${currentTheme.navActiveBorder}`
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon
                className="w-4 h-4"
                style={{ color: isActive ? currentTheme.primaryHex : undefined }}
              />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    tab.badge === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

