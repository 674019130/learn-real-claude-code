"use client";

import { motion } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

const BACKENDS = [
  { id: "command", label: "command", desc: "Shell script", color: "#f59e0b" },
  { id: "http", label: "HTTP", desc: "Webhook URL", color: "#3b82f6" },
  { id: "prompt", label: "prompt", desc: "Claude prompt", color: "#a855f7" },
];

const STEPS = [
  {
    title: "Overview",
    description: "Hooks let you intercept tool execution. PreToolUse fires before, PostToolUse fires after. Three backends: shell command, HTTP webhook, or Claude prompt.",
  },
  {
    title: "Hook Config",
    description: "Defined in settings.json under hooks[]. Each hook specifies: event type (PreToolUse/PostToolUse), matcher (tool name glob), and backend (command/HTTP/prompt).",
  },
  {
    title: "PreToolUse Fires",
    description: "Before the tool executes, all matching PreToolUse hooks run. The hook receives the tool name, input parameters, and session context as JSON on stdin.",
  },
  {
    title: "Command Hook (Shell)",
    description: "The most common backend: runs a shell command. stdin receives JSON context. The exit code and stdout determine the result. Environment variables carry session metadata.",
  },
  {
    title: "Hook Returns {decision: \"allow\"}",
    description: "If the hook approves, tool execution proceeds. The hook can also modify the tool input by returning {decision: \"allow\", modifiedInput: {...}}.",
  },
  {
    title: "Hook Returns {decision: \"block\"}",
    description: "If the hook blocks, the tool call is rejected entirely. The reason field is shown to Claude. This is how you enforce custom security policies.",
  },
  {
    title: "PostToolUse Fires",
    description: "After tool execution, PostToolUse hooks run. They receive the tool result and can log, audit, or trigger side effects. PostToolUse cannot block — it's observational.",
  },
  {
    title: "Async Hooks & Registry",
    description: "AsyncHookRegistry manages hook lifecycle. Hooks can be async — they're awaited with a timeout. Multiple hooks for the same event run in parallel, but all must pass for approval.",
  },
];

export default function HooksVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2500 });
  const palette = useSvgPalette();

  // Timeline positions
  const timelineY = 160;
  const preX = 140;
  const toolX = 320;
  const postX = 500;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {title}
          </div>
        )}
        <svg viewBox="0 0 680 350" className="w-full" style={{ maxHeight: 400 }}>
          {/* Horizontal timeline */}
          <line x1={40} y1={timelineY} x2={640} y2={timelineY} stroke={palette.edgeStroke} strokeWidth={2} />

          {/* Time arrow */}
          <polygon points="640,155 640,165 655,160" fill={palette.edgeStroke} />
          <text x={645} y={178} fontSize={8} fill={palette.labelFill} fontFamily="monospace">time</text>

          {/* Three main zones */}
          {/* PreToolUse zone */}
          {(() => {
            const isActive = viz.currentStep === 2 || viz.currentStep === 3 || viz.currentStep === 4 || viz.currentStep === 5;
            return (
              <g>
                <motion.rect
                  x={preX - 70} y={timelineY - 60} width={160} height={50} rx={8}
                  fill={isActive ? "#f59e0b" : palette.nodeFill}
                  fillOpacity={isActive ? 0.2 : 1}
                  stroke={isActive ? "#f59e0b" : palette.nodeStroke}
                  strokeWidth={isActive ? 2 : 1.5}
                  animate={{ opacity: isActive || viz.currentStep === 0 ? 1 : 0.35 }}
                />
                <text
                  x={preX + 10} y={timelineY - 32} textAnchor="middle"
                  fontSize={11} fontWeight={700} fontFamily="monospace"
                  fill={isActive ? "#f59e0b" : palette.nodeText}
                >
                  PreToolUse
                </text>
                {/* Timeline dot */}
                <circle cx={preX + 10} cy={timelineY} r={6} fill={isActive ? "#f59e0b" : palette.nodeStroke} />
              </g>
            );
          })()}

          {/* Tool Execution zone (center) */}
          {(() => {
            const isActive = viz.currentStep === 4 || viz.currentStep === 5;
            return (
              <g>
                <motion.rect
                  x={toolX - 60} y={timelineY - 60} width={130} height={50} rx={8}
                  fill={isActive ? palette.activeNodeFill : palette.nodeFill}
                  fillOpacity={isActive ? 0.2 : 1}
                  stroke={isActive ? palette.activeNodeStroke : palette.nodeStroke}
                  strokeWidth={isActive ? 2 : 1.5}
                  animate={{ opacity: isActive || viz.currentStep === 0 ? 1 : 0.35 }}
                />
                <text
                  x={toolX + 5} y={timelineY - 32} textAnchor="middle"
                  fontSize={11} fontWeight={700} fontFamily="monospace"
                  fill={isActive ? palette.activeNodeFill : palette.nodeText}
                >
                  Execute Tool
                </text>
                <circle cx={toolX + 5} cy={timelineY} r={6} fill={isActive ? palette.activeNodeFill : palette.nodeStroke} />
              </g>
            );
          })()}

          {/* PostToolUse zone */}
          {(() => {
            const isActive = viz.currentStep === 6;
            return (
              <g>
                <motion.rect
                  x={postX - 60} y={timelineY - 60} width={140} height={50} rx={8}
                  fill={isActive ? "#22c55e" : palette.nodeFill}
                  fillOpacity={isActive ? 0.2 : 1}
                  stroke={isActive ? "#22c55e" : palette.nodeStroke}
                  strokeWidth={isActive ? 2 : 1.5}
                  animate={{ opacity: isActive || viz.currentStep === 0 ? 1 : 0.35 }}
                />
                <text
                  x={postX + 10} y={timelineY - 32} textAnchor="middle"
                  fontSize={11} fontWeight={700} fontFamily="monospace"
                  fill={isActive ? "#22c55e" : palette.nodeText}
                >
                  PostToolUse
                </text>
                <circle cx={postX + 10} cy={timelineY} r={6} fill={isActive ? "#22c55e" : palette.nodeStroke} />
              </g>
            );
          })()}

          {/* Arrows between zones */}
          <line x1={preX + 80} y1={timelineY - 35} x2={toolX - 60} y2={timelineY - 35} stroke={palette.edgeStroke} strokeWidth={1} markerEnd="url(#hookArrow)" />
          <line x1={toolX + 70} y1={timelineY - 35} x2={postX - 60} y2={timelineY - 35} stroke={palette.edgeStroke} strokeWidth={1} markerEnd="url(#hookArrow)" />

          <defs>
            <marker id="hookArrow" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={palette.edgeStroke} />
            </marker>
          </defs>

          {/* Hook config (step 1) */}
          {viz.currentStep === 1 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect x={140} y={190} width={380} height={100} rx={6} fill={palette.bgSubtle} stroke={palette.nodeStroke} strokeWidth={1} />
              <text x={155} y={210} fontSize={9} fontWeight={700} fill={palette.activeNodeFill} fontFamily="monospace">
                settings.json → hooks[]
              </text>
              <text x={155} y={228} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                {'{ event: "PreToolUse",'}
              </text>
              <text x={155} y={242} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                {'  matcher: "Bash",'}
              </text>
              <text x={155} y={256} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                {'  command: "bash /path/to/validator.sh" }'}
              </text>
              <text x={155} y={278} fontSize={8} fill={palette.labelFill} fontFamily="monospace" fontStyle="italic">
                // matcher supports glob: &quot;File*&quot;, &quot;Bash&quot;, &quot;*&quot;
              </text>
            </motion.g>
          )}

          {/* Command hook stdin/stdout (step 3) */}
          {viz.currentStep === 3 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect x={60} y={190} width={260} height={110} rx={6} fill={palette.bgSubtle} stroke="#f59e0b" strokeWidth={1} />
              <text x={75} y={210} fontSize={9} fontWeight={700} fill="#f59e0b" fontFamily="monospace">
                Command Hook
              </text>

              {/* stdin */}
              <motion.rect
                x={75} y={218} width={90} height={22} rx={4}
                fill="#f59e0b" fillOpacity={0.15} stroke="#f59e0b" strokeWidth={1}
              />
              <text x={120} y={233} textAnchor="middle" fontSize={8} fill="#f59e0b" fontFamily="monospace" fontWeight={600}>
                stdin (JSON)
              </text>
              <text x={75} y={255} fontSize={7.5} fill={palette.labelFill} fontFamily="monospace">
                {'{ tool: "Bash",'}
              </text>
              <text x={75} y={267} fontSize={7.5} fill={palette.labelFill} fontFamily="monospace">
                {'  input: { command: "rm -rf /" },'}
              </text>
              <text x={75} y={279} fontSize={7.5} fill={palette.labelFill} fontFamily="monospace">
                {'  session: {...} }'}
              </text>

              {/* stdout */}
              <motion.rect
                x={180} y={218} width={90} height={22} rx={4}
                fill="#22c55e" fillOpacity={0.15} stroke="#22c55e" strokeWidth={1}
              />
              <text x={225} y={233} textAnchor="middle" fontSize={8} fill="#22c55e" fontFamily="monospace" fontWeight={600}>
                stdout
              </text>
            </motion.g>
          )}

          {/* Allow result (step 4) */}
          {viz.currentStep === 4 && (
            <motion.g initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <rect x={100} y={190} width={200} height={55} rx={8} fill="#22c55e" fillOpacity={0.12} stroke="#22c55e" strokeWidth={1.5} />
              <text x={200} y={212} textAnchor="middle" fontSize={10} fontWeight={700} fill="#22c55e" fontFamily="monospace">
                {'{ decision: "allow" }'}
              </text>
              <text x={200} y={230} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                → tool execution proceeds
              </text>
            </motion.g>
          )}

          {/* Block result (step 5) */}
          {viz.currentStep === 5 && (
            <motion.g initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <rect x={100} y={190} width={260} height={55} rx={8} fill="#ef4444" fillOpacity={0.12} stroke="#ef4444" strokeWidth={1.5} />
              <text x={230} y={212} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ef4444" fontFamily="monospace">
                {'{ decision: "block", reason: "..." }'}
              </text>
              <text x={230} y={230} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                → tool call rejected, reason shown to Claude
              </text>
            </motion.g>
          )}

          {/* PostToolUse detail (step 6) */}
          {viz.currentStep === 6 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect x={380} y={190} width={230} height={70} rx={6} fill={palette.bgSubtle} stroke="#22c55e" strokeWidth={1} />
              <text x={395} y={210} fontSize={9} fontWeight={700} fill="#22c55e" fontFamily="monospace">
                PostToolUse (observational)
              </text>
              <text x={395} y={228} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                Receives: tool name + result
              </text>
              <text x={395} y={242} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                Cannot block — only log/audit
              </text>
              <text x={395} y={256} fontSize={8} fill={palette.labelFill} fontFamily="monospace" fontStyle="italic">
                Use for: metrics, alerts, side effects
              </text>
            </motion.g>
          )}

          {/* Three backends (step 0 or step 7) */}
          {(viz.currentStep === 0 || viz.currentStep === 7) && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <text x={160} y={200} fontSize={10} fontWeight={700} fill={palette.labelFill} fontFamily="monospace">
                Three Hook Backends
              </text>
              {BACKENDS.map((b, i) => {
                const x = 100 + i * 180;
                return (
                  <g key={b.id}>
                    <motion.rect
                      x={x} y={210} width={150} height={40} rx={6}
                      fill={b.color} fillOpacity={0.15} stroke={b.color} strokeWidth={1.5}
                      animate={viz.currentStep === 7 ? { opacity: [0.6, 1, 0.6] } : {}}
                      transition={viz.currentStep === 7 ? { duration: 1.5, delay: i * 0.2, repeat: Infinity } : {}}
                    />
                    <text x={x + 75} y={228} textAnchor="middle" fontSize={10} fontWeight={700} fill={b.color} fontFamily="monospace">
                      {b.label}
                    </text>
                    <text x={x + 75} y={242} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                      {b.desc}
                    </text>
                  </g>
                );
              })}

              {/* Async note for step 7 */}
              {viz.currentStep === 7 && (
                <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <rect x={100} y={265} width={450} height={45} rx={6} fill={palette.bgSubtle} stroke={palette.nodeStroke} strokeWidth={1} />
                  <text x={115} y={283} fontSize={9} fontWeight={600} fill={palette.activeNodeFill} fontFamily="monospace">
                    AsyncHookRegistry
                  </text>
                  <text x={115} y={299} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                    Multiple hooks run in parallel • All must pass for approval • Timeout enforced
                  </text>
                </motion.g>
              )}
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
