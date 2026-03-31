"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import sourceIndex from "@/data/generated/source-index.json";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourceFile {
  path: string;
  loc: number;
  directory: string;
}

// ─── Chapter Key Files ────────────────────────────────────────────────────────

const CHAPTER_KEY_FILES: Record<string, string[]> = {
  c01: ["entrypoints/cli.tsx", "main.tsx", "entrypoints/init.ts"],
  c02: ["query.ts", "QueryEngine.ts"],
  c03: ["Tool.ts", "tools.ts"],
  c04: ["commands.ts"],
  c05: ["context.ts"],
  c06: ["cost-tracker.ts"],
  c10: ["coordinator/coordinatorMode.ts"],
  c14: ["cost-tracker.ts", "costHook.ts"],
};

const CHAPTER_TITLES: Record<string, { en: string; zh: string }> = {
  c01: { en: "Booting 512K Lines in 500ms", zh: "500ms 启动 512K 行代码" },
  c02: { en: "The Real Agent Loop", zh: "真正的 Agent Loop" },
  c03: { en: "Orchestrating 40+ Tools", zh: "40+ 工具的编排引擎" },
  c04: { en: "100+ Slash Commands", zh: "100+ 斜杠命令的调度系统" },
  c05: { en: "110+ Strings → One System Prompt", zh: "110+ 字符串拼成一个系统提示词" },
  c06: { en: "Context as a Resource", zh: "上下文即资源：三级压缩续命术" },
  c10: { en: "One Claude Commanding Many", zh: "一个 Claude 指挥一群 Claude" },
  c14: { en: "Observability", zh: "可观测性：遥测、成本与恢复" },
};

function getChapterForFile(filePath: string): string | null {
  const filename = filePath.split("/").pop() ?? filePath;
  for (const [chapter, files] of Object.entries(CHAPTER_KEY_FILES)) {
    if (files.some((f) => f === filePath || f.split("/").pop() === filename)) {
      return chapter;
    }
  }
  return null;
}

// ─── Directory Color Hashing ──────────────────────────────────────────────────

const DIR_COLORS = [
  { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30" },
  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" },
  { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30" },
  { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
  { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
];

function hashDir(dir: string): number {
  let h = 0;
  for (let i = 0; i < dir.length; i++) {
    h = ((h << 5) - h + dir.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % DIR_COLORS.length;
}

function getDirColor(dir: string) {
  return DIR_COLORS[hashDir(dir)];
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

function formatLoc(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function formatLocFull(n: number): string {
  return n.toLocaleString();
}

// ─── Main Component ───────────────────────────────────────────────────────────

const files = sourceIndex.files as SourceFile[];
const MAX_DISPLAY = 200;

export function ExplorerClient({ locale }: { locale: string }) {
  const isZh = locale === "zh";

  const [query, setQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<SourceFile | null>(null);
  const [activeDir, setActiveDir] = useState<string | null>(null);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const allDirs = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of files) {
      map.set(f.directory, (map.get(f.directory) ?? 0) + f.loc);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, []);

  const totalDirs = useMemo(() => {
    return new Set(files.map((f) => f.directory)).size;
  }, []);

  // ── Top files by LOC ──────────────────────────────────────────────────────

  const topFiles = useMemo(
    () => [...files].sort((a, b) => b.loc - a.loc).slice(0, 10),
    []
  );

  const maxLoc = topFiles[0]?.loc ?? 1;

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      const matchesQuery = q === "" || f.path.toLowerCase().includes(q);
      const matchesDir = activeDir === null || f.directory === activeDir;
      return matchesQuery && matchesDir;
    });
  }, [query, activeDir]);

  const displayedFiles = useMemo(
    () => filteredFiles.slice(0, MAX_DISPLAY),
    [filteredFiles]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectFile = useCallback(
    (f: SourceFile) => {
      setSelectedFile((prev) => (prev?.path === f.path ? null : f));
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isZh ? "← 首页" : "← Home"}
          </Link>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {isZh ? "源码浏览器" : "Source Explorer"}
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          {isZh
            ? "512,000+ 行生产级 TypeScript 源码"
            : "512,000+ lines of production TypeScript"}
        </p>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            value: sourceIndex.totalFiles.toLocaleString(),
            label: isZh ? "源文件" : "Source Files",
          },
          {
            value: (sourceIndex.totalLoc / 1000).toFixed(0) + "K",
            label: isZh ? "代码行数" : "Lines of Code",
          },
          {
            value: totalDirs.toLocaleString(),
            label: isZh ? "目录数" : "Directories",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center"
          >
            <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* ── Sidebar: Directory Filter ─────────────────────────────────── */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {isZh ? "目录过滤" : "Directories"}
            </h2>

            <button
              onClick={() => setActiveDir(null)}
              className={cn(
                "mb-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                activeDir === null
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              )}
            >
              {isZh ? "全部" : "All"}
            </button>

            <div className="space-y-1">
              {allDirs.map(([dir, loc]) => {
                const color = getDirColor(dir);
                const isActive = activeDir === dir;
                return (
                  <button
                    key={dir}
                    onClick={() => setActiveDir(isActive ? null : dir)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left transition-colors",
                      isActive
                        ? cn(color.bg, color.text, "border", color.border)
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs">
                        {dir === "." ? "(root)" : dir}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-600">
                        {formatLoc(loc)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Largest Files Chart ─────────────────────────────────────── */}
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {isZh ? "最大文件" : "Largest Files"}
            </h2>
            <div className="space-y-2">
              {topFiles.map((f) => {
                const color = getDirColor(f.directory);
                const pct = (f.loc / maxLoc) * 100;
                const name = f.path.split("/").pop()!;
                return (
                  <button
                    key={f.path}
                    onClick={() => handleSelectFile(f)}
                    className="group w-full text-left"
                  >
                    <div className="mb-1 flex items-center justify-between gap-1">
                      <span className="truncate font-mono text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                        {name}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-600">
                        {formatLoc(f.loc)}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={cn("h-full rounded-full transition-all", color.bg.replace("/15", "/60"))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Main: Search + File List ─────────────────────────────────── */}
        <div className="lg:col-span-3">
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isZh ? "搜索文件路径…" : "Search file paths…"}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-10 font-mono text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-colors"
              />
              {query && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="mb-3 text-xs text-zinc-600">
            {filteredFiles.length > MAX_DISPLAY ? (
              isZh
                ? `显示前 ${MAX_DISPLAY} 条，共 ${filteredFiles.length.toLocaleString()} 个结果`
                : `Showing ${MAX_DISPLAY} of ${filteredFiles.length.toLocaleString()} results`
            ) : (
              isZh
                ? `${filteredFiles.length.toLocaleString()} 个文件`
                : `${filteredFiles.length.toLocaleString()} files`
            )}
          </div>

          {/* File List */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {displayedFiles.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-zinc-600">
                {isZh ? "没有匹配的文件" : "No matching files"}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {displayedFiles.map((f) => {
                  const isSelected = selectedFile?.path === f.path;
                  const color = getDirColor(f.directory);
                  const chapter = getChapterForFile(f.path);
                  return (
                    <div key={f.path}>
                      <button
                        onClick={() => handleSelectFile(f)}
                        className={cn(
                          "group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected
                            ? "bg-zinc-800"
                            : "hover:bg-zinc-800/60"
                        )}
                      >
                        {/* File icon */}
                        <svg
                          className="h-3.5 w-3.5 shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>

                        {/* Path — truncate from left */}
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate font-mono text-xs transition-colors",
                            isSelected
                              ? "text-zinc-100"
                              : "text-zinc-400 group-hover:text-zinc-200"
                          )}
                          style={{ direction: "rtl", textAlign: "left" }}
                          title={f.path}
                        >
                          {f.path}
                        </span>

                        {/* Chapter badge */}
                        {chapter && (
                          <span className="shrink-0 rounded bg-blue-900/50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-400 border border-blue-800/50">
                            {chapter}
                          </span>
                        )}

                        {/* Directory badge */}
                        <span
                          className={cn(
                            "hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline-block",
                            color.bg,
                            color.text,
                            color.border
                          )}
                        >
                          {f.directory === "." ? "root" : f.directory.split("/")[0]}
                        </span>

                        {/* LOC */}
                        <span className="shrink-0 font-mono text-xs text-zinc-600">
                          {formatLoc(f.loc)}
                        </span>

                        {/* Chevron */}
                        <svg
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-transform text-zinc-600",
                            isSelected && "rotate-90 text-zinc-400"
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* File Detail Panel */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <FileDetail
                              file={f}
                              locale={locale}
                              isZh={isZh}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {filteredFiles.length > MAX_DISPLAY && (
            <p className="mt-3 text-center text-xs text-zinc-600">
              {isZh
                ? `还有 ${(filteredFiles.length - MAX_DISPLAY).toLocaleString()} 个文件 — 请使用搜索或目录过滤缩小范围`
                : `${(filteredFiles.length - MAX_DISPLAY).toLocaleString()} more files — use search or directory filter to narrow down`}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── File Detail Sub-Component ────────────────────────────────────────────────

function FileDetail({
  file,
  locale,
  isZh,
}: {
  file: SourceFile;
  locale: string;
  isZh: boolean;
}) {
  const chapter = getChapterForFile(file.path);
  const color = getDirColor(file.directory);
  const githubUrl = `https://github.com/674019130/claude-code/blob/main/${file.path}`;

  return (
    <div className="border-t border-zinc-700/60 bg-zinc-950 px-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Left: metadata */}
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-600">
              {isZh ? "完整路径" : "Full Path"}
            </div>
            <p className="break-all font-mono text-xs text-zinc-300">{file.path}</p>
          </div>

          <div className="flex gap-6">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                {isZh ? "代码行数" : "Lines of Code"}
              </div>
              <p className="font-mono text-sm font-bold text-zinc-200">
                {formatLocFull(file.loc)}
              </p>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                {isZh ? "目录" : "Directory"}
              </div>
              <span
                className={cn(
                  "inline-block rounded border px-2 py-0.5 font-mono text-xs",
                  color.bg,
                  color.text,
                  color.border
                )}
              >
                {file.directory === "." ? "(root)" : file.directory}
              </span>
            </div>
          </div>

          {/* GitHub link */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-600">
              {isZh ? "源码" : "Source"}
            </div>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {isZh ? "在 GitHub 查看" : "View on GitHub"}
            </a>
          </div>
        </div>

        {/* Right: chapter link */}
        {chapter && (
          <div className="rounded-lg border border-blue-800/40 bg-blue-950/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <svg
                className="h-4 w-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                {isZh ? "关键文件" : "Key File"}
              </span>
            </div>
            <p className="mb-3 text-xs text-zinc-400">
              {isZh
                ? `此文件在章节 ${chapter.toUpperCase()} 中详细讲解`
                : `This file is covered in Chapter ${chapter.toUpperCase()}`}
            </p>
            <div className="text-sm font-medium text-zinc-200">
              {isZh
                ? CHAPTER_TITLES[chapter]?.zh
                : CHAPTER_TITLES[chapter]?.en}
            </div>
            <Link
              href={`/${locale}/${chapter}`}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              {isZh ? "阅读章节" : "Read Chapter"}
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
