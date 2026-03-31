"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SessionVisualization } from "@/components/visualizations";
import { DocRenderer } from "@/components/docs/doc-renderer";
import { CHAPTER_META } from "@/lib/constants";

const TABS = [
  { id: "learn", labelEn: "Learn", labelZh: "学习" },
  { id: "visualize", labelEn: "Visualize", labelZh: "可视化" },
  { id: "code", labelEn: "Code", labelZh: "代码" },
  { id: "deep-dive", labelEn: "Deep Dive", labelZh: "深入" },
] as const;

// Key source files per chapter for the Code tab
const CHAPTER_FILES: Record<string, { path: string; desc: string }[]> = {
  c01: [
    { path: "entrypoints/cli.tsx", desc: "CLI entry point with fast-path checks" },
    { path: "main.tsx", desc: "Main module (804KB) — Commander, init, REPL" },
    { path: "entrypoints/init.ts", desc: "Memoized init() — configs, auth, shutdown" },
  ],
  c02: [
    { path: "query.ts", desc: "The core agent loop — while(true) + streaming" },
    { path: "QueryEngine.ts", desc: "Higher-level orchestration, system prompt assembly" },
  ],
  c03: [
    { path: "Tool.ts", desc: "Tool interface — schema, invoke, render, permissions" },
    { path: "tools.ts", desc: "Tool registry — getTools() assembles 40+ tools" },
  ],
  c04: [{ path: "commands.ts", desc: "Command registration & dispatch (100+ commands)" }],
  c05: [
    { path: "context.ts", desc: "System/user context injection" },
  ],
  c06: [{ path: "cost-tracker.ts", desc: "Token counting & cost estimation" }],
  c07: [],
  c08: [],
  c09: [],
  c10: [{ path: "coordinator/coordinatorMode.ts", desc: "Coordinator mode orchestration" }],
  c11: [],
  c12: [],
  c13: [],
  c14: [{ path: "cost-tracker.ts", desc: "Per-model token tracking" }],
  c15: [],
};

export function ChapterClient({ chapter, locale }: { chapter: string; locale: string }) {
  const [activeTab, setActiveTab] = useState<string>("learn");
  const isZh = locale === "zh";
  const meta = CHAPTER_META[chapter];
  const files = CHAPTER_FILES[chapter] || [];

  return (
    <div>
      {/* Tab Bar */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {isZh ? tab.labelZh : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "learn" && <DocRenderer chapter={chapter} />}

        {activeTab === "visualize" && <SessionVisualization version={chapter} />}

        {activeTab === "code" && (
          <div className="space-y-4">
            {files.length > 0 ? (
              files.map((f) => (
                <div key={f.path} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-bold text-pink-600 dark:bg-zinc-800 dark:text-pink-400">
                      {f.path}
                    </code>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{f.desc}</p>
                  <a
                    href={`https://github.com/674019130/claude-code/blob/main/${f.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-blue-500 hover:text-blue-600"
                  >
                    {isZh ? "在 GitHub 上查看 →" : "View on GitHub →"}
                  </a>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {isZh
                    ? "本章涉及多个分散的源文件，请参考教程中的代码引用。"
                    : "This chapter covers multiple distributed source files. See code references in the tutorial."}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "deep-dive" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-3 font-bold">
                {isZh ? "核心问题" : "Core Question"}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300">
                {isZh ? meta?.coreQuestionZh : meta?.coreQuestion}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-800/50 dark:bg-emerald-950/20">
              <h3 className="mb-3 font-bold text-emerald-700 dark:text-emerald-300">
                {isZh ? "关键洞察" : "Key Insight"}
              </h3>
              <p className="text-emerald-800 dark:text-emerald-200">
                {meta?.keyInsight}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
