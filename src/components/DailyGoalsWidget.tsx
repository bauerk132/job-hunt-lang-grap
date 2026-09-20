import React, { useState, useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Target,
  Trophy,
  Zap,
  CheckCircle2,
  Flame,
  TrendingUp,
  Plus,
  Minus,
  RotateCcw,
  Clock,
  ArrowUpRight,
  Calendar,
  Undo2,
  Check,
  AlertCircle,
} from "lucide-react";
import { JobOpportunity } from "../types";
import { ThemeId, THEMES } from "../types/theme";

interface DailyGoalsWidgetProps {
  jobs: JobOpportunity[];
  onRunCycle?: () => void;
  onExecuteBatchApply?: () => Promise<void>;
  qualifiedBatchJobsCount?: number;
  isRunning?: boolean;
  activeThemeId?: ThemeId;
}

// Helper to get local calendar date YYYY-MM-DD
function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Calculate milliseconds remaining until midnight
function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// Format duration into readable "Xh Ym"
function formatHoursMinutes(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export const DailyGoalsWidget: React.FC<DailyGoalsWidgetProps> = ({
  jobs,
  onRunCycle,
  onExecuteBatchApply,
  qualifiedBatchJobsCount = 0,
  isRunning = false,
  activeThemeId = "azure",
}) => {
  const currentTheme = THEMES[activeThemeId] || THEMES.azure;

  // Track active calendar day (YYYY-MM-DD)
  const [currentCalendarDay, setCurrentCalendarDay] = useState<string>(() => getLocalDateString());

  // Persist user-defined daily goal target (default: 10 jobs)
  const [dailyTarget, setDailyTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("job_agent_daily_goal");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val > 0 && val <= 100) return val;
      }
    } catch (_) {}
    return 10;
  });

  // Timestamp after which today's applications count (for manual resets & day rollover)
  const [lastResetTimestamp, setLastResetTimestamp] = useState<number>(() => {
    try {
      const savedTs = localStorage.getItem("job_agent_daily_goal_reset_ts");
      if (savedTs) {
        const parsed = parseInt(savedTs, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (_) {}
    // Default to start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return startOfToday.getTime();
  });

  // Optional manual external application offset
  const [manualOffset, setManualOffset] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("job_agent_manual_applied_offset");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (_) {}
    return 0;
  });

  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [customInputVal, setCustomInputVal] = useState<string>(dailyTarget.toString());
  const hasCelebratedRef = useRef<boolean>(false);

  // Notifications & Undo state
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const undoBackupRef = useRef<{ timestamp: number; offset: number } | null>(null);
  const [countdownToMidnight, setCountdownToMidnight] = useState<string>(() =>
    formatHoursMinutes(getMsUntilMidnight())
  );

  // Sync daily target to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("job_agent_daily_goal", dailyTarget.toString());
    } catch (_) {}
    setCustomInputVal(dailyTarget.toString());
  }, [dailyTarget]);

  // Sync manual offset to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("job_agent_manual_applied_offset", manualOffset.toString());
    } catch (_) {}
  }, [manualOffset]);

  // Sync reset timestamp to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("job_agent_daily_goal_reset_ts", lastResetTimestamp.toString());
    } catch (_) {}
  }, [lastResetTimestamp]);

  // --------------------------------------------------------------------------
  // AUTO-RESET IMPLEMENTATION: Clear counter at start of each new calendar day
  // --------------------------------------------------------------------------
  const executeCalendarDayReset = (newDayString: string, reason: "initial_check" | "midnight_tick") => {
    const startOfNewDay = new Date();
    startOfNewDay.setHours(0, 0, 0, 0);
    const newResetTs = startOfNewDay.getTime();

    setCurrentCalendarDay(newDayString);
    setLastResetTimestamp(newResetTs);
    setManualOffset(0);

    try {
      localStorage.setItem("job_agent_daily_goal_last_date", newDayString);
      localStorage.setItem("job_agent_daily_goal_reset_ts", newResetTs.toString());
      localStorage.setItem("job_agent_manual_applied_offset", "0");
    } catch (_) {}

    hasCelebratedRef.current = false;
    setResetFeedback(
      reason === "midnight_tick"
        ? `Midnight Rollover: Auto-reset daily quota for ${newDayString}`
        : `New calendar day detected (${newDayString}). Daily counter auto-cleared.`
    );

    // Auto-dismiss banner after 7 seconds
    setTimeout(() => {
      setResetFeedback(null);
    }, 7000);
  };

  // 1. Check on mount if saved date in localStorage differs from today's date
  useEffect(() => {
    const today = getLocalDateString();
    try {
      const savedDate = localStorage.getItem("job_agent_daily_goal_last_date");
      if (!savedDate) {
        // First run on this browser: initialize to today
        localStorage.setItem("job_agent_daily_goal_last_date", today);
      } else if (savedDate !== today) {
        // A new calendar day has started since last session!
        executeCalendarDayReset(today, "initial_check");
      }
    } catch (_) {}
  }, []);

  // 2. High-precision Watchdog Interval: checks for midnight transition in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      const nowDay = getLocalDateString();
      setCountdownToMidnight(formatHoursMinutes(getMsUntilMidnight()));

      if (nowDay !== currentCalendarDay) {
        // Midnight crossed while the user is actively using the app!
        executeCalendarDayReset(nowDay, "midnight_tick");
      }
    }, 15000); // Check every 15s

    return () => clearInterval(interval);
  }, [currentCalendarDay]);

  // --------------------------------------------------------------------------
  // MANUAL RESET IMPLEMENTATION: User explicitly clicks "Reset Counter"
  // --------------------------------------------------------------------------
  const handleManualReset = () => {
    // Save backup for undo capability
    undoBackupRef.current = {
      timestamp: lastResetTimestamp,
      offset: manualOffset,
    };

    const nowTs = Date.now();
    setLastResetTimestamp(nowTs);
    setManualOffset(0);
    hasCelebratedRef.current = false;
    setCanUndo(true);
    setResetFeedback("Daily application counter manually reset to 0.");

    // Dismiss undo window after 6 seconds
    setTimeout(() => {
      setCanUndo(false);
    }, 6000);
  };

  const handleUndoReset = () => {
    if (undoBackupRef.current) {
      setLastResetTimestamp(undoBackupRef.current.timestamp);
      setManualOffset(undoBackupRef.current.offset);
      undoBackupRef.current = null;
      setCanUndo(false);
      setResetFeedback("Reset reverted. Previous counter restored.");
      setTimeout(() => {
        setResetFeedback(null);
      }, 3000);
    }
  };

  // --------------------------------------------------------------------------
  // Calculate jobs applied today (respecting calendar day + reset timestamp)
  // --------------------------------------------------------------------------
  const appliedJobsCount = useMemo(() => {
    const todayStr = currentCalendarDay;

    // Filter jobs:
    // 1. Must be "applied" or "interview"
    // 2. Must belong to today's calendar date
    // 3. Must be applied AFTER lastResetTimestamp
    const baseCount = jobs.filter((j) => {
      if (j.status !== "applied" && j.status !== "interview") return false;

      if (j.appliedDate) {
        // Date match check
        const isToday = j.appliedDate.startsWith(todayStr);
        if (!isToday) return false;

        // Timestamp match check (respects manual reset)
        const jobTs = new Date(j.appliedDate).getTime();
        if (!isNaN(jobTs)) {
          return jobTs >= lastResetTimestamp;
        }
      }

      // If appliedDate is not formatted with ISO, check if reset occurred today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (lastResetTimestamp > startOfToday.getTime()) {
        // A manual reset occurred during today, exclude untimestamped mock jobs
        return false;
      }

      return true;
    }).length;

    return Math.max(0, baseCount + manualOffset);
  }, [jobs, currentCalendarDay, lastResetTimestamp, manualOffset]);

  const progressPercentage = Math.min(100, Math.round((appliedJobsCount / dailyTarget) * 100));
  const remainingJobs = Math.max(0, dailyTarget - appliedJobsCount);
  const isGoalAchieved = appliedJobsCount >= dailyTarget;

  // Trigger celebration confetti when hitting 100% goal
  useEffect(() => {
    if (isGoalAchieved && !hasCelebratedRef.current && appliedJobsCount > 0) {
      hasCelebratedRef.current = true;
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.65 },
          colors: [currentTheme.primaryHex, currentTheme.secondaryHex, "#10b981", "#f59e0b"],
        });
      } catch (_) {}
    } else if (!isGoalAchieved) {
      hasCelebratedRef.current = false;
    }
  }, [isGoalAchieved, appliedJobsCount, currentTheme]);

  const handleUpdateGoal = (newVal: number) => {
    const clamped = Math.max(1, Math.min(100, newVal));
    setDailyTarget(clamped);
    setIsEditingGoal(false);
  };

  const handleCustomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customInputVal, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      handleUpdateGoal(parsed);
    } else {
      setCustomInputVal(dailyTarget.toString());
      setIsEditingGoal(false);
    }
  };

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [currentCalendarDay]);

  const goalPresets = [5, 10, 15, 20, 25, 30];

  // Dynamic status badge
  const getStatusBadge = () => {
    if (isGoalAchieved && appliedJobsCount > 0) {
      return {
        label: `Daily Goal Achieved (${appliedJobsCount}/${dailyTarget})`,
        icon: Trophy,
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
        message: "Outstanding! Your autonomous agent crushed today's quota.",
      };
    }
    if (progressPercentage >= 75) {
      return {
        label: "Final Sprint Phase",
        icon: Flame,
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        message: `${remainingJobs} more role${remainingJobs === 1 ? "" : "s"} to complete today's mission.`,
      };
    }
    if (progressPercentage >= 50) {
      return {
        label: "Halfway Milestone",
        icon: Zap,
        badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        message: "Strong momentum! Pacing ahead of typical conversion schedules.",
      };
    }
    if (progressPercentage >= 25) {
      return {
        label: "Progressing",
        icon: TrendingUp,
        badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
        message: "Queue active. Automated tailored submissions underway.",
      };
    }
    return {
      label: "Ready to Pacing Target",
      icon: Clock,
      badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      message: `Set for ${dailyTarget} jobs. Trigger an apply cycle or batch apply.`,
    };
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div
      id="daily-goals-widget"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all duration-300"
    >
      {/* Ambient background glow matching active theme */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors"
        style={{ backgroundColor: currentTheme.primaryHex }}
      />
      <div
        className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors"
        style={{ backgroundColor: currentTheme.secondaryHex }}
      />

      {/* Top Notification / Auto-Reset Banner */}
      {resetFeedback && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between gap-2 animate-fadeIn relative z-20">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{resetFeedback}</span>
          </div>

          <div className="flex items-center gap-2">
            {canUndo && (
              <button
                type="button"
                id="undo-counter-reset-btn"
                onClick={handleUndoReset}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-800 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setResetFeedback(null)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center font-bold shadow-md transition-all"
            style={{
              backgroundColor: `${currentTheme.primaryHex}20`,
              borderColor: `${currentTheme.primaryHex}50`,
              borderWidth: "1px",
              color: currentTheme.primaryHex,
            }}
          >
            <Target className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Daily Goals & Quota Tracker
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1 ${statusBadge.badgeClass}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 font-mono mt-0.5">
              <span>Date: <strong className="text-slate-200">{todayFormatted}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Target: <strong className="text-emerald-400 font-bold">{dailyTarget} Applications/Day</strong></span>
              <span className="text-slate-600">•</span>
              {/* Auto-Reset Feature Badge */}
              <span
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/50"
                title={`Auto-reset feature active: Clears at 00:00 midnight local time (in ${countdownToMidnight})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Calendar className="w-3 h-3" />
                <span>Auto-Resets at 00:00 ({countdownToMidnight})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Goal Setting Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target Stepper */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              id="decrement-daily-goal-btn"
              onClick={() => handleUpdateGoal(dailyTarget - 1)}
              disabled={dailyTarget <= 1}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Decrease daily target"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {isEditingGoal ? (
              <form onSubmit={handleCustomInputSubmit} className="inline-flex">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customInputVal}
                  onChange={(e) => setCustomInputVal(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(customInputVal, 10);
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
                      handleUpdateGoal(parsed);
                    } else {
                      setIsEditingGoal(false);
                      setCustomInputVal(dailyTarget.toString());
                    }
                  }}
                  autoFocus
                  className="w-12 bg-slate-900 border border-indigo-500 rounded px-1 text-center font-mono font-bold text-white text-xs focus:outline-none"
                />
              </form>
            ) : (
              <button
                type="button"
                id="edit-daily-goal-value-btn"
                onClick={() => setIsEditingGoal(true)}
                className="px-2.5 py-0.5 font-mono font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer"
                title="Click to type a custom daily application goal"
              >
                {dailyTarget} <span className="text-[10px] text-slate-500 font-normal">roles</span>
              </button>
            )}

            <button
              type="button"
              id="increment-daily-goal-btn"
              onClick={() => handleUpdateGoal(dailyTarget + 1)}
              disabled={dailyTarget >= 100}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Increase daily target"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Presets Dropdown/Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-500 px-1 text-[10px] uppercase tracking-wider font-semibold">Presets:</span>
            {goalPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleUpdateGoal(preset)}
                className={`px-2 py-0.5 rounded-lg font-mono font-semibold transition-all ${
                  dailyTarget === preset
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Manual Increment Button (+1 Applied) */}
          <button
            type="button"
            id="increment-manual-applied-btn"
            onClick={() => setManualOffset((prev) => prev + 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
            title="Logged an application externally on LinkedIn/Indeed? Click to credit +1 towards today's goal"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>+1 Applied</span>
          </button>

          {/* MANUAL RESET BUTTON (Requested by User) */}
          <button
            type="button"
            id="manual-reset-daily-counter-btn"
            onClick={handleManualReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/60 text-xs font-semibold shadow-sm transition-all active:scale-95 group"
            title="Manually reset today's application progress counter to 0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400 group-hover:-rotate-90 transition-transform duration-300" />
            <span>Reset Counter</span>
          </button>
        </div>
      </div>

      {/* Progress Visualization Bar Section */}
      <div className="mt-4 space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Daily Target Completion</span>
            <span className="font-mono text-xs font-bold text-white">
              {appliedJobsCount} <span className="text-slate-500">/</span> {dailyTarget} roles
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px] font-mono">
              {remainingJobs > 0 ? (
                <span>
                  <strong className="text-amber-300 font-bold">{remainingJobs}</strong> left to target
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Quota Completed! (+{appliedJobsCount - dailyTarget} bonus)
                </span>
              )}
            </span>
            <span
              className="font-mono font-extrabold text-sm px-2 py-0.5 rounded-lg border shadow-sm"
              style={{
                color: isGoalAchieved && appliedJobsCount > 0 ? "#10b981" : currentTheme.primaryHex,
                backgroundColor: `${isGoalAchieved && appliedJobsCount > 0 ? "#10b981" : currentTheme.primaryHex}15`,
                borderColor: `${isGoalAchieved && appliedJobsCount > 0 ? "#10b981" : currentTheme.primaryHex}40`,
              }}
            >
              {progressPercentage}%
            </span>
          </div>
        </div>

        {/* The Animated Progress Track */}
        <div className="relative w-full h-4 sm:h-5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner p-0.5">
          {/* Milestone Guidelines (25%, 50%, 75%) */}
          <div className="absolute inset-0 flex justify-between px-[25%] pointer-events-none">
            <div className="w-[1px] h-full bg-slate-700/50" />
            <div className="w-[1px] h-full bg-slate-700/50" />
          </div>
          <div className="absolute inset-0 flex justify-center pointer-events-none">
            <div className="w-[1px] h-full bg-slate-700/60" />
          </div>

          {/* Filled Bar */}
          <div
            id="daily-goal-progress-bar-fill"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden shadow-md"
            style={{
              width: `${Math.max(appliedJobsCount === 0 ? 0 : 4, progressPercentage)}%`,
              background:
                isGoalAchieved && appliedJobsCount > 0
                  ? "linear-gradient(90deg, #10b981 0%, #34d399 50%, #06b6d4 100%)"
                  : `linear-gradient(90deg, ${currentTheme.primaryHex} 0%, ${currentTheme.secondaryHex} 50%, ${currentTheme.accentHex} 100%)`,
            }}
          >
            {/* Shimmer effect if non-zero */}
            {appliedJobsCount > 0 && (
              <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
            )}
          </div>
        </div>

        {/* Milestone Indicator Ticks */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pt-0.5">
          <span>0 (Start)</span>
          <span className={progressPercentage >= 25 ? "text-indigo-300 font-semibold" : ""}>25%</span>
          <span className={progressPercentage >= 50 ? "text-cyan-300 font-semibold" : ""}>50% (Halfway)</span>
          <span className={progressPercentage >= 75 ? "text-amber-300 font-semibold" : ""}>75%</span>
          <span className={isGoalAchieved && appliedJobsCount > 0 ? "text-emerald-400 font-bold" : ""}>
            100% Target ({dailyTarget})
          </span>
        </div>
      </div>

      {/* Tri-Metric Summary Pods & Action Trigger Ribbon */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {/* Pod 1: Current Status */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Applied Today
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-mono font-bold text-white">{appliedJobsCount}</span>
              <span className="text-xs text-slate-500 font-mono">/ {dailyTarget}</span>
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Pod 2: Remaining & Pacing */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Remaining to Goal
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-lg font-mono font-bold ${remainingJobs === 0 && appliedJobsCount > 0 ? "text-emerald-400" : "text-amber-300"}`}>
                {remainingJobs === 0 && appliedJobsCount > 0 ? "Target Met" : `${remainingJobs} roles`}
              </span>
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {/* Pod 3: Direct Action to Drive Progress */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block truncate">
              Advance Goal
            </span>
            <p className="text-[11px] text-slate-300 truncate">
              {qualifiedBatchJobsCount > 0
                ? `${qualifiedBatchJobsCount} roles >85% ATS ready`
                : "Run harvest cycle"}
            </p>
          </div>

          {qualifiedBatchJobsCount > 0 && onExecuteBatchApply ? (
            <button
              type="button"
              id="daily-goal-batch-apply-btn"
              onClick={onExecuteBatchApply}
              disabled={isRunning}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-950/30 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
              title="Apply directly to qualified jobs to advance toward daily target"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Submit Batch</span>
            </button>
          ) : onRunCycle ? (
            <button
              type="button"
              id="daily-goal-run-cycle-btn"
              onClick={onRunCycle}
              disabled={isRunning}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
              title="Run autonomous cycle to discover and apply to new roles"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Harvest Roles</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
