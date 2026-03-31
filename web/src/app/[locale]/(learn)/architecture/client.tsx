"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CHAPTER_META, LAYERS, type LayerId } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDarkMode } from "@/hooks/useDarkMode";
import directorySummary from "@/data/generated/architecture/directory-summary.json";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface DirEntry {
  directory: string;
  files: number;
  loc: number;
}

const DIR_DATA = directorySummary as DirEntry[];

/* ─────────────────────────────────────────────────────────────
   Directory → Layer inference
───────────────────────────────────────────────────────────── */
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
  if (DIR_LAYER_MAP[dir]) return DIR_LAYER_MAP[dir];
  for (const [key, layer] of Object.entries(DIR_LAYER_MAP)) {
    if (dir.startsWith(key)) return layer;
  }
  return "internals";
}

function getLayerColor(layerId: LayerId): string {
  return LAYERS.find((l) => l.id === layerId)?.color ?? "#71717a";
}

/* ─────────────────────────────────────────────────────────────
   Stats
───────────────────────────────────────────────────────────── */
const TOTAL_FILES = DIR_DATA.reduce((s, d) => s + d.files, 0);
const TOTAL_LOC = DIR_DATA.reduce((s, d) => s + d.loc, 0);
const TOTAL_CHAPTERS = Object.keys(CHAPTER_META).length;
const TOP_DIRS = [...DIR_DATA].sort((a, b) => b.loc - a.loc).slice(0, 20);
const MAX_LOC = TOP_DIRS[0]?.loc ?? 1;

/* ─────────────────────────────────────────────────────────────
   SVG Architecture Diagram — Subsystems & Edges
───────────────────────────────────────────────────────────── */
interface Subsystem {
  id: LayerId;
  x: number;
  y: number;
  w: number;
  h: number;
  abbrev: string;
}

// ViewBox: 900 × 560
const SUBSYSTEMS: Subsystem[] = [
  { id: "boot",         x:  40,  y:  30,  w: 140, h: 52, abbrev: "BOOT" },
  { id: "core",         x: 220,  y:  30,  w: 140, h: 52, abbrev: "CORE" },
  { id: "capabilities", x: 400,  y:  30,  w: 155, h: 52, abbrev: "CMDS" },
  { id: "intelligence", x: 595,  y:  30,  w: 155, h: 52, abbrev: "INTL" },
  { id: "safety",       x: 220,  y: 155,  w: 140, h: 52, abbrev: "SAFE" },
  { id: "scale",        x: 400,  y: 155,  w: 155, h: 52, abbrev: "SCAL" },
  { id: "rendering",    x: 595,  y: 155,  w: 155, h: 52, abbrev: "RENDR" },
  { id: "internals",    x:  40,  y: 285,  w: 140, h: 52, abbrev: "INTRNL" },
  { id: "secrets",      x: 220,  y: 285,  w: 140, h: 52, abbrev: "SECR" },
  { id: "plus",         x: 400,  y: 285,  w: 350, h: 52, abbrev: "PLUS+" },
];

interface Edge {
  from: LayerId;
  to: LayerId;
  label: string;
  labelZh: string;
}

const EDGES: Edge[] = [
  { from: "boot",         to: "core",         label: "starts",      labelZh: "启动" },
  { from: "core",         to: "capabilities", label: "dispatches",  labelZh: "调度" },
  { from: "core",         to: "intelligence", label: "assembles",   labelZh: "组装" },
  { from: "capabilities", to: "intelligence", label: "context",     labelZh: "上下文" },
  { from: "core",         to: "safety",       label: "guards",      labelZh: "守护" },
  { from: "safety",       to: "scale",        label: "allows",      labelZh: "许可" },
  { from: "scale",        to: "rendering",    label: "outputs",     labelZh: "输出" },
  { from: "internals",    to: "core",         label: "observes",    labelZh: "监控" },
  { from: "intelligence", to: "secrets",      label: "hides",       labelZh: "隐藏" },
  { from: "core",         to: "plus",         label: "inspires",    labelZh: "启发" },
];

function getNodeCenter(s: Subsystem) {
  return { cx: s.x + s.w / 2, cy: s.y + s.h / 2 };
}

function getEdgePoints(from: Subsystem, to: Subsystem) {
  const fc = getNodeCenter(from);
  const tc = getNodeCenter(to);
  return { x1: fc.cx, y1: fc.cy, x2: tc.cx, y2: tc.cy };
}

/* ─────────────────────────────────────────────────────────────
   Tooltip positioning helper
───────────────────────────────────────────────────────────── */
interface TooltipPos {
  x: number;
  y: number;
  anchorRight: boolean;
  anchorBottom: boolean;
}

function getTooltipPos(node: Subsystem, svgWidth: number, svgHeight: number): TooltipPos {
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const anchorRight = cx < svgWidth / 2;
  const anchorBottom = cy < svgHeight / 2;
  return {
    x: anchorRight ? node.x + node.w + 10 : node.x - 10,
    y: anchorBottom ? node.y : node.y + node.h - 120,
    anchorRight,
    anchorBottom,
  };
}

/* ─────────────────────────────────────────────────────────────
   SVG Diagram Component
───────────────────────────────────────────────────────────── */
function ArchDiagram({
  isZh,
  locale,
}: {
  isZh: boolean;
  locale: string;
}) {
  const isDark = useDarkMode();
  const [hoveredId, setHoveredId] = useState<LayerId | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const VW = 800;
  const VH = 400;

  const bgColor = isDark ? "#09090b" : "#f8fafc";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const edgeBase = isDark ? "#3f3f46" : "#cbd5e1";
  const edgeActive = "#3b82f6";
  const textBase = isDark ? "#d4d4d8" : "#334155";
  const subtextBase = isDark ? "#71717a" : "#94a3b8";
  const cardBg = isDark ? "#1c1c1e" : "#ffffff";
  const cardBorder = isDark ? "#3f3f46" : "#e2e8f0";

  const hoveredNode = SUBSYSTEMS.find((s) => s.id === hoveredId) ?? null;

  const handleMouseEnter = useCallback((id: LayerId) => setHoveredId(id), []);
  const handleMouseLeave = useCallback(() => setHoveredId(null), []);

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full rounded-xl"
        style={{ background: bgColor, maxHeight: 480 }}
        role="img"
        aria-label={isZh ? "Claude Code 架构图" : "Claude Code Architecture Diagram"}
      >
        {/* Defs */}
        <defs>
          {/* Grid pattern */}
          <pattern id="arch-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={gridColor} strokeWidth="0.5" />
          </pattern>

          {/* Arrowhead marker */}
          <marker
            id="arrow-base"
            markerWidth="6" markerHeight="6"
            refX="5" refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill={edgeBase} />
          </marker>
          <marker
            id="arrow-active"
            markerWidth="6" markerHeight="6"
            refX="5" refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill={edgeActive} />
          </marker>

          {/* Glow filter for hovered node */}
          <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid background */}
        <rect width={VW} height={VH} fill="url(#arch-grid)" />

        {/* Subtle section dividers */}
        <line x1={0} y1={110} x2={VW} y2={110} stroke={gridColor} strokeWidth="1" strokeDasharray="4,4" />
        <line x1={0} y1={235} x2={VW} y2={235} stroke={gridColor} strokeWidth="1" strokeDasharray="4,4" />
        <text x={8} y={102} fontSize="9" fill={subtextBase} fontFamily="monospace">LAYER 1</text>
        <text x={8} y={227} fontSize="9" fill={subtextBase} fontFamily="monospace">LAYER 2</text>
        <text x={8} y={350} fontSize="9" fill={subtextBase} fontFamily="monospace">LAYER 3</text>

        {/* Edges */}
        {EDGES.map((edge) => {
          const fromNode = SUBSYSTEMS.find((s) => s.id === edge.from);
          const toNode = SUBSYSTEMS.find((s) => s.id === edge.to);
          if (!fromNode || !toNode) return null;

          const { x1, y1, x2, y2 } = getEdgePoints(fromNode, toNode);
          const isActive = hoveredId === edge.from || hoveredId === edge.to;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const color = isActive ? edgeActive : edgeBase;
          const edgeLabel = isZh ? edge.labelZh : edge.label;

          return (
            <g key={`${edge.from}-${edge.to}`}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth={isActive ? 1.5 : 0.8}
                strokeDasharray={isActive ? "none" : "3,3"}
                markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow-base)"}
                style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
              />
              {isActive && (
                <text
                  x={midX}
                  y={midY - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill={edgeActive}
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {edgeLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {SUBSYSTEMS.map((node) => {
          const layer = LAYERS.find((l) => l.id === node.id);
          if (!layer) return null;
          const isHovered = hoveredId === node.id;
          const color = layer.color;
          const label = isZh ? layer.labelZh : layer.label;
          const chapters = layer.chapters;

          return (
            <g
              key={node.id}
              onMouseEnter={() => handleMouseEnter(node.id)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              aria-label={label}
              onFocus={() => handleMouseEnter(node.id)}
              onBlur={handleMouseLeave}
            >
              {/* Hover glow halo */}
              {isHovered && (
                <rect
                  x={node.x - 4}
                  y={node.y - 4}
                  width={node.w + 8}
                  height={node.h + 8}
                  rx={14}
                  ry={14}
                  fill={color}
                  opacity={0.15}
                  filter="url(#node-glow)"
                />
              )}

              {/* Node body */}
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx={10}
                ry={10}
                fill={isHovered ? color : (isDark ? "#27272a" : "#f1f5f9")}
                stroke={color}
                strokeWidth={isHovered ? 2 : 1}
                style={{ transition: "fill 0.18s, stroke-width 0.18s" }}
              />

              {/* Abbrev chip */}
              <text
                x={node.x + 10}
                y={node.y + 17}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="700"
                fill={isHovered ? "rgba(255,255,255,0.7)" : color}
                style={{ transition: "fill 0.18s" }}
              >
                {node.abbrev}
              </text>

              {/* Main label */}
              <text
                x={node.x + node.w / 2}
                y={node.y + node.h / 2 + 5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
                fill={isHovered ? "#ffffff" : textBase}
                style={{ transition: "fill 0.18s" }}
              >
                {label}
              </text>

              {/* Chapter count badge */}
              <text
                x={node.x + node.w - 8}
                y={node.y + 16}
                textAnchor="end"
                fontSize="9"
                fontFamily="monospace"
                fill={isHovered ? "rgba(255,255,255,0.75)" : subtextBase}
                style={{ transition: "fill 0.18s" }}
              >
                {chapters.length}ch
              </text>

              {/* Pulse ring animation on hovered node */}
              {isHovered && (
                <>
                  <rect
                    x={node.x - 8}
                    y={node.y - 8}
                    width={node.w + 16}
                    height={node.h + 16}
                    rx={16}
                    ry={16}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0"
                    style={{
                      animation: "arch-pulse 1.4s ease-out infinite",
                    }}
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Diagram title */}
        <text
          x={VW - 12}
          y={VH - 10}
          textAnchor="end"
          fontSize="9"
          fill={subtextBase}
          fontFamily="monospace"
        >
          {isZh ? "Claude Code 架构层次图" : "Claude Code Architecture Layers"}
        </text>
      </svg>

      {/* CSS for pulse animation — injected inline */}
      <style>{`
        @keyframes arch-pulse {
          0%   { opacity: 0.6; transform: scale(1);   transform-box: fill-box; transform-origin: center; }
          80%  { opacity: 0;   transform: scale(1.12); transform-box: fill-box; transform-origin: center; }
          100% { opacity: 0;   transform: scale(1.12); transform-box: fill-box; transform-origin: center; }
        }
      `}</style>

      {/* Tooltip Card — AnimatePresence for smooth enter/exit */}
      <AnimatePresence>
        {hoveredNode && (() => {
          const layer = LAYERS.find((l) => l.id === hoveredNode.id)!;
          const chapters = layer.chapters;
          const firstMeta = chapters[0] ? CHAPTER_META[chapters[0]] : null;

          return (
            <motion.div
              key={hoveredNode.id}
              initial={{ opacity: 0, scale: 0.94, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 4 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute z-20 w-64 rounded-xl border p-3 shadow-xl"
              style={{
                background: cardBg,
                borderColor: cardBorder,
                borderLeftColor: layer.color,
                borderLeftWidth: 3,
                top: `${((hoveredNode.y + hoveredNode.h + 8) / VH) * 100}%`,
                left: `${((hoveredNode.x + hoveredNode.w / 2) / VW) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="font-bold text-sm" style={{ color: layer.color }}>
                  {isZh ? layer.labelZh : layer.label}
                </span>
                <span className="ml-auto font-mono text-[10px] text-zinc-400">
                  {chapters.length} {isZh ? "章节" : "chapters"}
                </span>
              </div>

              {firstMeta && (
                <>
                  <p className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
                    {isZh ? firstMeta.titleZh : firstMeta.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                    {isZh ? firstMeta.keyInsight : firstMeta.keyInsight}
                  </p>
                </>
              )}

              <div className="mt-2 flex flex-wrap gap-1">
                {chapters.slice(0, 6).map((chId) => (
                  <span
                    key={chId}
                    className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                    style={{ color: layer.color, backgroundColor: layer.color + "18" }}
                  >
                    {chId}
                  </span>
                ))}
                {chapters.length > 6 && (
                  <span className="text-[9px] text-zinc-400">+{chapters.length - 6}</span>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Directory Stats Bar Chart
───────────────────────────────────────────────────────────── */
function DirStatsChart({
  isZh,
  activeLayer,
}: {
  isZh: boolean;
  activeLayer: LayerId | null;
}) {
  const filteredDirs = useMemo(() => {
    if (!activeLayer) return TOP_DIRS;
    return TOP_DIRS.filter((d) => inferLayer(d.directory) === activeLayer);
  }, [activeLayer]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {isZh ? "目录代码量（前 20）" : "Directory LOC — Top 20"}
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
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.018, duration: 0.22 }}
              className="group relative px-4 py-2"
            >
              {/* Background bar */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-r-sm"
                style={{ backgroundColor: color + "16" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.55, delay: i * 0.025, ease: "easeOut" }}
              />
              <div className="relative flex items-center gap-3">
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {entry.directory === "." ? "(root)" : entry.directory}
                </span>
                <span
                  className="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold sm:block"
                  style={{ color, backgroundColor: color + "18" }}
                >
                  {isZh ? layerMeta?.labelZh : layerMeta?.label}
                </span>
                <span className="shrink-0 font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {entry.loc >= 1000 ? `${(entry.loc / 1000).toFixed(1)}K` : entry.loc}
                </span>
                <span className="shrink-0 text-[10px] text-zinc-400">
                  {entry.files}f
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Export
───────────────────────────────────────────────────────────── */
export default function ArchitectureClient() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const isZh = locale === "zh";

  const [activeLayer, setActiveLayer] = useState<LayerId | null>(null);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {isZh ? "架构全图" : "Architecture Map"}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          {isZh
            ? "Claude Code 各架构层次的系统关系图、代码规模分布与章节对照"
            : "System relationships, code scale distribution, and chapter mapping across all architectural layers"}
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { value: TOTAL_LOC.toLocaleString(), label: isZh ? "总行数" : "Total LOC", note: "~512K" },
          { value: TOTAL_FILES.toLocaleString(), label: isZh ? "源文件数" : "Source Files" },
          { value: TOTAL_CHAPTERS.toString(), label: isZh ? "学习章节" : "Chapters" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800"
          >
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {stat.value}
            </div>
            {stat.note && (
              <div className="text-[10px] font-mono text-zinc-400">{stat.note}</div>
            )}
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all",
              activeLayer === layer.id
                ? "text-white shadow-sm"
                : "border text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
            )}
            style={
              activeLayer === layer.id
                ? { backgroundColor: layer.color, borderColor: layer.color }
                : { borderColor: layer.color + "50" }
            }
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                activeLayer === layer.id ? "bg-white/80" : ""
              )}
              style={activeLayer === layer.id ? {} : { backgroundColor: layer.color }}
            />
            {isZh ? layer.labelZh : layer.label}
          </button>
        ))}
      </div>

      {/* ── SVG Architecture Diagram ── */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {isZh ? "架构层次关系图（悬停查看详情）" : "Architecture Layer Map — hover nodes for details"}
          </span>
        </div>
        <div className="relative p-2">
          <ArchDiagram isZh={isZh} locale={locale} />
        </div>
      </div>

      {/* ── Directory Stats Bar Chart ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {isZh ? "源码目录规模" : "Source Directory Scale"}
          </h2>
          {activeLayer && (
            <button
              onClick={() => setActiveLayer(null)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              {isZh ? "清除筛选" : "Clear filter"} ×
            </button>
          )}
        </div>
        <DirStatsChart isZh={isZh} activeLayer={activeLayer} />
      </div>

      {/* ── Chapter Grid ── */}
      <div>
        <h2 className="mb-4 text-base font-bold text-zinc-900 dark:text-zinc-100">
          {isZh ? "章节与架构层对照" : "Chapters by Architectural Layer"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LAYERS.map((layer) => (
            <motion.div
              key={layer.id}
              whileHover={{ scale: 1.005 }}
              transition={{ duration: 0.12 }}
              className={cn(
                "rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 transition-shadow",
                activeLayer === layer.id ? "ring-2" : ""
              )}
              style={{
                borderLeftColor: layer.color,
                borderLeftWidth: 3,
                ...(activeLayer === layer.id ? { ringColor: layer.color } : {}),
              }}
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-semibold text-sm" style={{ color: layer.color }}>
                  {isZh ? layer.labelZh : layer.label}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: layer.color }}
                >
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
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
