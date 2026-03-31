"use client";

import { motion } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface McpServer {
  id: string;
  label: string;
  transport: "stdio" | "SSE" | "in-process";
  tools: string[];
  angle: number;
  radius: number;
}

const SERVERS: McpServer[] = [
  { id: "filesystem", label: "Filesystem", transport: "stdio", tools: ["Read", "Write", "Glob"], angle: -90, radius: 150 },
  { id: "github", label: "GitHub", transport: "SSE", tools: ["PR", "Issue", "Search"], angle: -30, radius: 150 },
  { id: "postgres", label: "PostgreSQL", transport: "stdio", tools: ["Query", "Schema"], angle: 30, radius: 150 },
  { id: "browser", label: "Browser", transport: "SSE", tools: ["Navigate", "Click", "Read"], angle: 90, radius: 150 },
  { id: "memory", label: "Memory", transport: "in-process", tools: ["Save", "Recall"], angle: 150, radius: 150 },
  { id: "custom", label: "Custom Server", transport: "stdio", tools: ["Tool A", "Tool B"], angle: 210, radius: 150 },
];

const TRANSPORT_COLORS: Record<string, { fill: string; stroke: string }> = {
  stdio: { fill: "#22c55e", stroke: "#16a34a" },
  SSE: { fill: "#f59e0b", stroke: "#d97706" },
  "in-process": { fill: "#a855f7", stroke: "#9333ea" },
};

const STEPS = [
  {
    title: "MCP Config Loaded",
    description: "Claude Code reads .mcp.json or settings to discover configured MCP servers. Each server declares its transport type and available capabilities.",
  },
  {
    title: "Connection Manager Starts",
    description: "McpConnectionManager initializes and begins establishing connections to each configured server. Connections are managed independently.",
  },
  {
    title: "stdio Transport",
    description: "The most common transport: Claude Code spawns a child process and communicates over stdin/stdout. Used for local tools like filesystem access and databases.",
  },
  {
    title: "SSE Transport",
    description: "Server-Sent Events transport for remote servers. Used for web-based services like GitHub and browser automation. Supports real-time streaming responses.",
  },
  {
    title: "Tools Discovered",
    description: "Each MCP server advertises its available tools via the tools/list method. Claude Code collects all tool definitions from all connected servers.",
  },
  {
    title: "Tools Bridged into Native List",
    description: "MCP tools are merged into Claude Code's native tool list alongside built-in tools (Read, Edit, Bash, etc.). The model sees one unified tool palette.",
  },
  {
    title: "Deferred Tools (ToolSearchTool)",
    description: "18 tools are deferred — not loaded into the prompt until requested via ToolSearchTool. This keeps the base prompt under the 25K token cap (~200K total budget).",
  },
];

const NATIVE_TOOLS = ["Read", "Edit", "Write", "Bash", "Glob", "Grep", "Agent"];
const DEFERRED_TOOLS = [
  "NotebookEdit", "WebFetch", "WebSearch", "TaskCreate", "TaskUpdate",
  "CronCreate", "CronList", "CronDelete", "SendMessage", "AskUserQuestion",
  "ExitPlanMode", "EnterPlanMode", "RemoteTrigger", "TeamCreate", "TeamDelete",
  "TaskGet", "TaskList", "TaskStop",
];

export default function MCPVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 3000 });
  const palette = useSvgPalette();

  const cx = 350;
  const cy = 220;

  const getServerPos = (server: McpServer) => {
    const rad = (server.angle * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * server.radius,
      y: cy + Math.sin(rad) * server.radius,
    };
  };

  const isServerVisible = (server: McpServer, step: number) => {
    if (step === 0) return true;
    if (step === 1) return true;
    if (step === 2) return server.transport === "stdio";
    if (step === 3) return server.transport === "SSE";
    return true;
  };

  const isServerActive = (server: McpServer, step: number) => {
    if (step === 0) return false;
    if (step === 1) return true;
    if (step === 2) return server.transport === "stdio";
    if (step === 3) return server.transport === "SSE";
    if (step >= 4) return true;
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {title}
          </div>
        )}
        <svg viewBox="0 0 700 440" className="w-full" style={{ maxHeight: 440 }}>
          {/* Central Claude Code hub */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={45}
            fill={palette.activeNodeFill}
            stroke={palette.activeNodeStroke}
            strokeWidth={2}
            animate={{ scale: viz.currentStep >= 1 ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 1.5, repeat: viz.currentStep >= 1 ? Infinity : 0 }}
          />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill={palette.activeNodeText} fontWeight={700} fontFamily="monospace">
            Claude Code
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9} fill={palette.activeNodeText} fontFamily="monospace" opacity={0.8}>
            MCP Client
          </text>

          {/* Connection lines to servers */}
          {SERVERS.map((server) => {
            const pos = getServerPos(server);
            const active = isServerActive(server, viz.currentStep);
            const visible = isServerVisible(server, viz.currentStep);
            const tColor = TRANSPORT_COLORS[server.transport];

            return (
              <motion.line
                key={`edge-${server.id}`}
                x1={cx}
                y1={cy}
                x2={pos.x}
                y2={pos.y}
                stroke={active ? tColor.stroke : palette.edgeStroke}
                strokeWidth={active ? 2.5 : 1}
                strokeDasharray={active ? "none" : "4,4"}
                animate={{ opacity: visible ? (active ? 1 : 0.3) : 0.1 }}
                transition={{ duration: 0.4 }}
              />
            );
          })}

          {/* Transport type indicator on edges */}
          {SERVERS.map((server) => {
            const pos = getServerPos(server);
            const active = isServerActive(server, viz.currentStep);
            const midX = (cx + pos.x) / 2;
            const midY = (cy + pos.y) / 2;
            const tColor = TRANSPORT_COLORS[server.transport];

            if (!active || viz.currentStep < 2) return null;

            return (
              <g key={`transport-${server.id}`}>
                <motion.rect
                  x={midX - 18}
                  y={midY - 8}
                  width={36}
                  height={16}
                  rx={8}
                  fill={tColor.fill}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#fff"
                  fontWeight={700}
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {server.transport}
                </motion.text>
              </g>
            );
          })}

          {/* MCP Server nodes */}
          {SERVERS.map((server) => {
            const pos = getServerPos(server);
            const active = isServerActive(server, viz.currentStep);
            const visible = isServerVisible(server, viz.currentStep);
            const tColor = TRANSPORT_COLORS[server.transport];

            return (
              <g key={server.id}>
                <motion.rect
                  x={pos.x - 45}
                  y={pos.y - 20}
                  width={90}
                  height={40}
                  rx={8}
                  fill={active ? tColor.fill : palette.nodeFill}
                  stroke={active ? tColor.stroke : palette.nodeStroke}
                  strokeWidth={1.5}
                  animate={{ opacity: visible ? (active ? 1 : 0.4) : 0.1 }}
                  transition={{ duration: 0.4 }}
                />
                <text
                  x={pos.x}
                  y={pos.y - 3}
                  textAnchor="middle"
                  fontSize={10}
                  fill={active ? "#fff" : palette.nodeText}
                  fontWeight={active ? 700 : 400}
                  fontFamily="monospace"
                >
                  {server.label}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 10}
                  textAnchor="middle"
                  fontSize={7}
                  fill={active ? "rgba(255,255,255,0.7)" : palette.labelFill}
                  fontFamily="monospace"
                >
                  {server.tools.join(", ")}
                </text>
              </g>
            );
          })}

          {/* Step 5: Tools discovered - floating tool badges */}
          {viz.currentStep >= 4 && (
            <g>
              {SERVERS.flatMap((server, si) => {
                const pos = getServerPos(server);
                return server.tools.map((tool, ti) => {
                  const offsetX = (ti - 1) * 35;
                  const targetX = cx;
                  const targetY = cy;
                  const startX = pos.x + offsetX;
                  const startY = pos.y + 28;

                  return (
                    <motion.g
                      key={`tool-${server.id}-${ti}`}
                      initial={{ x: 0, y: 0, opacity: 0 }}
                      animate={
                        viz.currentStep >= 5
                          ? { x: targetX - startX, y: targetY - startY, opacity: 0 }
                          : { x: 0, y: 0, opacity: 1 }
                      }
                      transition={{ duration: 0.6, delay: si * 0.08 + ti * 0.04 }}
                    >
                      <rect
                        x={startX - 14}
                        y={startY - 6}
                        width={28}
                        height={12}
                        rx={3}
                        fill={palette.bgSubtle}
                        stroke={palette.edgeStroke}
                        strokeWidth={0.5}
                      />
                      <text
                        x={startX}
                        y={startY + 3}
                        textAnchor="middle"
                        fontSize={6}
                        fill={palette.labelFill}
                        fontFamily="monospace"
                      >
                        {tool}
                      </text>
                    </motion.g>
                  );
                });
              })}
            </g>
          )}

          {/* Step 6: Merged tool list */}
          {viz.currentStep >= 5 && (
            <g>
              <motion.rect
                x={15}
                y={385}
                width={670}
                height={50}
                rx={8}
                fill={palette.bgSubtle}
                stroke={palette.activeNodeStroke}
                strokeWidth={1.5}
                strokeDasharray="4,2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
              <motion.text
                x={30}
                y={403}
                fontSize={9}
                fill={palette.activeNodeFill}
                fontWeight={700}
                fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Unified Tool Palette:
              </motion.text>
              {NATIVE_TOOLS.map((tool, i) => (
                <motion.g key={`native-${i}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}>
                  <rect x={30 + i * 58} y={409} width={52} height={16} rx={4} fill={palette.activeNodeFill} />
                  <text x={56 + i * 58} y={420} textAnchor="middle" fontSize={7} fill="#fff" fontFamily="monospace" fontWeight={600}>{tool}</text>
                </motion.g>
              ))}
              <motion.text
                x={30 + NATIVE_TOOLS.length * 58 + 5}
                y={420}
                fontSize={8}
                fill={palette.labelFill}
                fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                + MCP tools merged
              </motion.text>
            </g>
          )}

          {/* Step 7: Deferred tools indicator */}
          {viz.currentStep >= 6 && (
            <g>
              <motion.rect
                x={460}
                y={385}
                width={225}
                height={50}
                rx={8}
                fill="rgba(168,85,247,0.1)"
                stroke="#a855f7"
                strokeWidth={1.5}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              />
              <motion.text
                x={475}
                y={403}
                fontSize={9}
                fill="#a855f7"
                fontWeight={700}
                fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Deferred: 18 tools via ToolSearchTool
              </motion.text>
              {DEFERRED_TOOLS.slice(0, 6).map((tool, i) => (
                <motion.text
                  key={`def-${i}`}
                  x={475 + (i % 3) * 72}
                  y={416 + Math.floor(i / 3) * 12}
                  fontSize={7}
                  fill={palette.labelFill}
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  {tool}
                </motion.text>
              ))}
              <motion.text
                x={475}
                y={440}
                fontSize={7}
                fill="#a855f7"
                fontFamily="monospace"
                fontWeight={600}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.6 }}
              >
                25K token cap — load on demand
              </motion.text>
            </g>
          )}

          {/* Transport legend */}
          {viz.currentStep >= 2 && (
            <g>
              {Object.entries(TRANSPORT_COLORS).map(([key, color], i) => (
                <g key={key}>
                  <circle cx={20} cy={20 + i * 18} r={5} fill={color.fill} />
                  <text x={32} y={24 + i * 18} fontSize={9} fill={palette.labelFill} fontFamily="monospace">{key}</text>
                </g>
              ))}
            </g>
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
