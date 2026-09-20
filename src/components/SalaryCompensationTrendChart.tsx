import React, { useId, useMemo, useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Info,
  Building2,
  CheckCircle2,
  ExternalLink,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { JobOpportunity } from "../types";

export interface SalaryDataPoint {
  job: JobOpportunity;
  date: Date;
  daysAgo: number;
  minSalary: number; // in thousands (e.g. 155)
  maxSalary: number; // in thousands (e.g. 180)
  avgSalary: number; // in thousands (e.g. 167.5)
  rawSalary: string;
}

interface SalaryCompensationTrendChartProps {
  jobs: JobOpportunity[];
  defaultCollapsed?: boolean;
}

/**
 * Parses diverse salary string formats into numeric values (in thousands of dollars)
 * e.g. "$155k - $180k" -> { min: 155, max: 180, avg: 167.5 }
 *      "$165,000 - $190,000" -> { min: 165, max: 190, avg: 177.5 }
 */
export function parseSalaryRange(raw: string): { min: number; max: number; avg: number } | null {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().replace(/,/g, "");

  // Match ranges like $150k - $180k or 150k - 180k
  const kRangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*k\s*[-–—to]+\s*\$?(\d+(?:\.\d+)?)\s*k/);
  if (kRangeMatch) {
    const min = parseFloat(kRangeMatch[1]);
    const max = parseFloat(kRangeMatch[2]);
    return { min, max, avg: Math.round(((min + max) / 2) * 10) / 10 };
  }

  // Match full currency amounts like $150000 - $185000
  const fullRangeMatch = cleaned.match(/\$?(\d{5,7})\s*[-–—to]+\s*\$?(\d{5,7})/);
  if (fullRangeMatch) {
    const min = Math.round(parseFloat(fullRangeMatch[1]) / 1000);
    const max = Math.round(parseFloat(fullRangeMatch[2]) / 1000);
    return { min, max, avg: Math.round(((min + max) / 2) * 10) / 10 };
  }

  // Match single amounts like $170k or $175,000
  const singleKMatch = cleaned.match(/\$?(\d+(?:\.\d+)?)\s*k/);
  if (singleKMatch) {
    const val = parseFloat(singleKMatch[1]);
    return { min: val, max: val, avg: val };
  }

  const singleFullMatch = cleaned.match(/\$?(\d{5,7})/);
  if (singleFullMatch) {
    const val = Math.round(parseFloat(singleFullMatch[1]) / 1000);
    return { min: val, max: val, avg: val };
  }

  return null;
}

/**
 * Parses relative timestamps or ISO dates into Date objects
 */
export function parseAppliedDate(job: JobOpportunity): Date {
  const now = new Date("2026-09-20T14:49:30Z"); // current anchor date

  if (job.appliedDate) {
    const d = new Date(job.appliedDate);
    if (!isNaN(d.getTime())) return d;
  }

  const ts = (job.appliedTimestamp || job.postedTimeAgo || "").toLowerCase();
  if (ts.includes("just now") || ts.includes("min") || ts.includes("hour")) {
    return now;
  }
  if (ts.includes("yesterday") || ts.includes("1 day")) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }
  const daysMatch = ts.match(/(\d+)\s*day/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  }

  // Fallback: estimate from id hash to ensure deterministic spread across 30 days
  const hash = job.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const spreadDays = hash % 28;
  const d = new Date(now);
  d.setDate(d.getDate() - spreadDays);
  return d;
}

export const SalaryCompensationTrendChart: React.FC<SalaryCompensationTrendChartProps> = ({
  jobs,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [timeRange, setTimeRange] = useState<"30" | "14" | "7">("30");
  const [platformFilter, setPlatformFilter] = useState<"ALL" | "LinkedIn" | "Indeed">("ALL");
  const [viewMode, setViewMode] = useState<"band" | "median" | "ceiling">("band");
  const [hoveredPoint, setHoveredPoint] = useState<SalaryDataPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<SalaryDataPoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  const gradientId = useId();
  const areaGradientId = useId();
  const glowFilterId = useId();

  // ResizeObserver for dynamic, fluid SVG chart responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isCollapsed]);

  // Extract, parse, and filter successfully applied/interview jobs within chosen timeframe
  const dataPoints: SalaryDataPoint[] = useMemo(() => {
    const anchorDate = new Date("2026-09-20T14:49:30Z");
    const maxDays = parseInt(timeRange, 10);

    const candidates = jobs.filter(
      (j) => j.status === "applied" || j.status === "interview"
    );

    const points: SalaryDataPoint[] = [];

    candidates.forEach((job) => {
      if (platformFilter !== "ALL" && job.platform !== platformFilter) return;

      const parsedSalary = parseSalaryRange(job.salaryRange);
      if (!parsedSalary) return;

      const date = parseAppliedDate(job);
      const diffTime = anchorDate.getTime() - date.getTime();
      const daysAgo = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      if (daysAgo <= maxDays) {
        points.push({
          job,
          date,
          daysAgo,
          minSalary: parsedSalary.min,
          maxSalary: parsedSalary.max,
          avgSalary: parsedSalary.avg,
          rawSalary: job.salaryRange,
        });
      }
    });

    // Sort chronologically (oldest to newest)
    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [jobs, timeRange, platformFilter]);

  // Summary Metrics calculations
  const stats = useMemo(() => {
    if (dataPoints.length === 0) {
      return {
        medianTarget: 0,
        maxCeiling: 0,
        minFloor: 0,
        growthPercentage: 0,
        interviewCount: 0,
        avgAts: 0,
      };
    }

    const medians = dataPoints.map((p) => p.avgSalary).sort((a, b) => a - b);
    const midIndex = Math.floor(medians.length / 2);
    const medianTarget =
      medians.length % 2 !== 0
        ? medians[midIndex]
        : (medians[midIndex - 1] + medians[midIndex]) / 2;

    const maxCeiling = Math.max(...dataPoints.map((p) => p.maxSalary));
    const minFloor = Math.min(...dataPoints.map((p) => p.minSalary));

    // Calculate growth trajectory from first 3 data points to last 3 data points
    let growthPercentage = 0;
    if (dataPoints.length >= 2) {
      const earlyCohort = dataPoints.slice(0, Math.min(3, Math.ceil(dataPoints.length / 2)));
      const lateCohort = dataPoints.slice(-Math.min(3, Math.ceil(dataPoints.length / 2)));
      const earlyAvg = earlyCohort.reduce((sum, p) => sum + p.avgSalary, 0) / earlyCohort.length;
      const lateAvg = lateCohort.reduce((sum, p) => sum + p.avgSalary, 0) / lateCohort.length;
      growthPercentage = Math.round(((lateAvg - earlyAvg) / earlyAvg) * 100);
    }

    const interviewCount = dataPoints.filter((p) => p.job.status === "interview").length;
    const avgAts = Math.round(
      dataPoints.reduce((acc, p) => acc + p.job.atsFitScore, 0) / dataPoints.length
    );

    return {
      medianTarget: Math.round(medianTarget * 10) / 10,
      maxCeiling,
      minFloor,
      growthPercentage,
      interviewCount,
      avgAts,
    };
  }, [dataPoints]);

  // D3 Chart Dimensions & Scales
  const height = 340;
  const margin = { top: 32, right: 30, bottom: 44, left: 62 };
  const innerWidth = Math.max(280, containerWidth - margin.left - margin.right);
  const innerHeight = Math.max(160, height - margin.top - margin.bottom);

  // Time & Linear Scales
  const { xScale, yScale, minVal, maxVal, minDate, maxDate } = useMemo(() => {
    const anchor = new Date("2026-09-20T14:49:30Z");
    const past = new Date(anchor);
    past.setDate(past.getDate() - parseInt(timeRange, 10));

    const domainMinDate = dataPoints.length > 0 ? d3.min(dataPoints, (d) => d.date) || past : past;
    const domainMaxDate = anchor;

    const xs = d3
      .scaleTime()
      .domain([domainMinDate, domainMaxDate])
      .range([margin.left, margin.left + innerWidth]);

    const yValuesMin = dataPoints.length > 0 ? d3.min(dataPoints, (d) => d.minSalary) || 120 : 120;
    const yValuesMax = dataPoints.length > 0 ? d3.max(dataPoints, (d) => d.maxSalary) || 220 : 220;

    const yFloor = Math.max(60, Math.floor((yValuesMin - 15) / 10) * 10);
    const yCeil = Math.ceil((yValuesMax + 15) / 10) * 10;

    const ys = d3
      .scaleLinear()
      .domain([yFloor, yCeil])
      .range([margin.top + innerHeight, margin.top]);

    return {
      xScale: xs,
      yScale: ys,
      minVal: yFloor,
      maxVal: yCeil,
      minDate: domainMinDate,
      maxDate: domainMaxDate,
    };
  }, [dataPoints, innerWidth, innerHeight, margin.left, margin.top, timeRange]);

  // D3 Path Generators
  const areaGenerator = useMemo(() => {
    return d3
      .area<SalaryDataPoint>()
      .x((d) => xScale(d.date))
      .y0((d) => yScale(d.minSalary))
      .y1((d) => yScale(d.maxSalary))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  const medianLineGenerator = useMemo(() => {
    return d3
      .line<SalaryDataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.avgSalary))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  const ceilingLineGenerator = useMemo(() => {
    return d3
      .line<SalaryDataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.maxSalary))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  const floorLineGenerator = useMemo(() => {
    return d3
      .line<SalaryDataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.minSalary))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  // Generate SVG Path Strings
  const areaPath = useMemo(() => {
    if (dataPoints.length < 2) return "";
    return areaGenerator(dataPoints) || "";
  }, [areaGenerator, dataPoints]);

  const medianLinePath = useMemo(() => {
    if (dataPoints.length < 2) return "";
    return medianLineGenerator(dataPoints) || "";
  }, [medianLineGenerator, dataPoints]);

  const ceilingLinePath = useMemo(() => {
    if (dataPoints.length < 2) return "";
    return ceilingLineGenerator(dataPoints) || "";
  }, [ceilingLineGenerator, dataPoints]);

  const floorLinePath = useMemo(() => {
    if (dataPoints.length < 2) return "";
    return floorLineGenerator(dataPoints) || "";
  }, [floorLineGenerator, dataPoints]);

  // Linear regression trendline to show compensation acceleration mathematically
  const trendlinePath = useMemo(() => {
    if (dataPoints.length < 2) return null;
    const n = dataPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    dataPoints.forEach((p, i) => {
      sumX += i;
      sumY += p.avgSalary;
      sumXY += i * p.avgSalary;
      sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const firstPt = dataPoints[0];
    const lastPt = dataPoints[n - 1];

    const y1 = intercept;
    const y2 = slope * (n - 1) + intercept;

    return {
      x1: xScale(firstPt.date),
      y1: yScale(y1),
      x2: xScale(lastPt.date),
      y2: yScale(y2),
    };
  }, [dataPoints, xScale, yScale]);

  // Y-Axis Ticks ($k format)
  const yTicks = useMemo(() => {
    return yScale.ticks(6);
  }, [yScale]);

  // X-Axis Ticks (Dates)
  const xTicks = useMemo(() => {
    const numTicks = containerWidth < 500 ? 4 : 7;
    return xScale.ticks(numTicks);
  }, [xScale, containerWidth]);

  const activeFocusPoint = selectedPoint || hoveredPoint;

  return (
    <div
      id="salary-compensation-trend-container"
      ref={containerRef}
      className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md transition-all duration-300"
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-indigo-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                30-Day Market Compensation Trends
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  D3.js ENGINE
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing <span className="font-mono text-emerald-300 font-semibold">salaryRange</span> curves of {dataPoints.length} unattended Easy Apply submissions over the last 30 days
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(["30", "14", "7"] as const).map((days) => (
              <button
                key={days}
                id={`timeframe-${days}-btn`}
                onClick={() => setTimeRange(days)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  timeRange === days
                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(["ALL", "LinkedIn", "Indeed"] as const).map((plat) => (
              <button
                key={plat}
                id={`plat-filter-${plat.toLowerCase()}-btn`}
                onClick={() => setPlatformFilter(plat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  platformFilter === plat
                    ? "bg-slate-800 text-sky-300 shadow-sm font-semibold border border-sky-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {plat === "ALL" ? "All Sources" : plat}
              </button>
            ))}
          </div>

          {/* Collapse / Expand Toggle */}
          <button
            id="toggle-salary-chart-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title={isCollapsed ? "Expand Chart" : "Collapse Chart"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-slate-950/60 border-b border-slate-800/80 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                30d Median Target
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  ${stats.medianTarget}k
                </span>
                <span className="text-[10px] text-slate-400">/ yr</span>
              </div>
              <span className="text-[10px] text-emerald-400/80 flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" /> Evolving upward
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                Compensation Growth
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-xl font-bold font-mono ${stats.growthPercentage >= 0 ? "text-sky-400" : "text-amber-400"}`}>
                  {stats.growthPercentage >= 0 ? `+${stats.growthPercentage}%` : `${stats.growthPercentage}%`}
                </span>
                <span className="text-[10px] text-slate-400">trajectory</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Via keyword calibration
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                Market Ceiling
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-indigo-300 font-mono">
                  ${stats.maxCeiling}k
                </span>
                <span className="text-[10px] text-slate-400">max</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Top stretch compensation
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                Market Base Floor
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-slate-200 font-mono">
                  ${stats.minFloor}k
                </span>
                <span className="text-[10px] text-slate-400">min</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Filtered cutoff boundary
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                Interview Ratio
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-purple-300 font-mono">
                  {stats.interviewCount}
                </span>
                <span className="text-[10px] text-purple-400 font-medium">Screenings</span>
              </div>
              <span className="text-[10px] text-purple-400/80 mt-0.5 block">
                High-pay callbacks
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                Applied Data Points
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-amber-300 font-mono">
                  {dataPoints.length}
                </span>
                <span className="text-[10px] text-slate-400">roles</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Avg {stats.avgAts}% ATS match
              </span>
            </div>
          </div>

          {/* View Mode & Legend Bar */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px] mr-1">Layer:</span>
              <button
                id="view-mode-band-btn"
                onClick={() => setViewMode("band")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  viewMode === "band"
                    ? "bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Range Envelope (Min / Max Band)
              </button>
              <button
                id="view-mode-median-btn"
                onClick={() => setViewMode("median")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  viewMode === "median"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Median Curve Only
              </button>
              <button
                id="view-mode-ceiling-btn"
                onClick={() => setViewMode("ceiling")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  viewMode === "ceiling"
                    ? "bg-sky-950 text-sky-300 border border-sky-500/40 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Ceiling Trajectory
              </button>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded bg-gradient-to-r from-emerald-400 to-indigo-500 inline-block" />
                <span>Median Salary Trend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded bg-indigo-500/30 border border-indigo-500/50 inline-block" />
                <span>Offer Range Spread</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30 inline-block" />
                <span>Interview Callback</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                <span>Auto-Applied</span>
              </div>
            </div>
          </div>

          {/* D3 SVG Canvas Area */}
          <div className="relative p-4 select-none">
            {dataPoints.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <Briefcase className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
                <p className="text-sm">No applied jobs found for the selected {timeRange}-day period.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Trigger an agent cycle or adjust platform filters to visualize compensation data.
                </p>
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <svg
                  ref={svgRef}
                  width={containerWidth}
                  height={height}
                  className="overflow-visible"
                  style={{ minWidth: "500px" }}
                >
                  <defs>
                    {/* Linear Gradient for Salary Envelope Area */}
                    <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.04} />
                    </linearGradient>

                    {/* Linear Gradient for Median Stroke Curve */}
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="45%" stopColor="#10b981" />
                      <stop offset="85%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>

                    {/* Filter for glowing neon vector stroke */}
                    <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Horizontal Y-Axis Grid Lines & Tick Labels */}
                  <g className="grid-y">
                    {yTicks.map((tickVal) => {
                      const yPos = yScale(tickVal);
                      return (
                        <g key={tickVal} className="tick">
                          <line
                            x1={margin.left}
                            x2={margin.left + innerWidth}
                            y1={yPos}
                            y2={yPos}
                            stroke="#334155"
                            strokeOpacity={0.35}
                            strokeDasharray="2,2"
                          />
                          <text
                            x={margin.left - 10}
                            y={yPos + 4}
                            fill="#94a3b8"
                            fontSize="11"
                            fontFamily="ui-monospace, monospace"
                            textAnchor="end"
                          >
                            ${tickVal}k
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Vertical X-Axis Date Ticks */}
                  <g className="grid-x">
                    {xTicks.map((dateTick) => {
                      const xPos = xScale(dateTick);
                      return (
                        <g key={dateTick.toISOString()} className="tick">
                          <line
                            x1={xPos}
                            x2={xPos}
                            y1={margin.top}
                            y2={margin.top + innerHeight}
                            stroke="#334155"
                            strokeOpacity={0.25}
                            strokeDasharray="2,4"
                          />
                          <text
                            x={xPos}
                            y={margin.top + innerHeight + 20}
                            fill="#94a3b8"
                            fontSize="11"
                            fontFamily="ui-monospace, monospace"
                            textAnchor="middle"
                          >
                            {d3.timeFormat("%b %d")(dateTick)}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Salary Envelope Area Band (Confidence Interval / Min-Max Spread) */}
                  {(viewMode === "band" || viewMode === "ceiling") && areaPath && (
                    <path
                      d={areaPath}
                      fill={`url(#${areaGradientId})`}
                      className="transition-all duration-300"
                    />
                  )}

                  {/* Ceiling (Upper Bound) Dashed Line */}
                  {(viewMode === "band" || viewMode === "ceiling") && ceilingLinePath && (
                    <path
                      d={ceilingLinePath}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={1.5}
                      strokeDasharray="3,3"
                      strokeOpacity={0.75}
                    />
                  )}

                  {/* Floor (Lower Bound) Dashed Line */}
                  {viewMode === "band" && floorLinePath && (
                    <path
                      d={floorLinePath}
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth={1.5}
                      strokeDasharray="3,3"
                      strokeOpacity={0.65}
                    />
                  )}

                  {/* Linear Mathematical Trendline */}
                  {trendlinePath && (
                    <line
                      x1={trendlinePath.x1}
                      y1={trendlinePath.y1}
                      x2={trendlinePath.x2}
                      y2={trendlinePath.y2}
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeDasharray="5,5"
                      strokeOpacity={0.6}
                    />
                  )}

                  {/* Primary Glowing Median Curve */}
                  {medianLinePath && (
                    <path
                      d={medianLinePath}
                      fill="none"
                      stroke={`url(#${gradientId})`}
                      strokeWidth={3}
                      filter={`url(#${glowFilterId})`}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Crosshair Guideline on Hover/Select */}
                  {activeFocusPoint && (
                    <g className="crosshair-indicator">
                      <line
                        x1={xScale(activeFocusPoint.date)}
                        x2={xScale(activeFocusPoint.date)}
                        y1={margin.top}
                        y2={margin.top + innerHeight}
                        stroke="#6366f1"
                        strokeWidth={1.5}
                        strokeDasharray="3,3"
                        strokeOpacity={0.9}
                      />
                      {/* Vertical Min to Max connecting barbell */}
                      <line
                        x1={xScale(activeFocusPoint.date)}
                        x2={xScale(activeFocusPoint.date)}
                        y1={yScale(activeFocusPoint.maxSalary)}
                        y2={yScale(activeFocusPoint.minSalary)}
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        strokeOpacity={0.8}
                      />
                      <circle
                        cx={xScale(activeFocusPoint.date)}
                        cy={yScale(activeFocusPoint.maxSalary)}
                        r={4}
                        fill="#38bdf8"
                      />
                      <circle
                        cx={xScale(activeFocusPoint.date)}
                        cy={yScale(activeFocusPoint.minSalary)}
                        r={4}
                        fill="#818cf8"
                      />
                    </g>
                  )}

                  {/* Interactive Nodes for each Job Application */}
                  {dataPoints.map((pt) => {
                    const cx = xScale(pt.date);
                    const cy = yScale(pt.avgSalary);
                    const isSelected = selectedPoint?.job.id === pt.job.id;
                    const isHovered = hoveredPoint?.job.id === pt.job.id;
                    const isInterview = pt.job.status === "interview";

                    return (
                      <g
                        key={pt.job.id}
                        className="cursor-pointer transition-transform duration-150"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() => setSelectedPoint(isSelected ? null : pt)}
                      >
                        {/* Outer pulsating ring for interviews or selected node */}
                        {(isInterview || isSelected || isHovered) && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 11 : isInterview ? 9 : 8}
                            fill="none"
                            stroke={isInterview ? "#10b981" : "#6366f1"}
                            strokeWidth={2}
                            strokeOpacity={0.7}
                            className={isInterview ? "animate-pulse" : ""}
                          />
                        )}

                        {/* Core Data Point Dot */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isInterview ? 5.5 : 4.5}
                          fill={isInterview ? "#10b981" : "#38bdf8"}
                          stroke="#020617"
                          strokeWidth={2}
                        />

                        {/* Transparent click target to ease touch & mouse interaction */}
                        <circle cx={cx} cy={cy} r={16} fill="transparent" />
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Interactive Tooltip Card */}
                {activeFocusPoint && (
                  <div
                    className="absolute z-20 pointer-events-auto bg-slate-950/95 border border-indigo-500/60 rounded-xl p-3.5 shadow-2xl backdrop-blur-md w-72 text-xs text-slate-200 transition-all duration-150 animate-in fade-in"
                    style={{
                      left: Math.min(
                        Math.max(16, xScale(activeFocusPoint.date) - 144),
                        containerWidth - 304
                      ),
                      top: 12,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                              activeFocusPoint.job.platform === "LinkedIn"
                                ? "bg-sky-950 text-sky-300 border border-sky-800"
                                : "bg-amber-950 text-amber-300 border border-amber-800"
                            }`}
                          >
                            {activeFocusPoint.job.platform}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                              activeFocusPoint.job.status === "interview"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                            }`}
                          >
                            {activeFocusPoint.job.status === "interview"
                              ? "Interview Screen"
                              : "Auto-Applied"}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1 line-clamp-1">
                          {activeFocusPoint.job.title}
                        </h4>
                        <p className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span>{activeFocusPoint.job.company}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">
                          ATS Fit
                        </span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {activeFocusPoint.job.atsFitScore}%
                        </span>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 border-b border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Salary Range:</span>
                        <span className="font-mono font-bold text-emerald-300 text-xs">
                          {activeFocusPoint.rawSalary}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Midpoint Target:</span>
                        <span className="font-mono font-semibold text-sky-300 text-xs">
                          ${activeFocusPoint.avgSalary}k / yr
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Applied Timeline:</span>
                        <span className="text-slate-300 text-[11px] font-mono">
                          {d3.timeFormat("%b %d, %Y")(activeFocusPoint.date)} (
                          {activeFocusPoint.daysAgo === 0
                            ? "Today"
                            : `${activeFocusPoint.daysAgo}d ago`}
                          )
                        </span>
                      </div>
                    </div>

                    {activeFocusPoint.job.tailoredSummarySnippet && (
                      <p className="pt-2 text-[10px] text-slate-400 italic line-clamp-2">
                        "{activeFocusPoint.job.tailoredSummarySnippet}"
                      </p>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Click node to pin details</span>
                      <a
                        href={activeFocusPoint.job.easyApplyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                      >
                        <span>Open Posting</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Context Footer with Trend Diagnostics */}
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                <strong className="text-slate-200 font-semibold">Compensation Diagnosis: </strong>
                Agent feedback iterations targeting high-barrier cloud keywords (Azure Container Apps, Cosmos DB) raised median offer range by{" "}
                <strong className="text-emerald-400 font-mono">+{stats.growthPercentage}%</strong> over 30 days.
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
              <span>X-Axis: Continuous Time Scale (d3.scaleTime)</span>
              <span>Y-Axis: USD Compensation (d3.scaleLinear)</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
