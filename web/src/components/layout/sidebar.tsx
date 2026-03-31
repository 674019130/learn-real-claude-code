"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CHAPTER_ORDER, CHAPTER_META, LAYERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const isZh = locale === "zh";

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-[4.5rem] flex max-h-[calc(100vh-5rem)] flex-col overflow-y-auto pb-8">
        {LAYERS.map((layer) => (
          <div key={layer.id} className="mb-4">
            <div className="mb-1.5 flex items-center gap-1.5 px-2">
              <div className="h-2 w-2 rounded-full" style={{ background: layer.color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {isZh ? layer.labelZh : layer.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {layer.chapters.map((chId) => {
                const meta = CHAPTER_META[chId];
                if (!meta) return null;
                const href = `/${locale}/${chId}`;
                const isActive = pathname === href || pathname === `${href}/`;
                return (
                  <Link
                    key={chId}
                    href={href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
                      isActive
                        ? "bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                    )}
                  >
                    <span
                      className="font-mono text-[10px] font-bold shrink-0"
                      style={{ color: isActive ? layer.color : undefined }}
                    >
                      {chId}
                    </span>
                    <span className="truncate">
                      {isZh ? meta.titleZh : meta.title}
                    </span>
                    {meta.isPlus && (
                      <span className="ml-auto shrink-0 rounded bg-cyan-100 px-1 py-0.5 text-[8px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                        +
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Global pages */}
        <div className="mt-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <div className="mb-1.5 px-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {isZh ? "工具" : "Tools"}
            </span>
          </div>
          <div className="space-y-0.5">
            {[
              { href: `/${locale}/architecture`, label: isZh ? "架构图" : "Architecture" },
              { href: `/${locale}/flow`, label: isZh ? "流程追踪" : "Flow Tracer" },
              { href: `/${locale}/compare`, label: isZh ? "对比" : "Compare" },
              { href: `/${locale}/explorer`, label: isZh ? "源码浏览器" : "Explorer" },
            ].map((item) => {
              const isActive = pathname === item.href || pathname === `${item.href}/`;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
