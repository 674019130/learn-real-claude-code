"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface TokenBreakdown {
  label: string;
  value: number;
  color: string;
  maxValue: number;
}

const TOKEN_STEP1: TokenBreakdown[] = [
  { label: "Input", value: 4200, color: "#3b82f6", maxValue: 10000 },
  { label: "Output", value: 1800, color: "#10b981", maxValue: 10000 },
  { label: "Cache Read", value: 0, color: "#f59e0b", maxValue: 10000 },
  { label: "Cache Write", value: 4200, color: "#8b5cf6", maxValue: 10000 },
];

const TOKEN_STEP2: TokenBreakdown[] = [
  { label: "Input", value: 800, color: "#3b82f6", maxValue: 10000 },
  { label: "Output", value: 2100, color: "#10b981", maxValue: 10000 },
  { label: "Cache Read", value: 3400, color: "#f59e0b", maxValue: 10000 },
  { label: "Cache Write", value: 0, color: "#8b5cf6", maxValue: 10000 },
];

const PRICING = [
  { model: "Opus", input: "$15", output: "$75", cacheRead: "$1.50" },
  { model: "Sonnet", input: "$3", output: "$15", cacheRead: "$0.30" },
  { model: "Haiku", input: "$0.25", output: "$1.25", cacheRead: "$0.03" },
];

const ERROR_STATES = [
  { id: "normal", label: "Normal", color: "#10b981" },
  { id: "compact", label: "Compaction", color: "#f59e0b" },
  { id: "collapse", label: "Collapse", color: "#f97316" },
  { id: "fallback", label: "Fallback", color: "#ef4444" },
  { id: "breaker", label: "Circuit Open", color: "#dc2626" },
];

const BACKOFF_STEPS = [
  { delay: "1s", attempt: 1 },
  { delay: "2s", attempt: 2 },
  { delay: "4s", attempt: 3 },
  { delay: "8s", attempt: 4 },
  { delay: "16s", attempt: 5 },
  { delay: "32s", attempt: 6 },
  { delay: "60s", attempt: 7 },
  { delay: "60s", attempt: 8 },
  { delay: "60s", attempt: 9 },
  { delay: "60s", attempt: 10 },
  { delay: "60s", attempt: 11 },
];

const STEPS = [
  {
    title: "First API Call — Token Breakdown",
    description: "Every API response includes a token usage breakdown: input tokens, output tokens, cache read (hits), and cache write (new cache entries). First call has no cache hits.",
  },
  {
    title: "Cache Hit — Reduced Cost",
    description: "Subsequent calls benefit from prompt caching. The system prompt is cached — cache reads cost 90% less than fresh input tokens. Huge cost savings on repeated calls.",
  },
  {
    title: "Per-Model Pricing",
    description: "Claude Code calculates cost per request using the model's pricing table. Opus costs 5x more than Sonnet. Cache reads are 10x cheaper than input tokens.",
  },
  {
    title: "Dual Telemetry Pipeline",
    description: "Two telemetry systems run in parallel: 1st-party (Anthropic) for product analytics and model improvement, 3rd-party (Datadog/Sentry) for infrastructure monitoring.",
  },
  {
    title: "Error Recovery Pipeline",
    description: "When context gets too large: compaction (summarize history) → collapse (drop middle messages) → fallback (start fresh). Circuit breaker opens after 3 consecutive failures.",
  },
  {
    title: "Exponential Backoff — 11 Steps",
    description: "API errors trigger exponential backoff: 1s → 2s → 4s → 8s → 16s → 32s → 60s (capped). 11 retries with jitter before giving up. Prevents thundering herd.",
  },
];

export default function ObservabilityVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 3500 });
  const palette = useSvgPalette();

  const tokens = viz.currentStep >= 1 ? TOKEN_STEP2 : TOKEN_STEP1;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {title}
          </div>
        )}

        {/* Three-column dashboard */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Left: Token usage bars */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              Token Usage
            </div>
            <svg viewBox="0 0 220 180" className="w-full" style={{ maxHeight: 180 }}>
              {tokens.map((token, i) => {
                const barWidth = Math.max(4, (token.value / token.maxValue) * 150);
                const isActive = viz.currentStep <= 1;
                return (
                  <g key={token.label}>
                    <text x={0} y={25 + i * 42} fontSize={9} fill={palette.labelFill} fontFamily="monospace">
                      {token.label}
                    </text>
                    <motion.rect
                      x={65}
                      y={14 + i * 42}
                      height={18}
                      rx={4}
                      fill={token.color}
                      animate={{
                        width: barWidth,
                        opacity: isActive ? 1 : 0.5,
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    <motion.text
                      x={65 + barWidth + 6}
                      y={27 + i * 42}
                      fontSize={8}
                      fill={token.color}
                      fontFamily="monospace"
                      fontWeight={600}
                      animate={{ opacity: isActive ? 1 : 0.5 }}
                    >
                      {token.value.toLocaleString()}
                    </motion.text>
                  </g>
                );
              })}

              {/* Cache savings indicator */}
              <AnimatePresence>
                {viz.currentStep >= 1 && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <rect x={0} y={155} width={210} height={20} rx={4} fill="rgba(245,158,11,0.1)" stroke="#f59e0b" strokeWidth={0.5} />
                    <text x={105} y={169} textAnchor="middle" fontSize={8} fill="#f59e0b" fontWeight={700} fontFamily="monospace">
                      Cache: 90% cost reduction
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </svg>
          </div>

          {/* Center: Cost calculator / Telemetry */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {viz.currentStep <= 2 ? "Cost / 1M Tokens" : "Telemetry"}
            </div>
            <AnimatePresence mode="wait">
              {viz.currentStep <= 2 ? (
                <motion.div key="pricing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-zinc-400 font-mono">
                      <div>Model</div>
                      <div>Input</div>
                      <div>Output</div>
                      <div>Cache</div>
                    </div>
                    {PRICING.map((row, i) => (
                      <motion.div
                        key={row.model}
                        className="grid grid-cols-4 gap-1 text-xs font-mono rounded p-1"
                        style={{
                          backgroundColor: viz.currentStep === 2 && i === 0 ? "rgba(59,130,246,0.1)" : "transparent",
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="font-bold text-zinc-700 dark:text-zinc-300">{row.model}</div>
                        <div className="text-blue-600 dark:text-blue-400">{row.input}</div>
                        <div className="text-emerald-600 dark:text-emerald-400">{row.output}</div>
                        <div className="text-amber-600 dark:text-amber-400">{row.cacheRead}</div>
                      </motion.div>
                    ))}
                    <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                      Cache reads = 10x cheaper than input
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="telemetry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="space-y-3">
                    <motion.div
                      className="rounded border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950/40"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300">1st Party — Anthropic</div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                        Product analytics, model quality, usage metrics
                      </div>
                    </motion.div>
                    <motion.div
                      className="rounded border border-purple-200 bg-purple-50 p-2 dark:border-purple-800 dark:bg-purple-950/40"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300">3rd Party — Datadog/Sentry</div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                        Infrastructure, errors, latency, traces
                      </div>
                    </motion.div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Both run in parallel, independent pipelines
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Error recovery / Backoff */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {viz.currentStep <= 4 ? "Error Recovery" : "Backoff Strategy"}
            </div>
            <AnimatePresence mode="wait">
              {viz.currentStep <= 4 ? (
                <motion.div key="recovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <svg viewBox="0 0 220 160" className="w-full" style={{ maxHeight: 160 }}>
                    {ERROR_STATES.map((state, i) => {
                      const y = 10 + i * 30;
                      const isActive = viz.currentStep >= 4;
                      const isCurrent = viz.currentStep >= 4 && i <= 3;
                      const isBreaker = i === 4;
                      return (
                        <g key={state.id}>
                          <motion.rect
                            x={30}
                            y={y}
                            width={100}
                            height={24}
                            rx={isBreaker ? 12 : 6}
                            fill={isCurrent || (isBreaker && isActive) ? `${state.color}22` : palette.nodeFill}
                            stroke={isCurrent || (isBreaker && isActive) ? state.color : palette.nodeStroke}
                            strokeWidth={isCurrent || (isBreaker && isActive) ? 1.5 : 1}
                            animate={{ opacity: isActive ? 1 : (i === 0 ? 0.6 : 0.3) }}
                          />
                          <text
                            x={80}
                            y={y + 16}
                            textAnchor="middle"
                            fontSize={8}
                            fill={isCurrent || (isBreaker && isActive) ? state.color : palette.labelFill}
                            fontFamily="monospace"
                            fontWeight={isCurrent ? 700 : 400}
                          >
                            {state.label}
                          </text>
                          {i < ERROR_STATES.length - 1 && (
                            <motion.text
                              x={80}
                              y={y + 30}
                              textAnchor="middle"
                              fontSize={10}
                              fill={isCurrent ? state.color : palette.edgeStroke}
                              animate={{ opacity: isActive ? 0.8 : 0.3 }}
                            >
                              ↓
                            </motion.text>
                          )}
                        </g>
                      );
                    })}
                    {viz.currentStep >= 4 && (
                      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <text x={155} y={140} fontSize={7} fill="#dc2626" fontWeight={700} fontFamily="monospace">
                          max 3 failures
                        </text>
                        <text x={155} y={152} fontSize={7} fill={palette.labelFill} fontFamily="monospace">
                          then circuit opens
                        </text>
                      </motion.g>
                    )}
                  </svg>
                </motion.div>
              ) : (
                <motion.div key="backoff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="space-y-1">
                    {BACKOFF_STEPS.map((step, i) => {
                      const width = Math.min(100, (parseInt(step.delay) / 60) * 100);
                      return (
                        <motion.div
                          key={i}
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <span className="w-4 text-[9px] text-zinc-400 font-mono text-right">{step.attempt}</span>
                          <div
                            className="h-3 rounded"
                            style={{
                              width: `${width}%`,
                              backgroundColor: i < 4 ? "#3b82f6" : i < 7 ? "#f59e0b" : "#ef4444",
                              opacity: 0.7,
                            }}
                          />
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">{step.delay}</span>
                        </motion.div>
                      );
                    })}
                    <div className="mt-1 text-[9px] text-zinc-400 font-mono">
                      + jitter to prevent thundering herd
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
