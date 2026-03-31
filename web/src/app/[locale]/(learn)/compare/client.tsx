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
  tabLabel: string;
  tabLabelZh: string;
}

const COMPARE_CARDS: CompareCard[] = [
  {
    id: "agent-loop",
    title: "Agent Loop",
    titleZh: "Agent 循环",
    tabLabel: "Agent Loop",
    tabLabelZh: "循环",
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
    executeAsync(pending); // ← KEY
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
    tabLabel: "Tools",
    tabLabelZh: "工具",
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
  tools, t => t.isConcurrencySafe() // ← KEY
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
    tabLabel: "Permissions",
    tabLabelZh: "权限",
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
  yoloClassifier.check(tool),  // fast ← KEY
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
    tabLabel: "Context",
    tabLabelZh: "上下文",
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
// until usage drops below 80%  ← KEY
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
    tabLabel: "Memory",
    tabLabelZh: "记忆",
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
// across sessions in 4 phases:  ← KEY

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

// Syntax-color a code string: highlight `// ← KEY` annotation lines
function CodeLine({ line, tint }: { line: string; tint: "red" | "green" }) {
  const isKeyLine = line.includes("← KEY");
  const isComment =
    !isKeyLine &&
    (line.trimStart().startsWith("//") || line.trimStart().startsWith("#"));
  const isKeyword = !isComment && !isKeyLine;

  if (isKeyLine) {
    return (
      <span className="block">
        <span
          className={cn(
            "block rounded px-1 -mx-1 font-semibold",
            tint === "green"
              ? "bg-emerald-400/20 text-emerald-300"
              : "bg-rose-400/20 text-rose-300"
          )}
        >
          {line}
        </span>
      </span>
    );
  }

  if (isComment) {
    return (
      <span
        className={cn(
          "block",
          tint === "green" ? "text-emerald-600/70" : "text-rose-600/70"
        )}
      >
        {line}
      </span>
    );
  }

  // Colorize JS/TS keywords inline
  const keywords = /\b(const|let|var|for|await|if|else|break|return|async|of|in)\b/g;
  const parts = line.split(keywords);

  return (
    <span className="block">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className={
              tint === "green" ? "text-sky-400" : "text-orange-400"
            }
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function CodeBlock({ code, tint }: { code: string; tint: "red" | "green" }) {
  const lines = code.split("\n");
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-lg p-4 text-[11px] leading-[1.7] font-mono",
        tint === "red"
          ? "bg-[#1a0808] text-rose-200/90"
          : "bg-[#081a0e] text-emerald-200/90"
      )}
    >
      <code>
        {lines.map((line, i) => (
          <CodeLine key={i} line={line} tint={tint} />
        ))}
      </code>
    </pre>
  );
}

function ChapterBadge({ id }: { id: string }) {
  return (
    <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:bg-indigo-400/15 dark:text-indigo-400 border border-indigo-500/20">
      {id}
    </span>
  );
}

function CollapseIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 text-zinc-400"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

export default function CompareClient() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const isZh = locale === "zh";

  const [activeTab, setActiveTab] = useState<string>(COMPARE_CARDS[0].id);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(
    new Set([COMPARE_CARDS[0].id])
  );

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const scrollToCard = (id: string) => {
    setActiveTab(id);
    setExpandedCards((prev) => new Set([...prev, id]));
    // Small delay to let expand animation start, then scroll
    setTimeout(() => {
      document.getElementById(`compare-card-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-zinc-900 dark:text-zinc-50">
            {isZh ? (
              <>
                <span className="text-rose-500">教学版</span>
                <span className="mx-2 text-zinc-400 font-light">vs</span>
                <span className="text-emerald-500">生产版</span>
              </>
            ) : (
              <>
                <span className="text-rose-500">Naive</span>
                <span className="mx-2 text-zinc-400 font-light">vs</span>
                <span className="text-emerald-500">Production</span>
              </>
            )}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            {isZh
              ? "5 个核心 Agent 模式：教科书简化实现 vs Claude Code 生产级现实"
              : "5 core agent patterns — what the textbook teaches vs what Claude Code actually ships"}
          </p>
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            {isZh ? "教学版 / Naive" : "Naive / Textbook"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {isZh ? "生产版 / Claude Code" : "Production / Claude Code"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-400">
            <span className="font-mono text-[10px]">← KEY</span>
            {isZh ? "关键行标注" : "Key line annotation"}
          </span>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {COMPARE_CARDS.map((card, i) => {
          const isActive = activeTab === card.id;
          return (
            <button
              key={card.id}
              onClick={() => scrollToCard(card.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                isActive
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                  isActive
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                )}
              >
                {i + 1}
              </span>
              {isZh ? card.tabLabelZh : card.tabLabel}
            </button>
          );
        })}
      </div>

      {/* ── Compare Cards ── */}
      <div className="space-y-3">
        {COMPARE_CARDS.map((card, i) => {
          const isExpanded = expandedCards.has(card.id);

          return (
            <motion.div
              key={card.id}
              id={`compare-card-${card.id}`}
              layout
              className={cn(
                "overflow-hidden rounded-xl border transition-colors duration-200",
                isExpanded
                  ? "border-zinc-300 shadow-md dark:border-zinc-600"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              )}
            >
              {/* Card Header */}
              <button
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                  isExpanded
                    ? "bg-zinc-50 dark:bg-zinc-900"
                    : "bg-white hover:bg-zinc-50/50 dark:bg-zinc-950 dark:hover:bg-zinc-900/50"
                )}
                onClick={() => {
                  toggleCard(card.id);
                  setActiveTab(card.id);
                }}
              >
                {/* Index */}
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isExpanded
                      ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  )}
                >
                  {i + 1}
                </span>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                    {isZh ? card.titleZh : card.title}
                  </span>
                  {isZh && (
                    <span className="text-[10px] text-zinc-400 font-normal">
                      {card.title}
                    </span>
                  )}
                </div>

                {/* Chapter badge */}
                <ChapterBadge id={card.chapterRef} />

                {/* Collapse icon */}
                <CollapseIcon open={isExpanded} />
              </button>

              {/* Expanded Body */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-zinc-200 dark:border-zinc-700/60">
                      {/* Two-column code layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-700/60">
                        {/* Naive side */}
                        <div className="p-4 bg-[#0e0606] dark:bg-[#0e0606]">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                              {isZh ? card.naiveLabelZh : card.naiveLabel}
                            </span>
                          </div>
                          <CodeBlock code={card.naiveCode} tint="red" />
                        </div>

                        {/* Production side */}
                        <div className="p-4 bg-[#060e08] dark:bg-[#060e08]">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                              {isZh
                                ? card.productionLabelZh
                                : card.productionLabel}
                            </span>
                          </div>
                          <CodeBlock code={card.productionCode} tint="green" />
                        </div>
                      </div>

                      {/* Key difference callout */}
                      <div className="mx-4 mb-4 mt-3 flex gap-3 rounded-lg border border-amber-200/60 bg-amber-50/80 p-3.5 dark:border-amber-700/30 dark:bg-amber-900/10">
                        <span className="shrink-0 text-amber-500 mt-0.5">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6L8 1z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                        <div>
                          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
                            {isZh ? "核心差异" : "Key Insight"}
                          </div>
                          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300/90">
                            {isZh ? card.calloutZh : card.callout}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ── Summary Table ── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_1fr] border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
          <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-28">
            {isZh ? "模式" : "Pattern"}
          </div>
          <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-rose-500 border-l border-zinc-200 dark:border-zinc-800">
            {isZh ? "教学版" : "Naive Approach"}
          </div>
          <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-l border-zinc-200 dark:border-zinc-800">
            {isZh ? "生产版" : "Production Approach"}
          </div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {COMPARE_CARDS.map((card) => (
            <div
              key={card.id}
              className="grid grid-cols-[auto_1fr_1fr] hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer"
              onClick={() => scrollToCard(card.id)}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 w-28">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  {isZh ? card.titleZh : card.title}
                </span>
              </div>
              <div className="flex items-center px-3 py-2.5 border-l border-zinc-100 dark:border-zinc-800/80">
                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 truncate border border-rose-100 dark:border-rose-800/30">
                  {isZh ? card.naiveLabelZh : card.naiveLabel}
                </span>
              </div>
              <div className="flex items-center px-3 py-2.5 border-l border-zinc-100 dark:border-zinc-800/80">
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 truncate border border-emerald-100 dark:border-emerald-800/30">
                  {isZh ? card.productionLabelZh : card.productionLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
