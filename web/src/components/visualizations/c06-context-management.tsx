"use client";

import { motion } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

const STRATEGIES = [
  { id: "snip", label: "1. Snip tool_results", desc: "Replace old results with [snipped]" },
  { id: "micro", label: "2. Micro-compact", desc: "Shrink tool_results in-place" },
  { id: "collapse", label: "3. Collapse blocks", desc: "Merge adjacent system msgs" },
  { id: "summarize", label: "4. Summarize", desc: "LLM-based conversation summary" },
  { id: "drop", label: "5. Drop old turns", desc: "Remove earliest message pairs" },
  { id: "truncate", label: "6. Truncate output", desc: "Trim oversized tool output" },
  { id: "manual", label: "7. /compact", desc: "User-triggered full compaction" },
];

const STEPS = [
  {
    title: "Overview",
    description: "Claude Code manages a finite context window (~200K tokens). As conversation grows, 7 independent strategies keep it within budget.",
  },
  {
    title: "Context Growing",
    description: "Each turn adds user messages, assistant responses, and tool results. The context window fills from bottom to top.",
  },
  {
    title: "Approaching Threshold (90%)",
    description: "COMPLETION_THRESHOLD = 0.9 — when usage crosses 90%, auto-compaction triggers. This is checked after every agent loop iteration.",
  },
  {
    title: "Micro-compact Fires",
    description: "First defense: tool_results are shrunk in-place. Large file contents become summaries. This is cheap and preserves conversation flow.",
  },
  {
    title: "Continue Growing",
    description: "After micro-compact buys space, the conversation continues. But if usage climbs past 90% again, escalation happens.",
  },
  {
    title: "Auto-compact Fires",
    description: "Full summarization: the LLM compresses the conversation history into a compact summary, preserving key decisions and context.",
  },
  {
    title: "Manual /compact",
    description: "User can trigger /compact anytime. This runs the full compaction pipeline immediately, regardless of current usage level.",
  },
  {
    title: "The 7 Strategies",
    description: "All strategies are independent and composable: snip → micro-compact → collapse → summarize → drop → truncate → /compact. Each targets a different source of bloat.",
  },
];

export default function ContextManagementVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2500 });
  const palette = useSvgPalette();

  // Context bar fill levels per step
  const fillLevels = [0.3, 0.5, 0.9, 0.55, 0.78, 0.92, 0.45, 0.3];
  const fillLevel = fillLevels[viz.currentStep];

  // State machine states
  const states = [
    { id: "normal", label: "Normal", x: 340, y: 30 },
    { id: "micro", label: "Micro-compact", x: 460, y: 30 },
    { id: "auto", label: "Auto-compact", x: 460, y: 130 },
    { id: "manual", label: "/compact", x: 340, y: 130 },
  ];

  const activeState = (() => {
    if (viz.currentStep <= 1) return "normal";
    if (viz.currentStep === 2) return "normal";
    if (viz.currentStep === 3) return "micro";
    if (viz.currentStep === 4) return "normal";
    if (viz.currentStep === 5) return "auto";
    if (viz.currentStep === 6) return "manual";
    return "normal";
  })();

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {title}
          </div>
        )}
        <svg viewBox="0 0 650 340" className="w-full" style={{ maxHeight: 400 }}>
          {/* Left: Context Window Bar */}
          <text x={20} y={16} fontSize={11} fontWeight={700} fill={palette.labelFill} fontFamily="monospace">
            Context Window
          </text>

          {/* Bar outline */}
          <rect x={20} y={24} width={60} height={220} rx={4} fill="none" stroke={palette.nodeStroke} strokeWidth={1.5} />

          {/* Fill level (grows from bottom) */}
          <motion.rect
            x={22}
            rx={3}
            width={56}
            fill={fillLevel > 0.85 ? "#ef4444" : fillLevel > 0.7 ? "#f59e0b" : palette.activeNodeFill}
            animate={{
              y: 24 + 220 * (1 - fillLevel) - 2,
              height: 220 * fillLevel,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          {/* Threshold line at 90% */}
          <line
            x1={18} y1={24 + 220 * 0.1} x2={84} y2={24 + 220 * 0.1}
            stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,3"
          />
          <text x={88} y={24 + 220 * 0.1 + 4} fontSize={8} fill="#ef4444" fontFamily="monospace">
            90%
          </text>

          {/* Usage percentage */}
          <motion.text
            x={50}
            y={260}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fontFamily="monospace"
            animate={{ fill: fillLevel > 0.85 ? "#ef4444" : fillLevel > 0.7 ? "#f59e0b" : palette.activeNodeFill }}
          >
            {Math.round(fillLevel * 100)}%
          </motion.text>

          {/* Context blocks inside bar */}
          {Array.from({ length: Math.floor(fillLevel * 8) }, (_, i) => {
            const blockY = 24 + 220 - (i + 1) * 26;
            const labels = ["user", "assistant", "tool_call", "tool_result", "user", "assistant", "tool_call", "tool_result"];
            const colors = ["#3b82f6", "#6b7280", "#f59e0b", "#22c55e", "#3b82f6", "#6b7280", "#f59e0b", "#22c55e"];
            return blockY > 24 ? (
              <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <rect x={26} y={blockY} width={48} height={20} rx={2} fill={colors[i]} opacity={0.3} />
                <text x={50} y={blockY + 13} textAnchor="middle" fontSize={7} fill={colors[i]} fontFamily="monospace" fontWeight={600}>
                  {labels[i]}
                </text>
              </motion.g>
            ) : null;
          })}

          {/* Right: State Machine */}
          <text x={340} y={16} fontSize={11} fontWeight={700} fill={palette.labelFill} fontFamily="monospace">
            Compression State Machine
          </text>

          {/* State machine arrows */}
          {/* Normal → Micro-compact */}
          <line x1={410} y1={45} x2={455} y2={45} stroke={palette.edgeStroke} strokeWidth={1.5} markerEnd="url(#arrowhead)" />
          <text x={432} y={38} textAnchor="middle" fontSize={7} fill={palette.labelFill} fontFamily="monospace">≥90%</text>

          {/* Micro-compact → Normal (back) */}
          <line x1={455} y1={58} x2={410} y2={58} stroke="#22c55e" strokeWidth={1} strokeDasharray="3,3" />
          <text x={432} y={68} textAnchor="middle" fontSize={7} fill="#22c55e" fontFamily="monospace">freed</text>

          {/* Micro-compact → Auto-compact */}
          <line x1={510} y1={60} x2={510} y2={125} stroke={palette.edgeStroke} strokeWidth={1.5} markerEnd="url(#arrowhead)" />
          <text x={522} y={95} fontSize={7} fill={palette.labelFill} fontFamily="monospace">still ≥90%</text>

          {/* Manual /compact (from Normal) */}
          <line x1={380} y1={60} x2={380} y2={125} stroke="#a855f7" strokeWidth={1.5} strokeDasharray="4,3" markerEnd="url(#arrowhead)" />
          <text x={365} y={95} fontSize={7} fill="#a855f7" fontFamily="monospace" textAnchor="end">user</text>

          {/* Auto/Manual → Normal */}
          <motion.path
            d="M 400 130 Q 280 90 340 48"
            fill="none" stroke="#22c55e" strokeWidth={1} strokeDasharray="3,3"
          />

          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={palette.edgeStroke} />
            </marker>
          </defs>

          {/* State nodes */}
          {states.map((state) => {
            const isActive = activeState === state.id;
            return (
              <g key={state.id}>
                <motion.rect
                  x={state.x}
                  y={state.y}
                  width={state.id === "micro" || state.id === "auto" ? 110 : 90}
                  height={28}
                  rx={14}
                  fill={isActive ? (state.id === "manual" ? "#a855f7" : palette.activeNodeFill) : palette.nodeFill}
                  stroke={isActive ? (state.id === "manual" ? "#9333ea" : palette.activeNodeStroke) : palette.nodeStroke}
                  strokeWidth={1.5}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  style={{ transformOrigin: `${state.x + 50}px ${state.y + 14}px` }}
                  transition={{ duration: 0.3 }}
                />
                <text
                  x={state.x + (state.id === "micro" || state.id === "auto" ? 55 : 45)}
                  y={state.y + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={isActive ? 700 : 400}
                  fontFamily="monospace"
                  fill={isActive ? palette.activeNodeText : palette.nodeText}
                >
                  {state.label}
                </text>
              </g>
            );
          })}

          {/* Bottom: Strategy List (visible on step 7) */}
          {viz.currentStep === 7 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <text x={140} y={185} fontSize={10} fontWeight={700} fill={palette.labelFill} fontFamily="monospace">
                7 Independent Strategies (priority order)
              </text>
              {STRATEGIES.map((s, i) => {
                const y = 200 + i * 20;
                return (
                  <motion.g
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <rect x={140} y={y - 2} width={460} height={16} rx={3} fill={palette.activeNodeFill} opacity={0.1} />
                    <text x={150} y={y + 10} fontSize={9} fontWeight={600} fill={palette.activeNodeFill} fontFamily="monospace">
                      {s.label}
                    </text>
                    <text x={340} y={y + 10} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                      {s.desc}
                    </text>
                  </motion.g>
                );
              })}
            </motion.g>
          )}

          {/* Blocks flowing into bar animation for steps 1-2 */}
          {(viz.currentStep === 1 || viz.currentStep === 2) && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.rect
                x={120} y={200} width={40} height={14} rx={3}
                fill={palette.activeNodeFill} opacity={0.6}
                animate={{ x: [120, 80, 80], y: [200, 200, 180], opacity: [0.6, 0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
              />
              <motion.text
                x={140} y={210}
                fontSize={7} fill={palette.activeNodeText} fontFamily="monospace" textAnchor="middle"
                animate={{ x: [140, 100, 100], y: [210, 210, 190], opacity: [1, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
              >
                +msg
              </motion.text>
            </motion.g>
          )}

          {/* Compaction effect for steps 3, 5, 6 */}
          {(viz.currentStep === 3 || viz.currentStep === 5 || viz.currentStep === 6) && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.text
                x={50} y={145}
                textAnchor="middle" fontSize={16}
                fill={viz.currentStep === 6 ? "#a855f7" : palette.activeNodeFill}
                animate={{ opacity: [1, 0.3, 1], scale: [1, 0.9, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ↓
              </motion.text>
              <text x={120} y={148} fontSize={9} fontWeight={600} fill={palette.activeNodeFill} fontFamily="monospace">
                {viz.currentStep === 3 ? "shrinking tool_results..." : viz.currentStep === 5 ? "summarizing history..." : "full compaction..."}
              </text>
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
