"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface PromptSection {
  id: string;
  label: string;
  tokens: number;
  cached: boolean;
  color: string;
  height: number;
}

const PROMPT_SECTIONS: PromptSection[] = [
  { id: "identity", label: "Identity & Role", tokens: 800, cached: true, color: "#3b82f6", height: 28 },
  { id: "tools", label: "Tool Instructions", tokens: 12000, cached: true, color: "#8b5cf6", height: 80 },
  { id: "env", label: "Environment Context", tokens: 2400, cached: true, color: "#06b6d4", height: 36 },
  { id: "claude-md", label: "CLAUDE.md Files", tokens: 3500, cached: false, color: "#f59e0b", height: 48 },
  { id: "dynamic", label: "Dynamic Sections", tokens: 1200, cached: false, color: "#ef4444", height: 32 },
  { id: "date", label: "Date & MCP Context", tokens: 400, cached: false, color: "#ec4899", height: 22 },
];

const TOTAL_TOKENS = PROMPT_SECTIONS.reduce((sum, s) => sum + s.tokens, 0);

const VISIBLE_PER_STEP: Record<number, string[]> = {
  0: [],
  1: ["identity"],
  2: ["identity", "tools"],
  3: ["identity", "tools", "env"],
  4: ["identity", "tools", "env", "claude-md"],
  5: ["identity", "tools", "env", "claude-md", "dynamic", "date"],
  6: ["identity", "tools", "env", "claude-md", "dynamic", "date"],
};

const STEPS = [
  {
    title: "Empty Prompt",
    description:
      "The system prompt starts empty. fetchSystemPromptParts() assembles it from 110+ sections at the start of every API call.",
  },
  {
    title: "Identity — Who is Claude Code?",
    description:
      "First section: identity, role definition, tone guidelines. ~800 tokens. This is cached globally — identical for all users.",
  },
  {
    title: "Tool Instructions — The Largest Section",
    description:
      "Instructions for every tool: Read, Write, Edit, Bash, Grep, etc. ~12K tokens — the single largest section. Cached because tools don't change per-session.",
  },
  {
    title: "Environment Context",
    description:
      "OS, shell, platform, git status, working directory. ~2.4K tokens. Still in the cached (static) portion — environment is detected once at startup.",
  },
  {
    title: "CACHE BOUNDARY — CLAUDE.md (Uncached)",
    description:
      "SYSTEM_PROMPT_DYNAMIC_BOUNDARY splits static from dynamic. CLAUDE.md files are per-project and per-user — they CANNOT be globally cached. This is the amber zone.",
  },
  {
    title: "Dynamic Sections — Per-Request",
    description:
      "Current date, MCP server context, git reminders, active tasks. These change every request. No caching possible — always recomputed.",
  },
  {
    title: "Full Prompt — Cache Hit Indicator",
    description:
      "~20K tokens total. The static portion (blue/purple/cyan) gets a prompt cache hit on repeated calls. Dynamic portion (amber/red/pink) is always fresh. Cache saves ~70% of prompt tokens.",
  },
];

export default function SystemPromptVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2500 });
  const palette = useSvgPalette();

  const visible = VISIBLE_PER_STEP[viz.currentStep] || [];
  const showCacheLine = viz.currentStep >= 4;
  const showCacheHit = viz.currentStep === 6;

  // Calculate cumulative Y positions
  const sectionPositions = PROMPT_SECTIONS.map((section, i) => {
    const y = PROMPT_SECTIONS.slice(0, i).reduce((sum, s) => sum + s.height + 6, 0);
    return { ...section, y: y + 40 };
  });

  const cacheLineY = sectionPositions[3].y - 3; // Between env and claude-md
  const totalHeight = sectionPositions[sectionPositions.length - 1].y + sectionPositions[sectionPositions.length - 1].height + 60;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left panel: Stacking diagram */}
        <div className="lg:col-span-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {title && (
            <div className="mb-2 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {title}
            </div>
          )}

          <svg viewBox={`0 0 420 ${totalHeight}`} className="w-full" style={{ maxHeight: totalHeight }}>
            {/* Title */}
            <text x={210} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={palette.activeNodeFill} fontFamily="monospace">
              System Prompt Assembly
            </text>

            {/* Prompt sections */}
            {sectionPositions.map((section, i) => {
              const isVisible = visible.includes(section.id);
              const isHighlighted = viz.currentStep > 0 && (
                (viz.currentStep === 1 && section.id === "identity") ||
                (viz.currentStep === 2 && section.id === "tools") ||
                (viz.currentStep === 3 && section.id === "env") ||
                (viz.currentStep === 4 && section.id === "claude-md") ||
                (viz.currentStep === 5 && (section.id === "dynamic" || section.id === "date")) ||
                (viz.currentStep === 6)
              );

              return (
                <AnimatePresence key={section.id}>
                  {isVisible && (
                    <motion.g
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      {/* Section block */}
                      <motion.rect
                        x={40}
                        y={section.y}
                        width={280}
                        height={section.height}
                        rx={6}
                        fill={section.color}
                        fillOpacity={isHighlighted ? 0.18 : 0.08}
                        stroke={section.color}
                        strokeWidth={isHighlighted ? 2 : 1}
                        strokeOpacity={isHighlighted ? 0.6 : 0.2}
                        animate={{
                          fillOpacity: isHighlighted ? 0.18 : 0.08,
                          strokeWidth: isHighlighted ? 2 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      />

                      {/* Section label */}
                      <motion.text
                        x={55}
                        y={section.y + section.height / 2 + 4}
                        fontSize={10}
                        fontWeight={isHighlighted ? 700 : 500}
                        fontFamily="monospace"
                        fill={section.color}
                        animate={{ opacity: isHighlighted ? 1 : 0.6 }}
                      >
                        {section.label}
                      </motion.text>

                      {/* Token count inline */}
                      <motion.text
                        x={310}
                        y={section.y + section.height / 2 + 4}
                        fontSize={9}
                        fontFamily="monospace"
                        fill={section.color}
                        opacity={0.6}
                        textAnchor="end"
                      >
                        ~{(section.tokens / 1000).toFixed(1)}K
                      </motion.text>

                      {/* Cached indicator */}
                      {showCacheHit && (
                        <motion.text
                          x={340}
                          y={section.y + section.height / 2 + 4}
                          fontSize={8}
                          fontFamily="monospace"
                          fontWeight={600}
                          fill={section.cached ? "#22c55e" : "#ef4444"}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                        >
                          {section.cached ? "CACHED" : "FRESH"}
                        </motion.text>
                      )}
                    </motion.g>
                  )}
                </AnimatePresence>
              );
            })}

            {/* Cache boundary line */}
            {showCacheLine && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <line
                  x1={30} y1={cacheLineY} x2={395} y2={cacheLineY}
                  stroke="#f59e0b" strokeWidth={2} strokeDasharray="6,4"
                />
                <rect x={145} y={cacheLineY - 10} width={130} height={18} rx={9}
                  fill="#f59e0b" fillOpacity={0.15}
                />
                <text
                  x={210} y={cacheLineY + 2}
                  textAnchor="middle" fontSize={9} fontWeight={700}
                  fontFamily="monospace" fill="#f59e0b"
                >
                  DYNAMIC_BOUNDARY
                </text>

                {/* Labels */}
                <text x={395} y={cacheLineY - 18} textAnchor="end" fontSize={8} fontFamily="monospace" fill="#22c55e" fontWeight={600}>
                  STATIC (globally cached)
                </text>
                <text x={395} y={cacheLineY + 18} textAnchor="end" fontSize={8} fontFamily="monospace" fill="#ef4444" fontWeight={600}>
                  DYNAMIC (per-session)
                </text>
              </motion.g>
            )}

            {/* Cache hit summary bar at bottom */}
            {showCacheHit && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {/* Background bar */}
                <rect x={40} y={totalHeight - 40} width={340} height={22} rx={11}
                  fill={palette.nodeFill} stroke={palette.nodeStroke} strokeWidth={1}
                />
                {/* Cached portion (green) */}
                <motion.rect
                  x={40} y={totalHeight - 40} rx={11} ry={11} height={22}
                  fill="#22c55e" fillOpacity={0.25}
                  initial={{ width: 0 }}
                  animate={{ width: 340 * 0.75 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                />
                <motion.text
                  x={40 + 340 * 0.375} y={totalHeight - 25}
                  textAnchor="middle" fontSize={9} fontWeight={600}
                  fontFamily="monospace" fill="#22c55e"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  ~75% cache hit
                </motion.text>
                <motion.text
                  x={40 + 340 * 0.875} y={totalHeight - 25}
                  textAnchor="middle" fontSize={9} fontWeight={600}
                  fontFamily="monospace" fill="#ef4444"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  ~25% fresh
                </motion.text>
              </motion.g>
            )}

            {/* Empty state */}
            {viz.currentStep === 0 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <rect x={100} y={100} width={220} height={60} rx={8}
                  fill="none" stroke={palette.nodeStroke} strokeWidth={1.5} strokeDasharray="6,4"
                />
                <text x={210} y={135} textAnchor="middle" fontSize={11} fontFamily="monospace" fill={palette.labelFill}>
                  Empty prompt — assembling...
                </text>
              </motion.g>
            )}
          </svg>
        </div>

        {/* Right panel: Token breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Token Breakdown
          </div>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {PROMPT_SECTIONS.filter((s) => visible.includes(s.id)).map((section, i) => {
                const isNew = (
                  (viz.currentStep === 1 && section.id === "identity") ||
                  (viz.currentStep === 2 && section.id === "tools") ||
                  (viz.currentStep === 3 && section.id === "env") ||
                  (viz.currentStep === 4 && section.id === "claude-md") ||
                  (viz.currentStep === 5 && (section.id === "dynamic" || section.id === "date"))
                );

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className={`rounded-lg border p-2.5 ${
                      isNew
                        ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40"
                        : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: section.color }}
                        />
                        <span className="text-xs font-semibold font-mono text-zinc-700 dark:text-zinc-300">
                          {section.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">
                        {section.tokens.toLocaleString()}
                      </span>
                    </div>
                    {/* Token bar */}
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: section.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(section.tokens / 12000) * 100}%` }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span
                        className="text-[9px] font-mono font-semibold"
                        style={{ color: section.cached ? "#22c55e" : "#f59e0b" }}
                      >
                        {section.cached ? "CACHED" : "UNCACHED"}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono">
                        {((section.tokens / TOTAL_TOKENS) * 100).toFixed(0)}% of total
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {visible.length > 0 && (
              <motion.div
                key="total"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 rounded-lg border border-zinc-300 bg-zinc-100 p-2.5 dark:border-zinc-600 dark:bg-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300">
                    Total
                  </span>
                  <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300">
                    {PROMPT_SECTIONS.filter((s) => visible.includes(s.id))
                      .reduce((sum, s) => sum + s.tokens, 0)
                      .toLocaleString()}{" "}
                    tokens
                  </span>
                </div>
              </motion.div>
            )}

            {visible.length === 0 && (
              <div className="py-8 text-center text-xs text-zinc-400">
                Step through to see prompt assembly
              </div>
            )}
          </div>
        </div>
      </div>

      <StepControls
        currentStep={viz.currentStep}
        totalSteps={viz.totalSteps}
        onPrev={viz.prev}
        onNext={viz.next}
        onReset={viz.reset}
        isPlaying={viz.isPlaying}
        onToggleAutoPlay={viz.toggleAutoPlay}
        stepTitle={`Step ${viz.currentStep + 1}: ${STEPS[viz.currentStep].title}`}
        stepDescription={STEPS[viz.currentStep].description}
      />
    </div>
  );
}
