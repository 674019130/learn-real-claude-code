"use client";

import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";

// ---------------------------------------------------------------------------
// Step data
// ---------------------------------------------------------------------------

interface FlowStep {
  id: number;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  code: string;
  tag: string;
  color: string; // primary accent color
  category: "cli" | "prompt" | "api" | "tools" | "response";
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    title: "User types a message",
    titleZh: "用户输入消息",
    description:
      "The CLI intercepts stdin via Ink/React. Fast paths (/version, /help) exit before any expensive imports are evaluated — keeping startup under 500ms.",
    descriptionZh:
      "CLI 通过 Ink/React 拦截 stdin 输入。快速路径（/version、/help）在任何昂贵导入被执行之前就退出 — 保持启动时间 < 500ms。",
    code: `// cli/index.ts — fast path check
if (argv[0] === "--version") {
  console.log(VERSION);
  process.exit(0); // exits before any imports
}`,
    tag: "CLI",
    color: "#6366F1",
    category: "cli",
  },
  {
    id: 2,
    title: "Command check",
    titleZh: "命令检查",
    description:
      "Is this a slash command (/compact, /memory, /clear…)? Commands are user-initiated UI actions dispatched to a command registry — fundamentally different from tools, which are model-initiated.",
    descriptionZh:
      "这是斜杠命令（/compact、/memory、/clear…）吗？命令是用户发起的 UI 操作，分发到命令注册表 — 与模型发起的工具有本质区别。",
    code: `// commands/registry.ts
const cmd = commandRegistry.get(
  input.slice(1).split(" ")[0]
);
if (cmd) return cmd.handler(args, context);
// else → falls through to agent loop`,
    tag: "Commands",
    color: "#6366F1",
    category: "cli",
  },
  {
    id: 3,
    title: "Query enters the agent loop",
    titleZh: "查询进入 Agent 循环",
    description:
      "query.ts builds the messages array: system prompt + conversation history + new user message. This is the entry point to the main agentic while-loop.",
    descriptionZh:
      "query.ts 构建消息数组：系统提示词 + 对话历史 + 新用户消息。这是主 agentic while 循环的入口。",
    code: `// query.ts — agent loop entry
const messages = [
  { role: "system", content: systemPrompt },
  ...conversationHistory,
  { role: "user", content: userMessage },
];
while (true) {
  const response = await streamWithTools(messages);
  if (!response.hasToolUse) break;
}`,
    tag: "Agent Loop",
    color: "#8B5CF6",
    category: "prompt",
  },
  {
    id: 4,
    title: "System prompt assembly",
    titleZh: "系统提示词组装",
    description:
      "context.ts merges 10+ sources — base instructions, CLAUDE.md files (crawled up to project root), tool descriptions, memory snippets. SYSTEM_PROMPT_DYNAMIC_BOUNDARY splits static (globally cached) from dynamic (per-session) to maximize prompt cache hits.",
    descriptionZh:
      "context.ts 合并 10+ 来源 — 基础指令、CLAUDE.md 文件（向上爬取到项目根目录）、工具描述、记忆片段。SYSTEM_PROMPT_DYNAMIC_BOUNDARY 将静态部分（全局缓存）与动态部分（每次会话）分离，最大化 prompt cache 命中。",
    code: `// context.ts
const static_section = [
  baseInstructions, toolSchemas
].join("\\n");
// ─── SYSTEM_PROMPT_DYNAMIC_BOUNDARY ───
const dynamic_section = [
  claudeMdHierarchy,
  memorySnippets,
  sessionContext,
].join("\\n");`,
    tag: "Prompt",
    color: "#8B5CF6",
    category: "prompt",
  },
  {
    id: 5,
    title: "API call to Claude (streaming)",
    titleZh: "调用 Claude API（流式）",
    description:
      "The API call opens a streaming SSE connection. Tokens stream back as they arrive. StreamingToolExecutor listens to the byte stream for tool-use delimiters mid-stream — it doesn't wait for the full response.",
    descriptionZh:
      "API 调用打开流式 SSE 连接。Token 实时流回。StreamingToolExecutor 在流式传输过程中监听字节流中的工具调用分隔符 — 不需要等待完整响应。",
    code: `// StreamingToolExecutor
for await (const chunk of stream) {
  if (isToolUseStart(chunk)) {
    pendingTool = beginAccumulating(chunk);
  } else if (isToolUseEnd(chunk)) {
    executeToolAsync(pendingTool); // fire immediately!
  }
  yield chunk; // keep streaming text
}`,
    tag: "Streaming",
    color: "#3B82F6",
    category: "api",
  },
  {
    id: 6,
    title: "Tool execution (mid-stream!)",
    titleZh: "工具执行（流式传输中！）",
    description:
      "Tools fire while streaming continues. isConcurrencySafe() tools (reads, searches) run in parallel via Promise.all. Writes and filesystem mutations run sequentially to avoid race conditions.",
    descriptionZh:
      "工具在流式传输继续时触发。isConcurrencySafe() 工具（读取、搜索）通过 Promise.all 并行运行。写操作和文件系统变更顺序执行以避免竞态条件。",
    code: `// tool-runner.ts
const [safe, exclusive] = partition(
  pendingTools,
  t => t.isConcurrencySafe()
);
const safeResults = await Promise.all(
  safe.map(run)
);
for (const tool of exclusive) {
  await run(tool); // sequential for safety
}`,
    tag: "Tools",
    color: "#10B981",
    category: "tools",
  },
  {
    id: 7,
    title: "Tool result injection",
    titleZh: "工具结果注入",
    description:
      "Tool results are appended to the messages array as tool_result blocks. The agent loop either continues streaming from the same turn or starts a new turn if the model needs to reason about the results.",
    descriptionZh:
      "工具结果以 tool_result 块的形式附加到消息数组。如果模型需要对结果进行推理，agent 循环将继续从同一轮次流式传输或开始新的轮次。",
    code: `messages.push({
  role: "user",
  content: toolResults.map(r => ({
    type: "tool_result",
    tool_use_id: r.id,
    content: r.output,
  })),
});
// loop continues → new API call`,
    tag: "Messages",
    color: "#10B981",
    category: "tools",
  },
  {
    id: 8,
    title: "Context management check",
    titleZh: "上下文管理检查",
    description:
      "After each turn, if context > 95% full, a 7-strategy compression pipeline fires: snip recent tool results → microcompact old ones → collapse repeated patterns → full summarization. Preserves recency, drops old tool outputs first.",
    descriptionZh:
      "每轮结束后，如果上下文 > 95% 满，7 策略压缩管道触发：截断最近工具结果 → 微压缩旧结果 → 折叠重复模式 → 完全摘要。保留最近内容，优先丢弃旧工具输出。",
    code: `// compact.ts — strategy pipeline
if (tokenCount / maxTokens > 0.95) {
  for (const strategy of STRATEGIES) {
    await strategy.apply(messages);
    if (tokenCount / maxTokens < 0.80) break;
  }
  // STRATEGIES = [snip, microcompact,
  //   collapse, summarize, ...]
}`,
    tag: "Context",
    color: "#10B981",
    category: "tools",
  },
  {
    id: 9,
    title: "Response complete",
    titleZh: "响应完成",
    description:
      "The final text renders to the terminal via Ink's React reconciler. Cost tracker updates (tokens × price per token). Telemetry fires to Statsig (product analytics) + internal pipeline. The loop exits.",
    descriptionZh:
      "最终文本通过 Ink 的 React reconciler 渲染到终端。成本追踪器更新（token × 每 token 价格）。遥测触发到 Statsig（产品分析）+ 内部管道。循环退出。",
    code: `// cost-tracker.ts
const cost =
  inputTokens  * PRICES[model].input +
  outputTokens * PRICES[model].output;
updateCostAccumulator(cost);
trackEvent("agent_turn_complete", {
  cost, model
});
// ink re-renders markdown to terminal`,
    tag: "Render",
    color: "#F59E0B",
    category: "response",
  },
];

const TOTAL_STEPS = FLOW_STEPS.length;

// ---------------------------------------------------------------------------
// Diagram scenes — one per step (0-indexed)
// ---------------------------------------------------------------------------

/** Step 1-2: User input → command check box */
function DiagramCliCommands({
  stepIdx,
  color,
}: {
  stepIdx: number;
  color: string;
}) {
  const showCommand = stepIdx >= 1;
  return (
    <svg viewBox="0 0 320 200" className="w-full" style={{ maxHeight: 200 }}>
      {/* Terminal box */}
      <rect x="20" y="20" width="280" height="60" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
      <text x="36" y="40" fontSize="10" fill="#64748b" fontFamily="monospace">$ claude</text>
      <motion.text
        x="36"
        y="60"
        fontSize="11"
        fontFamily="monospace"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        fill="#e2e8f0"
      >
        {stepIdx === 0 ? "Fix the login bug in auth.ts" : stepIdx === 1 ? "/compact" : "Fix the login bug in auth.ts"}
      </motion.text>
      <motion.rect
        x="260"
        y="50"
        width="8"
        height="14"
        rx="1"
        fill={color}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* Arrow down */}
      <motion.line
        x1="160" y1="84" x2="160" y2="110"
        stroke={color}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />
      <polygon points="155,108 165,108 160,118" fill={color} />

      {/* Command check or agent box */}
      <AnimatePresence mode="wait">
        {showCommand ? (
          <motion.g
            key="cmd"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <rect x="80" y="118" width="160" height="40" rx="6" fill={color + "25"} stroke={color} strokeWidth="1.5" />
            <text x="160" y="135" textAnchor="middle" fontSize="10" fill={color} fontFamily="monospace" fontWeight="700">commandRegistry</text>
            <text x="160" y="150" textAnchor="middle" fontSize="9" fill={color} fontFamily="monospace" opacity={0.75}>.get("/compact") → handler()</text>
          </motion.g>
        ) : (
          <motion.g
            key="agent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <rect x="80" y="118" width="160" height="40" rx="6" fill={color + "25"} stroke={color} strokeWidth="1.5" />
            <text x="160" y="135" textAnchor="middle" fontSize="10" fill={color} fontFamily="monospace" fontWeight="700">stdin intercepted</text>
            <text x="160" y="150" textAnchor="middle" fontSize="9" fill={color} fontFamily="monospace" opacity={0.75}>Ink/React via process.stdin</text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Labels */}
      <text x="160" y="190" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
        {stepIdx === 0 ? "step 1: user input captured" : "step 2: slash command dispatched"}
      </text>
    </svg>
  );
}

/** Step 3-4: messages[] building up with system prompt layers */
function DiagramContextPrompt({ stepIdx }: { stepIdx: number }) {
  const color = "#8B5CF6";
  const showMessages = stepIdx >= 0;
  const showBoundary = stepIdx >= 1;

  const staticBlocks = [
    { label: "baseInstructions", w: 200, fill: color + "40", stroke: color },
    { label: "toolSchemas (110+ tools)", w: 200, fill: color + "30", stroke: color + "aa" },
  ];
  const dynamicBlocks = [
    { label: "CLAUDE.md hierarchy", w: 200, fill: "#3B82F620", stroke: "#3B82F6" },
    { label: "memorySnippets + sessionCtx", w: 200, fill: "#3B82F615", stroke: "#3B82F6aa" },
  ];

  return (
    <svg viewBox="0 0 320 210" className="w-full" style={{ maxHeight: 210 }}>
      {/* Static section */}
      <text x="16" y="18" fontSize="9" fill="#64748b" fontFamily="monospace">static (globally cached)</text>
      {staticBlocks.map((b, i) => (
        <motion.g
          key={b.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: showMessages ? 1 : 0, x: showMessages ? 0 : -10 }}
          transition={{ duration: 0.35, delay: i * 0.1 }}
        >
          <rect x="16" y={24 + i * 28} width={b.w} height="22" rx="4" fill={b.fill} stroke={b.stroke} strokeWidth="1.2" />
          <text x="26" y={24 + i * 28 + 15} fontSize="9" fill={color} fontFamily="monospace">{b.label}</text>
        </motion.g>
      ))}

      {/* Boundary */}
      {showBoundary && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.25 }}>
          <line x1="16" y1="88" x2="216" y2="88" stroke="#475569" strokeWidth="1" strokeDasharray="4,3" />
          <text x="224" y="92" fontSize="8" fill="#475569" fontFamily="monospace">DYNAMIC_BOUNDARY</text>
        </motion.g>
      )}

      {/* Dynamic section */}
      <text x="16" y="104" fontSize="9" fill="#64748b" fontFamily="monospace">dynamic (per-session)</text>
      {dynamicBlocks.map((b, i) => (
        <motion.g
          key={b.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: showBoundary ? 1 : 0, x: showBoundary ? 0 : -10 }}
          transition={{ duration: 0.35, delay: 0.3 + i * 0.1 }}
        >
          <rect x="16" y={110 + i * 28} width={b.w} height="22" rx="4" fill={b.fill} stroke={b.stroke} strokeWidth="1.2" />
          <text x="26" y={110 + i * 28 + 15} fontSize="9" fill="#3B82F6" fontFamily="monospace">{b.label}</text>
        </motion.g>
      ))}

      {/* User message */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: showMessages ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <rect x="16" y="170" width="200" height="22" rx="4" fill="#0f172a" stroke="#1e40af" strokeWidth="1.2" />
        <text x="26" y="185" fontSize="9" fill="#93c5fd" fontFamily="monospace">user: "Fix the login bug…"</text>
      </motion.g>

      <text x="240" y="90" textAnchor="middle" fontSize="8" fill="#6366F150" fontFamily="monospace" transform="rotate(-90,240,90)">messages[]</text>
      <text x="160" y="202" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
        {stepIdx === 0 ? "step 3: messages[] assembled" : "step 4: prompt cache split applied"}
      </text>
    </svg>
  );
}

/** Step 5-6: streaming arrows with tool_use delimiter highlighted */
function DiagramApiStreaming({ stepIdx }: { stepIdx: number }) {
  const apiColor = "#3B82F6";
  const toolColor = "#10B981";
  const showTool = stepIdx >= 1;

  return (
    <svg viewBox="0 0 320 210" className="w-full" style={{ maxHeight: 210 }}>
      {/* Client box */}
      <rect x="10" y="30" width="100" height="40" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
      <text x="60" y="55" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontFamily="monospace">Claude Code</text>

      {/* API box */}
      <rect x="210" y="30" width="100" height="40" rx="6" fill="#1e293b" stroke={apiColor} strokeWidth="1.5" />
      <text x="260" y="55" textAnchor="middle" fontSize="10" fill={apiColor} fontFamily="monospace">Claude API</text>

      {/* SSE stream arrows */}
      {[0, 1, 2, 3].map((i) => (
        <motion.g key={i}>
          <motion.line
            x1="210" y1={85 + i * 18} x2="110" y2={85 + i * 18}
            stroke={showTool && i === 2 ? toolColor : apiColor}
            strokeWidth={showTool && i === 2 ? 2 : 1.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.2 + i * 0.12 }}
          />
          <polygon
            points={`112,${85 + i * 18 - 4} 100,${85 + i * 18} 112,${85 + i * 18 + 4}`}
            fill={showTool && i === 2 ? toolColor : apiColor}
          />
          <motion.text
            x={160}
            y={85 + i * 18 - 3}
            textAnchor="middle"
            fontSize="8"
            fontFamily="monospace"
            fill={showTool && i === 2 ? toolColor : "#475569"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.12 }}
          >
            {i === 0
              ? "text chunk"
              : i === 1
              ? "text chunk"
              : i === 2
              ? showTool
                ? "⚡ tool_use start"
                : "text chunk"
              : showTool
              ? "tool_use end"
              : "text chunk"}
          </motion.text>
        </motion.g>
      ))}

      {/* Tool executor fires */}
      {showTool && (
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.6 }}
        >
          <rect x="10" y="160" width="200" height="30" rx="6" fill={toolColor + "20"} stroke={toolColor} strokeWidth="1.5" />
          <text x="110" y="170" textAnchor="middle" fontSize="9" fill={toolColor} fontFamily="monospace" fontWeight="700">StreamingToolExecutor fires</text>
          <text x="110" y="183" textAnchor="middle" fontSize="8" fill={toolColor} fontFamily="monospace" opacity={0.75}>executeToolAsync() immediately</text>
        </motion.g>
      )}

      <text x="160" y="202" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
        {stepIdx === 0 ? "step 5: SSE stream opens" : "step 6: tool_use detected mid-stream"}
      </text>
    </svg>
  );
}

/** Step 7-8: tool result injection + context gauge */
function DiagramToolsContext({ stepIdx }: { stepIdx: number }) {
  const toolColor = "#10B981";
  const showGauge = stepIdx >= 1;
  const gaugePercent = showGauge ? 78 : 30;
  const gaugeColor = showGauge ? "#F59E0B" : toolColor;

  return (
    <svg viewBox="0 0 320 210" className="w-full" style={{ maxHeight: 210 }}>
      {/* messages[] list */}
      <text x="16" y="16" fontSize="9" fill="#64748b" fontFamily="monospace">messages[]</text>
      {[
        { label: "user: Fix the login bug", color: "#3B82F6" },
        { label: "assistant: tool_use: read_file", color: "#8B5CF6" },
        { label: "tool_result: export function validateToken…", color: toolColor },
      ].map((msg, i) => (
        <motion.g
          key={msg.label}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
        >
          <rect x="16" y={22 + i * 32} width="188" height="24" rx="4" fill={msg.color + "18"} stroke={msg.color} strokeWidth="1.2" />
          <text x="26" y={38 + i * 32} fontSize="8.5" fill={msg.color} fontFamily="monospace">{msg.label}</text>
        </motion.g>
      ))}

      {/* New loop-back arrow */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <text x="16" y="126" fontSize="8" fill="#475569" fontFamily="monospace">↩ loop back → new API call</text>
      </motion.g>

      {/* Context gauge */}
      <text x="224" y="24" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">context</text>
      <rect x="210" y="30" width="24" height="120" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
      <motion.rect
        x="210"
        y={30 + 120 - (gaugePercent / 100) * 120}
        width="24"
        height={(gaugePercent / 100) * 120}
        rx="4"
        fill={gaugeColor}
        animate={{
          y: 30 + 120 - (gaugePercent / 100) * 120,
          height: (gaugePercent / 100) * 120,
          fill: gaugeColor,
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <text x="222" y="162" textAnchor="middle" fontSize="8" fill={gaugeColor} fontFamily="monospace">{gaugePercent}%</text>

      {/* Compact warning */}
      {showGauge && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.5 }}
        >
          <rect x="246" y="55" width="62" height="32" rx="4" fill="#F59E0B20" stroke="#F59E0B" strokeWidth="1.2" />
          <text x="277" y="69" textAnchor="middle" fontSize="8" fill="#F59E0B" fontFamily="monospace">autoCompact</text>
          <text x="277" y="81" textAnchor="middle" fontSize="8" fill="#F59E0B" fontFamily="monospace">pipeline ▶</text>
        </motion.g>
      )}

      <text x="160" y="202" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
        {stepIdx === 0 ? "step 7: tool results injected" : "step 8: context compression check"}
      </text>
    </svg>
  );
}

/** Step 9: final response + cost tracker */
function DiagramResponse() {
  const color = "#F59E0B";

  return (
    <svg viewBox="0 0 320 210" className="w-full" style={{ maxHeight: 210 }}>
      {/* Terminal output */}
      <rect x="10" y="16" width="240" height="100" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      <text x="26" y="34" fontSize="9" fill="#64748b" fontFamily="monospace">terminal output (Ink/React)</text>
      {[
        { text: "Fixed the token expiry bug in auth.ts.", color: "#e2e8f0" },
        { text: "Changed `Date.now()` → `Date.now() / 1000`", color: "#e2e8f0" },
        { text: "in the `validateToken` function.", color: "#e2e8f0" },
      ].map((line, i) => (
        <motion.text
          key={i}
          x="26"
          y={52 + i * 16}
          fontSize="9"
          fill={line.color}
          fontFamily="monospace"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 + i * 0.12 }}
        >
          {line.text}
        </motion.text>
      ))}

      {/* stop_reason badge */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.5 }}
      >
        <rect x="26" y="102" width="110" height="10" rx="3" fill="#6366F120" />
        <text x="31" y="111" fontSize="8" fill="#6366F1" fontFamily="monospace">stop_reason: end_turn ✓</text>
      </motion.g>

      {/* Cost tracker */}
      <motion.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.7 }}
      >
        <rect x="10" y="128" width="140" height="44" rx="6" fill={color + "15"} stroke={color} strokeWidth="1.5" />
        <text x="80" y="143" textAnchor="middle" fontSize="9" fill={color} fontFamily="monospace" fontWeight="700">cost-tracker.ts</text>
        <text x="80" y="157" textAnchor="middle" fontSize="8" fill={color} fontFamily="monospace">input: 2,341 tok × $3/M</text>
        <text x="80" y="168" textAnchor="middle" fontSize="8" fill={color} fontFamily="monospace">output: 412 tok × $15/M</text>
      </motion.g>

      {/* Statsig telemetry */}
      <motion.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.9 }}
      >
        <rect x="162" y="128" width="100" height="44" rx="6" fill="#6366F115" stroke="#6366F1" strokeWidth="1.5" />
        <text x="212" y="143" textAnchor="middle" fontSize="9" fill="#6366F1" fontFamily="monospace" fontWeight="700">Statsig</text>
        <text x="212" y="157" textAnchor="middle" fontSize="8" fill="#6366F1" fontFamily="monospace">agent_turn_complete</text>
        <text x="212" y="168" textAnchor="middle" fontSize="8" fill="#6366F1" fontFamily="monospace">event fired ✓</text>
      </motion.g>

      <text x="160" y="202" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">step 9: response rendered + loop exits</text>
    </svg>
  );
}

function StepDiagram({ stepIndex }: { stepIndex: number }) {
  let scene: React.ReactNode;
  const step = FLOW_STEPS[stepIndex];

  if (stepIndex <= 1) {
    scene = <DiagramCliCommands stepIdx={stepIndex} color={step.color} />;
  } else if (stepIndex <= 3) {
    scene = <DiagramContextPrompt stepIdx={stepIndex - 2} />;
  } else if (stepIndex <= 5) {
    scene = <DiagramApiStreaming stepIdx={stepIndex - 4} />;
  } else if (stepIndex <= 7) {
    scene = <DiagramToolsContext stepIdx={stepIndex - 6} />;
  } else {
    scene = <DiagramResponse />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex items-center justify-center"
      >
        {scene}
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Step List item
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<FlowStep["category"], { en: string; zh: string }> = {
  cli: { en: "CLI / Commands", zh: "CLI / 命令" },
  prompt: { en: "Context / Prompt", zh: "上下文 / 提示词" },
  api: { en: "API / Streaming", zh: "API / 流式" },
  tools: { en: "Tools / Context", zh: "工具 / 上下文" },
  response: { en: "Response", zh: "响应" },
};

function StepListItem({
  step,
  isActive,
  isCompleted,
  onClick,
  isZh,
}: {
  step: FlowStep;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
  isZh: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
        isActive
          ? "border-transparent shadow-lg"
          : isCompleted
          ? "border-zinc-200 bg-zinc-50/60 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70"
      )}
      style={
        isActive
          ? {
              backgroundColor: step.color + "15",
              borderColor: step.color + "50",
            }
          : {}
      }
    >
      {/* Circle */}
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
          isActive
            ? "text-white shadow-md"
            : isCompleted
            ? "text-white"
            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
        )}
        style={
          isActive
            ? { backgroundColor: step.color }
            : isCompleted
            ? { backgroundColor: "#10B981" }
            : {}
        }
      >
        {isCompleted ? (
          <CheckCircle2 size={14} />
        ) : (
          <span>{step.id}</span>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-semibold leading-tight transition-colors",
            isActive
              ? "text-zinc-900 dark:text-zinc-50"
              : isCompleted
              ? "text-zinc-400 dark:text-zinc-500"
              : "text-zinc-700 dark:text-zinc-300"
          )}
        >
          {isZh ? step.titleZh : step.title}
        </div>
        <div
          className={cn(
            "mt-0.5 hidden text-[11px] leading-snug sm:block",
            isActive
              ? "text-zinc-600 dark:text-zinc-400"
              : "text-zinc-400 dark:text-zinc-600"
          )}
        >
          {isZh ? step.descriptionZh.slice(0, 55) : step.description.slice(0, 60)}…
        </div>
      </div>

      {/* Tag badge */}
      <div
        className="hidden shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:block"
        style={{
          backgroundColor: step.color + "18",
          color: isActive || isCompleted ? step.color : "#71717a",
        }}
      >
        {step.tag}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function FlowClient() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const isZh = locale === "zh";

  const viz = useSteppedVisualization({
    totalSteps: TOTAL_STEPS,
    autoPlayInterval: 3000,
  });

  const step = FLOW_STEPS[viz.currentStep];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {isZh ? "请求全链路追踪" : "Flow Tracer"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isZh
            ? "Claude Code 从用户输入到完整响应的 9 步执行路径"
            : "9-step execution path from user input to complete response"}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left: Step List */}
        <div className="lg:col-span-2">
          <div className="space-y-1.5">
            {FLOW_STEPS.map((s, i) => (
              <div key={s.id} className="relative">
                {/* Vertical connector line */}
                {i < FLOW_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute bottom-0 left-[22px] top-full z-0 w-px transition-colors duration-300",
                      i < viz.currentStep
                        ? ""
                        : "bg-zinc-200 dark:bg-zinc-800"
                    )}
                    style={
                      i < viz.currentStep
                        ? { backgroundColor: FLOW_STEPS[i].color + "60" }
                        : {}
                    }
                  />
                )}
                <div className="relative z-10">
                  <StepListItem
                    step={s}
                    isActive={i === viz.currentStep}
                    isCompleted={i < viz.currentStep}
                    onClick={() => viz.goToStep(i)}
                    isZh={isZh}
                  />
                </div>
                {/* Spacer for connector */}
                {i < FLOW_STEPS.length - 1 && <div className="h-1.5" />}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Diagram + Info */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Diagram area */}
          <div
            className="relative overflow-hidden rounded-2xl border"
            style={{
              backgroundColor: "#0f172a",
              borderColor: step.color + "40",
              minHeight: 260,
            }}
          >
            {/* Step badge */}
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: step.color + "25", color: step.color }}
              >
                Step {step.id} · {step.tag}
              </span>
            </div>

            {/* Category label */}
            <div className="absolute right-3 top-3 z-10">
              <span className="text-[10px] font-mono text-slate-500">
                {isZh
                  ? CATEGORY_LABELS[step.category].zh
                  : CATEGORY_LABELS[step.category].en}
              </span>
            </div>

            {/* Animated diagram */}
            <div className="flex items-center justify-center px-4 pb-4 pt-10">
              <StepDiagram stepIndex={viz.currentStep} />
            </div>
          </div>

          {/* Description card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viz.currentStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border p-4"
              style={{
                borderColor: step.color + "30",
                backgroundColor: step.color + "08",
              }}
            >
              <div
                className="mb-1 text-base font-bold"
                style={{ color: step.color }}
              >
                {isZh ? step.titleZh : step.title}
              </div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {isZh ? step.descriptionZh : step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Code snippet */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`code-${viz.currentStep}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="overflow-hidden rounded-xl"
            >
              <div className="flex items-center justify-between rounded-t-xl bg-zinc-900 px-4 py-2">
                <span className="font-mono text-[10px] text-zinc-500">
                  {step.tag.toLowerCase().replace(" ", "-")}.ts
                </span>
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                </div>
              </div>
              <pre className="overflow-x-auto bg-zinc-950 px-4 pb-4 pt-3 text-xs leading-relaxed text-zinc-200">
                <code>{step.code}</code>
              </pre>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={viz.reset}
              title={isZh ? "重置" : "Reset"}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={viz.prev}
              disabled={viz.isFirstStep}
              title={isZh ? "上一步" : "Previous"}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={viz.toggleAutoPlay}
              title={viz.isPlaying ? (isZh ? "暂停" : "Pause") : (isZh ? "自动播放" : "Auto-play")}
              className="rounded-lg p-2 transition-colors"
              style={{
                backgroundColor: viz.isPlaying ? step.color + "20" : undefined,
                color: viz.isPlaying ? step.color : "#71717a",
              }}
            >
              {viz.isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={viz.next}
              disabled={viz.isLastStep}
              title={isZh ? "下一步" : "Next"}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right: dots + counter */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <button
                  key={i}
                  onClick={() => viz.goToStep(i)}
                  title={`Step ${i + 1}`}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: i === viz.currentStep ? 20 : 8,
                    backgroundColor:
                      i === viz.currentStep
                        ? step.color
                        : i < viz.currentStep
                        ? step.color + "55"
                        : "#d4d4d8",
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-xs text-zinc-400">
              {isZh
                ? `第 ${viz.currentStep + 1} / ${TOTAL_STEPS} 步`
                : `Step ${viz.currentStep + 1} of ${TOTAL_STEPS}`}
            </span>
          </div>
        </div>
      </div>

      {/* Completion state */}
      <AnimatePresence>
        {viz.isLastStep && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="shrink-0 text-amber-500" size={20} />
              <div>
                <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {isZh ? "全链路追踪完成！" : "Full flow traced!"}
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  {isZh
                    ? "你已经了解了 Claude Code 从用户输入到响应的完整 9 步执行路径"
                    : "You've traced the complete 9-step execution path from user input to response"}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
