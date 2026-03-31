"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface Command {
  name: string;
  desc: string;
}

const COMMAND_GROUPS: Record<string, { color: string; commands: Command[] }> = {
  Navigation: {
    color: "#3b82f6",
    commands: [
      { name: "/compact", desc: "Compress context" },
      { name: "/clear", desc: "Clear conversation" },
      { name: "/help", desc: "Show help" },
    ],
  },
  Configuration: {
    color: "#22c55e",
    commands: [
      { name: "/config", desc: "Edit settings" },
      { name: "/model", desc: "Switch model" },
      { name: "/permissions", desc: "Manage perms" },
    ],
  },
  Workflow: {
    color: "#a855f7",
    commands: [
      { name: "/commit", desc: "Git commit" },
      { name: "/review", desc: "Code review" },
      { name: "/init", desc: "Init project" },
    ],
  },
  Session: {
    color: "#f59e0b",
    commands: [
      { name: "/resume", desc: "Resume session" },
      { name: "/status", desc: "Show status" },
      { name: "/cost", desc: "Show cost" },
    ],
  },
  Debug: {
    color: "#ef4444",
    commands: [
      { name: "/bug", desc: "Report bug" },
      { name: "/doctor", desc: "Diagnostics" },
      { name: "/logs", desc: "View logs" },
    ],
  },
};

const FILTER_STATES: Record<number, string> = {
  0: "",
  1: "",
  2: "/com",
  3: "/compact",
  4: "/compact",
  5: "",
};

const STEPS = [
  {
    title: "Command Registry — All Commands",
    description:
      "The command registry holds 100+ slash commands organized by category. Each is registered with a name, description, and handler function.",
  },
  {
    title: "User Types a Slash",
    description:
      "When the user types '/', the registry is queried. All commands are shown initially. The input acts as a live filter — matching by prefix.",
  },
  {
    title: "Filtering — '/com'",
    description:
      "As the user types '/com', the registry filters in real-time. Only commands matching the prefix are shown: /compact, /commit, /config...",
  },
  {
    title: "Selection — '/compact'",
    description:
      "/compact is selected. The command handler is looked up in the registry and prepared for execution. Arguments are parsed if any.",
  },
  {
    title: "Command Execution Flow",
    description:
      "The command handler runs: input → parse args → validate → execute side effect → return result. Commands can modify UI state, trigger API calls, or run tools.",
  },
  {
    title: "Commands vs Tools",
    description:
      "Key distinction: Commands are USER-initiated (typed in REPL). Tools are MODEL-initiated (called by Claude via API). Commands live in the CLI; tools live in the agent loop.",
  },
];

function matchesFilter(name: string, filter: string): boolean {
  if (!filter) return true;
  return name.startsWith(filter);
}

export default function CommandSystemVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2500 });
  const palette = useSvgPalette();

  const filter = FILTER_STATES[viz.currentStep] || "";
  const showExecFlow = viz.currentStep === 4;
  const showComparison = viz.currentStep === 5;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left panel: Command dispatch tree */}
        <div className="lg:col-span-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {title && (
            <div className="mb-2 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {title}
            </div>
          )}

          {showComparison ? (
            /* Commands vs Tools comparison */
            <svg viewBox="0 0 420 280" className="w-full" style={{ maxHeight: 280 }}>
              <text x={210} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={palette.activeNodeFill} fontFamily="monospace">
                Commands vs Tools
              </text>

              {/* Commands column */}
              <motion.rect
                x={20} y={38} width={180} height={220} rx={8}
                fill="#3b82f6" fillOpacity={0.05} stroke="#3b82f6" strokeWidth={1.5} strokeOpacity={0.3}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              />
              <text x={110} y={58} textAnchor="middle" fontSize={11} fontWeight={700} fill="#3b82f6" fontFamily="monospace">
                Commands (User)
              </text>
              {[
                "Typed in REPL",
                "Slash prefix: /foo",
                "UI side effects",
                "No API call needed",
                "Registered statically",
                "100+ built-in",
              ].map((line, i) => (
                <motion.text
                  key={line} x={110} y={80 + i * 22}
                  textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#3b82f6" opacity={0.8}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 0.8, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  {line}
                </motion.text>
              ))}

              {/* Arrow */}
              <text x={210} y={160} textAnchor="middle" fontSize={18} fill={palette.labelFill}>
                ≠
              </text>

              {/* Tools column */}
              <motion.rect
                x={220} y={38} width={180} height={220} rx={8}
                fill="#f59e0b" fillOpacity={0.05} stroke="#f59e0b" strokeWidth={1.5} strokeOpacity={0.3}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              />
              <text x={310} y={58} textAnchor="middle" fontSize={11} fontWeight={700} fill="#f59e0b" fontFamily="monospace">
                Tools (Model)
              </text>
              {[
                "Called by Claude API",
                "tool_use blocks",
                "Code side effects",
                "Results → messages[]",
                "Dynamic (MCP extend)",
                "40+ built-in",
              ].map((line, i) => (
                <motion.text
                  key={line} x={310} y={80 + i * 22}
                  textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#f59e0b" opacity={0.8}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 0.8, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  {line}
                </motion.text>
              ))}
            </svg>
          ) : showExecFlow ? (
            /* Execution flow */
            <svg viewBox="0 0 420 280" className="w-full" style={{ maxHeight: 280 }}>
              <text x={210} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={palette.activeNodeFill} fontFamily="monospace">
                /compact Execution Flow
              </text>
              {[
                { label: "Parse Input", desc: '"/compact" → cmd lookup', y: 42 },
                { label: "Resolve Handler", desc: "registry.get('compact')", y: 90 },
                { label: "Parse Args", desc: "flags, options, positional", y: 138 },
                { label: "Execute", desc: "compactConversation()", y: 186 },
                { label: "Side Effect", desc: "messages[] compressed, UI updated", y: 234 },
              ].map((stage, i) => (
                <g key={stage.label}>
                  <motion.rect
                    x={60} y={stage.y} width={300} height={38} rx={6}
                    fill={palette.activeNodeFill} fillOpacity={i === 3 ? 0.15 : 0.06}
                    stroke={palette.activeNodeFill} strokeWidth={i === 3 ? 1.5 : 1} strokeOpacity={0.3}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  />
                  <motion.text
                    x={80} y={stage.y + 16} fontSize={11} fontWeight={600}
                    fontFamily="monospace" fill={palette.activeNodeFill}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.15 }}
                  >
                    {stage.label}
                  </motion.text>
                  <motion.text
                    x={80} y={stage.y + 30} fontSize={9}
                    fontFamily="monospace" fill={palette.labelFill}
                    initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                  >
                    {stage.desc}
                  </motion.text>
                  {i < 4 && (
                    <motion.line
                      x1={210} y1={stage.y + 38} x2={210} y2={stage.y + 48}
                      stroke={palette.activeEdgeStroke} strokeWidth={1.5}
                      strokeDasharray="3,3"
                      initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
                      transition={{ delay: i * 0.1 + 0.25 }}
                    />
                  )}
                </g>
              ))}
            </svg>
          ) : (
            /* Default: Command grid with filter */
            <svg viewBox="0 0 420 340" className="w-full" style={{ maxHeight: 340 }}>
              {/* Input field */}
              <rect x={60} y={5} width={300} height={28} rx={6}
                fill={palette.bgSubtle} stroke={palette.nodeStroke} strokeWidth={1.5}
              />
              <text x={74} y={24} fontSize={11} fontFamily="monospace" fill={palette.labelFill}>
                {filter || "Type / to search commands..."}
              </text>
              {filter && (
                <motion.rect
                  x={74 + filter.length * 6.6} y={12} width={1} height={14}
                  fill={palette.activeNodeFill}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              {/* Command groups */}
              {Object.entries(COMMAND_GROUPS).map(([group, data], gIdx) => {
                const col = gIdx % 3;
                const row = Math.floor(gIdx / 3);
                const gx = col * 138 + 8;
                const gy = row * 155 + 45;

                const visibleCommands = data.commands.filter((c) => matchesFilter(c.name, filter));
                const groupVisible = visibleCommands.length > 0;

                return (
                  <motion.g
                    key={group}
                    animate={{ opacity: groupVisible ? 1 : 0.15 }}
                    transition={{ duration: 0.3 }}
                  >
                    <rect
                      x={gx} y={gy} width={130} height={145} rx={8}
                      fill={data.color} fillOpacity={groupVisible ? 0.05 : 0.01}
                      stroke={data.color} strokeWidth={groupVisible ? 1 : 0.5}
                      strokeOpacity={groupVisible ? 0.3 : 0.1}
                    />
                    <text
                      x={gx + 65} y={gy + 18} textAnchor="middle"
                      fontSize={10} fontWeight={700} fontFamily="monospace"
                      fill={data.color} opacity={groupVisible ? 1 : 0.3}
                    >
                      {group}
                    </text>
                    {data.commands.map((cmd, cIdx) => {
                      const matches = matchesFilter(cmd.name, filter);
                      const isSelected = filter === cmd.name;
                      const cy = gy + 28 + cIdx * 36;

                      return (
                        <motion.g
                          key={cmd.name}
                          animate={{ opacity: matches ? 1 : 0.15 }}
                          transition={{ duration: 0.2 }}
                        >
                          <rect
                            x={gx + 6} y={cy} width={118} height={30} rx={5}
                            fill={isSelected ? data.color : palette.bgSubtle}
                            fillOpacity={isSelected ? 0.2 : 1}
                            stroke={isSelected ? data.color : palette.nodeStroke}
                            strokeWidth={isSelected ? 2 : 0.5}
                          />
                          <text
                            x={gx + 14} y={cy + 13} fontSize={10}
                            fontFamily="monospace" fontWeight={isSelected ? 700 : 500}
                            fill={isSelected ? data.color : palette.nodeText}
                          >
                            {cmd.name}
                          </text>
                          <text
                            x={gx + 14} y={cy + 24} fontSize={8}
                            fontFamily="monospace" fill={palette.labelFill}
                          >
                            {cmd.desc}
                          </text>
                        </motion.g>
                      );
                    })}
                  </motion.g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Right panel: Info */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {viz.currentStep <= 1 ? "Registry" : viz.currentStep <= 3 ? "Filter State" : "Details"}
          </div>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {viz.currentStep <= 1 ? (
                /* Show all groups with counts */
                Object.entries(COMMAND_GROUPS).map(([group, data]) => (
                  <motion.div
                    key={group}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono" style={{ color: data.color }}>
                        {group}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {data.commands.length} cmds
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : viz.currentStep <= 3 ? (
                /* Show filter match */
                <>
                  <motion.div
                    key="filter-input"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 dark:border-blue-800 dark:bg-blue-950/40"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 opacity-60">
                      input
                    </div>
                    <div className="mt-0.5 text-xs font-mono text-blue-700 dark:text-blue-300">
                      {filter || "/"}
                    </div>
                  </motion.div>
                  <motion.div
                    key="filter-matches"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      matches
                    </div>
                    <div className="mt-1 space-y-1">
                      {Object.values(COMMAND_GROUPS)
                        .flatMap((g) => g.commands)
                        .filter((c) => matchesFilter(c.name, filter))
                        .map((cmd) => (
                          <div
                            key={cmd.name}
                            className={`text-xs font-mono ${
                              filter === cmd.name
                                ? "font-bold text-blue-600 dark:text-blue-400"
                                : "text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {cmd.name}
                            <span className="ml-2 text-zinc-400">{cmd.desc}</span>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                </>
              ) : (
                /* Execution details or comparison notes */
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  {showComparison ? (
                    <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      <div className="font-bold text-zinc-700 dark:text-zinc-300">Key Insight:</div>
                      <div>Commands = user-initiated</div>
                      <div>Tools = model-initiated</div>
                      <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                        <div>Commands run in the CLI process</div>
                        <div>Tools run in the agent loop</div>
                        <div className="mt-1">Both are registered at startup</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      <div className="font-bold text-zinc-700 dark:text-zinc-300">/compact handler</div>
                      <div>1. Snapshot current messages[]</div>
                      <div>2. Ask Claude to summarize</div>
                      <div>3. Replace messages with summary</div>
                      <div>4. Update token count</div>
                      <div className="mt-2 text-[10px] text-zinc-400">
                        Triggers at 90% context budget
                      </div>
                    </div>
                  )}
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
