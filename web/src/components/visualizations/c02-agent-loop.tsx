"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type?: "start" | "process" | "decision" | "end";
}

const NODES: FlowNode[] = [
  { id: "input", label: "User Input", x: 30, y: 20, w: 100, h: 30, type: "start" },
  { id: "sysprompt", label: "System Prompt", x: 30, y: 70, w: 100, h: 30 },
  { id: "normalize", label: "Normalize Msgs", x: 30, y: 120, w: 100, h: 30 },
  { id: "api", label: "API Call (stream)", x: 30, y: 180, w: 100, h: 35 },
  { id: "stop", label: "stop_reason?", x: 30, y: 240, w: 100, h: 30, type: "decision" },
  { id: "executor", label: "StreamingToolExec", x: 30, y: 300, w: 110, h: 30 },
  { id: "permission", label: "canUseTool()", x: 30, y: 350, w: 100, h: 30 },
  { id: "execute", label: "Execute Tool", x: 170, y: 350, w: 90, h: 30 },
  { id: "compact", label: "autoCompact?", x: 170, y: 300, w: 90, h: 30 },
  { id: "endturn", label: "Return to REPL", x: 170, y: 240, w: 100, h: 30, type: "end" },
];

const EDGES: [string, string][] = [
  ["input", "sysprompt"],
  ["sysprompt", "normalize"],
  ["normalize", "api"],
  ["api", "stop"],
  ["stop", "executor"],
  ["executor", "permission"],
  ["permission", "execute"],
  ["execute", "compact"],
  ["compact", "api"],
  ["stop", "endturn"],
];

const ACTIVE_PER_STEP: Record<number, string[]> = {
  0: NODES.map((n) => n.id),
  1: ["input"],
  2: ["sysprompt", "normalize"],
  3: ["api"],
  4: ["stop"],
  5: ["executor", "permission"],
  6: ["execute"],
  7: ["compact", "api"],
  8: ["endturn"],
};

interface Message {
  type: "user" | "assistant" | "tool_call" | "tool_result" | "system";
  label: string;
}

const MESSAGES_PER_STEP: Record<number, Message[]> = {
  0: [],
  1: [{ type: "user", label: "Fix the bug in auth.ts" }],
  2: [
    { type: "user", label: "Fix the bug in auth.ts" },
    { type: "system", label: "System prompt assembled (110+ sections)" },
  ],
  3: [
    { type: "user", label: "Fix the bug in auth.ts" },
    { type: "system", label: "System prompt assembled" },
    { type: "assistant", label: "Streaming response..." },
  ],
  4: [
    { type: "user", label: "Fix the bug in auth.ts" },
    { type: "assistant", label: "I'll read the file first" },
    { type: "tool_call", label: "FileReadTool: auth.ts" },
  ],
  5: [
    { type: "user", label: "Fix the bug in auth.ts" },
    { type: "tool_call", label: "FileReadTool: auth.ts" },
    { type: "system", label: "canUseTool → ALLOWED" },
  ],
  6: [
    { type: "tool_call", label: "FileReadTool: auth.ts" },
    { type: "tool_result", label: "export function validateToken..." },
    { type: "tool_call", label: "FileEditTool: auth.ts" },
  ],
  7: [
    { type: "tool_call", label: "FileEditTool: auth.ts" },
    { type: "tool_result", label: "File edited successfully" },
    { type: "system", label: "Token check: 14,231 / 150,000 — OK" },
  ],
  8: [
    { type: "tool_result", label: "File edited successfully" },
    { type: "assistant", label: "Fixed the token expiry bug." },
    { type: "system", label: "stop_reason: end_turn → break" },
  ],
};

const STEPS = [
  { title: "Overview", description: "The real query loop: user input → API stream → tool execution → repeat until end_turn." },
  { title: "User Input", description: "processUserInput() in QueryEngine.ts processes the raw input and adds it to messages[]." },
  { title: "System Prompt & Normalize", description: "fetchSystemPromptParts() assembles 110+ sections. normalizeMessagesForAPI() strips tombstones and synthetic messages." },
  { title: "API Call (Streaming)", description: "The request streams to Claude. StreamingToolExecutor watches for tool_use blocks mid-stream — it doesn't wait for the full response." },
  { title: "stop_reason Check", description: "When the stream ends: tool_use → execute tools and loop back. end_turn → break and return to REPL." },
  { title: "Permission Check", description: "Before every tool execution: canUseTool() checks rules → heuristics → classifier. Hooks/classifier race with user confirmation." },
  { title: "Tool Execution", description: "The tool runs and its result is appended to messages[]. Read-only tools run concurrently; Bash runs exclusively." },
  { title: "autoCompact Check", description: "After each iteration: check token count against budget. If approaching threshold (90%), trigger autoCompact to compress history." },
  { title: "End Turn → REPL", description: "stop_reason is end_turn — the while loop breaks. Control returns to the REPL. Session state is persisted." },
];

const MSG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  user: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  assistant: { bg: "bg-zinc-50 dark:bg-zinc-800/50", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
  tool_call: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  tool_result: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  system: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
};

export default function AgentLoopVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 2500 });
  const palette = useSvgPalette();

  const activeNodes = ACTIVE_PER_STEP[viz.currentStep] || [];
  const messages = MESSAGES_PER_STEP[viz.currentStep] || [];

  const getNode = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Flow chart — 60% */}
        <div className="lg:col-span-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {title && (
            <div className="mb-2 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {title}
            </div>
          )}
          <svg viewBox="0 0 300 400" className="w-full" style={{ maxHeight: 400 }}>
            {/* Edges */}
            {EDGES.map(([fromId, toId], i) => {
              const from = getNode(fromId);
              const to = getNode(toId);
              const fromActive = activeNodes.includes(fromId);
              const toActive = activeNodes.includes(toId);
              const edgeActive = fromActive || toActive;

              // Simple straight lines for most edges
              let x1 = from.x + from.w / 2;
              let y1 = from.y + from.h;
              let x2 = to.x + to.w / 2;
              let y2 = to.y;

              // Special routing for loop-back edge (compact → api)
              if (fromId === "compact" && toId === "api") {
                return (
                  <motion.path
                    key={i}
                    d={`M ${from.x + from.w / 2} ${from.y} Q ${from.x + from.w / 2 + 60} ${180} ${to.x + to.w} ${to.y + to.h / 2}`}
                    fill="none"
                    stroke={edgeActive ? palette.activeEdgeStroke : palette.edgeStroke}
                    strokeWidth={edgeActive ? 2 : 1}
                    strokeDasharray={edgeActive ? "none" : "4,4"}
                    animate={{ opacity: edgeActive ? 1 : 0.3 }}
                  />
                );
              }

              // Route from stop → endturn horizontally
              if (fromId === "stop" && toId === "endturn") {
                x1 = from.x + from.w;
                y1 = from.y + from.h / 2;
                x2 = to.x;
                y2 = to.y + to.h / 2;
              }

              // Route permission → execute horizontally
              if (fromId === "permission" && toId === "execute") {
                x1 = from.x + from.w;
                y1 = from.y + from.h / 2;
                x2 = to.x;
                y2 = to.y + to.h / 2;
              }

              return (
                <motion.line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={edgeActive ? palette.activeEdgeStroke : palette.edgeStroke}
                  strokeWidth={edgeActive ? 2 : 1}
                  strokeDasharray={edgeActive ? "none" : "4,4"}
                  animate={{ opacity: edgeActive ? 1 : 0.3 }}
                />
              );
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const isActive = activeNodes.includes(node.id);
              const fill = isActive
                ? node.type === "end" ? palette.endNodeFill : palette.activeNodeFill
                : palette.nodeFill;
              const stroke = isActive
                ? node.type === "end" ? palette.endNodeStroke : palette.activeNodeStroke
                : palette.nodeStroke;
              const textFill = isActive ? palette.activeNodeText : palette.nodeText;

              return (
                <g key={node.id}>
                  {node.type === "decision" ? (
                    <motion.polygon
                      points={`${node.x + node.w / 2},${node.y} ${node.x + node.w},${node.y + node.h / 2} ${node.x + node.w / 2},${node.y + node.h} ${node.x},${node.y + node.h / 2}`}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={1.5}
                      animate={{ fill, stroke, opacity: isActive ? 1 : 0.4 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <motion.rect
                      x={node.x}
                      y={node.y}
                      width={node.w}
                      height={node.h}
                      rx={node.type === "start" || node.type === "end" ? 15 : 5}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={1.5}
                      animate={{ fill, stroke, opacity: isActive ? 1 : 0.4 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <text
                    x={node.x + node.w / 2}
                    y={node.y + node.h / 2 + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily="monospace"
                    fontWeight={isActive ? 700 : 400}
                    fill={textFill}
                    style={{ opacity: isActive ? 1 : 0.5 }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* Loop-back label */}
            <text x={260} y={170} fontSize={8} fill={palette.labelFill} fontFamily="monospace" textAnchor="middle" opacity={0.6}>
              loop
            </text>
          </svg>
        </div>

        {/* Messages panel — 40% */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            messages[]
          </div>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => {
                const colors = MSG_COLORS[msg.type];
                return (
                  <motion.div
                    key={`${viz.currentStep}-${i}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className={`rounded-lg border p-2.5 ${colors.bg} ${colors.border}`}
                  >
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} opacity-60`}>
                      {msg.type.replace("_", " ")}
                    </div>
                    <div className={`mt-0.5 text-xs font-mono ${colors.text}`}>
                      {msg.label}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {messages.length === 0 && (
              <div className="py-8 text-center text-xs text-zinc-400">
                Step through to see message flow
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
