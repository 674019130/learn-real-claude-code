"use client";

import { lazy, Suspense } from "react";
import { useTranslations } from "@/lib/i18n";

const visualizations: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<{ title?: string }>>
> = {
  c01: lazy(() => import("./c01-cli-bootstrap")),
  c02: lazy(() => import("./c02-agent-loop")),
  c03: lazy(() => import("./c03-tool-system")),
  c04: lazy(() => import("./c04-command-system")),
  c05: lazy(() => import("./c05-system-prompt")),
  c06: lazy(() => import("./c06-context-management")),
  c07: lazy(() => import("./c07-memory-dreams")),
  c08: lazy(() => import("./c08-permissions")),
  c09: lazy(() => import("./c09-hooks")),
  c10: lazy(() => import("./c10-multi-agent")),
  c11: lazy(() => import("./c11-mcp")),
  c12: lazy(() => import("./c12-ink-terminal")),
  c13: lazy(() => import("./c13-feature-gating")),
  c14: lazy(() => import("./c14-observability")),
  c15: lazy(() => import("./c15-hidden-features")),
  p01: lazy(() => import("./p01-context-engineering")),
  p02: lazy(() => import("./p02-agent-scaffolding")),
  p03: lazy(() => import("./p03-code-quality")),
};

export function SessionVisualization({ version }: { version: string }) {
  const t = useTranslations("viz");
  const Component = visualizations[version];
  if (!Component) return null;
  return (
    <Suspense
      fallback={
        <div className="min-h-[500px] animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      }
    >
      <div className="min-h-[500px]">
        <Component title={t(version)} />
      </div>
    </Suspense>
  );
}
