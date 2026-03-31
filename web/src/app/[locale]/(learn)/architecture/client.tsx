"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CHAPTER_META, LAYERS, type LayerId } from "@/lib/constants";
import { cn } from "@/lib/utils";
import directorySummary from "@/data/generated/architecture/directory-summary.json";

/* ── Types ── */
interface DirEntry {
  directory: string;
  files: number;
  loc: number;
}

const DIR_DATA = directorySummary as DirEntry[];

/* ── Layer color inference from directory name ── */
const DIR_LAYER_MAP: Record<string, LayerId> = {
  cli: "boot",
  entrypoints: "boot",
  screens: "boot",
  hooks: "core",
  tools: "core",
  services: "core",
  commands: "capabilities",
  utils: "intelligence",
  constants: "intelligence",
  "utils/settings": "intelligence",
  "utils/bash": "core",
  "utils/plugins": "capabilities",
  "utils/permissions": "safety",
  "utils/hooks": "safety",
  "services/compact": "intelligence",
  "services/mcp": "scale",
  "services/analytics": "internals",
  "services/lsp": "scale",
  bridge: "scale",
  "utils/swarm": "scale",
  "utils/telemetry": "internals",
  ink: "rendering",
  components: "rendering",
  "components/messages": "rendering",
  "components/PromptInput": "rendering",
  "components/mcp": "scale",
  "components/agents": "scale",
  "components/permissions": "safety",
  "native-ts": "rendering",
  keybindings: "capabilities",
  skills: "capabilities",
  "commands/plugin": "capabilities",
};

function inferLayer(dir: string): LayerId {
  // Exact match first
  if (DIR_LAYER_MAP[dir]) return DIR_LAYER_MAP[dir];
  // Prefix match
  for (const [key, layer] of Object.entries(DIR_LAYER_MAP)) {
    if (dir.startsWith(key)) return layer;
  }
  return "internals";
}

function getLayerColor(layerId: LayerId): string {
  return LAYERS.find((l) => l.id === layerId)?.color ?? "#71717a";
}

/* ── Stats ── */
const TOTAL_FILES = DIR_DATA.reduce((s, d) => s + d.files, 0);
const TOTAL_LOC = DIR_DATA.reduce((s, d) => s + d.loc, 0);
const TOTAL_CHAPTERS = Object.keys(CHAPTER_META).length;
const TOP_DIRS = [...DIR_DATA].sort((a, b) => b.loc - a.loc).slice(0, 20);
const MAX_LOC = TOP_DIRS[0]?.loc ?? 1;

export default function ArchitectureClient() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const isZh = locale === "zh";

  const [activeLayer, setActiveLayer] = useState<LayerId | null>(null);

  const filteredDirs = useMemo(() => {
    if (!activeLayer) return TOP_DIRS;
    return TOP_DIRS.filter((d) => inferLayer(d.directory) === activeLayer);
  }, [activeLayer]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {isZh ? "架构全图" : "Architecture Map"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isZh
            ? "按代码量可视化 Claude Code 各目录规模，颜色代表所属架构层次"
            : "Visualize Claude Code directory scale by lines of code, colored by architectural layer"}
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { value: TOTAL_LOC.toLocaleString(), label: isZh ? "总行数" : "Total LOC" },
          { value: TOTAL_FILES.toLocaleString(), label: isZh ? "源文件数" : "Source Files" },
          { value: TOTAL_CHAPTERS.toString(), label: isZh ? "学习章节" : "Chapters" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800"
          >
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Layer Filter Pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveLayer(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
            activeLayer === null
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          )}
        >
          {isZh ? "全部" : "All"}
        </button>
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              activeLayer === layer.id
                ? "text-white"
                : "border text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
            )}
            style={
              activeLayer === layer.id
                ? { backgroundColor: layer.color, borderColor: layer.color }
                : { borderColor: layer.color + "60" }
            }
          >
            {isZh ? layer.labelZh : layer.label}
          </button>
        ))}
      </div>

      {/* Flamegraph Bars */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {isZh ? "目录代码量 (前 20)" : "Directory LOC (Top 20)"}
          </span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {filteredDirs.map((entry, i) => {
            const layer = inferLayer(entry.directory);
            const color = getLayerColor(layer);
            const pct = (entry.loc / MAX_LOC) * 100;
            const layerMeta = LAYERS.find((l) => l.id === layer);

            return (
              <motion.div
                key={entry.directory}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02, duration: 0.25 }}
                className="group relative px-4 py-2.5"
              >
                {/* Background bar */}
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-r-sm"
                  style={{ backgroundColor: color + "18" }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, delay: i * 0.03 }}
                />
                <div className="relative flex items-center gap-3">
                  {/* Layer dot */}
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {/* Directory name */}
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {entry.directory === "." ? "(root)" : entry.directory}
                  </span>
                  {/* Layer badge */}
                  <span
                    className="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold sm:block"
                    style={{ color, backgroundColor: color + "18" }}
                  >
                    {isZh ? layerMeta?.labelZh : layerMeta?.label}
                  </span>
                  {/* LOC count */}
                  <span className="shrink-0 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {entry.loc >= 1000
                      ? `${(entry.loc / 1000).toFixed(1)}K`
                      : entry.loc.toString()}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Layer Cards Grid */}
      <h2 className="mb-4 text-base font-bold text-zinc-900 dark:text-zinc-100">
        {isZh ? "章节与架构层对照" : "Chapters by Architectural Layer"}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LAYERS.map((layer) => (
          <div
            key={layer.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            style={{ borderLeftColor: layer.color, borderLeftWidth: 3 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-sm" style={{ color: layer.color }}>
                {isZh ? layer.labelZh : layer.label}
              </span>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: layer.color }}>
                {layer.chapters.length} {isZh ? "章" : "ch"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {layer.chapters.map((chId) => {
                const meta = CHAPTER_META[chId];
                return (
                  <Link
                    key={chId}
                    href={`/${locale}/${chId}`}
                    className="group flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600"
                  >
                    <span className="font-mono text-[10px] font-bold" style={{ color: layer.color }}>
                      {chId}
                    </span>
                    {meta?.isPlus && (
                      <span className="rounded bg-cyan-100 px-1 text-[8px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                        +
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                      {meta ? (isZh ? meta.titleZh : meta.title) : chId}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
