"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

const STEPS = [
  {
    title: "The Old Paradigm: Prompt Engineering",
    description: "In 2023-2024, the craft was static prompts. Better system prompts → better output. The mental model: write the right words, get the right result.",
  },
  {
    title: "The Problem: Static Prompts Hit a Wall",
    description: "Benchmarks showed: the same model, with different scaffolding, varied by 17 tasks on SWE-bench. The model wasn't the bottleneck. The context was.",
  },
  {
    title: "The 80/20 Shift",
    description: "In production agents, 80% of what determines quality is dynamic context — what you inject at runtime. Only 20% is the static system prompt written in advance.",
  },
  {
    title: "How Claude Code Implements This",
    description: "Claude Code assembles context from 10+ sources at runtime: CLAUDE.md, conversation history, tool results, memory files, MCP schemas, token budgets. All dynamic.",
  },
  {
    title: "Context Engineering Techniques",
    description: "The new craft: what to include, what to compress, what to defer. Claude Code's 7 compression strategies, deferred tools, and Auto-Dream are all context engineering.",
  },
  {
    title: "The New Paradigm",
    description: "Context Engineering is to 2026 what Prompt Engineering was to 2023. The practitioners who understand runtime context assembly will build the most capable agents.",
  },
];

const PROMPT_SOURCES = [
  { label: "CLAUDE.md", share: 15, color: "#6366f1", dynamic: true },
  { label: "Tool schemas", share: 20, color: "#3b82f6", dynamic: true },
  { label: "Memory files", share: 12, color: "#8b5cf6", dynamic: true },
  { label: "Tool results", share: 18, color: "#ec4899", dynamic: true },
  { label: "Conversation history", share: 10, color: "#f97316", dynamic: true },
  { label: "Static system prompt", share: 20, color: "#71717a", dynamic: false },
  { label: "MCP schemas", share: 5, color: "#14b8a6", dynamic: true },
];

const TECHNIQUES = [
  { name: "7-strategy compression", desc: "snip → microcompact → collapse → summarize", color: "#6366f1" },
  { name: "Deferred tool loading", desc: "18 tools loaded on-demand via ToolSearchTool", color: "#3b82f6" },
  { name: "CLAUDE.md hierarchy", desc: "Project-specific context injected per session", color: "#8b5cf6" },
  { name: "Auto-Dream", desc: "Cross-session memory consolidation at runtime", color: "#ec4899" },
  { name: "Token budget tracking", desc: "95% threshold triggers compression pipeline", color: "#f97316" },
];

export default function ContextEngineeringVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 3500 });
  const palette = useSvgPalette();

  const step = viz.currentStep;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500">{title}</div>
        )}

        {/* Step 0: Old paradigm */}
        <AnimatePresence>
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-center text-xs font-mono text-zinc-400 mb-4">
                2023–2024 Mental Model
              </div>
              <div className="flex items-center justify-center gap-3">
                {["Write prompt", "→", "Better prompt", "→", "Best output"].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className={item === "→" ? "text-zinc-400 text-lg" : "rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3 text-center dark:border-zinc-700 dark:bg-zinc-800">
                <div className="text-xs font-mono text-zinc-500">The craft was static — words chosen in advance</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: The problem */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-center text-xs font-mono text-zinc-400 mb-4">
                SWE-bench Evidence
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Same model + naive scaffolding", score: 38, color: "#ef4444" },
                  { label: "Same model + Claude Code harness", score: 55, color: "#22c55e" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="rounded-xl border p-4 text-center"
                    style={{ borderColor: item.color + "40", background: item.color + "10" }}
                  >
                    <div className="text-3xl font-bold mb-1" style={{ color: item.color }}>
                      {item.score}%
                    </div>
                    <div className="text-[11px] text-zinc-500">{item.label}</div>
                  </motion.div>
                ))}
              </div>
              <div className="text-center text-xs font-mono text-amber-600 dark:text-amber-400">
                17-point gap — same model, different scaffolding
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: 80/20 */}
        <AnimatePresence>
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center text-xs font-mono text-zinc-400 mb-2">Context Composition</div>
              <div className="flex items-center justify-center gap-6">
                {[
                  { label: "Dynamic Context", pct: 80, color: "#6366f1", sub: "injected at runtime" },
                  { label: "Static Prompt", pct: 20, color: "#71717a", sub: "written in advance" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2 }}
                  >
                    <svg width="80" height="80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#e4e4e7" strokeWidth="8" className="dark:stroke-zinc-700" />
                      <motion.circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - item.pct / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                        initial={{ strokeDashoffset: `${2 * Math.PI * 34}` }}
                        animate={{ strokeDashoffset: `${2 * Math.PI * 34 * (1 - item.pct / 100)}` }}
                        transition={{ duration: 1, delay: i * 0.3 }}
                      />
                      <text x="40" y="45" textAnchor="middle" fontSize="18" fontWeight="bold" fill={item.color}>{item.pct}%</text>
                    </svg>
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{item.label}</div>
                    <div className="text-[10px] text-zinc-400">{item.sub}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: How Claude Code implements this */}
        <AnimatePresence>
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="text-center text-xs font-mono text-zinc-400 mb-2">Runtime Context Sources</div>
              <div className="space-y-1.5">
                {PROMPT_SOURCES.map((src, i) => (
                  <motion.div
                    key={src.label}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <span className="w-36 text-right text-[11px] font-mono text-zinc-500">{src.label}</span>
                    <div className="flex-1 h-5 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden relative">
                      <motion.div
                        className="h-full rounded flex items-center pl-2"
                        style={{ backgroundColor: src.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${src.share * 4}%` }}
                        transition={{ duration: 0.6, delay: i * 0.07 }}
                      >
                        <span className="text-[9px] font-bold text-white">{src.share}%</span>
                      </motion.div>
                    </div>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        color: src.dynamic ? "#22c55e" : "#71717a",
                        background: src.dynamic ? "#22c55e18" : "#71717a18",
                      }}
                    >
                      {src.dynamic ? "dynamic" : "static"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: Techniques */}
        <AnimatePresence>
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="text-center text-xs font-mono text-zinc-400 mb-2">Context Engineering Techniques in Claude Code</div>
              <div className="space-y-2">
                {TECHNIQUES.map((t, i) => (
                  <motion.div
                    key={t.name}
                    className="rounded-lg border p-3"
                    style={{ borderColor: t.color + "40", background: t.color + "08" }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="text-xs font-bold font-mono mb-0.5" style={{ color: t.color }}>
                      {t.name}
                    </div>
                    <div className="text-[11px] text-zinc-500">{t.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 5: New paradigm */}
        <AnimatePresence>
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-xl border-2 border-blue-500/30 bg-blue-50 p-6 text-center dark:bg-blue-950/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  Context Engineering
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  The 2026 paradigm for production agent quality
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "What to include", icon: "+" },
                    { label: "What to compress", icon: "⊖" },
                    { label: "What to defer", icon: "⏭" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-white p-2 dark:bg-zinc-800">
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center text-xs font-mono text-zinc-400">
                The practitioners who master runtime context will build the most capable agents
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
