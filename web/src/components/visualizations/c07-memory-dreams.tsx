"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

const DREAM_PHASES = [
  { id: "orient", label: "Orient", desc: "Read MEMORY.md index, understand structure", icon: "🧭" },
  { id: "gather", label: "Gather", desc: "Read git log, recent sessions, conversations", icon: "📥" },
  { id: "consolidate", label: "Consolidate", desc: "Merge, deduplicate, update memories", icon: "🔗" },
  { id: "prune", label: "Prune", desc: "Delete stale/outdated entries, trim index", icon: "✂️" },
];

const MEMORY_TYPES = [
  { type: "user", color: "#3b82f6", example: "user prefers terse responses" },
  { type: "feedback", color: "#f59e0b", example: "don't mock DB in tests" },
  { type: "project", color: "#22c55e", example: "merge freeze after Mar 5" },
  { type: "reference", color: "#a855f7", example: "bugs tracked in Linear INGEST" },
];

const STEPS = [
  {
    title: "Overview",
    description: "Claude Code's memory system: file-based memories in ~/.claude/projects/ with MEMORY.md index. Auto-Dream consolidates memories autonomously.",
  },
  {
    title: "MEMORY.md — The Index",
    description: "MEMORY.md is always loaded into context. It's an index of one-line pointers (<200 lines, ~25KB limit). Each entry links to a separate memory file with frontmatter.",
  },
  {
    title: "findRelevantMemories()",
    description: "At conversation start, memories are loaded and scored for relevance. The system reads MEMORY.md, then fetches individual memory files that match the current context.",
  },
  {
    title: "Memory Formation",
    description: "During conversation, Claude extracts memorable facts: user preferences, feedback corrections, project decisions, external references. Each becomes a .md file with type/name/description frontmatter.",
  },
  {
    title: "Auto-Dream Trigger",
    description: "Three gates must ALL pass: (1) 24+ hours since last dream, (2) 5+ sessions since last dream, (3) advisory lock acquired. This prevents concurrent dreams across sessions.",
  },
  {
    title: "Dream 4 Phases",
    description: "The dream subagent runs Orient → Gather → Consolidate → Prune. It reads git log, recent conversations, and memory files, then reorganizes the memory store.",
  },
  {
    title: "Dream Subagent",
    description: "Dreams run as a read-only subagent: it can read files and run bash (read-only), but cannot edit project code. It only modifies memory files. This is safe autonomous maintenance.",
  },
];

export default function MemoryDreamsVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2800 });
  const palette = useSvgPalette();

  const activeDreamPhase = viz.currentStep === 5 ? -1 : -2; // all phases animate at step 5

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {title}
          </div>
        )}
        <svg viewBox="0 0 680 380" className="w-full" style={{ maxHeight: 420 }}>
          {/* ========= TOP HALF: Memory Lifecycle ========= */}
          <text x={20} y={18} fontSize={11} fontWeight={700} fill={palette.labelFill} fontFamily="monospace">
            Memory Lifecycle
          </text>

          {/* Three lifecycle stages */}
          {["Formation", "Evolution", "Retrieval"].map((stage, i) => {
            const x = 30 + i * 220;
            const isActive =
              (stage === "Formation" && (viz.currentStep === 3 || viz.currentStep === 0)) ||
              (stage === "Evolution" && (viz.currentStep === 5 || viz.currentStep === 6 || viz.currentStep === 0)) ||
              (stage === "Retrieval" && (viz.currentStep === 2 || viz.currentStep === 0));
            return (
              <g key={stage}>
                <motion.rect
                  x={x} y={30} width={190} height={34} rx={17}
                  fill={isActive ? palette.activeNodeFill : palette.nodeFill}
                  stroke={isActive ? palette.activeNodeStroke : palette.nodeStroke}
                  strokeWidth={1.5}
                  animate={{ opacity: isActive ? 1 : 0.4 }}
                  transition={{ duration: 0.3 }}
                />
                <text
                  x={x + 95} y={51} textAnchor="middle" fontSize={11}
                  fontWeight={isActive ? 700 : 400} fontFamily="monospace"
                  fill={isActive ? palette.activeNodeText : palette.nodeText}
                >
                  {stage}
                </text>
                {i < 2 && (
                  <line
                    x1={x + 195} y1={47} x2={x + 220} y2={47}
                    stroke={palette.edgeStroke} strokeWidth={1.5}
                    markerEnd="url(#memArrow)"
                  />
                )}
              </g>
            );
          })}

          <defs>
            <marker id="memArrow" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={palette.edgeStroke} />
            </marker>
          </defs>

          {/* MEMORY.md representation (step 1) */}
          {(viz.currentStep === 1 || viz.currentStep === 2) && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <rect x={30} y={78} width={280} height={80} rx={6} fill={palette.bgSubtle} stroke={palette.nodeStroke} strokeWidth={1} />
              <text x={40} y={94} fontSize={10} fontWeight={700} fill={palette.activeNodeFill} fontFamily="monospace">
                MEMORY.md
              </text>
              <text x={40} y={110} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                - [User role](user_role.md) — data scientist
              </text>
              <text x={40} y={122} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                - [DB testing](feedback_db.md) — no mocks
              </text>
              <text x={40} y={134} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                - [Merge freeze](project_freeze.md) — after Mar 5
              </text>
              <text x={40} y={148} fontSize={8} fill="#ef4444" fontFamily="monospace">
                {"<200 lines | ~25KB limit"}
              </text>
            </motion.g>
          )}

          {/* Memory types (step 3 - formation) */}
          {viz.currentStep === 3 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {MEMORY_TYPES.map((m, i) => {
                const x = 30 + i * 160;
                return (
                  <motion.g
                    key={m.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <rect x={x} y={78} width={148} height={52} rx={5} fill={m.color} opacity={0.15} stroke={m.color} strokeWidth={1} />
                    <text x={x + 8} y={95} fontSize={10} fontWeight={700} fill={m.color} fontFamily="monospace">
                      {m.type}
                    </text>
                    <text x={x + 8} y={112} fontSize={7.5} fill={palette.labelFill} fontFamily="monospace">
                      {m.example}
                    </text>
                  </motion.g>
                );
              })}
            </motion.g>
          )}

          {/* findRelevantMemories flow (step 2) */}
          {viz.currentStep === 2 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.rect
                x={350} y={82} width={180} height={30} rx={5}
                fill={palette.activeNodeFill} opacity={0.2}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <text x={360} y={102} fontSize={9} fontWeight={600} fill={palette.activeNodeFill} fontFamily="monospace">
                findRelevantMemories()
              </text>
              <motion.line
                x1={315} y1={100} x2={345} y2={100}
                stroke={palette.activeEdgeStroke} strokeWidth={1.5}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.g>
          )}

          {/* ========= DIVIDER ========= */}
          <line x1={20} y1={170} x2={660} y2={170} stroke={palette.edgeStroke} strokeDasharray="6,4" opacity={0.4} />

          {/* ========= BOTTOM HALF: Auto-Dream ========= */}
          <text x={20} y={192} fontSize={11} fontWeight={700} fill={palette.labelFill} fontFamily="monospace">
            Auto-Dream System
          </text>

          {/* Three-gate trigger (step 4) */}
          {(viz.currentStep === 4 || viz.currentStep === 0) && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {[
                { label: "24h+ since last dream", x: 30 },
                { label: "5+ sessions elapsed", x: 240 },
                { label: "Advisory lock acquired", x: 450 },
              ].map((gate, i) => {
                const isTriggered = viz.currentStep === 4;
                return (
                  <g key={gate.label}>
                    <motion.rect
                      x={gate.x} y={205} width={190} height={28} rx={5}
                      fill={isTriggered ? "#22c55e" : palette.nodeFill}
                      stroke={isTriggered ? "#16a34a" : palette.nodeStroke}
                      strokeWidth={1.5}
                      animate={{ opacity: isTriggered ? 1 : 0.5 }}
                    />
                    <text
                      x={gate.x + 95} y={223} textAnchor="middle" fontSize={9}
                      fontWeight={600} fontFamily="monospace"
                      fill={isTriggered ? "#ffffff" : palette.nodeText}
                    >
                      {isTriggered ? "✓ " : ""}{gate.label}
                    </text>
                    {i < 2 && (
                      <text
                        x={gate.x + 205} y={223} fontSize={12} fontWeight={700}
                        fill={isTriggered ? "#22c55e" : palette.labelFill}
                      >
                        &amp;&amp;
                      </text>
                    )}
                  </g>
                );
              })}
            </motion.g>
          )}

          {/* Dream 4 phases (steps 5-6) */}
          {(viz.currentStep >= 5 || viz.currentStep === 0) && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              {DREAM_PHASES.map((phase, i) => {
                const x = 30 + i * 162;
                const isAnimating = viz.currentStep === 5;
                const phaseDelay = i * 0.6;
                return (
                  <g key={phase.id}>
                    <motion.rect
                      x={x} y={250} width={148} height={65} rx={6}
                      fill={isAnimating ? palette.activeNodeFill : palette.nodeFill}
                      stroke={isAnimating ? palette.activeNodeStroke : palette.nodeStroke}
                      strokeWidth={1.5}
                      animate={isAnimating ? {
                        fill: [palette.nodeFill, palette.activeNodeFill, palette.nodeFill],
                        stroke: [palette.nodeStroke, palette.activeNodeStroke, palette.nodeStroke],
                      } : {}}
                      transition={isAnimating ? { duration: 2, delay: phaseDelay, repeat: Infinity, repeatDelay: 1 } : {}}
                    />
                    <text
                      x={x + 74} y={272} textAnchor="middle" fontSize={11}
                      fontWeight={700} fontFamily="monospace"
                      fill={palette.nodeText}
                    >
                      {phase.icon} {phase.label}
                    </text>
                    <text
                      x={x + 74} y={288} textAnchor="middle" fontSize={7.5}
                      fill={palette.labelFill} fontFamily="monospace"
                    >
                      {phase.desc.split(", ").slice(0, 1).join("")}
                    </text>
                    <text
                      x={x + 74} y={300} textAnchor="middle" fontSize={7.5}
                      fill={palette.labelFill} fontFamily="monospace"
                    >
                      {phase.desc.split(", ").slice(1).join(", ")}
                    </text>
                    {/* Arrow between phases */}
                    {i < 3 && (
                      <motion.line
                        x1={x + 152} y1={282} x2={x + 162} y2={282}
                        stroke={palette.edgeStroke} strokeWidth={2}
                        markerEnd="url(#memArrow)"
                        animate={isAnimating ? { stroke: [palette.edgeStroke, palette.activeEdgeStroke, palette.edgeStroke] } : {}}
                        transition={isAnimating ? { duration: 2, delay: phaseDelay + 0.3, repeat: Infinity, repeatDelay: 1 } : {}}
                      />
                    )}
                  </g>
                );
              })}
            </motion.g>
          )}

          {/* Subagent badge (step 6) */}
          {viz.currentStep === 6 && (
            <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <rect x={30} y={330} width={620} height={30} rx={5} fill="#a855f7" opacity={0.12} stroke="#a855f7" strokeWidth={1} />
              <text x={340} y={349} textAnchor="middle" fontSize={10} fontWeight={600} fill="#a855f7" fontFamily="monospace">
                Dream Subagent: read-only bash | can only modify memory files | safe autonomous maintenance
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
