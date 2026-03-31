"use client";

import { motion } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface Worker {
  id: string;
  label: string;
  task: string;
  angle: number; // position around coordinator
}

const WORKERS: Worker[] = [
  { id: "w1", label: "Worker 1", task: "Search codebase", angle: -60 },
  { id: "w2", label: "Worker 2", task: "Run tests", angle: 60 },
  { id: "w3", label: "Worker 3", task: "Write docs", angle: 180 },
];

const STEPS = [
  {
    title: "Overview",
    description: "Multi-agent: a Coordinator spawns Workers via TeamCreate, communicates via SendMessage, each Worker has an independent JSONL inbox. Hub-and-spoke topology.",
  },
  {
    title: "Coordinator Mode Activated",
    description: "When the task is complex, Claude enters coordinator mode. The coordinator plans the work, decides how to split it, and manages worker lifecycle.",
  },
  {
    title: "Spawn Workers (TeamCreate)",
    description: "TeamCreate spawns worker subagents. Each gets its own process, conversation context, and tool set. Workers are independent — they don't share memory with each other.",
  },
  {
    title: "Send Task (SendMessage)",
    description: "The coordinator sends tasks via SendMessage. Each message is written to the worker's JSONL inbox file. Workers poll their inbox for new messages.",
  },
  {
    title: "Worker Receives Task",
    description: "Worker reads from its inbox, gets the task. It now operates independently with its own agent loop — reading files, running tools, making decisions.",
  },
  {
    title: "Worker Executes Independently",
    description: "Each worker runs its own full agent loop. INTERNAL_WORKER_TOOLS are filtered — workers can't spawn sub-workers or use coordinator-only tools.",
  },
  {
    title: "Worker Reports Back",
    description: "Worker sends results back via SendMessage to coordinator. The coordinator's inbox receives the completion message with the worker's output.",
  },
  {
    title: "Coordinator Synthesizes",
    description: "Coordinator collects all worker results, synthesizes the final answer. Key rule: coordinator can't say 'based on findings' — must present as its own work. Fork subagent cache sharing enables fast spawning.",
  },
];

export default function MultiAgentVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2800 });
  const palette = useSvgPalette();

  // Hub position
  const hubX = 330;
  const hubY = 130;
  const radius = 140;

  // Worker positions computed from angles
  const workerPositions = WORKERS.map((w) => {
    const rad = (w.angle * Math.PI) / 180;
    return {
      ...w,
      x: hubX + Math.cos(rad) * radius,
      y: hubY + Math.sin(rad) * radius,
    };
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {title}
          </div>
        )}
        <svg viewBox="0 0 680 370" className="w-full" style={{ maxHeight: 420 }}>
          {/* Spokes (hub → worker connections) */}
          {workerPositions.map((w) => {
            const isActive = viz.currentStep >= 2;
            const isSending = viz.currentStep === 3;
            const isReceiving = viz.currentStep === 6;
            return (
              <g key={`spoke-${w.id}`}>
                <motion.line
                  x1={hubX} y1={hubY} x2={w.x} y2={w.y}
                  stroke={isActive ? palette.activeEdgeStroke : palette.edgeStroke}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isActive ? "none" : "4,4"}
                  animate={{ opacity: isActive ? 0.8 : 0.3 }}
                />

                {/* Animated message dot flying from hub to worker */}
                {isSending && (
                  <motion.circle
                    r={4}
                    fill="#f59e0b"
                    animate={{
                      cx: [hubX, w.x],
                      cy: [hubY, w.y],
                      opacity: [1, 0],
                    }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.5 }}
                  />
                )}

                {/* Animated message dot flying from worker to hub */}
                {isReceiving && (
                  <motion.circle
                    r={4}
                    fill="#22c55e"
                    animate={{
                      cx: [w.x, hubX],
                      cy: [w.y, hubY],
                      opacity: [1, 0],
                    }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.5 }}
                  />
                )}
              </g>
            );
          })}

          {/* Coordinator Hub */}
          {(() => {
            const isActive = viz.currentStep === 1 || viz.currentStep === 7 || viz.currentStep === 0;
            const isCoordinating = viz.currentStep >= 1;
            return (
              <g>
                {/* Glow ring */}
                {isCoordinating && (
                  <motion.circle
                    cx={hubX} cy={hubY} r={46}
                    fill="none" stroke={palette.activeNodeStroke}
                    strokeWidth={2}
                    animate={{ opacity: [0.2, 0.5, 0.2], r: [46, 50, 46] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <motion.circle
                  cx={hubX} cy={hubY} r={40}
                  fill={isCoordinating ? palette.activeNodeFill : palette.nodeFill}
                  stroke={isCoordinating ? palette.activeNodeStroke : palette.nodeStroke}
                  strokeWidth={2}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  style={{ transformOrigin: `${hubX}px ${hubY}px` }}
                />
                <text
                  x={hubX} y={hubY - 5} textAnchor="middle"
                  fontSize={10} fontWeight={700} fontFamily="monospace"
                  fill={isCoordinating ? palette.activeNodeText : palette.nodeText}
                >
                  Coordinator
                </text>
                <text
                  x={hubX} y={hubY + 10} textAnchor="middle"
                  fontSize={8} fontFamily="monospace"
                  fill={isCoordinating ? palette.activeNodeText : palette.labelFill}
                  opacity={0.7}
                >
                  (main agent)
                </text>
              </g>
            );
          })()}

          {/* Worker Nodes */}
          {workerPositions.map((w, i) => {
            const isSpawned = viz.currentStep >= 2;
            const isWorking = viz.currentStep === 4 || viz.currentStep === 5;
            const isReporting = viz.currentStep === 6;
            return (
              <g key={w.id}>
                {/* Worker circle */}
                <motion.circle
                  cx={w.x} cy={w.y} r={32}
                  fill={isWorking ? "#f59e0b" : isReporting ? "#22c55e" : palette.nodeFill}
                  fillOpacity={isWorking || isReporting ? 0.3 : 1}
                  stroke={isWorking ? "#f59e0b" : isReporting ? "#22c55e" : isSpawned ? palette.activeNodeStroke : palette.nodeStroke}
                  strokeWidth={1.5}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isSpawned ? 1 : 0,
                    opacity: isSpawned ? 1 : 0,
                  }}
                  style={{ transformOrigin: `${w.x}px ${w.y}px` }}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                />
                {isSpawned && (
                  <>
                    <text
                      x={w.x} y={w.y - 5} textAnchor="middle"
                      fontSize={9} fontWeight={600} fontFamily="monospace"
                      fill={palette.nodeText}
                    >
                      {w.label}
                    </text>
                    <text
                      x={w.x} y={w.y + 9} textAnchor="middle"
                      fontSize={7} fontFamily="monospace"
                      fill={palette.labelFill}
                    >
                      {w.task}
                    </text>
                  </>
                )}

                {/* JSONL Mailbox beneath worker */}
                {isSpawned && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <rect
                      x={w.x - 35} y={w.y + 38} width={70} height={20} rx={3}
                      fill={palette.bgSubtle} stroke={palette.nodeStroke} strokeWidth={1}
                    />
                    <text
                      x={w.x} y={w.y + 52} textAnchor="middle"
                      fontSize={7} fontFamily="monospace" fill={palette.labelFill}
                    >
                      inbox.jsonl
                    </text>

                    {/* Message indicator */}
                    {(viz.currentStep >= 3) && (
                      <motion.circle
                        cx={w.x + 30} cy={w.y + 40} r={5}
                        fill={viz.currentStep === 3 ? "#f59e0b" : "#22c55e"}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </motion.g>
                )}

                {/* Working animation */}
                {isWorking && (
                  <motion.text
                    x={w.x + 36} y={w.y - 20}
                    fontSize={9} fontWeight={700} fill="#f59e0b" fontFamily="monospace"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ...
                  </motion.text>
                )}
              </g>
            );
          })}

          {/* Bottom: Key constraints and details */}
          {viz.currentStep === 5 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect x={120} y={285} width={420} height={40} rx={6} fill={palette.bgSubtle} stroke="#f59e0b" strokeWidth={1} />
              <text x={330} y={305} textAnchor="middle" fontSize={9} fontWeight={600} fill="#f59e0b" fontFamily="monospace">
                INTERNAL_WORKER_TOOLS filtered
              </text>
              <text x={330} y={318} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                Workers cannot: spawn sub-workers, use TeamCreate, or use SendMessage to other workers
              </text>
            </motion.g>
          )}

          {viz.currentStep === 7 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect x={100} y={275} width={470} height={65} rx={6} fill={palette.bgSubtle} stroke={palette.activeNodeStroke} strokeWidth={1} />
              <text x={335} y={295} textAnchor="middle" fontSize={9} fontWeight={700} fill={palette.activeNodeFill} fontFamily="monospace">
                Synthesis Rules
              </text>
              <text x={115} y={312} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                {`• Coordinator can't say "based on findings" — must present as own work`}
              </text>
              <text x={115} y={326} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                • Fork subagent cache sharing → workers inherit parent's conversation cache
              </text>
            </motion.g>
          )}

          {/* SendMessage label on spokes for step 3 */}
          {viz.currentStep === 3 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <text x={hubX + 60} y={hubY - 50} fontSize={8} fontWeight={600} fill="#f59e0b" fontFamily="monospace">
                SendMessage()
              </text>
            </motion.g>
          )}

          {/* TeamCreate label for step 2 */}
          {viz.currentStep === 2 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <text x={hubX + 50} y={hubY - 45} fontSize={8} fontWeight={600} fill={palette.activeNodeFill} fontFamily="monospace">
                TeamCreate()
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
