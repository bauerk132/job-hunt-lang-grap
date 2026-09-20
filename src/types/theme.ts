export type ThemeId = "azure" | "emerald" | "crimson";

export interface ThemeTokens {
  id: ThemeId;
  name: string;
  tagline: string;
  category: string;
  description: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  backgroundHex: string;
  swatches: string[];
  
  // Tailwind utility mappings
  rootClass: string;
  headerBg: string;
  headerBorder: string;
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  primaryGradient: string;
  primaryButtonText: string;
  accentBadge: string;
  accentText: string;
  secondaryText: string;
  highlightText: string;
  glowShadow: string;
  ringGlow: string;
  navActive: string;
  navActiveBorder: string;
  statusLive: string;
  
  // Chart colors for Recharts
  chartColors: {
    primary: string;
    secondary: string;
    accent: string;
    tertiary: string;
  };
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  azure: {
    id: "azure",
    name: "Quantum Azure",
    tagline: "Azure Cloud & Autonomous AI Core",
    category: "High-Tech Cloud Infrastructure",
    description: "Deep obsidian midnight paired with electric indigo, radiant cyber cyan, and azure cloud highlights. Engineered for high-clarity cloud telemetry, autonomous workflows, and microservice architectures.",
    primaryHex: "#6366f1",
    secondaryHex: "#06b6d4",
    accentHex: "#38bdf8",
    backgroundHex: "#020617",
    swatches: ["#6366f1", "#06b6d4", "#38bdf8", "#818cf8", "#0f172a"],
    rootClass: "theme-azure bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white",
    headerBg: "bg-slate-950/90 border-slate-800",
    headerBorder: "border-slate-800",
    cardBg: "bg-slate-900/80",
    cardBorder: "border-slate-800",
    cardBorderHover: "hover:border-indigo-500/60",
    primaryGradient: "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500",
    primaryButtonText: "text-white",
    accentBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    accentText: "text-indigo-400",
    secondaryText: "text-sky-400",
    highlightText: "text-cyan-300",
    glowShadow: "shadow-indigo-500/25",
    ringGlow: "ring-indigo-500/30",
    navActive: "bg-indigo-500/10 text-white",
    navActiveBorder: "border-indigo-500",
    statusLive: "bg-emerald-400 text-emerald-400",
    chartColors: {
      primary: "#6366f1",
      secondary: "#06b6d4",
      accent: "#ec4899",
      tertiary: "#10b981",
    },
  },
  emerald: {
    id: "emerald",
    name: "Emerald Matrix",
    tagline: "High-Velocity Algorithmic Terminal",
    category: "Quantitative FinTech & Velocity",
    description: "Deep pitch forest obsidian infused with vibrant neon emerald, mint aqua, and cyber lime highlights. Evokes rapid algorithmic execution, terminal precision, and unstoppable momentum in modern quantitative systems.",
    primaryHex: "#10b981",
    secondaryHex: "#34d399",
    accentHex: "#06d6a0",
    backgroundHex: "#02120b",
    swatches: ["#10b981", "#34d399", "#06d6a0", "#14b8a6", "#042f22"],
    rootClass: "theme-emerald bg-[#02120b] text-emerald-50 selection:bg-emerald-500 selection:text-slate-950",
    headerBg: "bg-[#031a10]/90 border-emerald-900/60",
    headerBorder: "border-emerald-900/60",
    cardBg: "bg-[#042417]/80",
    cardBorder: "border-emerald-800/60",
    cardBorderHover: "hover:border-emerald-400/70",
    primaryGradient: "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-400",
    primaryButtonText: "text-slate-950 font-bold",
    accentBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
    accentText: "text-emerald-400",
    secondaryText: "text-teal-300",
    highlightText: "text-mint-300",
    glowShadow: "shadow-emerald-500/30",
    ringGlow: "ring-emerald-500/40",
    navActive: "bg-emerald-500/15 text-emerald-200",
    navActiveBorder: "border-emerald-400",
    statusLive: "bg-emerald-400 text-emerald-400",
    chartColors: {
      primary: "#10b981",
      secondary: "#34d399",
      accent: "#f59e0b",
      tertiary: "#06b6d4",
    },
  },
  crimson: {
    id: "crimson",
    name: "Nebula Crimson",
    tagline: "Cyberpunk Velvet & Solar Royalty",
    category: "Luxury Bold & High-Contrast",
    description: "Deep cosmic amethyst velvet complemented by radiant solar rose, vibrant fuchsia, and warm sunset amber sparks. Crafted for striking visual impact, executive luxury, and high-fashion cybernetic aesthetics.",
    primaryHex: "#f43f5e",
    secondaryHex: "#d946ef",
    accentHex: "#f59e0b",
    backgroundHex: "#0d0417",
    swatches: ["#f43f5e", "#d946ef", "#a855f7", "#f59e0b", "#220838"],
    rootClass: "theme-crimson bg-[#0e0417] text-rose-50 selection:bg-rose-500 selection:text-white",
    headerBg: "bg-[#140624]/90 border-rose-950/80",
    headerBorder: "border-rose-950/80",
    cardBg: "bg-[#1c0833]/80",
    cardBorder: "border-purple-900/60",
    cardBorderHover: "hover:border-rose-500/70",
    primaryGradient: "bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-500 hover:from-rose-500 hover:via-fuchsia-500 hover:to-amber-400",
    primaryButtonText: "text-white font-bold",
    accentBadge: "bg-rose-500/20 text-rose-300 border-rose-500/50",
    accentText: "text-rose-400",
    secondaryText: "text-fuchsia-300",
    highlightText: "text-amber-300",
    glowShadow: "shadow-rose-500/30",
    ringGlow: "ring-rose-500/40",
    navActive: "bg-rose-500/15 text-rose-200",
    navActiveBorder: "border-rose-500",
    statusLive: "bg-rose-400 text-rose-400",
    chartColors: {
      primary: "#f43f5e",
      secondary: "#d946ef",
      accent: "#f59e0b",
      tertiary: "#38bdf8",
    },
  },
};
