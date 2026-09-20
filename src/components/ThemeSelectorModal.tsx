import React from "react";
import {
  Palette,
  Check,
  X,
  Sparkles,
  Zap,
  Layers,
  Eye,
  Sliders,
  TrendingUp,
  Cpu,
  Flame,
  Terminal,
} from "lucide-react";
import { ThemeId, THEMES } from "../types/theme";

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  activeThemeId,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const currentTheme = THEMES[activeThemeId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="theme-selector-modal"
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-400 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Palette className="w-5 h-5 text-indigo-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Chromatic Theme Architecture
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  3 Variations
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Select between three meticulously crafted, thematic, classy, and colorful bold UI palettes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active theme banner */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {currentTheme.swatches.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full border-2 border-slate-900 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                    Active Variation:
                  </span>
                  <span className="text-sm font-bold text-white">{currentTheme.name}</span>
                </div>
                <span className="text-xs text-slate-400">{currentTheme.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Atmosphere:</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                {currentTheme.tagline}
              </span>
            </div>
          </div>

          {/* 3 Variations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
              const theme = THEMES[themeKey];
              const isSelected = activeThemeId === themeKey;

              return (
                <div
                  key={themeKey}
                  id={`theme-card-${themeKey}`}
                  onClick={() => onSelectTheme(themeKey)}
                  className={`group relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-950 border-white/80 shadow-xl ring-2 ring-indigo-500/50 scale-[1.02]"
                      : "bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-950/80"
                  }`}
                >
                  {/* Selected Pill Badge */}
                  {isSelected && (
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-white text-slate-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Active</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header with Icon and Swatches */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${theme.primaryHex}, ${theme.secondaryHex})`,
                          }}
                        >
                          {themeKey === "azure" && <Cpu className="w-5 h-5 text-white" />}
                          {themeKey === "emerald" && <Terminal className="w-5 h-5 text-slate-950 font-bold" />}
                          {themeKey === "crimson" && <Flame className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base tracking-tight group-hover:text-indigo-300 transition-colors">
                            {theme.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {theme.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Color Swatch Bar */}
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Palette Matrix</span>
                        <span>{theme.primaryHex}</span>
                      </div>
                      <div className="flex h-4 w-full rounded-md overflow-hidden shadow-inner">
                        {theme.swatches.map((swatch, idx) => (
                          <div
                            key={idx}
                            className="flex-1 transition-transform hover:scale-110"
                            style={{ backgroundColor: swatch }}
                            title={swatch}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed min-h-[56px]">
                      {theme.description}
                    </p>

                    {/* Thematic UI Preview Simulation */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                        Interactive Component Preview
                      </span>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                        {/* Sample Tag */}
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                            style={{
                              backgroundColor: `${theme.primaryHex}20`,
                              color: theme.secondaryHex,
                              border: `1px solid ${theme.primaryHex}50`,
                            }}
                          >
                            96% ATS Match
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">CONF-A7X9</span>
                        </div>

                        {/* Sample Button */}
                        <div
                          className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md"
                          style={{
                            background: `linear-gradient(90deg, ${theme.primaryHex}, ${theme.secondaryHex})`,
                            color: themeKey === "emerald" ? "#02120b" : "#ffffff",
                          }}
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Batch Apply Live</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-5 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTheme(themeKey);
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        isSelected
                          ? "bg-white text-slate-950 shadow-lg font-bold"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Current Theme</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Switch to {theme.name}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Architectural Breakdown Table */}
          <div className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                Design Philosophy & Chromatic Hierarchy
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[11px] uppercase font-mono bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Variation</th>
                    <th className="py-2.5 px-3">Primary Aura</th>
                    <th className="py-2.5 px-3">Key Accent Colors</th>
                    <th className="py-2.5 px-3">Visual Tone & Target Archetype</th>
                    <th className="py-2.5 px-3">Substrate Background</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-indigo-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                      1. Quantum Azure
                    </td>
                    <td className="py-3 px-3">Cloud AI & Microservices</td>
                    <td className="py-3 px-3 font-mono text-cyan-300">
                      Indigo (#6366f1) • Cyan (#06b6d4) • Sky (#38bdf8)
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Authoritative, technical, high-precision Azure telemetry aesthetic.
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">#020617 (Obsidian Midnight)</td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                      2. Emerald Matrix
                    </td>
                    <td className="py-3 px-3">Algorithmic FinTech & Velocity</td>
                    <td className="py-3 px-3 font-mono text-emerald-300">
                      Neon Emerald (#10b981) • Mint (#34d399) • Cyber Jade (#06d6a0)
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      High-frequency terminal, quantitative confidence, decisive velocity.
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">#02120b (Pitch Forest)</td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-rose-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                      3. Nebula Crimson
                    </td>
                    <td className="py-3 px-3">Executive Luxury & Cyberpunk Velvet</td>
                    <td className="py-3 px-3 font-mono text-rose-300">
                      Solar Rose (#f43f5e) • Fuchsia (#d946ef) • Sunset Amber (#f59e0b)
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Hyper-contrast, sophisticated warm dark mode, bold royalty & charisma.
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">#0e0417 (Cosmic Amethyst)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Theme settings persist across reloads via browser local storage.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
