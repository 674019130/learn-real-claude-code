export const CHAPTER_ORDER = [
  "c01", "c02", "c03", "c04", "c05", "c06", "c07", "c08", "c09", "c10",
  "c11", "c12", "c13", "c14", "c15", "p01", "p02", "p03",
] as const;

export const LEARNING_PATH = CHAPTER_ORDER;

export type ChapterId = (typeof CHAPTER_ORDER)[number];

export const CHAPTER_META: Record<string, {
  title: string;
  titleZh: string;
  subtitle: string;
  subtitleZh: string;
  coreQuestion: string;
  coreQuestionZh: string;
  keyInsight: string;
  layer: LayerId;
  prevChapter: string | null;
  isPlus?: boolean;
}> = {
  c01: {
    title: "Booting 512K Lines in 500ms",
    titleZh: "500ms 启动 512K 行代码",
    subtitle: "Fast Paths, Lazy Imports, Parallel Prefetch",
    subtitleZh: "快速路径、延迟加载、并行预取",
    coreQuestion: "How does a massive TypeScript CLI start fast?",
    coreQuestionZh: "如何让一个巨型 TypeScript CLI 项目启动飞快？",
    keyInsight: "Fast paths exit before importing anything; expensive I/O runs in parallel with module evaluation",
    layer: "boot",
    prevChapter: null,
  },
  c02: {
    title: "The Real Agent Loop",
    titleZh: "真正的 Agent Loop",
    subtitle: "Streaming, Mid-Flight Tools, Auto-Compact",
    subtitleZh: "流式处理、中途执行、自动压缩",
    coreQuestion: "What separates a production agent loop from a textbook while-loop?",
    coreQuestionZh: "生产级 agent loop 与教学版 while 循环的本质差距是什么？",
    keyInsight: "StreamingToolExecutor fires tools mid-stream without waiting for the full response",
    layer: "core",
    prevChapter: "c01",
  },
  c03: {
    title: "Orchestrating 40+ Tools",
    titleZh: "40+ 工具的编排引擎",
    subtitle: "Concurrent Execution, Result Budgets, Schema Validation",
    subtitleZh: "并发执行、结果预算、Schema 验证",
    coreQuestion: "How to design a concurrent, streaming, permission-aware tool execution system?",
    coreQuestionZh: "如何设计一个并发、流式、权限感知的工具执行系统？",
    keyInsight: "Tools declare isConcurrencySafe() — reads run in parallel, writes run exclusively",
    layer: "core",
    prevChapter: "c02",
  },
  c04: {
    title: "100+ Slash Commands",
    titleZh: "100+ 斜杠命令的调度系统",
    subtitle: "Registration, Dispatch, The Command vs Tool Distinction",
    subtitleZh: "注册、调度、命令与工具的区别",
    coreQuestion: "What's the fundamental difference between commands and tools?",
    coreQuestionZh: "命令和工具有什么本质区别？",
    keyInsight: "Commands are user-initiated UI actions; tools are model-initiated API actions",
    layer: "capabilities",
    prevChapter: "c03",
  },
  c05: {
    title: "110+ Strings → One System Prompt",
    titleZh: "110+ 字符串拼成一个系统提示词",
    subtitle: "Dynamic Assembly, Cache Boundary, CLAUDE.md Hierarchy",
    subtitleZh: "动态组装、缓存边界、CLAUDE.md 层级",
    coreQuestion: "How to assemble a system prompt from 10+ sources and maximize prompt cache hits?",
    coreQuestionZh: "如何从 10+ 来源动态组装系统提示词并最大化 prompt cache 命中？",
    keyInsight: "SYSTEM_PROMPT_DYNAMIC_BOUNDARY splits static (globally cached) from dynamic (per-session) sections",
    layer: "intelligence",
    prevChapter: "c04",
  },
  c06: {
    title: "Context as a Resource",
    titleZh: "上下文即资源：三级压缩续命术",
    subtitle: "Seven Compression Strategies, Token Budgets",
    subtitleZh: "七种压缩策略、Token 预算",
    coreQuestion: "When the context window fills up — what to compress, what to keep, what to discard?",
    coreQuestionZh: "当 context window 不够用时，怎么压？压什么？留什么？",
    keyInsight: "Seven independent strategies fire in priority order: snip → microcompact → collapse → summarize",
    layer: "intelligence",
    prevChapter: "c05",
  },
  c07: {
    title: "Memory & Dreams",
    titleZh: "记忆与梦境：跨会话的持久化",
    subtitle: "Cross-Session Persistence, Auto-Dream Consolidation",
    subtitleZh: "跨会话持久化、Auto-Dream 记忆整合",
    coreQuestion: "How does an agent maintain memory across sessions? What is Auto-Dream?",
    coreQuestionZh: "agent 怎么在会话间保持记忆？Auto-Dream「做梦」机制是什么？",
    keyInsight: "Auto-Dream runs four phases (orient→gather→consolidate→prune) with a read-only bash subagent",
    layer: "intelligence",
    prevChapter: "c06",
  },
  c08: {
    title: "Defense in Depth",
    titleZh: "五层安全栈与权限竞赛",
    subtitle: "5-Layer Permission Stack, YOLO Classifier, Permission Racing",
    subtitleZh: "五层权限栈、YOLO 分类器、权限竞赛",
    coreQuestion: "How to protect irreversible operations with multi-layer defense? What is permission racing?",
    coreQuestionZh: "如何用多层防御保护不可逆操作？权限竞赛是什么？",
    keyInsight: "Hooks/classifier race concurrently with user confirmation — first to return wins",
    layer: "safety",
    prevChapter: "c07",
  },
  c09: {
    title: "Hook Lifecycle",
    titleZh: "Hook 生命周期：工具执行的切面",
    subtitle: "PreToolUse, PostToolUse, External Hooks, Async Patterns",
    subtitleZh: "PreToolUse、PostToolUse、外部 Hook、异步模式",
    coreQuestion: "How to extend tool execution behavior without modifying core code?",
    coreQuestionZh: "如何在不修改核心代码的情况下扩展工具执行行为？",
    keyInsight: "Hooks can modify tool input, block execution, or inject system messages — three backends (command/HTTP/prompt)",
    layer: "safety",
    prevChapter: "c08",
  },
  c10: {
    title: "One Claude Commanding Many",
    titleZh: "一个 Claude 指挥一群 Claude",
    subtitle: "Coordinator Mode, File-Based IPC, Prompt Cache Sharing",
    subtitleZh: "Coordinator Mode、文件 IPC、Prompt Cache 共享",
    coreQuestion: "How does Coordinator Mode orchestrate parallel workers? How does file-based IPC work?",
    coreQuestionZh: "Coordinator Mode 如何编排多 Worker 并行？文件 IPC 如何实现？",
    keyInsight: "Fork subagents share the parent's prompt cache for near-zero-cost context inheritance",
    layer: "scale",
    prevChapter: "c09",
  },
  c11: {
    title: "MCP: Infinite Extension",
    titleZh: "MCP: 无限扩展协议",
    subtitle: "Tool Bridging, Transport Types, Deferred Loading",
    subtitleZh: "工具桥接、传输类型、延迟加载",
    coreQuestion: "How to seamlessly bridge external MCP tools into the agent's native tool list?",
    coreQuestionZh: "如何把外部 MCP 工具无缝桥接进 agent 的工具列表？",
    keyInsight: "18 deferred tools load on-demand via ToolSearchTool to keep the base prompt under 200K tokens",
    layer: "scale",
    prevChapter: "c10",
  },
  c12: {
    title: "React in the Terminal",
    titleZh: "在终端里跑 React",
    subtitle: "Custom Reconciler, Yoga Layout, Double-Buffered Screen",
    subtitleZh: "自定义 Reconciler、Yoga 布局、双缓冲屏幕",
    coreQuestion: "How to drive a full-featured terminal UI with React?",
    coreQuestionZh: "如何用 React 驱动一个全功能终端 UI？",
    keyInsight: "Three interning pools (Char/Style/Hyperlink) turn O(n) string comparisons into O(1) integer checks",
    layer: "rendering",
    prevChapter: "c11",
  },
  c13: {
    title: "Dual Feature Gating",
    titleZh: "双重特性门控与构建管道",
    subtitle: "Compile-Time DCE + Runtime Flags, 108 Missing Modules",
    subtitleZh: "编译时 DCE + 运行时门控、108 个缺失模块",
    coreQuestion: "How to produce multiple builds (CLI/Bridge/Coordinator/KAIROS) from one codebase?",
    coreQuestionZh: "如何从一个 codebase 生成多种构建？",
    keyInsight: "Bun feature() eliminates code at compile time; GrowthBook/Statsig gates features at runtime — two systems, complementary roles",
    layer: "internals",
    prevChapter: "c12",
  },
  c14: {
    title: "Observability",
    titleZh: "可观测性：遥测、成本与恢复",
    subtitle: "Dual Telemetry, Cost Tracking, Error Recovery Pipeline",
    subtitleZh: "遥测双通道、成本追踪、错误恢复管道",
    coreQuestion: "How to track agent costs, performance, and errors in production?",
    coreQuestionZh: "如何在生产环境追踪 agent 成本、性能和错误？",
    keyInsight: "Circuit breaker (max 3 consecutive failures) prevents infinite retry loops; 11-step exponential backoff handles transient errors",
    layer: "internals",
    prevChapter: "c13",
  },
  c15: {
    title: "Secrets in the Source",
    titleZh: "隐藏在源码里的秘密",
    subtitle: "BUDDY, KAIROS, Undercover, Anti-Distillation, Speculation",
    subtitleZh: "BUDDY 宠物、KAIROS 常驻、Undercover 伪装、反蒸馏、推测执行",
    coreQuestion: "What unreleased features were hiding in the source code?",
    coreQuestionZh: "Claude Code 还藏了哪些没发布的功能？",
    keyInsight: "BUDDY uses Mulberry32 PRNG seeded by userId for deterministic companion generation — 0.01% chance of shiny legendary",
    layer: "secrets",
    prevChapter: "c14",
  },
  p01: {
    title: "Context Engineering: The 2026 Paradigm Shift",
    titleZh: "Context Engineering：2026 范式转移",
    subtitle: "From Prompt Engineering to Context Engineering",
    subtitleZh: "从 Prompt Engineering 到 Context Engineering",
    coreQuestion: "Why is 80% of what matters dynamic context, not static prompts?",
    coreQuestionZh: "为什么 80% 重要的是动态上下文，而非静态 prompt？",
    keyInsight: "Multi-turn performance drops 39% vs single-shot — context engineering compensates by managing what the model sees across turns",
    layer: "plus",
    prevChapter: "c15",
    isPlus: true,
  },
  p02: {
    title: "Agent Scaffolding: The Harness Matters",
    titleZh: "Agent Scaffolding 学：Harness 和 Model 一样重要",
    subtitle: "Same Model, Different Harness = 17 Problems Apart",
    subtitleZh: "同模型不同 Harness 差 17 题",
    coreQuestion: "Why does the harness matter as much as the model?",
    coreQuestionZh: "为什么 harness 和 model 一样重要？",
    keyInsight: "Three focused agents consistently outperform one generalist working three times as long",
    layer: "plus",
    prevChapter: "p01",
    isPlus: true,
  },
  p03: {
    title: "When 90% of Code Is AI-Written",
    titleZh: "代码质量辩论：当 90% 代码是 AI 写的",
    subtitle: "3,167-Line Functions, Vibe Coding, and the Quality Debate",
    subtitleZh: "3,167 行函数、Vibe Coding 与质量争论",
    coreQuestion: "Can AI-generated code be production-quality at scale?",
    coreQuestionZh: "AI 生成的代码能否达到生产级质量？",
    keyInsight: "60-100 internal npm releases daily, 5 PRs per engineer — velocity compensates for structural debt",
    layer: "plus",
    prevChapter: "p02",
    isPlus: true,
  },
};

export type LayerId = "boot" | "core" | "capabilities" | "intelligence" | "safety" | "scale" | "rendering" | "internals" | "secrets" | "plus";

export const LAYERS: readonly {
  id: LayerId;
  label: string;
  labelZh: string;
  color: string;
  chapters: string[];
}[] = [
  { id: "boot", label: "Boot & Loop", labelZh: "启动与循环", color: "#6366F1", chapters: ["c01", "c02"] },
  { id: "core", label: "Core Engine", labelZh: "核心引擎", color: "#3B82F6", chapters: ["c03"] },
  { id: "capabilities", label: "Commands", labelZh: "命令系统", color: "#10B981", chapters: ["c04"] },
  { id: "intelligence", label: "Prompt & Context", labelZh: "提示词与上下文", color: "#8B5CF6", chapters: ["c05", "c06", "c07"] },
  { id: "safety", label: "Safety & Hooks", labelZh: "安全与钩子", color: "#EF4444", chapters: ["c08", "c09"] },
  { id: "scale", label: "Scale & Extend", labelZh: "多 Agent 与扩展", color: "#EC4899", chapters: ["c10", "c11"] },
  { id: "rendering", label: "Terminal Rendering", labelZh: "终端渲染", color: "#14B8A6", chapters: ["c12"] },
  { id: "internals", label: "Engineering Internals", labelZh: "工程内功", color: "#F97316", chapters: ["c13", "c14"] },
  { id: "secrets", label: "Hidden Secrets", labelZh: "隐藏彩蛋", color: "#A855F7", chapters: ["c15"] },
  { id: "plus", label: "Plus: Frontiers", labelZh: "Plus：前沿", color: "#0EA5E9", chapters: ["p01", "p02", "p03"] },
] as const;
