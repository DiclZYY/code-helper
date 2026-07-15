# {{PROJECT_NAME}} — Agent Guide

AI 编程助手（Cursor / Claude / Trae / Codex 等）请先阅读本文件，再开始改动代码。

## Overview

`{{PROJECT_NAME}}` 是一个使用 {{PRIMARY_LANG}} 的项目。本文件约束 AI 助手的工作范围、协作约定与可用工具集。

## Working directory

主要改动落在：

- 前端：`<fill>`
- 后端：`<fill>`
- 工具链：`<fill>`

不在 AI 助手权限内的目录：`node_modules/`、`.git/`、`vendor/`、自动生成代码。

## Language & framework

- 主要语言：`<fill>`
- 主要框架：`<fill>`
- 包管理：`<fill>`（npm / pnpm / yarn / composer）

## Conventions

- 命名：`<fill>`
- 文件结构：`<fill>`
- Git commit：`<fill>`
- 代码风格：`<fill>`

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
- 不要在 `AGENTS.md` 写大段代码片段，方法论放到对应的 `.agents/skills/<name>/`

## Updating

修改本文件后请同步：

1. 更新「Installed toolset」段落
2. 若新增 / 删除顶级段落，在 [references/agents-standard.md](../references/agents-standard.md) 校对一遍
