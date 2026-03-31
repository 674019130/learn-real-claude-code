"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/i18n";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

let docsData: { chapter: string; locale: string; title: string; content: string }[] = [];
try {
  docsData = require("@/data/generated/docs.json");
} catch {}

interface DocRendererProps {
  chapter: string;
}

function renderMarkdown(md: string): string {
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, { detect: false, ignoreMissing: true })
    .use(rehypeStringify)
    .processSync(md);
  return String(result);
}

function postProcessHtml(html: string): string {
  html = html.replace(
    /<pre><code class="hljs language-(\w+)">/g,
    '<pre class="code-block" data-language="$1"><code class="hljs language-$1">'
  );
  html = html.replace(
    /<pre><code(?! class="hljs)([^>]*)>/g,
    '<pre class="ascii-diagram"><code$1>'
  );
  html = html.replace(/<blockquote>/, '<blockquote class="hero-callout">');
  html = html.replace(/<h1>.*?<\/h1>\n?/, "");
  html = html.replace(
    /<ol start="(\d+)">/g,
    (_, start) => `<ol style="counter-reset:step-counter ${parseInt(start) - 1}">`
  );
  return html;
}

export function DocRenderer({ chapter }: DocRendererProps) {
  const locale = useLocale();

  const doc = useMemo(() => {
    const match = docsData.find(
      (d) => d.chapter === chapter && d.locale === locale
    );
    if (match) return match;
    return docsData.find(
      (d) => d.chapter === chapter && d.locale === "en"
    );
  }, [chapter, locale]);

  if (!doc) {
    return (
      <div className="py-8 text-center text-zinc-400 dark:text-zinc-500">
        {locale === "zh" ? "教程内容加载中..." : "Tutorial content loading..."}
      </div>
    );
  }

  const html = useMemo(() => {
    const raw = renderMarkdown(doc.content);
    return postProcessHtml(raw);
  }, [doc.content]);

  return (
    <div className="py-4">
      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
