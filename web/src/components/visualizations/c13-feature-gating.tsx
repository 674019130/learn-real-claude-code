"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

const COMPILE_FLAGS = [
  { name: "BUDDY", eliminated: true, color: "#ef4444" },
  { name: "KAIROS", eliminated: true, color: "#f59e0b" },
  { name: "COORDINATOR", eliminated: true, color: "#8b5cf6" },
  { name: "ULTRAPLAN", eliminated: true, color: "#ec4899" },
  { name: "VOICE_MODE", eliminated: false, color: "#3b82f6" },
  { name: "MCP_CLIENT", eliminated: false, color: "#10b981" },
  { name: "SPECULATION", eliminated: true, color: "#f97316" },
  { name: "UNDERCOVER", eliminated: true, color: "#6366f1" },
];

const RUNTIME_FLAGS = [
  { name: "GrowthBook", type: "A/B", desc: "Feature experiments" },
  { name: "Statsig", type: "rollout", desc: "Gradual rollouts" },
  { name: "USER_TYPE", type: "env", desc: "'ant' = internal" },
];

const CODENAMES = [
  { name: "Capybara", version: "current", color: "#f59e0b" },
  { name: "Tengu", version: "next", color: "#8b5cf6" },
  { name: "Fennec", version: "experimental", color: "#ef4444" },
  { name: "Numbat", version: "internal", color: "#10b981" },
];

const STEPS = [
  {
    title: "Single Codebase",
    description: "One codebase, 512K+ lines of TypeScript. But not all code ships to all users. Feature gating controls what gets built and what runs.",
  },
  {
    title: "Compile-Time DCE — feature()",
    description: "Bun's feature() macro enables compile-time Dead Code Elimination. 44 feature flags evaluated at build time — unreachable branches are stripped from the bundle entirely.",
  },
  {
    title: "What Gets Eliminated",
    description: "BUDDY, KAIROS, COORDINATOR, ULTRAPLAN, SPECULATION, UNDERCOVER — all eliminated from the public build. The code literally doesn't exist in the shipped binary.",
  },
  {
    title: "Runtime Feature Flags",
    description: "GrowthBook and Statsig provide runtime flags for A/B testing and gradual rollouts. These control behavior without changing the binary.",
  },
  {
    title: "Internal vs External Split",
    description: "USER_TYPE === 'ant' gates Anthropic-internal features. Internal builds include debugging tools, extra telemetry, and experimental features not ready for public release.",
  },
  {
    title: "Codenames & Missing Modules",
    description: "Animal codenames (Capybara, Tengu, Fennec, Numbat) identify release channels. 108 modules referenced in code but missing from the repo — they exist only in internal builds.",
  },
];

export default function FeatureGatingVisualization({ title }: { title?: string }) {
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
        <svg viewBox="0 0 700 420" className="w-full" style={{ maxHeight: 420 }}>
          {/* Source code block at top */}
          <motion.rect
            x={250}
            y={10}
            width={200}
            height={50}
            rx={10}
            fill={viz.currentStep === 0 ? palette.activeNodeFill : palette.nodeFill}
            stroke={viz.currentStep === 0 ? palette.activeNodeStroke : palette.nodeStroke}
            strokeWidth={2}
            animate={{ scale: viz.currentStep === 0 ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 1.5, repeat: viz.currentStep === 0 ? Infinity : 0 }}
          />
          <text x={350} y={32} textAnchor="middle" fontSize={12} fill={viz.currentStep === 0 ? palette.activeNodeText : palette.nodeText} fontWeight={700} fontFamily="monospace">
            Source Code
          </text>
          <text x={350} y={48} textAnchor="middle" fontSize={9} fill={viz.currentStep === 0 ? "rgba(255,255,255,0.7)" : palette.labelFill} fontFamily="monospace">
            512K+ lines TypeScript
          </text>

          {/* Fork lines from source */}
          {viz.currentStep >= 1 && (
            <g>
              {/* Left branch: compile-time */}
              <motion.path
                d="M 300 60 L 180 100"
                fill="none"
                stroke={viz.currentStep >= 1 && viz.currentStep <= 2 ? "#ef4444" : palette.edgeStroke}
                strokeWidth={viz.currentStep >= 1 && viz.currentStep <= 2 ? 2 : 1}
                strokeDasharray={viz.currentStep >= 1 ? "none" : "4,4"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
              {/* Right branch: runtime */}
              <motion.path
                d="M 400 60 L 520 100"
                fill="none"
                stroke={viz.currentStep >= 3 ? "#3b82f6" : palette.edgeStroke}
                strokeWidth={viz.currentStep >= 3 ? 2 : 1}
                strokeDasharray={viz.currentStep >= 3 ? "none" : "4,4"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, opacity: viz.currentStep >= 3 ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              />
            </g>
          )}

          {/* Compile-time DCE section (left) */}
          {viz.currentStep >= 1 && (
            <g>
              <motion.rect
                x={60}
                y={100}
                width={240}
                height={40}
                rx={8}
                fill={viz.currentStep <= 2 ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.05)"}
                stroke="#ef4444"
                strokeWidth={viz.currentStep <= 2 ? 1.5 : 0.5}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              />
              <text x={180} y={118} textAnchor="middle" fontSize={10} fill="#ef4444" fontWeight={700} fontFamily="monospace">
                Compile-Time: feature()
              </text>
              <text x={180} y={132} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                Bun DCE — 44 flags — strips dead code
              </text>
            </g>
          )}

          {/* Feature flag chips — compile time */}
          {viz.currentStep >= 1 && (
            <g>
              {COMPILE_FLAGS.map((flag, i) => {
                const col = i % 4;
                const row = Math.floor(i / 4);
                const x = 70 + col * 60;
                const y = 155 + row * 35;
                const isEliminated = flag.eliminated && viz.currentStep >= 2;

                return (
                  <motion.g
                    key={flag.name}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <motion.rect
                      x={x}
                      y={y}
                      width={52}
                      height={24}
                      rx={5}
                      fill={isEliminated ? "rgba(239,68,68,0.1)" : `${flag.color}22`}
                      stroke={isEliminated ? "#ef4444" : flag.color}
                      strokeWidth={1}
                      animate={{ opacity: isEliminated ? 0.4 : 1 }}
                    />
                    <text
                      x={x + 26}
                      y={y + 15}
                      textAnchor="middle"
                      fontSize={7}
                      fill={isEliminated ? "#ef4444" : flag.color}
                      fontFamily="monospace"
                      fontWeight={600}
                    >
                      {flag.name}
                    </text>
                    {isEliminated && (
                      <motion.line
                        x1={x + 4}
                        y1={y + 12}
                        x2={x + 48}
                        y2={y + 12}
                        stroke="#ef4444"
                        strokeWidth={2}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                      />
                    )}
                  </motion.g>
                );
              })}
              {viz.currentStep >= 2 && (
                <motion.text
                  x={180}
                  y={235}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#ef4444"
                  fontWeight={700}
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Code doesn&apos;t exist in shipped binary
                </motion.text>
              )}
            </g>
          )}

          {/* Runtime flags section (right) */}
          {viz.currentStep >= 3 && (
            <g>
              <motion.rect
                x={400}
                y={100}
                width={260}
                height={40}
                rx={8}
                fill={viz.currentStep >= 3 && viz.currentStep <= 4 ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.05)"}
                stroke="#3b82f6"
                strokeWidth={viz.currentStep >= 3 && viz.currentStep <= 4 ? 1.5 : 0.5}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              />
              <text x={530} y={118} textAnchor="middle" fontSize={10} fill="#3b82f6" fontWeight={700} fontFamily="monospace">
                Runtime Feature Flags
              </text>
              <text x={530} y={132} textAnchor="middle" fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                GrowthBook + Statsig — behavior without rebuild
              </text>

              {RUNTIME_FLAGS.map((flag, i) => (
                <motion.g
                  key={flag.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <rect
                    x={410}
                    y={155 + i * 38}
                    width={240}
                    height={30}
                    rx={6}
                    fill={palette.bgSubtle}
                    stroke={palette.nodeStroke}
                    strokeWidth={1}
                  />
                  <text x={425} y={174 + i * 38} fontSize={10} fill={palette.activeNodeFill} fontWeight={700} fontFamily="monospace">
                    {flag.name}
                  </text>
                  <text x={525} y={174 + i * 38} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                    [{flag.type}]
                  </text>
                  <text x={575} y={174 + i * 38} fontSize={8} fill={palette.labelFill} fontFamily="monospace">
                    {flag.desc}
                  </text>
                </motion.g>
              ))}
            </g>
          )}

          {/* Internal vs External split */}
          {viz.currentStep >= 4 && (
            <g>
              <motion.rect
                x={410}
                y={280}
                width={110}
                height={40}
                rx={8}
                fill="rgba(16,185,129,0.15)"
                stroke="#10b981"
                strokeWidth={1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
              <text x={465} y={298} textAnchor="middle" fontSize={9} fill="#10b981" fontWeight={700} fontFamily="monospace">
                ant (internal)
              </text>
              <text x={465} y={312} textAnchor="middle" fontSize={7} fill={palette.labelFill} fontFamily="monospace">
                debug + telemetry
              </text>

              <motion.rect
                x={540}
                y={280}
                width={110}
                height={40}
                rx={8}
                fill="rgba(168,85,247,0.15)"
                stroke="#a855f7"
                strokeWidth={1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              />
              <text x={595} y={298} textAnchor="middle" fontSize={9} fill="#a855f7" fontWeight={700} fontFamily="monospace">
                external
              </text>
              <text x={595} y={312} textAnchor="middle" fontSize={7} fill={palette.labelFill} fontFamily="monospace">
                public release
              </text>
            </g>
          )}

          {/* Codenames & missing modules */}
          {viz.currentStep >= 5 && (
            <g>
              {/* Codename badges */}
              <motion.text
                x={180}
                y={265}
                textAnchor="middle"
                fontSize={10}
                fill={palette.activeNodeFill}
                fontWeight={700}
                fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Release Channels (Codenames)
              </motion.text>
              {CODENAMES.map((cn, i) => (
                <motion.g
                  key={cn.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <rect
                    x={55 + i * 65}
                    y={275}
                    width={58}
                    height={36}
                    rx={6}
                    fill={`${cn.color}22`}
                    stroke={cn.color}
                    strokeWidth={1}
                  />
                  <text x={84 + i * 65} y={292} textAnchor="middle" fontSize={8} fill={cn.color} fontWeight={700} fontFamily="monospace">
                    {cn.name}
                  </text>
                  <text x={84 + i * 65} y={304} textAnchor="middle" fontSize={7} fill={palette.labelFill} fontFamily="monospace">
                    {cn.version}
                  </text>
                </motion.g>
              ))}

              {/* Missing modules */}
              <motion.rect
                x={55}
                y={325}
                width={250}
                height={35}
                rx={6}
                fill="rgba(239,68,68,0.08)"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="4,2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />
              <motion.text
                x={180}
                y={343}
                textAnchor="middle"
                fontSize={9}
                fill="#ef4444"
                fontWeight={600}
                fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.6 }}
              >
                108 missing modules — internal builds only
              </motion.text>
              <motion.text
                x={180}
                y={356}
                textAnchor="middle"
                fontSize={7}
                fill={palette.labelFill}
                fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.7 }}
              >
                Referenced in code but absent from public repo
              </motion.text>
            </g>
          )}

          {/* Key insight box */}
          <AnimatePresence>
            {viz.currentStep >= 2 && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <rect
                  x={55}
                  y={380}
                  width={590}
                  height={32}
                  rx={6}
                  fill="rgba(59,130,246,0.08)"
                  stroke={palette.activeNodeStroke}
                  strokeWidth={1}
                  strokeDasharray="6,3"
                />
                <text x={350} y={400} textAnchor="middle" fontSize={9} fill={palette.activeNodeFill} fontWeight={600} fontFamily="monospace">
                  Two systems: compile-time eliminates code entirely — runtime gates features without rebuild
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
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
