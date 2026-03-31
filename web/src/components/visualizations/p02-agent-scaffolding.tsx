"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

const STEPS = [
  {
    title: "The Naive View: Model Is Everything",
    description: "The common assumption: better model = better agent. Just upgrade to the latest LLM and everything improves. This is wrong.",
  },
  {
    title: "Evidence: Same Model, Different Harness",
    description: "SWE-bench Verified benchmarks show the same model with naive scaffolding vs Claude Code's harness differs by 17+ tasks. The harness is the variable that explains the gap.",
  },
  {
    title: "What a Demo Agent Looks Like",
    description: "A weekend demo: user message → LLM call → parse → execute tool → return. 50 lines. Works in a notebook. Fails in production after 10 minutes.",
  },
  {
    title: "What a Production Agent Looks Like",
    description: "Claude Code: streaming executor, permission racing, 7 compression strategies, deferred tool loading, process-spawning multi-agent. 512,000 lines. Works for 8-hour sessions.",
  },
  {
    title: "The Harness Design Principles",
    description: "Anthropic's engineering blog: use different prompts for first turn vs subsequent turns. Write to progress files. Use git history as working memory. The harness encodes these decisions.",
  },
  {
    title: "Why Scaffolding > Model for Long Tasks",
    description: "For a 2-minute task, model quality dominates. For an 8-hour autonomous session, scaffolding dominates. The harness determines whether the agent can maintain coherence across 200K tokens.",
  },
];

const DEMO_AGENT = [
  { label: "User message", color: "#6366f1" },
  { label: "LLM call", color: "#3b82f6" },
  { label: "Parse response", color: "#8b5cf6" },
  { label: "Execute tool", color: "#ec4899" },
  { label: "Return result", color: "#f97316" },
];

const PRODUCTION_AGENT = [
  { label: "Fast-path check", color: "#6366f1" },
  { label: "Parallel prefetch", color: "#3b82f6" },
  { label: "System prompt assembly", color: "#8b5cf6" },
  { label: "Stream + mid-flight tools", color: "#ec4899" },
  { label: "Token budget check", color: "#f97316" },
  { label: "Permission racing", color: "#ef4444" },
  { label: "Context compression", color: "#22c55e" },
  { label: "Telemetry", color: "#14b8a6" },
];

const PRINCIPLES = [
  { title: "First-turn vs subsequent", desc: "Different system prompts for session start vs continuation", color: "#6366f1" },
  { title: "Progress files", desc: "Write intermediate state to disk so crashes don't lose work", color: "#3b82f6" },
  { title: "Git history as memory", desc: "Use repository history as working memory for context", color: "#8b5cf6" },
  { title: "Bounded subagents", desc: "3 focused agents > 1 generalist working 3x longer", color: "#ec4899" },
];

export default function AgentScaffoldingVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 3500 });
  const palette = useSvgPalette();

  const step = viz.currentStep;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500">{title}</div>
        )}

        {/* Step 0: Naive view */}
        <AnimatePresence>
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">Common Assumption</div>
              <div className="flex items-center gap-4">
                {[
                  { label: "GPT-4", score: "42%", color: "#ef4444" },
                  { label: "Claude 3.5", score: "49%", color: "#f97316" },
                  { label: "Claude Sonnet", score: "55%", color: "#22c55e" },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="rounded-xl border-2 px-5 py-3 text-center"
                      style={{ borderColor: m.color, background: m.color + "15" }}
                    >
                      <div className="text-xl font-bold" style={{ color: m.color }}>{m.score}</div>
                      <div className="text-xs text-zinc-500">{m.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 text-center">
                "Just use the newest model" — ignores scaffolding completely
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Same model, different harness */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">Same Model. Different Harness.</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Claude Sonnet\n+ naive scaffolding", score: 38, color: "#ef4444", sub: "Simple loop, no compression" },
                  { label: "Claude Sonnet\n+ Claude Code harness", score: 55, color: "#22c55e", sub: "512K lines of engineering" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="rounded-xl border p-4 text-center"
                    style={{ borderColor: item.color + "40", background: item.color + "10" }}
                  >
                    <div className="text-4xl font-bold mb-2" style={{ color: item.color }}>{item.score}%</div>
                    <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">{item.label}</div>
                    <div className="mt-2 text-[10px] text-zinc-400">{item.sub}</div>
                  </motion.div>
                ))}
              </div>
              <motion.div
                className="text-center text-sm font-bold text-amber-600 dark:text-amber-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                +17 tasks from scaffolding alone
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Demo agent */}
        <AnimatePresence>
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">Demo Agent — ~50 lines</div>
              <div className="flex flex-col items-center gap-1">
                {DEMO_AGENT.map((node, i) => (
                  <motion.div
                    key={node.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className="rounded-lg border px-6 py-2 text-sm font-medium font-mono"
                      style={{ borderColor: node.color + "60", background: node.color + "15", color: node.color }}
                    >
                      {node.label}
                    </div>
                    {i < DEMO_AGENT.length - 1 && (
                      <div className="text-zinc-300 dark:text-zinc-600 text-lg leading-none">↓</div>
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="text-center text-[11px] font-mono text-red-500">
                Fails after 10 min — no compression, no permissions, no recovery
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Production agent */}
        <AnimatePresence>
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">Production Agent — 512K lines</div>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCTION_AGENT.map((node, i) => (
                  <motion.div
                    key={node.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-lg border px-3 py-2 text-[11px] font-mono"
                    style={{ borderColor: node.color + "60", background: node.color + "12", color: node.color }}
                  >
                    {node.label}
                  </motion.div>
                ))}
              </div>
              <div className="text-center text-[11px] font-mono text-green-500">
                Works for 8-hour autonomous sessions
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: Design principles */}
        <AnimatePresence>
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">Anthropic Harness Design Principles</div>
              <div className="space-y-2">
                {PRINCIPLES.map((p, i) => (
                  <motion.div
                    key={p.title}
                    className="rounded-lg border p-3"
                    style={{ borderColor: p.color + "40", background: p.color + "08" }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="text-xs font-bold font-mono mb-0.5" style={{ color: p.color }}>
                      {p.title}
                    </div>
                    <div className="text-[11px] text-zinc-500">{p.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 5: Long tasks */}
        <AnimatePresence>
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-xs font-mono text-zinc-400 text-center mb-2">Task Duration vs What Matters More</div>
              <div className="relative h-48 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 400 160">
                  {/* Axes */}
                  <line x1="40" y1="130" x2="380" y2="130" stroke="#a1a1aa" strokeWidth="1" />
                  <line x1="40" y1="10" x2="40" y2="130" stroke="#a1a1aa" strokeWidth="1" />
                  <text x="200" y="155" textAnchor="middle" fontSize="10" fill="#71717a">Task Duration</text>
                  <text x="10" y="75" textAnchor="middle" fontSize="10" fill="#71717a" transform="rotate(-90 10 75)">Impact</text>
                  {/* Labels */}
                  <text x="100" y="144" textAnchor="middle" fontSize="9" fill="#71717a">2 min</text>
                  <text x="220" y="144" textAnchor="middle" fontSize="9" fill="#71717a">30 min</text>
                  <text x="340" y="144" textAnchor="middle" fontSize="9" fill="#71717a">8 hours</text>
                  {/* Model quality line — decreasing */}
                  <motion.path
                    d="M40,30 C100,35 200,60 380,110"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeDasharray="400"
                    initial={{ strokeDashoffset: 400 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.2 }}
                  />
                  <text x="320" y="100" fontSize="9" fill="#6366f1">model quality</text>
                  {/* Scaffolding line — increasing */}
                  <motion.path
                    d="M40,110 C100,90 200,50 380,20"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    strokeDasharray="400"
                    initial={{ strokeDashoffset: 400 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                  />
                  <text x="300" y="30" fontSize="9" fill="#f97316">scaffolding</text>
                </svg>
              </div>
              <div className="text-center text-xs font-mono text-zinc-400">
                Claude Code is optimized for the right side of this chart
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
