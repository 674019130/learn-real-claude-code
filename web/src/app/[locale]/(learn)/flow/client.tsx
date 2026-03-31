"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlowStep {
  id: number;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  code?: string;
  tag: string;
  tagColor: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    title: "User types a message",
    titleZh: "用户输入消息",
    description:
      "The CLI intercepts stdin via Ink/React. Fast paths (/version, /help) exit before any expensive imports are evaluated — keeping startup < 500ms.",
    descriptionZh:
      "CLI 通过 Ink/React 拦截 stdin 输入。快速路径（/version、/help）在任何昂贵导入被执行之前就退出 — 保持启动时间 < 500ms。",
    code: `// cli/index.ts — fast path check
if (argv[0] === "--version") {
  console.log(VERSION);
  process.exit(0);        // exits before any imports
}`,
    tag: "CLI",
    tagColor: "#6366F1",
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
const cmd = commandRegistry.get(input.slice(1).split(" ")[0]);
if (cmd) return cmd.handler(args, context);
// else → falls through to agent loop`,
    tag: "Commands",
    tagColor: "#10B981",
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
    tagColor: "#3B82F6",
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
const static_section = [baseInstructions, toolSchemas].join("\\n");
// ─── SYSTEM_PROMPT_DYNAMIC_BOUNDARY ───
const dynamic_section = [
  claudeMdHierarchy,
  memorySnippets,
  sessionContext,
].join("\\n");`,
    tag: "Prompt",
    tagColor: "#8B5CF6",
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
  yield chunk;                    // keep streaming text
}`,
    tag: "Streaming",
    tagColor: "#EC4899",
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
const safeResults = await Promise.all(safe.map(run));
for (const tool of exclusive) {
  await run(tool); // sequential for safety
}`,
    tag: "Tools",
    tagColor: "#F97316",
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
    tagColor: "#3B82F6",
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
    tagColor: "#8B5CF6",
  },
  {
    id: 9,
    title: "Response complete",
    titleZh: "响应完成",
    description:
      "The final text renders to the terminal via Ink's React reconciler. Cost tracker updates (tokens × price per token). Telemetry fires to two backends: Statsig (product analytics) + internal pipeline. The loop exits.",
    descriptionZh:
      "最终文本通过 Ink 的 React reconciler 渲染到终端。成本追踪器更新（token × 每 token 价格）。遥测触发到两个后端：Statsig（产品分析）+ 内部管道。循环退出。",
    code: `// cost-tracker.ts
const cost = inputTokens  * PRICES[model].input
           + outputTokens * PRICES[model].output;
updateCostAccumulator(cost);
trackEvent("agent_turn_complete", { cost, model });
// ink re-renders final markdown to terminal`,
    tag: "Render",
    tagColor: "#14B8A6",
  },
];

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className="flex justify-center py-0.5">
      <div className={cn("w-px transition-colors duration-300", active ? "h-6 bg-blue-400" : "h-6 bg-zinc-200 dark:bg-zinc-700")} />
    </div>
  );
}

export default function FlowClient() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const isZh = locale === "zh";

  const [activeStep, setActiveStep] = useState(0); // 0-indexed
  const totalSteps = FLOW_STEPS.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {isZh ? "请求全链路追踪" : "Flow Tracer"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isZh
            ? "Claude Code 从用户输入到完整响应的完整执行路径 — 点击任意步骤展开"
            : "Complete execution path from user input to full response — click any step to expand"}
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
          disabled={activeStep === 0}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {isZh ? "← 上一步" : "← Prev"}
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {activeStep + 1} / {totalSteps}
        </span>
        <button
          onClick={() => setActiveStep((s) => Math.min(totalSteps - 1, s + 1))}
          disabled={activeStep === totalSteps - 1}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {isZh ? "下一步 →" : "Next →"}
        </button>
        <button
          onClick={() => setActiveStep(0)}
          className="ml-auto rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          {isZh ? "重置" : "Reset"}
        </button>
      </div>

      {/* Step List */}
      <div>
        {FLOW_STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isCompleted = i < activeStep;

          return (
            <div key={step.id}>
              {/* Step Card */}
              <motion.div
                layout
                className={cn(
                  "cursor-pointer rounded-xl border transition-all duration-200",
                  isActive
                    ? "border-zinc-300 bg-white shadow-md dark:border-zinc-600 dark:bg-zinc-900"
                    : isCompleted
                    ? "border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
                )}
                onClick={() => setActiveStep(i)}
              >
                {/* Step Header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Step number circle */}
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                      isActive
                        ? "text-white"
                        : isCompleted
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                    style={isActive ? { backgroundColor: step.tagColor } : {}}
                  >
                    {isCompleted ? "✓" : step.id}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold transition-colors",
                          isActive
                            ? "text-zinc-900 dark:text-zinc-100"
                            : isCompleted
                            ? "text-zinc-500 dark:text-zinc-500"
                            : "text-zinc-700 dark:text-zinc-300"
                        )}
                      >
                        {isZh ? step.titleZh : step.title}
                      </span>
                      <span
                        className="hidden rounded px-1.5 py-0.5 text-[10px] font-bold sm:block"
                        style={{
                          backgroundColor: step.tagColor + "20",
                          color: step.tagColor,
                        }}
                      >
                        {step.tag}
                      </span>
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <motion.span
                    animate={{ rotate: isActive ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-zinc-400"
                  >
                    ▾
                  </motion.span>
                </div>

                {/* Expanded Content */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-700">
                        {/* Description */}
                        <p className="mb-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {isZh ? step.descriptionZh : step.description}
                        </p>

                        {/* Code snippet */}
                        {step.code && (
                          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-200 dark:bg-zinc-800">
                            <code>{step.code}</code>
                          </pre>
                        )}

                        {/* Next step hint */}
                        {i < totalSteps - 1 && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveStep(i + 1);
                              }}
                              className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                              style={{
                                backgroundColor: step.tagColor + "15",
                                color: step.tagColor,
                              }}
                            >
                              {isZh ? "下一步 →" : "Next step →"}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Connector */}
              {i < FLOW_STEPS.length - 1 && (
                <StepConnector active={isCompleted || isActive} />
              )}
            </div>
          );
        })}
      </div>

      {/* Completion state */}
      {activeStep === totalSteps - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/20"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <div>
              <div className="text-sm font-semibold text-green-800 dark:text-green-300">
                {isZh ? "全链路追踪完成！" : "Full flow traced!"}
              </div>
              <div className="text-xs text-green-700 dark:text-green-400">
                {isZh
                  ? "你已经了解了 Claude Code 从用户输入到响应的完整执行路径"
                  : "You've traced the complete execution path from user input to response"}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
