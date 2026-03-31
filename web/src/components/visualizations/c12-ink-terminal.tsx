"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface PipelineStage {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  color: string;
}

const STAGES: PipelineStage[] = [
  { id: "jsx", label: "JSX", sublabel: "React Components", x: 30, color: "#3b82f6" },
  { id: "reconciler", label: "Reconciler", sublabel: "Virtual DOM", x: 160, color: "#8b5cf6" },
  { id: "yoga", label: "Yoga", sublabel: "Flexbox Layout", x: 310, color: "#f59e0b" },
  { id: "grid", label: "Output Grid", sublabel: "2D Cell Array", x: 450, color: "#10b981" },
  { id: "ansi", label: "ANSI", sublabel: "Terminal Output", x: 580, color: "#ef4444" },
];

const REACT_TREE = [
  { depth: 0, tag: "<InkRoot>", type: "element" },
  { depth: 1, tag: "<Box flexDir='column'>", type: "element" },
  { depth: 2, tag: "<Text bold>", type: "element" },
  { depth: 3, tag: '"Claude Code"', type: "text" },
  { depth: 2, tag: "<Box gap={1}>", type: "element" },
  { depth: 3, tag: "<Spinner />", type: "component" },
  { depth: 3, tag: "<Text>", type: "element" },
  { depth: 4, tag: '"Thinking..."', type: "text" },
];

const VDOM_NODES = [
  { depth: 0, tag: "ink-root", type: "host" },
  { depth: 1, tag: "ink-box", type: "host" },
  { depth: 2, tag: "ink-text", type: "host" },
  { depth: 2, tag: "ink-box", type: "host" },
  { depth: 3, tag: "ink-text", type: "host" },
  { depth: 3, tag: "ink-text", type: "host" },
];

const INTERNING_POOLS = [
  { name: "Char Pool", desc: "Dedup character values", count: "~128", savings: "95% less allocs" },
  { name: "Style Pool", desc: "Dedup ANSI style combos", count: "~64", savings: "O(1) compare" },
  { name: "Hyperlink Pool", desc: "Dedup OSC 8 links", count: "~16", savings: "Ref equality" },
];

const TERMINAL_LINES = [
  { text: "╭─ Claude Code ─────────────╮", style: "dim" },
  { text: "│ \x1b[1mClaude Code\x1b[0m              │", style: "bold" },
  { text: "│ ⠋ Thinking...             │", style: "normal" },
  { text: "╰───────────────────────────╯", style: "dim" },
];

const STEPS = [
  {
    title: "React Component Tree",
    description: "Ink uses React to build terminal UIs. You write JSX with <Box> and <Text> components, just like React DOM uses <div> and <span>.",
  },
  {
    title: "Custom Reconciler → Virtual DOM",
    description: "Ink's custom React reconciler creates a virtual DOM of host elements (ink-box, ink-text, ink-root) — not real DOM nodes, but internal representations.",
  },
  {
    title: "Yoga Calculates Flexbox Layout",
    description: "Each ink-box maps to a Yoga node. Yoga (Facebook's layout engine) calculates flexbox positions — the same engine React Native uses.",
  },
  {
    title: "Render to Output Grid",
    description: "The layout tree is rendered to a 2D cell array. Each cell holds a character + style. This grid represents the entire terminal screen.",
  },
  {
    title: "Three Interning Pools — O(1)",
    description: "Characters, styles, and hyperlinks are interned into pools. Instead of comparing strings, the renderer compares integer IDs. O(n) → O(1) per cell.",
  },
  {
    title: "ANSI Optimization + Scroll",
    description: "Only changed cells are re-rendered. DECSTBM (Set Top/Bottom Margins) enables hardware scroll regions — the terminal scrolls content without redrawing.",
  },
  {
    title: "Final Terminal Output",
    description: "The optimized ANSI escape sequences are written to stdout. The user sees a clean, flicker-free terminal UI rendered at high performance.",
  },
];

export default function InkTerminalVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 3000 });
  const palette = useSvgPalette();

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {title}
          </div>
        )}

        {/* Pipeline stages header */}
        <svg viewBox="0 0 700 60" className="w-full mb-2" style={{ maxHeight: 60 }}>
          {STAGES.map((stage, i) => {
            const isActive = viz.currentStep === i || (viz.currentStep === 4 && i === 3) || (viz.currentStep === 5 && i === 4) || (viz.currentStep === 6 && i === 4);
            const isPast = viz.currentStep > i || (viz.currentStep >= 5 && i <= 3);
            return (
              <g key={stage.id}>
                <motion.rect
                  x={stage.x}
                  y={8}
                  width={110}
                  height={40}
                  rx={8}
                  fill={isActive ? stage.color : isPast ? stage.color : palette.nodeFill}
                  stroke={isActive ? stage.color : palette.nodeStroke}
                  strokeWidth={1.5}
                  animate={{ opacity: isActive ? 1 : isPast ? 0.6 : 0.3 }}
                  transition={{ duration: 0.3 }}
                />
                <text
                  x={stage.x + 55}
                  y={24}
                  textAnchor="middle"
                  fontSize={11}
                  fill={isActive || isPast ? "#fff" : palette.nodeText}
                  fontWeight={700}
                  fontFamily="monospace"
                >
                  {stage.label}
                </text>
                <text
                  x={stage.x + 55}
                  y={38}
                  textAnchor="middle"
                  fontSize={8}
                  fill={isActive || isPast ? "rgba(255,255,255,0.7)" : palette.labelFill}
                  fontFamily="monospace"
                >
                  {stage.sublabel}
                </text>
                {i < STAGES.length - 1 && (
                  <motion.text
                    x={stage.x + 125}
                    y={32}
                    fontSize={16}
                    fill={isPast || isActive ? stage.color : palette.edgeStroke}
                    fontFamily="monospace"
                    animate={{ opacity: isPast || isActive ? 1 : 0.3 }}
                  >
                    →
                  </motion.text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Main content area — split view */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Left: React/VDOM tree */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {viz.currentStep <= 0 ? "React Tree" : viz.currentStep === 1 ? "Virtual DOM" : "Internal Representation"}
            </div>
            <div className="space-y-0.5 font-mono text-xs">
              <AnimatePresence mode="wait">
                {viz.currentStep <= 0 && (
                  <motion.div key="react" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {REACT_TREE.map((node, i) => (
                      <motion.div
                        key={i}
                        className={`${node.type === "text" ? "text-amber-600 dark:text-amber-400" : node.type === "component" ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"}`}
                        style={{ paddingLeft: node.depth * 16 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        {node.tag}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                {viz.currentStep === 1 && (
                  <motion.div key="vdom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {VDOM_NODES.map((node, i) => (
                      <motion.div
                        key={i}
                        className="text-purple-600 dark:text-purple-400"
                        style={{ paddingLeft: node.depth * 16 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        {node.tag}
                      </motion.div>
                    ))}
                    <div className="mt-2 text-[10px] text-zinc-400">
                      Not real DOM — Ink&apos;s internal host elements
                    </div>
                  </motion.div>
                )}
                {viz.currentStep === 2 && (
                  <motion.div key="yoga" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-1">
                      <div className="text-amber-600 dark:text-amber-400">YogaNode (root)</div>
                      <div className="pl-4 text-amber-600 dark:text-amber-400">├ YogaNode flexDir=column</div>
                      <div className="pl-8 text-amber-600 dark:text-amber-400">├ YogaNode (text) w=auto</div>
                      <div className="pl-8 text-amber-600 dark:text-amber-400">└ YogaNode gap=1 flexDir=row</div>
                      <div className="pl-12 text-amber-600 dark:text-amber-400">├ YogaNode w=1 (spinner)</div>
                      <div className="pl-12 text-amber-600 dark:text-amber-400">└ YogaNode (text) w=auto</div>
                    </div>
                    <div className="mt-2 text-[10px] text-zinc-400">
                      Same engine as React Native — flexbox in the terminal
                    </div>
                  </motion.div>
                )}
                {viz.currentStep === 3 && (
                  <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-0.5">
                      {["[C][l][a][u][d][e][ ][C][o][d][e]", "[⠋][ ][T][h][i][n][k][i][n][g][.]"].map((row, i) => (
                        <motion.div
                          key={i}
                          className="text-emerald-600 dark:text-emerald-400"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          {row}
                        </motion.div>
                      ))}
                      <div className="mt-1 text-[10px] text-zinc-400">
                        Each cell: char + style + hyperlink ref
                      </div>
                    </div>
                  </motion.div>
                )}
                {viz.currentStep === 4 && (
                  <motion.div key="pools" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-2">
                      {INTERNING_POOLS.map((pool, i) => (
                        <motion.div
                          key={i}
                          className="rounded border border-zinc-200 p-2 dark:border-zinc-600"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.12 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{pool.name}</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{pool.savings}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {pool.desc} — ~{pool.count} entries
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {viz.currentStep >= 5 && (
                  <motion.div key="ansi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-0.5">
                      <div className="text-red-500 dark:text-red-400 text-[10px] mb-1">
                        {viz.currentStep === 5 ? "ANSI diff — only changed cells:" : "Final stdout:"}
                      </div>
                      {viz.currentStep === 5 ? (
                        <>
                          <div className="text-zinc-400">ESC[?1049h — alt screen</div>
                          <div className="text-emerald-500">ESC[1;4r — DECSTBM scroll</div>
                          <div className="text-amber-500">ESC[1m — bold on</div>
                          <div className="text-zinc-300 dark:text-zinc-500">Claude Code</div>
                          <div className="text-amber-500">ESC[22m — bold off</div>
                          <div className="text-zinc-400 text-[10px] mt-1">
                            Only changed regions redrawn
                          </div>
                        </>
                      ) : (
                        <>
                          {TERMINAL_LINES.map((line, i) => (
                            <motion.div
                              key={i}
                              className={`${line.style === "bold" ? "font-bold text-zinc-800 dark:text-zinc-200" : line.style === "dim" ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-300"}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.08 }}
                            >
                              {line.text.replace(/\x1b\[[0-9;]*m/g, "")}
                            </motion.div>
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Visual output / key metrics */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {viz.currentStep <= 2 ? "How It Works" : viz.currentStep <= 4 ? "Performance" : "Terminal Preview"}
            </div>
            <svg viewBox="0 0 300 180" className="w-full" style={{ maxHeight: 180 }}>
              {viz.currentStep <= 2 && (
                <g>
                  <text x={150} y={30} textAnchor="middle" fontSize={11} fill={palette.activeNodeFill} fontWeight={700} fontFamily="monospace">
                    {["JSX → reconciler → DOM", "reconcile() → ink-* nodes", "Yoga → x,y,w,h per node"][viz.currentStep]}
                  </text>
                  {/* Flow arrows */}
                  {[0, 1, 2].map((i) => (
                    <g key={i}>
                      <motion.rect
                        x={30 + i * 95}
                        y={50}
                        width={80}
                        height={35}
                        rx={6}
                        fill={i <= viz.currentStep ? STAGES[i].color : palette.nodeFill}
                        stroke={i <= viz.currentStep ? STAGES[i].color : palette.nodeStroke}
                        strokeWidth={1.5}
                        animate={{ opacity: i <= viz.currentStep ? 1 : 0.3 }}
                      />
                      <text x={70 + i * 95} y={72} textAnchor="middle" fontSize={9} fill={i <= viz.currentStep ? "#fff" : palette.nodeText} fontFamily="monospace" fontWeight={600}>
                        {["JSX", "VDOM", "Layout"][i]}
                      </text>
                      {i < 2 && (
                        <text x={115 + i * 95} y={72} fontSize={14} fill={palette.labelFill}>→</text>
                      )}
                    </g>
                  ))}
                  <text x={150} y={120} textAnchor="middle" fontSize={9} fill={palette.labelFill} fontFamily="monospace">
                    {[
                      "<Box> and <Text> — React for terminals",
                      "ink-box, ink-text, ink-root host elements",
                      "Facebook Yoga engine — flexbox everywhere",
                    ][viz.currentStep]}
                  </text>
                </g>
              )}

              {viz.currentStep === 3 && (
                <g>
                  <text x={150} y={20} textAnchor="middle" fontSize={10} fill={palette.activeNodeFill} fontWeight={700} fontFamily="monospace">
                    2D Output Grid
                  </text>
                  {/* Grid visualization */}
                  {Array.from({ length: 4 }, (_, row) =>
                    Array.from({ length: 12 }, (_, col) => (
                      <motion.rect
                        key={`${row}-${col}`}
                        x={45 + col * 18}
                        y={35 + row * 22}
                        width={16}
                        height={20}
                        rx={2}
                        fill={row === 0 && col < 11 ? "#10b981" : palette.nodeFill}
                        stroke={palette.nodeStroke}
                        strokeWidth={0.5}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (row * 12 + col) * 0.01 }}
                      />
                    ))
                  )}
                  <text x={150} y={140} textAnchor="middle" fontSize={9} fill={palette.labelFill} fontFamily="monospace">
                    Each cell = char + style ID + link ID
                  </text>
                  <text x={150} y={155} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                    Diffed against previous frame
                  </text>
                </g>
              )}

              {viz.currentStep === 4 && (
                <g>
                  <text x={150} y={20} textAnchor="middle" fontSize={10} fill={palette.activeNodeFill} fontWeight={700} fontFamily="monospace">
                    Interning: O(n) → O(1)
                  </text>
                  {/* Before/after comparison */}
                  <rect x={20} y={35} width={120} height={60} rx={6} fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth={1} />
                  <text x={80} y={52} textAnchor="middle" fontSize={9} fill="#ef4444" fontWeight={700} fontFamily="monospace">Before</text>
                  <text x={80} y={68} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">strcmp(&quot;bold red&quot;)</text>
                  <text x={80} y={82} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">O(n) per cell</text>

                  <text x={150} y={68} fontSize={14} fill={palette.labelFill} textAnchor="middle">→</text>

                  <rect x={160} y={35} width={120} height={60} rx={6} fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth={1} />
                  <text x={220} y={52} textAnchor="middle" fontSize={9} fill="#10b981" fontWeight={700} fontFamily="monospace">After</text>
                  <text x={220} y={68} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">styleId === 7</text>
                  <text x={220} y={82} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">O(1) per cell</text>

                  <text x={150} y={125} textAnchor="middle" fontSize={9} fill="#10b981" fontWeight={600} fontFamily="monospace">
                    3 pools: Char + Style + Hyperlink
                  </text>
                  <text x={150} y={145} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                    Integer comparison replaces string comparison
                  </text>
                </g>
              )}

              {viz.currentStep >= 5 && (
                <g>
                  <text x={150} y={20} textAnchor="middle" fontSize={10} fill={palette.activeNodeFill} fontWeight={700} fontFamily="monospace">
                    {viz.currentStep === 5 ? "ANSI Optimization" : "Terminal Output"}
                  </text>
                  {/* Terminal frame */}
                  <rect x={25} y={35} width={250} height={130} rx={8} fill="#1a1a2e" stroke="#333" strokeWidth={1.5} />
                  <circle cx={42} cy={48} r={4} fill="#ff5f57" />
                  <circle cx={55} cy={48} r={4} fill="#febc2e" />
                  <circle cx={68} cy={48} r={4} fill="#28c840" />
                  <text x={85} y={52} fontSize={8} fill="#666" fontFamily="monospace">terminal</text>
                  <line x1={25} y1={58} x2={275} y2={58} stroke="#333" strokeWidth={0.5} />

                  {TERMINAL_LINES.map((line, i) => (
                    <motion.text
                      key={i}
                      x={35}
                      y={75 + i * 16}
                      fontSize={9}
                      fill={line.style === "bold" ? "#e2e8f0" : line.style === "dim" ? "#555" : "#94a3b8"}
                      fontFamily="monospace"
                      fontWeight={line.style === "bold" ? 700 : 400}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {line.text.replace(/\x1b\[[0-9;]*m/g, "")}
                    </motion.text>
                  ))}

                  {viz.currentStep === 5 && (
                    <motion.rect
                      x={35}
                      y={63}
                      width={4}
                      height={80}
                      fill="#ef4444"
                      opacity={0.3}
                      rx={2}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </g>
              )}
            </svg>
          </div>
        </div>
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
