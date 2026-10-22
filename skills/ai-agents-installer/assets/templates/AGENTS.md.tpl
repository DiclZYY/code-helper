# {{PROJECT_NAME}} — Agent Guide

AI 编程助手（Cursor / Claude / Trae / Codex 等）请先阅读本文件，再开始改动代码。

## Overview

`{{PROJECT_NAME}}` 是一个使用 {{PRIMARY_LANG}} 的项目。本文件约束 AI 助手的工作范围、协作约定与可用工具集。

项目解构、架构与硬约束详见 [`.agents/rules/`](.agents/rules/)；流程类 SOP 见 [`.agents/skills/`](.agents/skills/)。根目录 `CLAUDE.md` 仅为兼容入口（薄指针），不维护双份正文。

## Working directory

主要改动落在：

<!-- ai-agents-installer:working-dir:frontend -->
- 前端：`<fill>`
<!-- /ai-agents-installer:working-dir:frontend -->
<!-- ai-agents-installer:working-dir:backend -->
- 后端：`<fill>`
<!-- /ai-agents-installer:working-dir:backend -->
<!-- ai-agents-installer:working-dir:toolchain -->
- 工具链：`<fill>`
<!-- /ai-agents-installer:working-dir:toolchain -->

不在 AI 助手权限内的目录：`node_modules/`、`.git/`、`vendor/`、自动生成代码。

## Language & framework

<!-- ai-agents-installer:language:primary -->
- 主要语言：`<fill>`
<!-- /ai-agents-installer:language:primary -->
<!-- ai-agents-installer:language:framework -->
- 主要框架：`<fill>`
<!-- /ai-agents-installer:language:framework -->
<!-- ai-agents-installer:language:pkgmanager -->
- 包管理：`<fill>`（npm / pnpm / yarn / composer）
<!-- /ai-agents-installer:language:pkgmanager -->

## Conventions

<!-- ai-agents-installer:conventions:naming -->
- 命名：`<fill>`
<!-- /ai-agents-installer:conventions:naming -->
<!-- ai-agents-installer:conventions:filestructure -->
- 文件结构：`<fill>`
<!-- /ai-agents-installer:conventions:filestructure -->
<!-- ai-agents-installer:conventions:gitcommit -->
- Git commit：`<fill>`
<!-- /ai-agents-installer:conventions:gitcommit -->
<!-- ai-agents-installer:conventions:codestyle -->
- 代码风格：`<fill>`
<!-- /ai-agents-installer:conventions:codestyle -->

## Key patterns（索引）

> 架构细节写在 `.agents/rules/`，此处只保留链接，勿粘贴大段正文。

- 目录边界 / 目录树 → `.agents/rules/` 中对应 `repo-structure` 或等价文件
- 前端约定 → `.agents/rules/` 中对应 `frontend-*`
- 后端约定 → `.agents/rules/` 中对应 `backend-*`
- 本地启动与命令 → `.agents/rules/` 中对应 `dev-workflow`

## Installed toolset

- 源仓库：`{{REPO_DEFAULT}}`
- 初始化日期：`{{DATE}}`

### Skills

> 命名规范：`<skill-name>` — `<一句话用途>`

<!-- 安装后追加，例如： -->
<!-- - `spa-naf`（SPA Native App Framework） — Tab 主壳 + 子页叠层 + slide 转场 + keep-alive -->

### Rules

> 命名规范：`<rule-name>` — `<一句话硬约束主题>`

<!-- 安装后追加，例如： -->
<!-- - `apc-framework` — admin-pro-core 框架硬约束（前后端、构建、发布、安全） -->

## Do not

- 不要把 skill / rule 装到 `node_modules/.skills/` 后不同步到 `.agents/`
- 不要修改 `AGENTS.md` 的「Conventions」段落除非用户明确要求
- 不要把 `{{REPO_DEFAULT}}` 改成个人 fork 仓库而不告知协作者
- 不要在 `AGENTS.md` 写大段代码片段或 Project-specific patterns；方法论进 `.agents/skills/`，架构细节进 `.agents/rules/`
- 不要再维护独立的大段 `CLAUDE.md` 或双份项目解构；根 `CLAUDE.md` 仅为兼容入口

## Updating

修改本文件后请同步：

1. 更新「Installed toolset」段落
2. 若新增 / 删除顶级段落，在 skill 的 [references/agents-standard.md](../references/agents-standard.md) 校对一遍
