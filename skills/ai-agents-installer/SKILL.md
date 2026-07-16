---
name: ai-agents-installer
description: >-
  Initializes a project's AI toolset following the AGENTS.md + .agents
  industry standard. Detects whether AGENTS.md or .agents exist, scaffolds
  the standard layout (AGENTS.md, .agents/README.md, .agents/skills/,
  .agents/rules/) from bundled templates, and installs skills / rules from a
  configured repository (default: DiclZYY/code-helper) into
  .agents/skills and .agents/rules via npx skills add. Use when bootstrapping
  or scaffolding an AI toolset, AGENTS.md, .agents directory, agent workflow,
  or installing a skill/rule from a repo into a project's .agents layout.
license: MIT
compatibility: Requires Node.js 18+, npx, and network access to GitHub for `npx skills add` / `npx degit`.
---

# AI Agents Installer

把当前项目初始化为「符合 AGENTS.md + `.agents/` 行业标准」的 AI 编程助手工作区，并按需从仓库拉取 skill / rule。

- 标准与目录结构：[references/agents-standard.md](references/agents-standard.md)
- 命令与故障排查：[references/installer-commands.md](references/installer-commands.md)
- 模板文件：[assets/templates/AGENTS.md.tpl](assets/templates/AGENTS.md.tpl)、[assets/templates/agents-readme.md.tpl](assets/templates/agents-readme.md.tpl)、[assets/templates/skills-readme.md.tpl](assets/templates/skills-readme.md.tpl)、[assets/templates/rules-readme.md.tpl](assets/templates/rules-readme.md.tpl)
- 检测与生成脚本：[scripts/detect.mjs](scripts/detect.mjs)、[scripts/scaffold.mjs](scripts/scaffold.mjs)

## When to use

**适用：**

- 第一次给项目接入 AI 编程助手（Cursor / Claude / Trae 等），需要落地 AGENTS.md + `.agents/` 标准
- 已有项目里 AGENTS.md / `.agents/` 缺失或残缺，需要补齐骨架
- 想把仓库 `DiclZYY/code-helper` 里的某个或某些 skill / rule 安装到项目中，并放进 `.agents/skills` / `.agents/rules`
- 用户给出「在项目里装一下这个 skill」类需求，且当前项目尚未配套 `.agents/` 骨架

**不适用：**

- 仓库自身的 skill / rule 维护（在 `code-helper-skills` 仓内编辑 `skills/<name>/SKILL.md` 本身）
- 用户明确指定其它目录（如 `.cursor/`、`.claude/`）作为 AI 工具集落点，本 skill 仍可执行 init，但需要明确告知偏离 `.agents/` 默认
- 仅想在终端临时查看 / 调用某个 skill 而不需要持久化到项目

## Core pattern

```mermaid
flowchart TB
  subgraph project["目标项目根目录"]
    agentsMd["AGENTS.md<br/>AI 助手工作准则"]
    agentsDir[".agents/"]
    skillsDir[".agents/skills/"]
    rulesDir[".agents/rules/"]
    readmeA[".agents/README.md"]
    skillsReadme[".agents/skills/README.md"]
    rulesReadme[".agents/rules/README.md"]
    stackRule[".agents/rules/<stack-name>/<br/>frontend-stack.md + backend-stack.md + SOURCES.md"]
  end
  subgraph src["源仓库 (默认 DiclZYY/code-helper)"]
    srcSkills["skills/<name>/SKILL.md"]
    srcRules["rules/<name>/*.md"]
  end
  subgraph cli["本地 CLI"]
    npx["npx skills add <repo> --skill <name>"]
    detectCmd["detect.mjs --hint stack"]
  end
  detect["detect.mjs<br/>扫描 AGENTS.md / .agents/ 状态"] --> state{"已存在?"}
  state -- 缺失/残缺 --> scaffold["scaffold.mjs<br/>从 assets/templates 复制补齐"]
  state -- 完整 --> skipInit["跳过 init"]
  scaffold --> readmeA
  userAsk["用户要求安装 skill/rule"] --> pickTarget{"指定 .agents?"}
  pickTarget -- 默认 --> defaultLayout[".agents/skills 或 .agents/rules"]
  pickTarget -- 指定其它 --> otherLayout["用户指定目录"]
  srcSkills --> npx
  npx --> defaultLayout
  srcRules --> npx
  npx --> defaultLayout

  %% Step 1.5 深度分流
  detectCmd --> hintJson["hints: packageManager / primaryFrontend / primaryBackend / nodeVersion / phpVersion"]
  depth{"Step 1.5 面板<br/>深度?"}
  depth -- A: 立即解读源码 --> scan["Step 7: 扫描元数据 + 代表性业务文件"]
  scan --> deriveSpec["生成 frontend-stack.md / backend-stack.md / SOURCES.md"]
  deriveSpec --> stackRule
  deriveSpec --> fillAgentsMd["回填 AGENTS.md <fill> 占位"]
  fillAgentsMd --> agentsMd
  depth -- B: 只建立目录结构 --> skipDeep["跳过深度 init"]
```

### 标准布局

| 路径 | 作用 | 是否必建 |
|------|------|----------|
| `AGENTS.md` | AI 助手在项目中的工作准则（位置、语言、约束） | 是 |
| `.agents/` | AI 助手配置根目录 | 是 |
| `.agents/README.md` | 目录说明与维护约定 | 是 |
| `.agents/skills/` | 已安装 skill 落点（项目级） | 是 |
| `.agents/rules/` | 已安装 rule 落点（项目级） | 是 |
| `.agents/skills/README.md` | skills 子目录索引骨架 | 是 |
| `.agents/rules/README.md` | rules 子目录索引骨架 | 是 |

`.agents/` 下**不再**保留 `skills-npm` 风格的 `node_modules/.skills/<name>` 结构，而是直接把 skill 文件同步进 `.agents/skills/<name>/`。如确需保留 `node_modules/.skills/`（例如在 Cursor 中让 `npx skills` 自动发现），按 [references/installer-commands.md](references/installer-commands.md#可选-node_modulesskills-保留) 处理。

### 默认源仓库

- 仓库名：`DiclZYY/code-helper`
- 安装方式：`npx skills add <repo> --skill <name>`
- 用户可在执行时临时指定其它仓库，例如 `npx skills add antfu/skills --skill xxx`，仍落到 `.agents/skills/<name>/`

### Skill 与 Rule 的区分

| 类型 | 触发方式 | 内容特征 | 落点 |
|------|----------|----------|------|
| **skill** | 按 description 触发词按需加载 | 解决某类问题的完整方法论 + checklist + 模板 | `.agents/skills/<name>/SKILL.md` + 可选 `references/` `assets/` `scripts/` |
| **rule** | 始终生效，常驻上下文 | 硬约束 / 编码规范 / 强制工作流 | `.agents/rules/<name>/*.md`（一组围绕同一框架的硬约束文件） |

`npx skills add` 默认装的是 skill；rule 需要从源仓库的 `rules/<name>/` 直接拷贝到 `.agents/rules/<name>/`。

## Implementation checklist

### 1. 检测项目状态

执行 `node scripts/detect.mjs`（或自行实现等价扫描）：

- [ ] 项目根是否存在 `AGENTS.md`
- [ ] 是否存在 `.agents/` 目录
- [ ] 是否存在 `.agents/skills/`、`.agents/rules/`、`README.md`
- [ ] 是否存在 `.agents/skills/README.md`、`.agents/rules/README.md`
- [ ] 给出 `missing` / `partial` / `ready` 三档结论

完整检测脚本见 [scripts/detect.mjs](scripts/detect.mjs)。

### 1.5 询问 init 深度（确认面板）

检测完成后，调用 `AskUserQuestion` 让用户在面板中选择是否立即解读源码：

```yaml
questions:
  - header: init 深度
    multiSelect: false
    question: 检测完成。是否立即解读项目源码并自动生成前后端规范？
    options:
      - label: 立即解读源码 (推荐)
        description: 扫描 package.json / composer.json、目录结构、代表性业务文件，生成 .agents/rules/frontend-stack.md 与 backend-stack.md，并回填 AGENTS.md 的 Language & framework / Conventions 段
      - label: 只建立目录结构
        description: 保持当前行为：只生成 AGENTS.md + .agents/ 骨架，规范段留 <fill> 占位，后续手动填
```

**重要约束**：

- 选 A 时执行 Step 7「深度解读源码生成规范」
- 选 B 时**严禁**偷偷执行任何源码扫描（违反用户意图）；直接进入 Step 2
- 用户选完后再继续，不可省略面板

### 2. 生成缺失的骨架（仅写缺失项）

按检测结果**只写缺失文件**，不要覆盖已有内容：

- `AGENTS.md` → 复制 [assets/templates/AGENTS.md.tpl](assets/templates/AGENTS.md.tpl)，替换占位符
- `.agents/README.md` → [assets/templates/agents-readme.md.tpl](assets/templates/agents-readme.md.tpl)
- `.agents/skills/README.md` → [assets/templates/skills-readme.md.tpl](assets/templates/skills-readme.md.tpl)
- `.agents/rules/README.md` → [assets/templates/rules-readme.md.tpl](assets/templates/rules-readme.md.tpl)

`AGENTS.md.tpl` 包含以下占位符，生成时**必须**替换：

| 占位符 | 含义 | 示例 |
|--------|------|------|
| `{{PROJECT_NAME}}` | 项目名（package.json 的 `name` 字段或目录名） | `admin-pro-core` |
| `{{PRIMARY_LANG}}` | 主要使用语言 / 框架 | `Vue2 + Laravel` |
| `{{REPO_DEFAULT}}` | 默认 skill/rule 源仓库 | `DiclZYY/code-helper` |
| `{{DATE}}` | 初始化日期（YYYY-MM-DD） | `2026-07-15` |

生成脚本见 [scripts/scaffold.mjs](scripts/scaffold.mjs)。

### 3. 安装 skill

```bash
npx skills add {{REPO_DEFAULT}} --skill <skill-name>
```

- 默认目标目录：`.agents/skills/<skill-name>/`
- 若用户指定 `--to` / 自定义路径，记录到 `AGENTS.md` 的「已安装工具集」一节
- 安装后**确认** `.agents/skills/<skill-name>/SKILL.md` 的 frontmatter `name` 与目录名一致

### 4. 安装 rule

`npx skills` 不直接覆盖 rule，需从源仓库 `rules/` 拷贝：

```bash
# 从源仓库下载指定 rule（一次性）
npx degit {{REPO_DEFAULT}}/rules/<rule-name> .agents/rules/<rule-name>
```

或克隆后 `cp -r`。`.agents/rules/<rule-name>/` 下应是 `README.md` + 一组分类子 `.md`。

### 5. 更新 `AGENTS.md` 的「已安装工具集」

在 `AGENTS.md` 中追加（不要覆盖原有内容）：

```markdown
## 已安装工具集

- 源仓库：{{REPO_DEFAULT}}
- 初始化日期：{{DATE}}

### Skills

- `<skill-name>` — <一句话用途>

### Rules

- `<rule-name>` — <一句话硬约束主题>
```

### 6. 后续默认

完成 init 后，**所有后续 skill / rule 安装默认走 `.agents/skills/`、`.agents/rules/`**；除非用户在执行时显式声明其它落点。每次安装后回写 `AGENTS.md` 的「已安装工具集」列表。

### 7. 深度解读源码生成规范（可选，仅当 Step 1.5 选 A 时执行）

本步骤把项目源码的固定模式（命名 / 目录 / mixin / 三件套 / 样式约定等）抽取出来，自动生成两份 rule 并回填 `AGENTS.md` 的占位段。详细执行手册见 [references/derive-stack-spec.md](references/derive-stack-spec.md)。

#### 7.1 获取项目元数据 hint

执行：

```bash
node scripts/detect.mjs --hint stack [projectRoot]
```

JSON 输出中读取 `hints` 字段：`packageManager` / `primaryFrontend` / `primaryBackend` / `nodeVersion` / `phpVersion`。

#### 7.2 扫描代表性业务文件（深扫：模式级）

AI 自行决定读哪些文件，但**至少**覆盖下列样本：

- 前端：1 个列表页 + 1 个表单/详情页（识别 listMixin / routeMixin / dictMixin / form rules 模式）
- 后端：1 个 Model + 1 个 Repository + 1 个 Controller + 1 个 routes 片段
- 公共：1 个 utils 文件（识别 money / region / 日期等工具约定）
- 样式：1 个 .scss / `<style>` 片段（识别 BEM / 命名空间 / 主题色变量）

**严格限制**：

- 每个文件读不超过 200 行（用 Read 工具的 `limit` 参数）
- **不要扫描** `.git/` / `node_modules/` / `vendor/` / `dist/` / `build/` / `.agents/` / `.cursor/`
- 选**简单业务模块**（如 project / order），避开带状态机 / 工作流 / 复杂报表的脏样本
- 单文件超过 500 行跳过，换选目录中较小者

#### 7.3 生成前后端规范 rule

目录结构：

```
.agents/rules/<stack-name>/
├── frontend-stack.md      # 仅当 primaryFrontend !== 'none'
├── backend-stack.md       # 仅当 primaryBackend !== 'none'
└── SOURCES.md             # 扫描源文件清单（审计）
```

`<stack-name>` 命名规则：

- 仅前端：`vue2` / `vue3` / `react`
- 仅后端：`laravel` / `node`
- 前后端皆有：`vue2-laravel` / `vue3-laravel` / `react-laravel` / `react-node`

每份规范文件模板（≤ 200 行，bullet 而非长段）：

```markdown
# <Stack> Stack Conventions

> 由 ai-agents-installer 在 <DATE> 自动生成，基于 <N> 个代表性文件。
> 后续修改请同步 AGENTS.md 的 Installed toolset 段落。

## Tech stack

- 框架 / 版本：...
- 包管理：...
- 运行时版本：...

## Directory layout

- ...

## Naming

- 组件 / 类 / 文件命名：...

## Key patterns

- <从扫描中观察到的固定模式，3~5 条>

## Anti-patterns

- <扫描中发现的违反当前规范的反例或常见误用>
```

#### 7.4 回填 AGENTS.md 占位段

按 `AGENTS.md.tpl` 中的 HTML 注释锚点（`<!-- ai-agents-installer:<section>:<key>-->` … `<!-- /ai-agents-installer:<section>:<key>-->`）定位 `<fill>` 占位并替换：

| 锚点 section | 锚点 key | 替换内容来源 |
|--------------|----------|--------------|
| `working-dir` | `frontend` / `backend` / `toolchain` | 7.1 hint + 7.2 扫描到的目录 |
| `language` | `primary` / `framework` / `pkgmanager` | hint |
| `conventions` | `naming` / `filestructure` / `gitcommit` / `codestyle` | 7.2 模式观察 |

**严格约束**：

- 不修改锚点注释本身
- 不修改任何非 `<fill>` 内容
- 不修改列表项标签文本（如「- 前端：」中的 `前端` 必须保留）
- 不删除括号注释（如「(npm / pnpm / yarn / composer)」），只替换 `<fill>` 部分
- 替换失败（找不到锚点）时跳过该项并 console 输出 warning，不报错

#### 7.5 更新 Installed toolset

在 `AGENTS.md` 的 `### Rules` 段落下追加一行（找到首个 bullet 行作为插入位置）：

```markdown
- `<stack-name>` — <一句话主题>，自动生成于 <DATE>
```

**不覆盖**已有 bullet。

#### 7.6 输出审计清单

在控制台输出 `Scanned files:` 列表，并写入 `.agents/rules/<stack-name>/SOURCES.md`：

```markdown
# Scan Sources

> 本目录的规范由 ai-agents-installer 在 <DATE> 基于以下文件生成。

## Frontend

| 文件 | 角色 | 行数 |
|------|------|------|

## Backend

| 文件 | 角色 | 行数 |
|------|------|------|

## Shared

| 文件 | 角色 | 行数 |
|------|------|------|
```

## Anti-patterns

- 把 skill 装到 `node_modules/.skills/` 后**不**同步到 `.agents/skills/`，导致项目提交到 git 后别的协作者 AI 助手看不到
- 覆盖用户已有的 `AGENTS.md`，丢失项目既有约定
- 把所有 skill 全装到一个扁平目录，丢失 `references/` `assets/` `scripts/` 的子目录结构
- 把 rule 当 skill 装（`npx skills add` 不适用于硬约束型 rule）
- 在 `AGENTS.md` 写「所有约束」后仍让 `.agents/skills/` 与 `.agents/rules/` 缺失 → 工具集只挂在 AGENTS.md，AI 助手无法按 description 触发
- 跨平台时忽略 PowerShell 与 `npx degit` 的差异（见 [references/installer-commands.md](references/installer-commands.md#跨平台注意)）
- 把 `code-helper-skills` 的仓库地址写死成 `code-helper`（仓库名是 `code-helper-skills`），导致 `npx skills add` 找不到
- 不回写 `AGENTS.md` 的「已安装工具集」，后续接手者无法快速知道项目挂了哪些 skill / rule
- 在 Step 1.5 选 B 时仍偷偷执行 Step 7 → 违反用户意图（必须按面板选项严格执行）
- Step 7 扫描到 `node_modules/` / `vendor/` / `.git/` / `dist/` / `build/` → 浪费 token 且干扰模式识别
- Step 7 选带特殊业务（状态机 / 工作流 / 报表）的脏样本 → 模式被特例淹没，输出规范失真
- Step 7 把 `frontend-stack.md` / `backend-stack.md` 写成大段叙述而非 bullet checklist → 不便于 AI 助手直接消费
- Step 7 覆盖 AGENTS.md 中用户已有的非 `<fill>` 内容 → 破坏用户既有约定（必须严格按锚点替换）
- Step 7 修改锚点注释本身 → 后续替换算法失效
- Step 7 跳过 SOURCES.md 审计清单 → 用户无法复核扫描范围

## Cross-platform notes

- macOS / Linux 直接用 `npx` + `cp -r`
- Windows PowerShell 用 `Copy-Item -Recurse` 代替 `cp -r`；`degit` 在 PowerShell 下需注意参数转义
- `npx skills add` 自带跨平台 shim，但若 `.agents/` 路径含空格或中文，先做路径 quote

## Additional resources

- [references/agents-standard.md](references/agents-standard.md) — AGENTS.md + `.agents/` 行业标准来源与字段含义
- [references/installer-commands.md](references/installer-commands.md) — `npx skills add` / `npx degit` 命令、跨平台、故障排查
- [references/derive-stack-spec.md](references/derive-stack-spec.md) — Step 7 深度解读源码：扫描源清单、输出模板、AGENTS.md 回填算法
- [assets/templates/AGENTS.md.tpl](assets/templates/AGENTS.md.tpl) — 根 `AGENTS.md` 模板
- [assets/templates/agents-readme.md.tpl](assets/templates/agents-readme.md.tpl) — `.agents/README.md` 模板
- [assets/templates/skills-readme.md.tpl](assets/templates/skills-readme.md.tpl) — `.agents/skills/README.md` 模板
- [assets/templates/rules-readme.md.tpl](assets/templates/rules-readme.md.tpl) — `.agents/rules/README.md` 模板
- [scripts/detect.mjs](scripts/detect.mjs) — 检测项目当前 AGENTS.md + `.agents/` 状态
- [scripts/scaffold.mjs](scripts/scaffold.mjs) — 仅写缺失骨架文件
