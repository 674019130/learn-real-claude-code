import { CHAPTER_ORDER, CHAPTER_META, LAYERS } from "@/lib/constants";
import { ChapterClient } from "./client";

export function generateStaticParams() {
  const locales = ["en", "zh"];
  return locales.flatMap((locale) =>
    CHAPTER_ORDER.map((chapter) => ({ locale, chapter }))
  );
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ locale: string; chapter: string }>;
}) {
  const { locale, chapter } = await params;
  const meta = CHAPTER_META[chapter];
  const isZh = locale === "zh";

  if (!meta) {
    return <div className="py-20 text-center text-zinc-500">Chapter not found</div>;
  }

  const layer = LAYERS.find((l) => l.id === meta.layer);
  const prevMeta = meta.prevChapter ? CHAPTER_META[meta.prevChapter] : null;
  const nextChapterIdx = CHAPTER_ORDER.indexOf(chapter as any);
  const nextId = nextChapterIdx < CHAPTER_ORDER.length - 1 ? CHAPTER_ORDER[nextChapterIdx + 1] : null;
  const nextMeta = nextId ? CHAPTER_META[nextId] : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          {layer && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: layer.color, background: `${layer.color}15` }}
            >
              {isZh ? layer.labelZh : layer.label}
            </span>
          )}
          <span className="font-mono text-xs font-bold text-zinc-400 uppercase">{chapter}</span>
          {meta.isPlus && (
            <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
              PLUS
            </span>
          )}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {isZh ? meta.titleZh : meta.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isZh ? meta.subtitleZh : meta.subtitle}
        </p>
      </div>

      {/* Core Question & Key Insight */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {isZh ? "核心问题" : "Core Question"}
          </div>
          <div className="text-sm text-amber-900 dark:text-amber-200">
            {isZh ? meta.coreQuestionZh : meta.coreQuestion}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/30">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {isZh ? "关键洞察" : "Key Insight"}
          </div>
          <div className="text-sm text-emerald-900 dark:text-emerald-200">
            {meta.keyInsight}
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <ChapterClient chapter={chapter} locale={locale} />

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
        {meta.prevChapter && prevMeta ? (
          <a
            href={`/${locale}/${meta.prevChapter}`}
            className="text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400"
          >
            ← {isZh ? prevMeta.titleZh : prevMeta.title}
          </a>
        ) : <div />}
        {nextId && nextMeta ? (
          <a
            href={`/${locale}/${nextId}`}
            className="text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400"
          >
            {isZh ? nextMeta.titleZh : nextMeta.title} →
          </a>
        ) : <div />}
      </div>
    </div>
  );
}
