"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { useSvgPalette } from "@/hooks/useDarkMode";
import { StepControls } from "./shared/step-controls";

interface SecretCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  unlockStep: number;
  details: string[];
}

const CARDS: SecretCard[] = [
  {
    id: "buddy",
    title: "BUDDY",
    icon: "🐾",
    color: "#f59e0b",
    unlockStep: 2,
    details: [
      "Mulberry32 PRNG — deterministic from seed",
      "18 species: cat, dog, fox, owl, penguin...",
      "5 rarities: common → shiny legendary",
      "ASCII sprite art companions",
    ],
  },
  {
    id: "kairos",
    title: "KAIROS",
    icon: "⏱",
    color: "#8b5cf6",
    unlockStep: 4,
    details: [
      "Always-on background daemon",
      "<tick> probes run on schedule",
      "15-second blocking budget per tick",
      "Invisible — no UI surface",
    ],
  },
  {
    id: "undercover",
    title: "UNDERCOVER",
    icon: "🕵",
    color: "#ef4444",
    unlockStep: 5,
    details: [
      'isUndercover() — identity check',
      '"Do not blow your cover"',
      "No force-OFF switch exists",
      "Most mysterious feature flag",
    ],
  },
];

const MORE_SECRETS = [
  { name: "Anti-Distillation", desc: "Fake tool definitions injected to poison model copying attempts", color: "#dc2626" },
  { name: "Speculation Mode", desc: "Parallel execution while user is still typing — predicts next action", color: "#3b82f6" },
  { name: "ULTRAPLAN", desc: "Advanced planning mode with structured decomposition", color: "#10b981" },
  { name: "Voice Mode", desc: "Audio interface integration — speech-to-text and text-to-speech", color: "#f97316" },
];

const RARITY_TABLE = [
  { name: "Common", chance: "60%", color: "#a1a1aa", bar: 60 },
  { name: "Uncommon", chance: "25%", color: "#22c55e", bar: 25 },
  { name: "Rare", chance: "10%", color: "#3b82f6", bar: 10 },
  { name: "Legendary", chance: "4%", color: "#a855f7", bar: 4 },
  { name: "Shiny Legendary", chance: "0.01%", color: "#f59e0b", bar: 1 },
];

const STEPS = [
  {
    title: "feature() — The Gate Function",
    description: "All hidden features are controlled by Bun's feature() compile-time macro. These features exist in the codebase but are DCE'd (Dead Code Eliminated) from public builds.",
  },
  {
    title: "Unlock: BUDDY System",
    description: "A virtual pet companion system hidden in Claude Code. Uses Mulberry32 PRNG for deterministic species generation — your buddy is tied to your user seed.",
  },
  {
    title: "BUDDY — Rarity System",
    description: "18 possible species across 5 rarity tiers. Shiny Legendary has a 0.01% chance — rarer than a shiny Charizard. Each buddy gets a unique ASCII sprite.",
  },
  {
    title: "Unlock: KAIROS Daemon",
    description: "An always-on background process that runs <tick> probes on a schedule. Has a strict 15-second blocking budget per tick. No UI — it's completely invisible to the user.",
  },
  {
    title: "Unlock: UNDERCOVER Mode",
    description: "The most mysterious feature. isUndercover() checks if the agent is operating undercover. The system prompt includes \"Do not blow your cover.\" No force-OFF switch exists.",
  },
  {
    title: "More Hidden Features",
    description: "Anti-Distillation injects fake tool defs to poison model copying. Speculation Mode predicts your next action and pre-executes in parallel. Plus ULTRAPLAN and Voice Mode.",
  },
  {
    title: "All Secrets Revealed",
    description: "These features show Claude Code is far more than a simple CLI wrapper. It's a sophisticated agent platform with experimental capabilities being tested internally.",
  },
];

export default function HiddenFeaturesVisualization({ title }: { title?: string }) {
  const viz = useSteppedVisualization({ totalSteps: STEPS.length, autoPlayInterval: 3500 });
  const palette = useSvgPalette();

  return (
    <div className="space-y-4">
      {/* Dark themed container for mystery vibe */}
      <div className="overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4 relative">
        {/* Scan-line effect overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
            zIndex: 10,
          }}
        />

        {title && (
          <div className="mb-3 text-center text-sm font-semibold text-zinc-500 relative z-20">
            {title}
          </div>
        )}

        {/* feature() function display */}
        <AnimatePresence>
          {viz.currentStep === 0 && (
            <motion.div
              className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900 p-4 font-mono text-sm relative z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-zinc-500 mb-1">// Bun compile-time macro</div>
              <div>
                <span className="text-purple-400">if</span>
                <span className="text-zinc-300"> (</span>
                <span className="text-amber-400">feature</span>
                <span className="text-zinc-300">(</span>
                <span className="text-green-400">&quot;BUDDY&quot;</span>
                <span className="text-zinc-300">)) {"{"}</span>
              </div>
              <div className="pl-4 text-zinc-500">// This entire block is removed</div>
              <div className="pl-4 text-zinc-500">// from the public binary via DCE</div>
              <div className="text-zinc-300">{"}"}</div>
              <div className="mt-2 text-xs text-red-400">
                ← Evaluates at build time, not runtime
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Three secret cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 relative z-20">
          {CARDS.map((card) => {
            const isUnlocked = viz.currentStep >= card.unlockStep;
            const isActive = viz.currentStep === card.unlockStep || viz.currentStep === card.unlockStep + (card.id === "buddy" ? 1 : 0);
            const isRevealed = viz.currentStep >= 6;

            return (
              <motion.div
                key={card.id}
                className="rounded-xl border p-4 relative overflow-hidden"
                style={{
                  borderColor: isUnlocked ? card.color : "#3f3f46",
                  backgroundColor: isUnlocked ? `${card.color}10` : "#18181b",
                }}
                animate={{
                  scale: isActive ? 1.02 : 1,
                  borderColor: isUnlocked ? card.color : "#3f3f46",
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Locked overlay */}
                <AnimatePresence>
                  {!isUnlocked && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm z-10"
                      exit={{ opacity: 0, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">🔒</div>
                        <div className="text-xs text-zinc-500 font-mono">CLASSIFIED</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Card content */}
                <div className="text-center mb-3">
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div
                    className="text-sm font-bold font-mono"
                    style={{ color: isUnlocked ? card.color : "#71717a" }}
                  >
                    {card.title}
                  </div>
                </div>

                {isUnlocked && (
                  <motion.div
                    className="space-y-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {card.details.map((detail, i) => (
                      <motion.div
                        key={i}
                        className="text-[11px] font-mono text-zinc-400"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                      >
                        <span style={{ color: card.color }}>•</span> {detail}
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Glow effect when active */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      boxShadow: `0 0 30px ${card.color}33, inset 0 0 30px ${card.color}11`,
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Revealed checkmark */}
                {isRevealed && (
                  <motion.div
                    className="absolute top-2 right-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-xs" style={{ color: card.color }}>✓</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* BUDDY rarity table */}
        <AnimatePresence>
          {viz.currentStep === 2 && (
            <motion.div
              className="mt-4 rounded-lg border border-amber-800/50 bg-zinc-900 p-3 relative z-20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="text-xs font-bold text-amber-400 font-mono mb-2">
                Rarity Distribution
              </div>
              <div className="space-y-1.5">
                {RARITY_TABLE.map((rarity, i) => (
                  <motion.div
                    key={rarity.name}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <span className="w-28 text-[10px] font-mono" style={{ color: rarity.color }}>
                      {rarity.name}
                    </span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded overflow-hidden">
                      <motion.div
                        className="h-full rounded"
                        style={{ backgroundColor: rarity.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(2, rarity.bar)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                    </div>
                    <span className="w-10 text-right text-[10px] font-mono text-zinc-500">
                      {rarity.chance}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-amber-500/60 font-mono">
                Shiny Legendary: 1 in 10,000 — rarer than a shiny Charizard
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* More secrets */}
        <AnimatePresence>
          {viz.currentStep >= 5 && (
            <motion.div
              className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2 relative z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {MORE_SECRETS.map((secret, i) => (
                <motion.div
                  key={secret.name}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 p-2.5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: secret.color }}
                    />
                    <span className="text-xs font-bold font-mono" style={{ color: secret.color }}>
                      {secret.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {secret.desc}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* All revealed banner */}
        <AnimatePresence>
          {viz.currentStep >= 6 && (
            <motion.div
              className="mt-4 rounded-lg border border-zinc-600 p-3 text-center relative z-20"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(139,92,246,0.1), rgba(239,68,68,0.1))",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-xs font-mono text-zinc-400">
                Claude Code is not just a CLI wrapper — it&apos;s a{" "}
                <span className="text-amber-400 font-bold">sophisticated agent platform</span>{" "}
                with hidden experimental capabilities
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
