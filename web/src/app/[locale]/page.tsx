import { CHAPTER_ORDER, CHAPTER_META, LAYERS } from "@/lib/constants";
import Link from "next/link";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isZh = locale === "zh";

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-800/50 dark:bg-blue-950/30">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {isZh ? "512K 行 TypeScript 源码深度解析" : "512K lines of leaked TypeScript — analyzed"}
          </span>
        </div>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {isZh ? (
            <>深入真实<br /><span className="text-blue-600">Claude Code</span></>
          ) : (
            <>Learn Real<br /><span className="text-blue-600">Claude Code</span></>
          )}
        </h1>
        <p className="mx-auto max-w-2xl text-base text-zinc-500 dark:text-zinc-400 sm:text-lg">
          {isZh
            ? "工业级 AI 编码 Agent 的架构拆解 — 不讲概念，只讲源码里真实发生了什么"
            : "How a production AI coding agent actually works — not concepts, but what the source code really does"}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${locale}/c01`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isZh ? "开始学习" : "Start Learning"}
            <span>→</span>
          </Link>
          <Link
            href={`/${locale}/architecture`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
          >
            {isZh ? "架构总览" : "Architecture Map"}
          </Link>
          <Link
            href={`/${locale}/explorer`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
          >
            {isZh ? "源码浏览器" : "Source Explorer"}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-20 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: "512K+", label: isZh ? "行 TypeScript" : "Lines of TypeScript" },
          { value: "1,902", label: isZh ? "源文件" : "Source Files" },
          { value: "40+", label: isZh ? "内置工具" : "Built-in Tools" },
          { value: "15 + 3", label: isZh ? "深度章节" : "Deep Chapters" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Code teaser */}
      <div className="mb-20 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          <span className="ml-3 font-mono text-[11px] text-zinc-500">query.ts — The Real Agent Loop</span>
        </div>
        <pre className="overflow-x-auto p-5 text-[0.8rem] leading-relaxed">
          <code className="font-mono text-zinc-300">{`// query.ts — StreamingToolExecutor fires tools MID-STREAM
while (true) {
  const stream = await anthropic.messages.stream({ messages })

  `}<span className="text-purple-400">for await</span>{` (const event of stream) {
    if (event.type === `}<span className="text-green-400">'content_block_start'</span>{`) {
      `}<span className="text-zinc-500">// Tool use delimiter detected — fire immediately</span>{`
      if (event.content_block.type === `}<span className="text-green-400">'tool_use'</span>{`) {
        `}<span className="text-blue-400">StreamingToolExecutor</span>{`.dispatch(event)  `}<span className="text-zinc-500">// ← mid-stream!</span>{`
      }
    }
  }
  if (shouldAutoCompact(tokenBudget)) compactContext()  `}<span className="text-zinc-500">// ← 95% full</span>{`
  if (!hasMoreToolCalls) `}<span className="text-purple-400">break</span>{`
}`}</code>
        </pre>
      </div>

      {/* Learning path */}
      <div>
        <h2 className="mb-8 text-2xl font-bold tracking-tight">
          {isZh ? "学习路线" : "Learning Path"}
        </h2>
        <div className="space-y-8">
          {LAYERS.map((layer) => (
            <div key={layer.id}>
              <div className="mb-3 flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full" style={{ background: layer.color }} />
                <h3 className="font-semibold" style={{ color: layer.color }}>
                  {isZh ? layer.labelZh : layer.label}
                </h3>
                <span className="text-xs text-zinc-400">
                  {layer.chapters.length} {isZh ? "章" : "chapters"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {layer.chapters.map((chId) => {
                  const meta = CHAPTER_META[chId];
                  if (!meta) return null;
                  return (
                    <Link
                      key={chId}
                      href={`/${locale}/${chId}`}
                      className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                      style={{ borderLeftColor: layer.color, borderLeftWidth: 3 }}
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold uppercase" style={{ color: layer.color }}>
                          {chId}
                        </span>
                        {meta.isPlus && (
                          <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                            PLUS
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                        {isZh ? meta.titleZh : meta.title}
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        {isZh ? meta.subtitleZh : meta.subtitle}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
