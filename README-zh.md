[English](./README.md) | [中文](./README-zh.md)

# 深入真实 Claude Code — 512K 行 Agent 的源码考古

## 源码不会说谎

2026 年 3 月 31 日，一位安全研究员发现 Anthropic 意外地将 Claude Code 的完整 TypeScript 源码打包进了一个 npm 包——512,000+ 行代码，1,902 个文件，一个解压后还原为完整代码库的 60MB sourcemap 文件。

这不是第一次。同样的错误在 2025 年 2 月发生过一次。

在讨论源码揭示了什么之前，先精确定义你真正在看的是什么。

**Claude Code 不是 Agent。Claude Code 是 Harness（运行框架）。**

Agent 是 Claude——一个由 Anthropic 训练的神经网络，具备推理、规划和行动的能力。Claude Code 是包裹这个模型的外壳：工具系统、上下文管理、权限系统、终端 UI、流式基础设施。它是 Agent 驾驶的车辆，而不是驾驶员本身。

这个区别很重要，因为它改变了你从阅读源码中学到什么。你研究的不是「Claude 如何思考」，而是 **Anthropic 如何构建让 Claude 发挥最佳状态的环境**——在生产环境中，在规模化场景下，面对真实用户。

当你仔细阅读那 512,000 行代码时，你会发现它极具启发性。

### 源码揭示了什么

关于 AI 编码 Agent 的常见心智模型是这样的：

```
用户消息 → LLM 调用 → 解析响应 → if tool_call: 执行工具 → 循环
```

简洁。干净。一个周末就能教会。

而 Claude Code 源码中的现实截然不同：

```
用户消息
    → 快速路径检查（--version、--help 等 < 5ms 退出）
    → 延迟模块求值（main.tsx 804KB；不加载不需要的模块）
    → 并行预取（config + auth + MCP 初始化并发触发）
    → 命令注册表检查（100+ 斜杠命令，在触碰模型之前）
    → 系统提示词组装（10+ 来源，SYSTEM_PROMPT_DYNAMIC_BOUNDARY 控制缓存）
    → StreamingToolExecutor 在流式传输中途触发工具（不等完整响应）
    → 并发工具执行（isConcurrencySafe() → 读并行，写互斥）
    → 结果预算强制（截断以防止上下文溢出）
    → Token 预算检查（> 95% 满 → 7 策略压缩管道）
    → 权限竞赛（hooks + 分类器 + 用户确认并发；先返回安全信号者胜出）
    → 遥测（StatsD 指标 + Sentry 错误 + 按模型成本追踪）
    → 循环
```

**循环不是难点。边界才是难点。**

这就是 512,000 行代码教给你的：生产级 Agent 大部分不是 LLM 调用，而是精心的资源管理——上下文窗口、Token 预算、权限系统、错误恢复、流式基础设施。模型占代码的 20%，Harness 占 80%。

### 教科书无法教给你的

关于生产级 Agent 工程，有四件事是教科书示例系统性地隐藏的：

**1. 流式传输中途的工具执行。**
每个教程的写法都是：接收完整响应 → 解析工具调用 → 执行工具 → 发送结果。Claude Code 的 `StreamingToolExecutor` 在分隔符边界处触发工具——响应仍在流式传输时。这不是微优化，而是一个改变 Agent 使用体验的架构决策。

**2. 上下文是有限资源。**
上下文窗口不是「现在就很大了」。生产 Agent 仍然会触及限制。Claude Code 有七个独立的压缩策略按优先级顺序触发：剪除重复系统消息、微压缩近期工具结果、折叠长文件读取、汇总整个对话。漏掉其中任何一个，你就会在 200K tokens 时遭遇静默失败。

**3. 权限竞赛。**
朴素的模式是：检查权限 → 如果通过，运行工具 → 显示结果。Claude Code 并发运行三件事：Shell hooks、AI 分类器和用户确认对话框。第一个返回安全信号的获胜。这意味着大多数工具在没有明显延迟的情况下运行，分类器从你的审批模式中学习。

**4. 多 Agent 即文件 I/O。**
不是框架，不是图。`coordinatorMode.ts` 派生子进程，继承父进程的提示词缓存，将结果写入临时文件，协调器读取这些文件。Fork 子 Agent 以近乎零成本共享上下文。所谓「架构」，不过是进程派生加一个 glob。

这些模式不会出现在任何 Agent 教程中。它们出现在 Claude Code 的源码里——静静地，没有文档，精确地做它们需要做的事。

---

## 隐藏在源码中

泄露还暴露了 Anthropic 从未公开的功能。

**BUDDY** — 虚拟伴侣系统。每个用户都会获得一个由 Mulberry32 PRNG（以 userId 为种子）生成的确定性伙伴。伙伴有名字、物种、情绪，以及 0.01% 的概率成为闪光传说级。它被设计为出现在输入框旁边的对话气泡中。从未发布。

**KAIROS** — 「常驻 Claude」。一个持续运行的后台 Agent，监控你的代码库变化，维护运行中的上下文日志，在你睡觉时为下一次会话做准备。不是一次性 CLI 工具——而是一个守护进程。名字来自古希腊语中「时机」的概念。

**Undercover 模式** — 一个允许 Claude Code 以不同 AI 助手身份呈现自己的系统。实现方式暗示企业白标，名字暗示别的东西。

**推测执行** — 在用户阅读上一个响应时预先运行可能的下一步操作。如果用户确认，结果已经准备好；如果不确认，结果被丢弃。Claude Code 在你不知情的情况下已经提前思考了。

这些功能足够完整，可以在源码中找到；又足够不完整，从未发布。它们是 Claude Code 去向的地图。

---

## 这个仓库做什么

这不是一个构建 Agent 的教程。[learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) 已经做了那件事。

这是源码考古——对 512,000 行生产 TypeScript 的系统性解剖，提取让 Claude Code 运作的工程决策、架构模式和隐藏机制。

```
                    真正的 AGENT LOOP（query.ts）
                    ==============================

    用户输入
         |
         v
    [ 快速路径？]---是---> exit(0)，所有 import 都未加载
         |
         否
         |
         v
    [ 斜杠命令？]---是---> commandRegistry.dispatch()
         |
         否
         |
         v
    构建 messages[] ←──────────────────────────────┐
         |                                          |
         v                                          |
    组装系统提示词                                    |
    （10+ 来源，缓存边界）                            |
         |                                          |
         v                                          |
    流式 API 调用 ────────────────────────────────────┼──> 遥测
         |                                          |
         | （流式传输中途）                           |
         v                                          |
    StreamingToolExecutor 触发工具                   |
    （如果 isConcurrencySafe() 则并发）               |
         |                                          |
         v                                          |
    注入工具结果                                      |
         |                                          |
         v                                          |
    [ tokenBudget > 95%？]---是---> compressContext()
         |                                          |
         v                                          |
    [ 还有工具调用？]---是─────────────────────────┘
         |
         否
         |
         v
    渲染响应（Ink/React → 终端）


    教科书中缺失的内容：
    - 流式传输中途的工具执行
    - 并发工具调度
    - 自动上下文压缩
    - 权限竞赛（与工具执行并行运行）
    - 每次 API 调用的成本追踪
```

**15 章 + 3 Plus 章节。每章逆向工程一个架构机制。**

> **c01** &nbsp; *「快速路径在 import 任何模块前就退出；昂贵的 I/O 与模块求值并行运行」* — 一个 804KB 的 TypeScript 单体如何在 500ms 内启动
>
> **c02** &nbsp; *「StreamingToolExecutor 在流式传输中途触发工具，不等完整响应」* — 真正的 Agent Loop：流式传输、飞行中的工具、自动压缩
>
> **c03** &nbsp; *「工具声明 isConcurrencySafe()——读并行，写互斥」* — 编排 40+ 个工具：并发执行与结果预算
>
> **c04** &nbsp; *「命令是用户发起的 UI 操作；工具是模型发起的 API 操作」* — 100+ 斜杠命令：注册、调度、命令与工具的区别
>
> **c05** &nbsp; *「SYSTEM_PROMPT_DYNAMIC_BOUNDARY 将静态（全局缓存）与动态（每会话）分离」* — 110+ 个字符串组装成一个系统提示词，以及缓存经济学
>
> **c06** &nbsp; *「七个独立策略按优先级顺序触发：snip → microcompact → collapse → summarize」* — 上下文作为有限资源，七种压缩策略
>
> **c07** &nbsp; *「Auto-Dream 运行四个阶段（orient→gather→consolidate→prune），配备只读 bash 子 Agent」* — 通过 CLAUDE.md 持久化和 Auto-Dream 整合实现跨会话记忆
>
> **c08** &nbsp; *「Hooks/分类器与用户确认并发竞赛——先返回者胜出」* — 五层权限栈与权限竞赛
>
> **c09** &nbsp; *「Hooks 可以修改工具输入、阻断执行或注入系统消息」* — Hook 生命周期：PreToolUse、PostToolUse、三种后端
>
> **c10** &nbsp; *「Fork 子 Agent 以近乎零成本共享父进程的提示词缓存」* — 一个 Claude 指挥众多：Coordinator Mode、文件 IPC、缓存共享
>
> **c11** &nbsp; *「18 个延迟工具通过 ToolSearchTool 按需加载，将基础提示词保持在 200K tokens 以下」* — MCP：通过延迟工具加载实现无限扩展
>
> **c12** &nbsp; *「三个 Interning Pool（Char/Style/Hyperlink）将 O(n) 字符串比较转为 O(1) 整数检查」* — React 在终端中运行：自定义 Reconciler、Yoga 布局、双缓冲屏幕
>
> **c13** &nbsp; *「Bun feature() 在编译时消除代码；GrowthBook/Statsig 在运行时控制特性」* — 双特性门控：编译时 DCE + 运行时标志，108 个缺失模块
>
> **c14** &nbsp; *「断路器（最多 3 次连续失败）防止无限重试循环」* — 可观测性：双遥测通道、成本追踪、11 步错误恢复
>
> **c15** &nbsp; *「BUDDY 使用以 userId 为种子的 Mulberry32 PRNG——0.01% 概率获得闪光传说」* — 源码中的秘密：BUDDY、KAIROS、Undercover、推测执行
>
> **p01** &nbsp; `[PLUS]` *「为什么 80% 重要的内容是动态上下文，而不是静态提示词？」* — Context Engineering：2026 年的范式转移
>
> **p02** &nbsp; `[PLUS]` *「Demo Agent 与生产 Agent 的区别，几乎完全在于脚手架」* — Agent 脚手架：为什么 Harness 比提示词更重要
>
> **p03** &nbsp; `[PLUS]` *「工业级 Agent 是 20% LLM 调用 + 80% 精心的资源管理」* — Claude Code 揭示的 2026 年 Agent 架构

---

## 源码

本分析使用的 Claude Code 源码从 npm 包 `@anthropic-ai/claude-code` 2.1.88 版本中提取，通过错误包含的 `cli.js.map` sourcemap 文件获得。

泄露已被多位安全研究员确认并广泛记录。这是同一个错误第二次发生（第一次是 2025 年 2 月）。

源码镜像：**[github.com/674019130/claude-code](https://github.com/674019130/claude-code)**
原始镜像：[github.com/Kuberwastaken/claude-code](https://github.com/Kuberwastaken/claude-code)

讨论：
- [Hacker News](https://news.ycombinator.com/item?id=47584540)
- [DEV Community 分析](https://dev.to/gabrielanhaia/claude-codes-entire-source-code-was-just-leaked-via-npm-source-maps-heres-whats-inside-cjo)

---

## 快速开始

```sh
git clone https://github.com/674019130/learn-real-claude-code
cd learn-real-claude-code/web
npm install
npm run dev     # http://localhost:3000
```

### Web 平台功能

| 页面 | 说明 |
|------|------|
| `/[locale]/c01` — `/c15` | 章节教程，含交互式可视化 |
| `/[locale]/architecture` | SVG 架构图——悬停追踪数据流 |
| `/[locale]/flow` | 完整请求生命周期步进演示（9 步） |
| `/[locale]/compare` | 朴素实现 vs 生产实现：5 个并排对比 |
| `/[locale]/explorer` | 浏览全部 1,902 个源文件，支持搜索与过滤 |

支持英文和中文（`/en/...`、`/zh/...`）。

---

## 项目架构

```
learn-real-claude-code/
├── docs/
│   ├── en/          # 英文教程 Markdown（c01-c15, p01-p03）
│   └── zh/          # 中文教程 Markdown（c01-c15, p01-p03）
├── source -> ~/Projects/claude-code-leaked/   # 源码符号链接
└── web/
    ├── scripts/
    │   └── extract-source.ts    # 索引源码 → docs.json + source-index.json
    └── src/
        ├── app/[locale]/
        │   ├── page.tsx         # 首页
        │   ├── (learn)/
        │   │   ├── [chapter]/   # 章节页（学习 / 可视化 / 代码 / 深度剖析）
        │   │   ├── architecture/
        │   │   ├── flow/
        │   │   ├── compare/
        │   │   └── explorer/
        ├── components/
        │   ├── layout/          # header, sidebar
        │   ├── visualizations/  # c01-c15 交互式 SVG 组件
        │   └── docs/            # Markdown 渲染器
        └── data/generated/      # docs.json, source-index.json（由 extract-source.ts 生成）
```

## 不包含的内容

本仓库从源码分析 Claude Code 的架构。它不会：

- 复现 Claude Code 的功能（构建竞争性 AI 编码工具不是目标）
- 包含完整的 512K 行源码（改为链接到镜像）
- 对 Anthropic 的意图、路线图或内部决策做任何声明
- 保证准确性——源码分析涉及解读

Plus 章节（p01-p03）包含关于 2026 年 Agent 工程趋势的观点。请将其视为分析，而非事实。

---

## 许可证

MIT

---

**源码不会说谎。512,000 行代码告诉你：生产 Agent 大部分是管道工程。**

**读懂管道。构建更好的 Agent。**
