import * as fs from "fs";
import * as path from "path";

const SOURCE_DIR = path.resolve(__dirname, "../../source");
const OUT_DIR = path.resolve(__dirname, "../src/data/generated");

interface FileEntry {
  path: string;
  loc: number;
  directory: string;
}

interface SourceIndex {
  totalFiles: number;
  totalLoc: number;
  files: FileEntry[];
}

function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

function walkDir(dir: string, basePath: string = ""): FileEntry[] {
  const entries: FileEntry[] = [];
  if (!fs.existsSync(dir)) return entries;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === ".git" || item === "node_modules" || item === "public") continue;
    const fullPath = path.join(dir, item);
    const relativePath = basePath ? `${basePath}/${item}` : item;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      entries.push(...walkDir(fullPath, relativePath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
      entries.push({
        path: relativePath,
        loc: countLines(fullPath),
        directory: basePath || ".",
      });
    }
  }
  return entries;
}

// Chapter key files mapping
const CHAPTER_KEY_FILES: Record<string, string[]> = {
  c01: ["entrypoints/cli.tsx", "main.tsx", "entrypoints/init.ts", "setup.ts"],
  c02: ["query.ts", "QueryEngine.ts", "query/tokenBudget.ts"],
  c03: ["Tool.ts", "tools.ts"],
  c04: ["commands.ts"],
  c05: ["context.ts"],
  c06: ["cost-tracker.ts"],
  c07: [],
  c08: [],
  c09: [],
  c10: ["coordinator/coordinatorMode.ts"],
  c11: [],
  c12: [],
  c13: [],
  c14: ["cost-tracker.ts", "costHook.ts"],
  c15: [],
};

function extractChapterData(chapterId: string, allFiles: FileEntry[]) {
  const keyFilePaths = CHAPTER_KEY_FILES[chapterId] || [];
  const keyFiles = keyFilePaths.map((p) => {
    const fullPath = path.join(SOURCE_DIR, p);
    const entry = allFiles.find((f) => f.path === p);
    let source = "";
    try {
      source = fs.readFileSync(fullPath, "utf-8");
      // Truncate very large files to first 500 lines for web display
      const lines = source.split("\n");
      if (lines.length > 500) {
        source = lines.slice(0, 500).join("\n") + `\n// ... (${lines.length - 500} more lines)`;
      }
    } catch {}
    return {
      path: p,
      filename: path.basename(p),
      loc: entry?.loc || 0,
      source,
    };
  });

  return { id: chapterId, keyFiles, snippets: [] };
}

function main() {
  console.log("📦 Extracting source from:", SOURCE_DIR);

  if (!fs.existsSync(SOURCE_DIR)) {
    console.log("⚠️  Source directory not found. Using pre-generated data.");
    return;
  }

  // Ensure output directories exist
  fs.mkdirSync(path.join(OUT_DIR, "chapters"), { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "architecture"), { recursive: true });

  // Build source index
  const files = walkDir(SOURCE_DIR);
  const totalLoc = files.reduce((sum, f) => sum + f.loc, 0);
  const index: SourceIndex = { totalFiles: files.length, totalLoc, files };

  fs.writeFileSync(
    path.join(OUT_DIR, "source-index.json"),
    JSON.stringify(index, null, 2)
  );
  console.log(`✅ Source index: ${files.length} files, ${totalLoc.toLocaleString()} LOC`);

  // Extract per-chapter data
  for (const chapterId of Object.keys(CHAPTER_KEY_FILES)) {
    const data = extractChapterData(chapterId, files);
    fs.writeFileSync(
      path.join(OUT_DIR, "chapters", `${chapterId}.json`),
      JSON.stringify(data, null, 2)
    );
  }
  console.log(`✅ Extracted ${Object.keys(CHAPTER_KEY_FILES).length} chapter data files`);

  // Build directory summary for architecture page
  const directories = new Map<string, { files: number; loc: number }>();
  for (const f of files) {
    const dir = f.directory || ".";
    const entry = directories.get(dir) || { files: 0, loc: 0 };
    entry.files++;
    entry.loc += f.loc;
    directories.set(dir, entry);
  }

  const topDirs = [...directories.entries()]
    .sort((a, b) => b[1].loc - a[1].loc)
    .slice(0, 50)
    .map(([dir, stats]) => ({ directory: dir, ...stats }));

  fs.writeFileSync(
    path.join(OUT_DIR, "architecture", "directory-summary.json"),
    JSON.stringify(topDirs, null, 2)
  );
  console.log("✅ Architecture directory summary generated");

  // Extract docs from docs/ directory
  const DOCS_DIR = path.resolve(__dirname, "../../docs");
  interface DocContent {
    chapter: string;
    locale: string;
    title: string;
    content: string;
  }

  const docs: DocContent[] = [];

  if (fs.existsSync(DOCS_DIR)) {
    for (const locale of ["en", "zh"]) {
      const localeDir = path.join(DOCS_DIR, locale);
      if (!fs.existsSync(localeDir)) continue;

      const docFiles = fs.readdirSync(localeDir).filter((f) => f.endsWith(".md"));
      for (const filename of docFiles) {
        const chapterMatch = filename.match(/^(c\d+|p\d+)/);
        if (!chapterMatch) continue;

        const chapter = chapterMatch[1];
        const content = fs.readFileSync(path.join(localeDir, filename), "utf-8");
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : filename;

        docs.push({ chapter, locale, title, content });
      }
    }
    console.log(`✅ Extracted ${docs.length} doc files`);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "docs.json"),
    JSON.stringify(docs, null, 2)
  );
}

main();
