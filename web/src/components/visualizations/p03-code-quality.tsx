"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

const STEPS = [
  {
    title: "90% AI-Written Code",
    description: "Claude Code's source was reportedly 90% written by Claude Code itself — the tool dogfooding its own capabilities. This raises a question: what does AI-generated production code look like?",
  },
  {
    title: "The print.ts Case Study",
    description: "A single file: print.ts — 3,167 lines, cyclomatic complexity of 486. One function. It handles every terminal rendering case. It works perfectly. It's also unmaintainable by hand.",
  },
  {
    title: "What AI Code Looks Like vs Human Code",
    description: "AI-generated code tends to be verbose, repetitive, and locally correct but globally complex. Human code tends to be terse, abstract, and globally elegant but locally opaque.",
  },
  {
    title: "The Resource Question",
    description: "Claude Code uses 360MB RAM. OpenCode (a minimalist competitor) uses ~40MB. For a CLI tool, that's 9x overhead. The question: is that complexity necessary, or is it vibe coding residue?",
  },
  {
    title: "36-Line State Management",
    description: "Counter-evidence: the entire agent state is managed in 36 lines using useSyncExternalStore. No Redux, no Zustand. Where complexity matters, it's minimal. The 3,167-line file is an outlier.",
  },
  {
    title: "The Vibe Coding Hypothesis",
    description: "AI generates → passes tests → ships → no human refactors → complexity accumulates. 60-100 npm publishes/day, 5 PRs/engineer/day. Velocity is prioritized over cleanliness. It works.",
  },
];

const METRICS = [
  { name: "print.ts", loc: 3167, complexity: 486, color: "#ef4444", bar: 95 },
  { name: "query.ts", loc: 890, complexity: 67, color: "#f97316", bar: 55 },
  { name: "Tool.ts", loc: 230, complexity: 18, color: "#22c55e", bar: 18 },
  { name: "state (36 lines)", loc: 36, complexity: 4, color: "#6366f1", bar: 4 },
];

const COMPARISON = [
  { trait: "Line count per function", ai: "High (avg 200+)", human: "Low (avg 30)", winner: "human" },
  { trait: "Repetition", ai: "High (copy-paste patterns)", human: "Low (DRY)", winner: "human" },
  { trait: "Test passage", ai: "Reliable", human: "Reliable", winner: "tie" },
  { trait: "Local correctness", ai: "Very high", human: "High", winner: "ai" },
  { trait: "Global architecture", ai: "Often flat/monolithic", human: "Often layered", winner: "human" },
  { trait: "Velocity", ai: "Extremely fast", human: "Slow", winner: "ai" },
];

const VELOCITY = [
  { label: "npm publishes/day", value: "60-100", color: "#6366f1" },
  { label: "PRs/engineer/day", value: "5", color: "#3b82f6" },
  { label: "Refactors of print.ts", value: "0", color: "#ef4444" },
  { label: "Tests passing", value: "✓ all", color: "#22c55e" },
];

export default function CodeQualityVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 3800 });
  const palette = useSvgPalette();

  const step = viz.currentStep;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500">{title}</div>
        )}

        {/* Step 0: 90% AI-written */}
        <AnimatePresence>
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-3">Claude Code Source Authorship</div>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e4e4e7" strokeWidth="12" className="dark:stroke-zinc-700" />
                    <motion.circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="12"
                      strokeDasharray="251.3"
                      initial={{ strokeDashoffset: 251.3 }}
                      animate={{ strokeDashoffset: 251.3 * 0.1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">90%</div>
                    <div className="text-xs text-zinc-500">AI-written</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                {[
                  { pct: "90%", label: "Written by Claude Code", color: "#6366f1" },
                  { pct: "10%", label: "Human-authored", color: "#71717a" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border p-2"
                    style={{ borderColor: item.color + "30", background: item.color + "10" }}
                  >
                    <div className="text-lg font-bold" style={{ color: item.color }}>{item.pct}</div>
                    <div className="text-[10px] text-zinc-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: print.ts */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">Complexity by File</div>
              <div className="space-y-2">
                {METRICS.map((m, i) => (
                  <motion.div
                    key={m.name}
                    className="space-y-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex justify-between text-[11px] font-mono">
                      <span style={{ color: m.color }}>{m.name}</span>
                      <span className="text-zinc-500">{m.loc.toLocaleString()} LOC · complexity {m.complexity}</span>
                    </div>
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden">
                      <motion.div
                        className="h-full rounded"
                        style={{ backgroundColor: m.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${m.bar}%` }}
                        transition={{ duration: 0.7, delay: i * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="text-center text-[11px] font-mono text-red-500">
                print.ts: 3,167 lines, cyclomatic complexity 486 — one function
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Comparison */}
        <AnimatePresence>
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">AI Code vs Human Code</div>
              <div className="space-y-1.5">
                {COMPARISON.map((row, i) => (
                  <motion.div
                    key={row.trait}
                    className="grid grid-cols-3 gap-2 text-[11px] rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 font-mono text-zinc-600 dark:text-zinc-400">
                      {row.trait}
                    </div>
                    <div
                      className="px-2 py-1.5 font-mono"
                      style={{
                        background: row.winner === "ai" ? "#6366f120" : "transparent",
                        color: row.winner === "ai" ? "#6366f1" : "#71717a",
                      }}
                    >
                      {row.ai}
                    </div>
                    <div
                      className="px-2 py-1.5 font-mono"
                      style={{
                        background: row.winner === "human" ? "#22c55e20" : "transparent",
                        color: row.winner === "human" ? "#22c55e" : "#71717a",
                      }}
                    >
                      {row.human}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Resource usage */}
        <AnimatePresence>
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">Memory Usage Comparison</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Claude Code", ram: "360MB", bar: 90, color: "#ef4444", note: "Feature-rich, AI-generated" },
                  { name: "OpenCode", ram: "~40MB", bar: 10, color: "#22c55e", note: "Minimalist, hand-written" },
                ].map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="rounded-xl border p-4 text-center"
                    style={{ borderColor: item.color + "40", background: item.color + "10" }}
                  >
                    <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>{item.ram}</div>
                    <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-2">{item.name}</div>
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden">
                      <motion.div
                        className="h-full rounded"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.bar}%` }}
                        transition={{ duration: 0.8, delay: i * 0.2 }}
                      />
                    </div>
                    <div className="mt-1.5 text-[10px] text-zinc-400">{item.note}</div>
                  </motion.div>
                ))}
              </div>
              <div className="text-center text-xs font-mono text-amber-600 dark:text-amber-400">
                9x memory overhead — a CLI tool that thinks it&apos;s an IDE
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: 36-line state */}
        <AnimatePresence>
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">The Counter-Evidence</div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800/40 dark:bg-green-950/20">
                <div className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">36-line state management</div>
                <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                  <div><span className="text-purple-500">const</span> <span className="text-blue-500">state</span> = <span className="text-amber-500">useSyncExternalStore</span>(</div>
                  <div className="pl-4"><span className="text-green-500">subscribe</span>,</div>
                  <div className="pl-4"><span className="text-green-500">getSnapshot</span>,</div>
                  <div className="pl-4"><span className="text-green-500">getServerSnapshot</span></div>
                  <div>)</div>
                </div>
                <div className="mt-3 text-[11px] text-zinc-500">
                  No Redux. No Zustand. No boilerplate. Where complexity matters, the code is minimal.
                </div>
              </div>
              <div className="text-center text-[11px] font-mono text-zinc-400">
                The 3,167-line file is an outlier, not the rule
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 5: Vibe coding */}
        <AnimatePresence>
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">The Vibe Coding Hypothesis</div>
              <div className="flex flex-col gap-2">
                {[
                  "AI generates code",
                  "Tests pass",
                  "Code ships",
                  "Nobody refactors",
                  "Complexity accumulates",
                  "Ship more features instead",
                ].map((stage, i) => (
                  <motion.div
                    key={stage}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: `hsl(${(i * 40) + 220}, 70%, 55%)` }}
                    >
                      {i + 1}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">{stage}</div>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {VELOCITY.map((v, i) => (
                  <motion.div
                    key={v.label}
                    className="rounded-lg border p-2 text-center"
                    style={{ borderColor: v.color + "40", background: v.color + "10" }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                  >
                    <div className="text-base font-bold" style={{ color: v.color }}>{v.value}</div>
                    <div className="text-[9px] text-zinc-500">{v.label}</div>
                  </motion.div>
                ))}
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
