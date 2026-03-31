"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface Tool {
  name: string;
  category: string;
}

const TOOL_CATEGORIES: Record<string, { color: string; darkColor: string; tools: string[] }> = {
  File: {
    color: "#3b82f6",
    darkColor: "#60a5fa",
    tools: ["Read", "Write", "Edit", "Glob", "Grep", "NotebookEdit"],
  },
  Execution: {
    color: "#ef4444",
    darkColor: "#f87171",
    tools: ["Bash", "BashBackground"],
  },
  Search: {
    color: "#22c55e",
    darkColor: "#4ade80",
    tools: ["WebSearch", "WebFetch"],
  },
  Agent: {
    color: "#a855f7",
    darkColor: "#c084fc",
    tools: ["Agent", "Task", "TaskCreate", "TaskUpdate", "SendMessage"],
  },
  MCP: {
    color: "#f59e0b",
    darkColor: "#fbbf24",
    tools: ["mcp__*", "ToolSearch"],
  },
  Other: {
    color: "#64748b",
    darkColor: "#94a3b8",
    tools: ["AskUser", "Skill", "TodoRead", "TodoWrite"],
  },
};

const PIPELINE_STAGES = [
  { id: "input", label: "Tool Call Input", desc: "tool_use block from API" },
  { id: "validate", label: "Schema Validate", desc: "JSON schema check" },
  { id: "permission", label: "Permission Check", desc: "canUseTool() gate" },
  { id: "execute", label: "Execute Tool", desc: "invoke() → result" },
  { id: "budget", label: "Result Budget", desc: "truncate to char limit" },
  { id: "result", label: "Tool Result", desc: "→ messages[]" },
];

const STEPS = [
  {
    title: "Tool Registry Overview",
    description:
      "Claude Code ships 40+ tools organized by category. Each tool implements a common interface: schema (JSON Schema), invoke(), and render().",
  },
  {
    title: "File Tools — The Core",
    description:
      "Read, Write, Edit, Glob, Grep — the most-used tools. Read-only tools (Read, Glob, Grep) are marked isConcurrencySafe() = true, enabling parallel execution.",
  },
  {
    title: "Execution Tools — Bash",
    description:
      "Bash is the most powerful tool — and the most dangerous. It runs exclusively (never concurrent). Result budget: 30K characters. Background variant for long-running processes.",
  },
  {
    title: "Agent & Task Tools",
    description:
      "Agent spawns sub-agents for parallel work. Task tools track progress. SendMessage enables agent-to-agent communication. These power the multi-agent architecture.",
  },
  {
    title: "Tool Interface Contract",
    description:
      "Every tool implements: name, description, inputSchema (JSON Schema for params), invoke(input, context), isReadOnly(), isConcurrencySafe(). This uniform interface lets the executor treat all tools identically.",
  },
  {
    title: "StreamingToolExecutor Pipeline",
    description:
      "Tool calls flow through a 5-stage pipeline: parse input → validate schema → check permission → execute → budget-trim result. The executor processes tool_use blocks mid-stream.",
  },
  {
    title: "Concurrent vs Exclusive Execution",
    description:
      "isConcurrencySafe() determines parallelism. Read/Glob/Grep run in parallel (Promise.all). Bash runs exclusively (awaited alone). Result budgets: Bash 30K, Grep 20K chars.",
  },
];

const ACTIVE_CATEGORIES_PER_STEP: Record<number, string[]> = {
  0: Object.keys(TOOL_CATEGORIES),
  1: ["File"],
  2: ["Execution"],
  3: ["Agent"],
  4: Object.keys(TOOL_CATEGORIES),
  5: [],
  6: ["File", "Execution"],
};

export default function ToolSystemVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2500 });
  const palette = useSvgPalette();

  const activeCategories = ACTIVE_CATEGORIES_PER_STEP[viz.currentStep] || [];
  const showPipeline = viz.currentStep >= 5;
  const showInterface = viz.currentStep === 4;
  const showConcurrency = viz.currentStep === 6;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left panel: Tool grid */}
        <div className="lg:col-span-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {title && (
            <div className="mb-2 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {title}
            </div>
          )}

          {showInterface ? (
            /* Step 5: Tool interface contract */
            <svg viewBox="0 0 420 300" className="w-full" style={{ maxHeight: 300 }}>
              <text x={210} y={24} textAnchor="middle" fontSize={13} fontWeight={700} fill={palette.activeNodeFill} fontFamily="monospace">
                Tool Interface Contract
              </text>
              {[
                { label: "name", type: "string", y: 50 },
                { label: "description", type: "string", y: 85 },
                { label: "inputSchema", type: "JSONSchema", y: 120 },
                { label: "invoke(input, ctx)", type: "→ ToolResult", y: 155 },
                { label: "isReadOnly()", type: "→ boolean", y: 190 },
                { label: "isConcurrencySafe()", type: "→ boolean", y: 225 },
              ].map((field, i) => (
                <g key={field.label}>
                  <motion.rect
                    x={30}
                    y={field.y}
                    width={360}
                    height={28}
                    rx={5}
                    fill={i === 3 ? palette.activeNodeFill : palette.nodeFill}
                    stroke={i === 3 ? palette.activeNodeStroke : palette.nodeStroke}
                    strokeWidth={1.5}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 360, opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                  />
                  <motion.text
                    x={44}
                    y={field.y + 18}
                    fontSize={11}
                    fontFamily="monospace"
                    fontWeight={600}
                    fill={i === 3 ? palette.activeNodeText : palette.nodeText}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.08 + 0.1 }}
                  >
                    {field.label}
                  </motion.text>
                  <motion.text
                    x={280}
                    y={field.y + 18}
                    fontSize={10}
                    fontFamily="monospace"
                    fill={i === 3 ? palette.activeNodeText : palette.labelFill}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: i * 0.08 + 0.15 }}
                  >
                    {field.type}
                  </motion.text>
                </g>
              ))}
              <text x={210} y={280} textAnchor="middle" fontSize={9} fill={palette.labelFill} fontFamily="monospace">
                Every tool — built-in or MCP — implements this interface
              </text>
            </svg>
          ) : showConcurrency ? (
            /* Step 7: Concurrent vs exclusive */
            <svg viewBox="0 0 420 300" className="w-full" style={{ maxHeight: 300 }}>
              <text x={210} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={palette.activeNodeFill} fontFamily="monospace">
                Concurrent vs Exclusive Execution
              </text>

              {/* Parallel group */}
              <motion.rect
                x={20} y={40} width={180} height={150} rx={8}
                fill="none" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4,4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              />
              <text x={110} y={58} textAnchor="middle" fontSize={10} fontWeight={700} fill="#22c55e" fontFamily="monospace">
                Promise.all() — Parallel
              </text>
              {["Read", "Glob", "Grep", "WebFetch"].map((tool, i) => (
                <g key={tool}>
                  <motion.rect
                    x={35} y={70 + i * 28} width={150} height={22} rx={4}
                    fill={TOOL_CATEGORIES.File.color} fillOpacity={0.15}
                    stroke={TOOL_CATEGORIES.File.color} strokeWidth={1}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 35, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  />
                  <motion.text
                    x={110} y={85 + i * 28} textAnchor="middle" fontSize={10}
                    fontFamily="monospace" fill={TOOL_CATEGORIES.File.color}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.05 }}
                  >
                    {tool}
                  </motion.text>
                </g>
              ))}

              {/* Exclusive group */}
              <motion.rect
                x={220} y={40} width={180} height={150} rx={8}
                fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              />
              <text x={310} y={58} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ef4444" fontFamily="monospace">
                await — Exclusive
              </text>
              {["Bash", "Write", "Edit"].map((tool, i) => (
                <g key={tool}>
                  <motion.rect
                    x={235} y={70 + i * 28} width={150} height={22} rx={4}
                    fill={TOOL_CATEGORIES.Execution.color} fillOpacity={0.15}
                    stroke={TOOL_CATEGORIES.Execution.color} strokeWidth={1}
                    initial={{ x: 450, opacity: 0 }}
                    animate={{ x: 235, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  />
                  <motion.text
                    x={310} y={85 + i * 28} textAnchor="middle" fontSize={10}
                    fontFamily="monospace" fill={TOOL_CATEGORIES.Execution.color}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.05 }}
                  >
                    {tool}
                  </motion.text>
                </g>
              ))}

              {/* Budget labels */}
              <text x={110} y={215} textAnchor="middle" fontSize={9} fill={palette.labelFill} fontFamily="monospace">
                Grep budget: 20K chars
              </text>
              <text x={310} y={215} textAnchor="middle" fontSize={9} fill={palette.labelFill} fontFamily="monospace">
                Bash budget: 30K chars
              </text>

              {/* Key insight */}
              <motion.rect
                x={40} y={240} width={340} height={40} rx={6}
                fill={palette.activeNodeFill} fillOpacity={0.1}
                stroke={palette.activeNodeFill} strokeWidth={1}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              />
              <motion.text
                x={210} y={257} textAnchor="middle" fontSize={10} fontWeight={600}
                fill={palette.activeNodeFill} fontFamily="monospace"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              >
                isConcurrencySafe() → true = parallel
              </motion.text>
              <motion.text
                x={210} y={272} textAnchor="middle" fontSize={10} fontWeight={600}
                fill={palette.activeNodeFill} fontFamily="monospace"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              >
                isConcurrencySafe() → false = exclusive
              </motion.text>
            </svg>
          ) : (
            /* Default: Tool grid */
            <svg viewBox="0 0 420 320" className="w-full" style={{ maxHeight: 320 }}>
              {Object.entries(TOOL_CATEGORIES).map(([category, data], catIdx) => {
                const isActive = activeCategories.includes(category);
                const col = catIdx % 3;
                const row = Math.floor(catIdx / 3);
                const groupX = col * 140 + 10;
                const groupY = row * 160 + 10;
                const catColor = data.color;

                return (
                  <g key={category}>
                    {/* Category background */}
                    <motion.rect
                      x={groupX}
                      y={groupY}
                      width={130}
                      height={148}
                      rx={8}
                      fill={catColor}
                      fillOpacity={isActive ? 0.08 : 0.02}
                      stroke={catColor}
                      strokeWidth={isActive ? 1.5 : 0.5}
                      strokeOpacity={isActive ? 0.5 : 0.15}
                      animate={{
                        fillOpacity: isActive ? 0.08 : 0.02,
                        strokeOpacity: isActive ? 0.5 : 0.15,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Category label */}
                    <motion.text
                      x={groupX + 65}
                      y={groupY + 18}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fontFamily="monospace"
                      fill={catColor}
                      animate={{ opacity: isActive ? 1 : 0.4 }}
                    >
                      {category}
                    </motion.text>

                    {/* Tool pills */}
                    {data.tools.map((tool, toolIdx) => {
                      const pillY = groupY + 30 + toolIdx * 20;
                      return (
                        <g key={tool}>
                          <motion.rect
                            x={groupX + 8}
                            y={pillY}
                            width={114}
                            height={16}
                            rx={8}
                            fill={catColor}
                            fillOpacity={isActive ? 0.2 : 0.06}
                            stroke={catColor}
                            strokeWidth={0.5}
                            strokeOpacity={isActive ? 0.4 : 0.1}
                            animate={{
                              fillOpacity: isActive ? 0.2 : 0.06,
                              strokeOpacity: isActive ? 0.4 : 0.1,
                            }}
                            transition={{ duration: 0.3, delay: toolIdx * 0.03 }}
                          />
                          <motion.text
                            x={groupX + 65}
                            y={pillY + 11}
                            textAnchor="middle"
                            fontSize={8}
                            fontFamily="monospace"
                            fontWeight={isActive ? 600 : 400}
                            fill={catColor}
                            animate={{ opacity: isActive ? 0.9 : 0.35 }}
                            transition={{ duration: 0.3, delay: toolIdx * 0.03 }}
                          >
                            {tool}
                          </motion.text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Right panel: Pipeline or info */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {showPipeline ? "StreamingToolExecutor" : "Tool Details"}
          </div>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {showPipeline ? (
                PIPELINE_STAGES.map((stage, i) => {
                  const isActiveStage = viz.currentStep === 5 || (viz.currentStep === 6 && (i === 3 || i === 4));
                  return (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.06 }}
                      className={`rounded-lg border p-2.5 ${
                        isActiveStage
                          ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40"
                          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                          isActiveStage
                            ? "bg-blue-500 text-white"
                            : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                        }`}>
                          {i + 1}
                        </div>
                        <div className={`text-xs font-semibold font-mono ${
                          isActiveStage
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}>
                          {stage.label}
                        </div>
                      </div>
                      <div className={`mt-1 ml-7 text-[10px] ${
                        isActiveStage
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}>
                        {stage.desc}
                      </div>
                      {i < PIPELINE_STAGES.length - 1 && (
                        <div className="ml-[13px] mt-1 h-3 border-l border-dashed border-zinc-300 dark:border-zinc-600" />
                      )}
                    </motion.div>
                  );
                })
              ) : (
                activeCategories.map((cat) => {
                  const data = TOOL_CATEGORIES[cat];
                  return (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50"
                    >
                      <div className="text-xs font-bold font-mono" style={{ color: data.color }}>
                        {cat}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {data.tools.map((tool) => (
                          <span
                            key={tool}
                            className="rounded-full px-2 py-0.5 text-[10px] font-mono"
                            style={{
                              backgroundColor: data.color + "18",
                              color: data.color,
                              border: `1px solid ${data.color}40`,
                            }}
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            {activeCategories.length === 0 && !showPipeline && (
              <div className="py-8 text-center text-xs text-zinc-400">
                Step through to explore tools
              </div>
            )}
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
