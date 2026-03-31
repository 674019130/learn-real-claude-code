"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CompareCard {
  id: string;
  title: string;
  titleZh: string;
  chapterRef: string;
  naiveCode: string;
  productionCode: string;
  naiveLabel: string;
  naiveLabelZh: string;
  productionLabel: string;
  productionLabelZh: string;
  callout: string;
  calloutZh: string;
}

const COMPARE_CARDS: CompareCard[] = [
  {
    id: "agent-loop",
    title: "Agent Loop",
    titleZh: "Agent 循环",
    chapterRef: "c02",
    naiveLabel: "Naive / Textbook",
    naiveLabelZh: "教学版",
    productionLabel: "Production / Claude Code",
    productionLabelZh: "生产版 / Claude Code",
    naiveCode: `# Textbook agent loop
while True:
    response = llm.call(messages)
    if response.has_tool_call:
        result = tool.run(
            response.tool_call
        )
        messages.append(result)
    else:
        break  # done`,
    productionCode: `// StreamingToolExecutor fires tools
// at delimiter MID-STREAM
for await (const chunk of stream) {
  if (isToolUseStart(chunk)) {
    pending = accumulate(chunk);
  } else if (isToolUseEnd(chunk)) {
    executeAsync(pending); // ← fires NOW
  }
  yield chunk; // streaming continues
}
// + auto-compact at 95% context`,
    callout:
      "Tools fire mid-stream without waiting for the full response, and context auto-compresses before the window fills.",
    calloutZh:
      "工具在不等待完整响应的情况下在流式传输中途触发，且上下文在窗口填满前自动压缩。",
  },
  {
    id: "tool-execution",
    title: "Tool Execution",
    titleZh: "工具执行",
    chapterRef: "c03",
    naiveLabel: "Naive / Sequential",
    naiveLabelZh: "教学版 / 顺序执行",
    productionLabel: "Production / Claude Code",
    productionLabelZh: "生产版 / Claude Code",
    naiveCode: `# Sequential tool execution
for tool in tool_calls:
    result = tool.run()
    # each tool waits for the
    # previous to complete
    results.append(result)`,
    productionCode: `// Partition by safety class
const [safe, exclusive] = partition(
  tools, t => t.isConcurrencySafe()
);

// Reads run in parallel
const safeResults = await Promise.all(
  safe.map(t => run(t))
);

// Writes run sequentially
for (const t of exclusive) {
  await run(t); // no race conditions
}`,
    callout:
      "Tools declare isConcurrencySafe() — reads and searches run in parallel, writes run exclusively to prevent filesystem races.",
    calloutZh:
      "工具声明 isConcurrencySafe() — 读取和搜索并行运行，写操作独占运行以防止文件系统竞态。",
  },
  {
    id: "permission-check",
    title: "Permission Check",
    titleZh: "权限检查",
    chapterRef: "c08",
    naiveLabel: "Naive / Linear",
    naiveLabelZh: "教学版 / 线性检查",
    productionLabel: "Production / Permission Racing",
    productionLabelZh: "生产版 / 权限竞赛",
    naiveCode: `# Naive sequential permission check
if tool.requires_permission:
    approved = ask_user()
    if approved:
        result = tool.run()
# hooks and classifiers run
# one at a time, blocking`,
    productionCode: `// Three-way permission race
const winner = await Promise.race([
  hooks.preToolUse(tool),      // fast
  yoloClassifier.check(tool),  // fast
  askUser(tool),               // slow
]);
// First to return "safe" wins —
// often classifier fires before
// user even sees the dialog`,
    callout:
      "Hooks, the YOLO auto-approve classifier, and user confirmation race concurrently. The first to return a safe verdict wins — auto-approval is typically fastest.",
    calloutZh:
      "Hook、YOLO 自动批准分类器和用户确认并发竞争。第一个返回安全判定的获胜 — 自动批准通常最快。",
  },
  {
    id: "context-management",
    title: "Context Management",
    titleZh: "上下文管理",
    chapterRef: "c06",
    naiveLabel: "Naive / Truncation",
    naiveLabelZh: "教学版 / 简单截断",
    productionLabel: "Production / 7-Strategy Pipeline",
    productionLabelZh: "生产版 / 7 策略管道",
    naiveCode: `# Naive truncation
if len(messages) > limit:
    # just drop the oldest ones
    messages = messages[-100:]
# loses critical context,
# no awareness of content type`,
    productionCode: `// 7-strategy pipeline fires in order
// until usage drops below 80%
const STRATEGIES = [
  snipRecentToolResults,   // 1
  microcompactOldTools,    // 2
  collapseRepeatedPatterns,// 3
  summarizeOldTurns,       // 4
  aggressiveSummarize,     // 5
  dropOldUserMessages,     // 6
  emergencyTruncate,       // 7
];
for (const s of STRATEGIES) {
  await s.apply(messages);
  if (usage() < 0.80) break;
}`,
    callout:
      "Preserves recency and semantic value — drops old tool results first, never user messages unless critical, and summarizes rather than blindly truncating.",
    calloutZh:
      "保留最近内容和语义价值 — 优先丢弃旧工具结果，除非紧急否则不丢弃用户消息，并通过摘要而非盲目截断来压缩。",
  },
  {
    id: "memory",
    title: "Memory",
    titleZh: "记忆系统",
    chapterRef: "c07",
    naiveLabel: "Naive / Stateless",
    naiveLabelZh: "教学版 / 无状态",
    productionLabel: "Production / Auto-Dream",
    productionLabelZh: "生产版 / Auto-Dream",
    naiveCode: `# Stateless — no memory
memory = {}  # empty each session

# User must re-explain context
# every single conversation`,
    productionCode: `// CLAUDE.md files persist on disk
// Auto-Dream consolidates memories
// across sessions in 4 phases:

// Phase 1: Orient — understand context
// Phase 2: Gather — read all CLAUDE.md
// Phase 3: Consolidate — write merged
// Phase 4: Prune — remove stale facts

// Uses read-only bash subagent
// to prevent accidental writes`,
    callout:
      "CLAUDE.md files form a hierarchical memory system. Auto-Dream periodically consolidates them across sessions using a read-only subagent — seeded by Mulberry32 PRNG for determinism.",
    calloutZh:
      "CLAUDE.md 文件构成层次化记忆系统。Auto-Dream 使用只读子 agent 定期跨会话整合记忆 — 由 Mulberry32 PRNG 确保确定性。",
  },
];

function CodeBlock({ code, tint }: { code: string; tint: "red" | "green" }) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-lg p-3 text-xs leading-relaxed",
        tint === "red"
          ? "bg-red-950/80 text-red-100"
          : "bg-green-950/80 text-green-100"
      )}
    >
      <code>{code}</code>
    </pre>
  );
}

export default function CompareClient() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const isZh = locale === "zh";

  const [expandedCard, setExpandedCard] = useState<string | null>(
    COMPARE_CARDS[0].id
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {isZh ? "教学版 vs 生产版" : "Naive vs Production"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isZh
            ? "5 个关键 Agent 模式的教学实现与 Claude Code 生产实现对比"
            : "5 key agent patterns: textbook implementation vs Claude Code production reality"}
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-red-200 dark:bg-red-900/60" />
          <span className="text-zinc-600 dark:text-zinc-400">
            {isZh ? "教学版（简化）" : "Naive / Textbook"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-green-200 dark:bg-green-900/60" />
          <span className="text-zinc-600 dark:text-zinc-400">
            {isZh ? "生产版（Claude Code）" : "Production (Claude Code)"}
          </span>
        </div>
      </div>

      {/* Compare Cards */}
      <div className="space-y-4">
        {COMPARE_CARDS.map((card, i) => {
          const isExpanded = expandedCard === card.id;

          return (
            <motion.div
              key={card.id}
              layout
              className={cn(
                "overflow-hidden rounded-xl border transition-colors duration-200",
                isExpanded
                  ? "border-zinc-300 shadow-sm dark:border-zinc-600"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              )}
            >
              {/* Card Header */}
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                onClick={() =>
                  setExpandedCard(isExpanded ? null : card.id)
                }
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {i + 1}
                </span>
                <span className="flex-1 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {isZh ? card.titleZh : card.title}
                </span>
                <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {card.chapterRef}
                </span>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-zinc-400"
                >
                  ▾
                </motion.span>
              </button>

              {/* Expanded Content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-zinc-200 dark:border-zinc-700">
                      {/* Side-by-side code */}
                      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
                        {/* Naive side */}
                        <div className="border-b border-zinc-200 p-4 sm:border-b-0 sm:border-r dark:border-zinc-700">
                          <div className="mb-2 flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-red-400" />
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                              {isZh ? card.naiveLabelZh : card.naiveLabel}
                            </span>
                          </div>
                          <CodeBlock code={card.naiveCode} tint="red" />
                        </div>

                        {/* Production side */}
                        <div className="p-4">
                          <div className="mb-2 flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-green-400" />
                            <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                              {isZh
                                ? card.productionLabelZh
                                : card.productionLabel}
                            </span>
                          </div>
                          <CodeBlock code={card.productionCode} tint="green" />
                        </div>
                      </div>

                      {/* Key difference callout */}
                      <div className="mx-4 mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-900/20">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {isZh ? "核心差异" : "Key Difference"}
                        </div>
                        <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                          {isZh ? card.calloutZh : card.callout}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Summary table */}
      <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {isZh ? "差距一览" : "Gap Summary"}
          </span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {COMPARE_CARDS.map((card) => (
            <div key={card.id} className="flex items-center gap-4 px-4 py-2.5">
              <span className="w-28 shrink-0 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {isZh ? card.titleZh : card.title}
              </span>
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-700 dark:bg-red-900/20 dark:text-red-400 truncate">
                  {isZh ? card.naiveLabelZh : card.naiveLabel}
                </span>
                <span className="text-zinc-400">→</span>
                <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] text-green-700 dark:bg-green-900/20 dark:text-green-400 truncate">
                  {isZh ? card.productionLabelZh : card.productionLabel}
                </span>
              </div>
              <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {card.chapterRef}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
