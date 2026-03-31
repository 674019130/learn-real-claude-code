"use client";

import { motion } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

const PHASES = [
  { id: "entry", label: "cli.tsx entry", file: "entrypoints/cli.tsx", duration: 5, y: 0 },
  { id: "fastpath", label: "Fast-path checks", file: "--version, --dump-system-prompt", duration: 1, y: 50 },
  { id: "profile", label: "profileCheckpoint", file: "cli_entry marker", duration: 2, y: 100 },
  { id: "parallel", label: "Parallel prefetch", file: "MDM + Keychain (concurrent)", duration: 30, y: 150 },
  { id: "import", label: "Dynamic import main.tsx", file: "804KB module evaluation", duration: 200, y: 200 },
  { id: "init", label: "init() — memoized", file: "configs, env vars, auth, graceful shutdown", duration: 80, y: 250 },
  { id: "commander", label: "Commander.parse()", file: "CLI args, model resolution", duration: 15, y: 300 },
  { id: "repl", label: "launchRepl()", file: "Ink render tree → REPL ready", duration: 50, y: 350 },
];

const STEPS = [
  {
    title: "Overview",
    description: "Claude Code's startup sequence — from cli.tsx to REPL in ~500ms. Each bar represents a phase.",
  },
  {
    title: "cli.tsx — The Entry Point",
    description: "main() starts here. First thing: check for fast-path flags (--version, --dump-system-prompt) that exit before importing any modules.",
  },
  {
    title: "Fast Paths — Zero Module Loading",
    description: "--version exits immediately with zero imports. --dump-system-prompt outputs the prompt and exits. These paths are ~0ms because they skip the entire module tree.",
  },
  {
    title: "Parallel Prefetch — Side Effects During Import",
    description: "startMdmRawRead() and startKeychainPrefetch() fire BEFORE the main import finishes. Expensive I/O runs in parallel with module evaluation — a key optimization.",
  },
  {
    title: "Dynamic Import — main.tsx (804KB)",
    description: "The massive main module loads lazily. Bun's compile-time DCE via feature() eliminates unreleased features from the bundle. This is the heaviest phase.",
  },
  {
    title: "init() — Runs Once (Memoized)",
    description: "init() is memoized — safe to call multiple times but only runs once. Loads configs, sets up environment variables, detects the repository, configures graceful shutdown.",
  },
  {
    title: "Commander & Auth",
    description: "Commander parses all CLI flags. OAuth tokens are validated. The trust dialog is checked. Model resolution picks the right Claude model variant.",
  },
  {
    title: "launchRepl() — Ready",
    description: "React/Ink mounts the terminal UI. The REPL event loop begins. Claude Code is ready for user input.",
  },
];

export default function CLIBootstrapVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2500 });
  const palette = useSvgPalette();

  const barStartX = 180;
  const maxBarWidth = 400;
  const maxDuration = Math.max(...PHASES.map((p) => p.duration));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {title}
          </div>
        )}
        <svg viewBox="0 0 700 420" className="w-full" style={{ maxHeight: 420 }}>
          {/* Time axis */}
          <text x={barStartX} y={415} fontSize={10} fill={palette.labelFill} fontFamily="monospace">
            0ms
          </text>
          <text x={barStartX + maxBarWidth} y={415} fontSize={10} fill={palette.labelFill} fontFamily="monospace" textAnchor="end">
            ~500ms
          </text>
          <line x1={barStartX} y1={400} x2={barStartX + maxBarWidth} y2={400} stroke={palette.edgeStroke} strokeDasharray="4,4" />

          {PHASES.map((phase, i) => {
            const isActive = viz.currentStep === 0 || viz.currentStep === i + 1;
            const isPast = viz.currentStep > i + 1;
            const barWidth = Math.max(8, (phase.duration / maxDuration) * maxBarWidth * 0.9);
            const isFastPath = phase.id === "fastpath";
            const isParallel = phase.id === "parallel";

            let fill = palette.nodeFill;
            let stroke = palette.nodeStroke;
            let opacity = viz.currentStep === 0 ? 0.5 : 0.2;

            if (isActive) {
              fill = palette.activeNodeFill;
              stroke = palette.activeNodeStroke;
              opacity = 1;
            } else if (isPast) {
              opacity = 0.7;
            }

            if (isFastPath && (isActive || viz.currentStep === 3)) {
              fill = "#22c55e";
              stroke = "#16a34a";
            }
            if (isParallel && (isActive || viz.currentStep === 4)) {
              fill = "#f59e0b";
              stroke = "#d97706";
            }

            return (
              <g key={phase.id}>
                <text
                  x={barStartX - 8}
                  y={phase.y + 25}
                  fontSize={11}
                  fill={isActive ? palette.activeNodeFill : palette.labelFill}
                  textAnchor="end"
                  fontFamily="monospace"
                  fontWeight={isActive ? 700 : 400}
                >
                  {phase.label}
                </text>

                <motion.rect
                  x={barStartX}
                  y={phase.y + 12}
                  rx={4}
                  ry={4}
                  height={22}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.5}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: barWidth, opacity }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />

                <motion.text
                  x={barStartX + barWidth + 6}
                  y={phase.y + 27}
                  fontSize={9}
                  fill={palette.labelFill}
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isActive || isPast ? 1 : 0 }}
                >
                  ~{phase.duration}ms
                </motion.text>

                {isActive && viz.currentStep > 0 && (
                  <motion.text
                    x={barStartX}
                    y={phase.y + 45}
                    fontSize={9}
                    fill={palette.activeEdgeStroke}
                    fontFamily="monospace"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                  >
                    {phase.file}
                  </motion.text>
                )}

                {isFastPath && viz.currentStep >= 3 && (
                  <motion.text
                    x={barStartX + barWidth + 44}
                    y={phase.y + 27}
                    fontSize={9}
                    fill="#22c55e"
                    fontWeight={700}
                    fontFamily="monospace"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    → exit 0
                  </motion.text>
                )}

                {isParallel && viz.currentStep >= 4 && (
                  <motion.text
                    x={barStartX + barWidth + 44}
                    y={phase.y + 27}
                    fontSize={9}
                    fill="#f59e0b"
                    fontWeight={700}
                    fontFamily="monospace"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                  >
                    async ⚡
                  </motion.text>
                )}
              </g>
            );
          })}
        </svg>
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
