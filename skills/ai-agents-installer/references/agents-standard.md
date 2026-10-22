# AGENTS.md + .agents 行业标准

本 skill 落地的目录结构遵循两个事实标准：

1. **AGENTS.md**：仓库根目录下由 AI 编程助手（Cursor / Claude / Trae / Codex 等）自动识别的「工作准则」文件，等价于贡献者文档但面向 AI agent。
2. **`.agents/`**：项目内统一收纳 AI 工具集（skills / rules / agents）的目录，行业内已形成事实约定（参见 [agents-md/.agents 规范草案](https://github.com/agentsmd/agents-md) 与各 AI 编程助手 IDE 文档）。

## 顶层布局

```
<project-root>/
├── AGENTS.md                        # AI 工作准则（索引 + 硬约束摘要）
├── CLAUDE.md                        # 可选：Claude Code 兼容薄指针
└── .agents/
    ├── README.md                    # 目录说明与维护约定
    ├── skills/                      # 已安装的 skill（按 description 触发）
    │   ├── README.md                # skills 索引骨架
    │   └── <skill-name>/SKILL.md    # 单个 skill
    └── rules/                       # 已安装的 rule（始终生效）
        ├── README.md                # rules 索引骨架
        └── <rule-name>/*.md         # rule 文档集（架构正文落点）
```

| 路径 | 是否提交 git | 作用 |
|------|--------------|------|
| `AGENTS.md` | 是 | 项目级 AI 工作准则（索引型，不写大段架构） |
| `CLAUDE.md` | 是（推荐） | Claude Code 兼容入口；**仅薄指针**，正文见 AGENTS + rules |
| `.agents/README.md` | 是 | 协作者阅读入口 |
| `.agents/skills/<name>/` | 是 | 项目级 skill 落点，AI 助手按 description 触发 |
| `.agents/rules/<name>/` | 是 | 项目级 rule 落点，AI 助手始终消费；**项目解构 / 架构单一事实源** |

> 与「个人 skills 目录」（如 `~/.cursor/skills/`）的区别：项目级 `.agents/skills/` 是**提交到仓库**的，团队成员 / CI 拉代码后即可共享同一套 AI 工具集。

## 内容分层（CLAUDE ↔ AGENTS ↔ rules）

**双入口、单正文**：`CLAUDE.md` 与 `AGENTS.md` 都可被助手发现，但架构 / 目录树 / 命令速查等正文**只**写在 `.agents/rules/`。

| 层 | 写什么 | 不写什么 |
|----|--------|----------|
| `CLAUDE.md` | 指向 AGENTS / `.agents/` 的 10～15 行说明 | 项目结构树、核心架构、命令表 |
| `AGENTS.md` | Overview、目录边界摘要、Conventions、Installed toolset、Key patterns 链接 | 大段 Project-specific patterns、长代码块 |
| `.agents/rules/` | 目录树、前后端架构、dev-workflow、硬约束 | — |
| `.agents/skills/` | 按需 SOP / 模板 | 始终生效的硬约束（应放 rule） |

完整迁移面板与落点表见 [claude-and-agents.md](./claude-and-agents.md)。

## AGENTS.md 必备段落

| 段落 | 必填 | 内容要点 |
|------|------|----------|
| `# Project Agent Guide`（标题） | 是 | 项目名 + 一句话定位 |
| `## Overview` | 是 | 项目用途、技术栈概览 + 指向 `.agents/rules/` |
| `## Working directory` | 是 | 主要改动落在哪些目录（前端 / 后端 / 工具链） |
| `## Language & framework` | 是 | 主要使用语言与框架版本范围 |
| `## Conventions` | 是 | 命名 / 文件结构 / Git commit 规范等硬约束（短 bullet） |
| `## Key patterns`（索引） | 推荐 | 2～4 条链接到 rule，勿粘贴架构正文 |
| `## Installed toolset` | 是 | 列出当前 `.agents/skills/`、`.agents/rules/` 下的 skill / rule 与一句话用途 |
| `## Do not` | 是 | 反模式清单（须含：勿双份维护 CLAUDE 架构正文） |

模板见 [assets/templates/AGENTS.md.tpl](../assets/templates/AGENTS.md.tpl)、[assets/templates/CLAUDE.md.tpl](../assets/templates/CLAUDE.md.tpl)。

## .agents/skills/ vs .agents/rules/

| 维度 | skill | rule |
|------|-------|------|
| 触发 | 按 description 中的关键词按需加载 | 始终生效，常驻上下文 |
| 内容 | 方法论 + checklist + 模板 | 硬约束 / 强制工作流 |
| frontmatter | 必须有 `name` + `description` | 无强制 frontmatter，按 Markdown 组织 |
| 落点 | `skills/<name>/SKILL.md` + 可选子目录 | `rules/<name>/*.md`（一组围绕同一框架的硬约束文件） |
| 安装方式 | `npx skills add <repo> --skill <name>` | 从源仓库 `rules/<name>/` 直接拷贝（`npx degit` / `cp -r`） |

## 命名约束

- skill 目录全小写、连字符 `-` 分隔
- 禁止 `skill` / `helper` / `tool` 等泛词
- 长度 2~5 个单词
- 与 source 仓库中的 skill / rule 目录名逐字符一致

## 与既有 AI 助手的兼容

| 助手 | 是否自动识别 | 说明 |
|------|--------------|------|
| Cursor | 是（`.cursor/` + `.agents/` 均可） | 优先识别 `.cursor/skills/`，但同样会扫描 `.agents/skills/` |
| Claude Code | 是 | 常读根 `CLAUDE.md`；本 skill 用**薄指针**指向 `AGENTS.md` + `.agents/`，避免双份正文 |
| Trae | 是 | 识别 `.agents/` |
| Codex CLI | 是 | 识别 `AGENTS.md` + `.agents/` |
| Continue | 部分 | 需在 `config.json` 中显式配置路径 |

> 在不熟悉的 IDE 上，**最稳的写法**：`.agents/skills/` + `.agents/rules/` + 根 `AGENTS.md` + 可选薄指针 `CLAUDE.md`。本 skill 默认这套布局。

## 可选：保留 `node_modules/.skills/`

若所在 IDE 仍按 `node_modules/.skills/` 自动发现 skill，可在 `scripts/scaffold.mjs` 加 `--keep-node-skills` 标志，把 skill 同时复制一份到 `node_modules/.skills/<name>/`。**不推荐**：易与 `.agents/skills/` 不一致，且不会被 git 跟踪。
