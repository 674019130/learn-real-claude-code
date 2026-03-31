"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", solid: "bg-blue-500", solidText: "text-blue-50", bar: "bg-blue-500/60" },
  { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30", solid: "bg-violet-500", solidText: "text-violet-50", bar: "bg-violet-500/60" },
  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", solid: "bg-emerald-500", solidText: "text-emerald-50", bar: "bg-emerald-500/60" },
  { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", solid: "bg-amber-500", solidText: "text-amber-50", bar: "bg-amber-500/60" },
  { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30", solid: "bg-rose-500", solidText: "text-rose-50", bar: "bg-rose-500/60" },
  { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30", solid: "bg-cyan-500", solidText: "text-cyan-50", bar: "bg-cyan-500/60" },
  { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30", solid: "bg-fuchsia-500", solidText: "text-fuchsia-50", bar: "bg-fuchsia-500/60" },
  { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", solid: "bg-orange-500", solidText: "text-orange-50", bar: "bg-orange-500/60" },
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

// ─── File Icon ────────────────────────────────────────────────────────────────

function FileIcon({ ext, className }: { ext: string; className?: string }) {
  const color =
    ext === "tsx" || ext === "ts"
      ? "text-blue-400"
      : ext === "json"
      ? "text-amber-400"
      : ext === "md"
      ? "text-emerald-400"
      : "text-zinc-500";

  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0", color, className)}
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
  );
}

// ─── External Link Icon ───────────────────────────────────────────────────────

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5", className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

// ─── GitHub Icon ──────────────────────────────────────────────────────────────

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

// ─── Largest Files Bar Chart (shown in detail panel when no file selected) ────

function LargestFilesChart({
  files,
  onSelect,
  isZh,
}: {
  files: SourceFile[];
  onSelect: (f: SourceFile) => void;
  isZh: boolean;
}) {
  const maxLoc = files[0]?.loc ?? 1;
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {isZh ? "最大文件 Top 10" : "Largest Files Top 10"}
      </h3>
      <div className="space-y-2.5">
        {files.map((f, i) => {
          const color = getDirColor(f.directory);
          const pct = (f.loc / maxLoc) * 100;
          const name = f.path.split("/").pop()!;
          return (
            <button
              key={f.path}
              onClick={() => onSelect(f)}
              className="group w-full text-left"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] tabular-nums text-zinc-600 w-4 shrink-0">
                    {i + 1}
                  </span>
                  <span className="truncate font-mono text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    {name}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-xs text-zinc-500">
                  {formatLoc(f.loc)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className={cn("h-full rounded-full", color.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── File Detail Panel Content ────────────────────────────────────────────────

function FileDetailContent({
  file,
  locale,
  isZh,
  topFiles,
  onSelectFile,
}: {
  file: SourceFile | null;
  locale: string;
  isZh: boolean;
  topFiles: SourceFile[];
  onSelectFile: (f: SourceFile) => void;
}) {
  if (!file) {
    return (
      <div className="p-5">
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <div className="mb-1 text-2xl">📂</div>
          <p className="text-sm text-zinc-500">
            {isZh ? "点击左侧文件查看详情" : "Select a file to view details"}
          </p>
        </div>
        <LargestFilesChart files={topFiles} onSelect={onSelectFile} isZh={isZh} />
      </div>
    );
  }

  const chapter = getChapterForFile(file.path);
  const color = getDirColor(file.directory);
  const githubUrl = `https://github.com/674019130/claude-code/blob/main/${file.path}`;
  const filename = file.path.split("/").pop()!;
  const ext = filename.split(".").pop() ?? "";

  return (
    <div className="p-5 space-y-5">
      {/* Filename header */}
      <div className="border-b border-zinc-800 pb-4">
        <div className="flex items-start gap-2 mb-2">
          <FileIcon ext={ext} className="mt-0.5 h-4 w-4" />
          <span className="font-mono text-sm font-semibold text-zinc-100 break-all leading-snug">
            {filename}
          </span>
        </div>
        <p className="font-mono text-[11px] text-zinc-500 break-all leading-relaxed pl-6">
          {file.path}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
            {isZh ? "代码行数" : "Lines of Code"}
          </div>
          <div className="font-mono text-lg font-bold text-blue-400">
            {formatLocFull(file.loc)}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
            {isZh ? "目录" : "Directory"}
          </div>
          <span
            className={cn(
              "inline-block rounded border px-1.5 py-0.5 font-mono text-[11px] font-medium mt-0.5",
              color.bg,
              color.text,
              color.border
            )}
          >
            {file.directory === "." ? "(root)" : file.directory}
          </span>
        </div>
      </div>

      {/* Chapter card */}
      {chapter && (
        <div
          className={cn(
            "rounded-xl border p-4",
            "border-blue-700/40 bg-blue-950/25"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-4 w-4 text-blue-400 shrink-0"
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              {isZh ? "关键文件 · " : "Key File · "}
              <span className="font-mono">{chapter.toUpperCase()}</span>
            </span>
          </div>
          <p className="mb-1 text-xs text-zinc-500">
            {isZh
              ? `此文件在以下章节中详细讲解`
              : `Covered in chapter:`}
          </p>
          <p className="mb-3 text-sm font-semibold text-zinc-200 leading-snug">
            {isZh ? CHAPTER_TITLES[chapter]?.zh : CHAPTER_TITLES[chapter]?.en}
          </p>
          <Link
            href={`/${locale}/${chapter}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            {isZh ? "阅读章节" : "Read Chapter"}
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* GitHub link */}
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 transition-all"
      >
        <GitHubIcon />
        {isZh ? "在 GitHub 查看" : "View on GitHub"}
        <ExternalLinkIcon className="text-zinc-500" />
      </a>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const files = sourceIndex.files as SourceFile[];
const MAX_DISPLAY = 150;
const MAX_DIR_CHIPS = 8;

export function ExplorerClient({ locale }: { locale: string }) {
  const isZh = locale === "zh";

  const [query, setQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<SourceFile | null>(null);
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const chipScrollRef = useRef<HTMLDivElement>(null);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const allDirs = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of files) {
      map.set(f.directory, (map.get(f.directory) ?? 0) + f.loc);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1]);
  }, []);

  const topDirs = useMemo(() => allDirs.slice(0, MAX_DIR_CHIPS), [allDirs]);

  const totalDirs = useMemo(() => {
    return new Set(files.map((f) => f.directory)).size;
  }, []);

  // ── Top files by LOC ──────────────────────────────────────────────────────

  const topFiles = useMemo(
    () => [...files].sort((a, b) => b.loc - a.loc).slice(0, 10),
    []
  );

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      const matchesQuery = q === "" || f.path.toLowerCase().includes(q);
      const matchesDir = activeDir === null || f.directory === activeDir;
      return matchesQuery && matchesDir;
    });
  }, [query, activeDir]);

  const displayLimit = showAll ? filteredFiles.length : MAX_DISPLAY;
  const displayedFiles = useMemo(
    () => filteredFiles.slice(0, displayLimit),
    [filteredFiles, displayLimit]
  );

  const hiddenCount = filteredFiles.length - displayedFiles.length;

  // Reset showAll when query/dir changes
  useEffect(() => {
    setShowAll(false);
  }, [query, activeDir]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectFile = useCallback((f: SourceFile) => {
    setSelectedFile((prev) => {
      const next = prev?.path === f.path ? null : f;
      if (next) setMobileDetailOpen(true);
      return next;
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setQuery("");
  }, []);

  const handleCloseMobileDetail = useCallback(() => {
    setMobileDetailOpen(false);
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {/* ── Back + Title ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isZh ? "返回首页" : "Back to Home"}
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {isZh ? "源码浏览器" : "Source Explorer"}
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          {isZh
            ? "探索 512,000+ 行生产级 TypeScript 源码"
            : "Browse 512,000+ lines of production TypeScript"}
        </p>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            icon: "📁",
            value: sourceIndex.totalFiles.toLocaleString(),
            label: isZh ? "源文件" : "Source Files",
            color: "text-blue-400",
          },
          {
            icon: "📝",
            value: (sourceIndex.totalLoc / 1000).toFixed(0) + "K",
            label: isZh ? "代码行数" : "Lines of Code",
            color: "text-violet-400",
          },
          {
            icon: "🗂️",
            value: totalDirs.toLocaleString(),
            label: isZh ? "目录数" : "Directories",
            color: "text-emerald-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center shadow-sm"
          >
            <div className="mb-1 text-lg">{stat.icon}</div>
            <div className={cn("text-2xl font-bold tabular-nums", stat.color)}>
              {stat.value}
            </div>
            <div className="mt-1 text-xs text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter Bar (sticky) ──────────────────────────────────── */}
      <div className="sticky top-0 z-20 -mx-4 px-4 pb-3 pt-2 backdrop-blur-md bg-black/80 border-b border-zinc-800/60 mb-4">
        {/* Search input */}
        <div className="relative mb-3">
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
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 pl-10 pr-10 font-mono text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-colors"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Directory filter chips — horizontally scrollable */}
        <div
          ref={chipScrollRef}
          className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* "All" chip */}
          <button
            onClick={() => setActiveDir(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all",
              activeDir === null
                ? "bg-zinc-100 text-zinc-900 shadow-sm"
                : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            )}
          >
            {isZh ? "全部" : "All"}
          </button>

          {topDirs.map(([dir]) => {
            const color = getDirColor(dir);
            const isActive = activeDir === dir;
            const label = dir === "." ? "(root)" : dir.split("/")[0];
            return (
              <button
                key={dir}
                onClick={() => setActiveDir(isActive ? null : dir)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  isActive
                    ? cn(color.solid, color.solidText, "shadow-sm")
                    : cn(
                        "border",
                        color.border,
                        color.text,
                        color.bg,
                        "hover:opacity-90"
                      )
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Two-column layout: File List + Detail Panel ───────────────────── */}
      <div className="flex gap-4 lg:gap-6 min-h-[60vh]">
        {/* ── LEFT: File List ────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 lg:basis-3/5">
          {/* Results count */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-zinc-600">
              {filteredFiles.length > displayLimit
                ? isZh
                  ? `显示 ${displayLimit} / ${filteredFiles.length.toLocaleString()} 个文件`
                  : `Showing ${displayLimit} of ${filteredFiles.length.toLocaleString()} files`
                : isZh
                ? `${filteredFiles.length.toLocaleString()} 个文件`
                : `${filteredFiles.length.toLocaleString()} files`}
            </span>
            {activeDir && (
              <button
                onClick={() => setActiveDir(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {isZh ? "清除过滤" : "Clear filter"}
              </button>
            )}
          </div>

          {/* File rows */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {displayedFiles.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <div className="mb-2 text-2xl">🔍</div>
                <p className="text-sm text-zinc-500">
                  {isZh ? "没有匹配的文件" : "No matching files"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {displayedFiles.map((f) => {
                  const isSelected = selectedFile?.path === f.path;
                  const color = getDirColor(f.directory);
                  const chapter = getChapterForFile(f.path);
                  const ext = f.path.split(".").pop() ?? "";

                  return (
                    <button
                      key={f.path}
                      onClick={() => handleSelectFile(f)}
                      className={cn(
                        "group relative flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-blue-950/20 dark:bg-blue-950/25"
                          : "hover:bg-zinc-800/50"
                      )}
                    >
                      {/* Blue left border for selected */}
                      {isSelected && (
                        <span className="absolute left-0 top-0 h-full w-0.5 rounded-r-full bg-blue-500" />
                      )}

                      {/* File type icon */}
                      <FileIcon ext={ext} />

                      {/* Path — truncate from left with rtl trick */}
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate font-mono text-xs transition-colors",
                          isSelected
                            ? "text-zinc-100"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        )}
                        style={{ direction: "rtl", textAlign: "left", unicodeBidi: "bidi-override" }}
                        title={f.path}
                      >
                        {f.path}
                      </span>

                      {/* Chapter badge */}
                      {chapter && (
                        <span className="shrink-0 rounded-md border border-blue-700/50 bg-blue-900/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                          {chapter}
                        </span>
                      )}

                      {/* Directory chip (hidden on mobile) */}
                      <span
                        className={cn(
                          "hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-block",
                          color.bg,
                          color.text,
                          color.border
                        )}
                      >
                        {f.directory === "." ? "root" : f.directory.split("/")[0]}
                      </span>

                      {/* LOC badge */}
                      <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                        {formatLoc(f.loc)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Show more button */}
          {hiddenCount > 0 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
              >
                {isZh
                  ? `显示剩余 ${hiddenCount.toLocaleString()} 个文件`
                  : `Show ${hiddenCount.toLocaleString()} more files`}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Detail Panel (desktop only) ────────────────────────── */}
        <div className="hidden lg:block lg:basis-2/5 shrink-0">
          <div className="sticky top-[130px] rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-800 px-5 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {isZh ? "文件详情" : "File Detail"}
              </h2>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedFile?.path ?? "__empty__"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <FileDetailContent
                  file={selectedFile}
                  locale={locale}
                  isZh={isZh}
                  topFiles={topFiles}
                  onSelectFile={handleSelectFile}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Sheet ───────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileDetailOpen && selectedFile && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={handleCloseMobileDetail}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-zinc-700 bg-zinc-900 shadow-2xl lg:hidden"
            >
              {/* Drag handle + close */}
              <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 rounded-full bg-zinc-700" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    {isZh ? "文件详情" : "File Detail"}
                  </span>
                </div>
                <button
                  onClick={handleCloseMobileDetail}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <FileDetailContent
                file={selectedFile}
                locale={locale}
                isZh={isZh}
                topFiles={topFiles}
                onSelectFile={(f) => {
                  handleSelectFile(f);
                  setMobileDetailOpen(true);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
