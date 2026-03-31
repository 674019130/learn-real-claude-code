"use client";

import { motion } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface Layer {
  id: string;
  label: string;
  desc: string;
  color: string;
}

const LAYERS: Layer[] = [
  { id: "cli", label: "CLI Args", desc: "--allowedTools, --dangerouslySkipPermissions", color: "#3b82f6" },
  { id: "settings", label: "Settings / MDM", desc: "settings.json, enterprise MDM policies", color: "#8b5cf6" },
  { id: "rules", label: "Permission Rules", desc: "Glob patterns: allow/deny per tool+path", color: "#f59e0b" },
  { id: "heuristics", label: "Heuristics", desc: "dangerousPatterns.ts — rm -rf, sudo, etc.", color: "#ef4444" },
  { id: "classifier", label: "YOLO Classifier", desc: "ML model: auto-approve safe operations", color: "#22c55e" },
];

const STEPS = [
  {
    title: "Overview",
    description: "5 layers of defense between Claude and your system. Every tool call passes through all active layers before execution.",
  },
  {
    title: "Layer 1: CLI Args",
    description: "--allowedTools restricts which tools are available. --dangerouslySkipPermissions bypasses all checks (DANGEROUS). These are the outermost gate.",
  },
  {
    title: "Layer 2: Settings / MDM",
    description: "settings.json defines per-project rules. Enterprise MDM policies can enforce restrictions fleet-wide. These are checked before per-request rules.",
  },
  {
    title: "Layer 3: Permission Rules",
    description: "Fine-grained glob patterns: allow Write to src/**/*.ts, deny Write to .env*. Rules are evaluated in order — first match wins.",
  },
  {
    title: "Layer 4: Heuristics",
    description: "dangerousPatterns.ts catches risky commands: rm -rf, chmod 777, curl|bash. Pattern matching on Bash tool arguments — a safety net for obvious dangers.",
  },
  {
    title: "Layer 5: YOLO Classifier",
    description: "ML-based auto-approve: classifies tool calls as safe/unsafe. Safe calls skip the user prompt. Reduces permission fatigue for read-only and low-risk operations.",
  },
  {
    title: "Permission Racing",
    description: "Key insight: hooks and the YOLO classifier RACE with user confirmation. Whichever returns first wins. If the classifier says 'allow' before the user clicks, it auto-approves.",
  },
  {
    title: "Denial Tracking",
    description: "denialTracking records every user denial. After repeated denials for the same tool pattern, Claude learns to stop asking. Persistent across the session.",
  },
];

export default function PermissionsVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2500 });
  const palette = useSvgPalette();

  const activeLayerIndex = viz.currentStep >= 1 && viz.currentStep <= 5 ? viz.currentStep - 1 : -1;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {title}
          </div>
        )}
        <svg viewBox="0 0 680 360" className="w-full" style={{ maxHeight: 400 }}>
          {/* Left: 5-Layer Stack */}
          <text x={20} y={18} fontSize={11} fontWeight={700} fill={palette.labelFill} fontFamily="monospace">
            Permission Layers
          </text>

          {LAYERS.map((layer, i) => {
            const y = 32 + i * 58;
            const isActive = activeLayerIndex === i || viz.currentStep === 0;
            const isHighlighted = activeLayerIndex === i;
            const isPast = viz.currentStep > i + 1 && viz.currentStep <= 5;

            return (
              <g key={layer.id}>
                <motion.rect
                  x={20} y={y} width={250} height={44} rx={6}
                  fill={isHighlighted ? layer.color : palette.nodeFill}
                  stroke={isHighlighted ? layer.color : palette.nodeStroke}
                  strokeWidth={isHighlighted ? 2 : 1.5}
                  fillOpacity={isHighlighted ? 0.2 : 1}
                  animate={{ opacity: isActive || isPast ? 1 : 0.3 }}
                  transition={{ duration: 0.3 }}
                />
                {/* Layer number badge */}
                <circle
                  cx={36} cy={y + 22} r={10}
                  fill={isHighlighted ? layer.color : palette.edgeStroke}
                  opacity={isActive || isPast ? 1 : 0.4}
                />
                <text
                  x={36} y={y + 26} textAnchor="middle" fontSize={10}
                  fontWeight={700} fill="#ffffff" fontFamily="monospace"
                >
                  {i + 1}
                </text>
                <text
                  x={54} y={y + 18} fontSize={10}
                  fontWeight={isHighlighted ? 700 : 500} fontFamily="monospace"
                  fill={isHighlighted ? layer.color : palette.nodeText}
                >
                  {layer.label}
                </text>
                <text
                  x={54} y={y + 34} fontSize={7.5}
                  fill={palette.labelFill} fontFamily="monospace"
                >
                  {layer.desc}
                </text>

                {/* Pass/block indicator for past layers */}
                {isPast && (
                  <motion.text
                    x={255} y={y + 26} fontSize={14}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    ✓
                  </motion.text>
                )}

                {/* Connector line between layers */}
                {i < 4 && (
                  <line
                    x1={145} y1={y + 44} x2={145} y2={y + 58}
                    stroke={palette.edgeStroke} strokeWidth={1} strokeDasharray="3,3"
                  />
                )}
              </g>
            );
          })}

          {/* Right: Request flow diagram */}
          <text x={330} y={18} fontSize={11} fontWeight={700} fill={palette.labelFill} fontFamily="monospace">
            Request Flow
          </text>

          {/* Tool call box */}
          <motion.rect
            x={330} y={32} width={140} height={34} rx={6}
            fill={palette.activeNodeFill} fillOpacity={0.15}
            stroke={palette.activeNodeStroke} strokeWidth={1.5}
          />
          <text x={400} y={54} textAnchor="middle" fontSize={10} fontWeight={600} fontFamily="monospace" fill={palette.activeNodeFill}>
            Tool Call Request
          </text>

          {/* Arrow down through layers */}
          <motion.line
            x1={400} y1={66} x2={400} y2={130}
            stroke={palette.activeEdgeStroke} strokeWidth={2}
            strokeDasharray="4,4"
            animate={{ strokeDashoffset: [0, -16] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />

          {/* Layer check box */}
          <rect x={340} y={130} width={120} height={30} rx={5} fill={palette.nodeFill} stroke={palette.nodeStroke} strokeWidth={1.5} />
          <text x={400} y={149} textAnchor="middle" fontSize={9} fontFamily="monospace" fill={palette.nodeText}>
            Layer Checks
          </text>

          {/* Fork: Allow / Deny */}
          <line x1={400} y1={160} x2={400} y2={180} stroke={palette.edgeStroke} strokeWidth={1.5} />

          {/* Allow path */}
          <line x1={400} y1={180} x2={340} y2={210} stroke="#22c55e" strokeWidth={1.5} />
          <motion.rect
            x={290} y={210} width={100} height={28} rx={14}
            fill="#22c55e" fillOpacity={0.2} stroke="#22c55e" strokeWidth={1.5}
          />
          <text x={340} y={228} textAnchor="middle" fontSize={10} fontWeight={600} fontFamily="monospace" fill="#22c55e">
            ALLOW
          </text>

          {/* Deny path */}
          <line x1={400} y1={180} x2={460} y2={210} stroke="#ef4444" strokeWidth={1.5} />
          <motion.rect
            x={410} y={210} width={100} height={28} rx={14}
            fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" strokeWidth={1.5}
          />
          <text x={460} y={228} textAnchor="middle" fontSize={10} fontWeight={600} fontFamily="monospace" fill="#ef4444">
            DENY
          </text>

          {/* Permission Racing (step 6) */}
          {viz.currentStep === 6 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <rect x={300} y={258} width={260} height={90} rx={8} fill={palette.bgSubtle} stroke={palette.nodeStroke} strokeWidth={1} />
              <text x={430} y={278} textAnchor="middle" fontSize={10} fontWeight={700} fill={palette.activeNodeFill} fontFamily="monospace">
                Permission Racing
              </text>

              {/* Three racers */}
              {[
                { label: "Hook", x: 315, color: "#8b5cf6" },
                { label: "Classifier", x: 390, color: "#22c55e" },
                { label: "User", x: 475, color: "#3b82f6" },
              ].map((racer, i) => (
                <g key={racer.label}>
                  <motion.rect
                    x={racer.x} y={290} width={65} height={22} rx={4}
                    fill={racer.color} fillOpacity={0.2} stroke={racer.color} strokeWidth={1}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                  />
                  <text x={racer.x + 32} y={305} textAnchor="middle" fontSize={8} fontWeight={600} fill={racer.color} fontFamily="monospace">
                    {racer.label}
                  </text>
                </g>
              ))}

              <text x={430} y={335} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                First to return wins → allow or deny
              </text>
            </motion.g>
          )}

          {/* Denial Tracking (step 7) */}
          {viz.currentStep === 7 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <rect x={300} y={258} width={260} height={90} rx={8} fill={palette.bgSubtle} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,3" />
              <text x={430} y={278} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ef4444" fontFamily="monospace">
                denialTracking
              </text>
              {[
                "Bash(rm -rf) — denied 3x → stop asking",
                "Write(.env) — denied 2x → flagged",
                "Bash(sudo) — denied 1x → monitoring",
              ].map((entry, i) => (
                <motion.text
                  key={i}
                  x={315} y={296 + i * 16}
                  fontSize={8} fill={palette.labelFill} fontFamily="monospace"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  {entry}
                </motion.text>
              ))}
            </motion.g>
          )}
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
