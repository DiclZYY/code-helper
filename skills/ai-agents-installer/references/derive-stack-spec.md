# Derive Stack Spec（深度解读源码 → 生成前后端规范）

> 本文档对应 SKILL.md 中 Step 7「深度解读源码生成规范」的详细执行手册。  
> 仅当 Step 1.5 面板中用户选择「立即解读源码」时执行。

## 1. 总体流程

```
detect.mjs --hint stack    →  项目元数据 hint（package.json / composer.json / 顶层目录）
        ↓
AI 读取 hint + 扫描代表性文件
        ↓
生成立两份规范 rule（前端 / 后端，按代码存在与否取舍）
        ↓
按锚点注释回填 AGENTS.md 占位段
        ↓
更新 AGENTS.md「Installed toolset」
        ↓
写出 SOURCES.md 审计清单
```

## 2. 扫描元数据（Step 7.1）

由 `detect.mjs --hint stack` 输出 JSON，AI 直接消费其中的 `hints` 字段。

### 2.1 detect.mjs 推断规则

| 字段 | 推断依据 |
|------|----------|
| `packageManager` | 同时存在 `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` → `pnpm` / `yarn` / `npm`；仅有 `package.json` → `npm`；存在 `composer.json` + `composer.lock` → `composer` |
| `primaryFrontend` | `package.json` dependencies 中匹配：`vue` → `vue2/vue3`（按主版本号）/ `react` → `react`；命中 `vite` / `webpack` → 标注构建工具 |
| `primaryBackend` | `composer.json` `require` 中匹配：`laravel/framework` → `laravel`；否则读 `composer.json` `type` / `require` 推断（`php` → `php`，无 → `none`） |
| `nodeVersion` | `package.json` `engines.node` |
| `phpVersion` | `composer.json` `require.php` |

### 2.2 AI 补充扫描

读完 hint 后 AI 自行补充（不写脚本）：

- `package.json` `scripts` 中提取 `lint` / `build` / `test` 命令
- 顶层目录结构（depth=2 的 readdir 结果）：识别 `src/` / `app/` / `backend/` / `api/` 等
- README.md / docs/（若有）：项目名、一句话用途

## 3. 扫描代表性业务文件（Step 7.2）

### 3.1 候选清单（按技术栈）

| 技术栈 | 前端必扫 | 后端必扫 | 公共 / 样式 |
|--------|----------|----------|-------------|
| Vue2 + Laravel | `src/views/<module>/index.vue` + `create.vue` | `app/Http/Controllers/Api/<Module>Controller.php` + `app/Models/<Module>.php` + `app/Repositories/Implement/<Module>Repository.php` + `api/routes/api.php` 片段 | `src/utils/money.js`（或类似）+ 一个 `.scss` / `<style>` 片段 |
| Vue3 + Node | `src/views/<module>/index.vue` + 1 表单 | `src/controllers/<X>Controller.ts` + `src/models/<X>.ts` + 1 个 routes 片段 | 一个 `utils/` 工具 + 一个 `styles/` |
| React + Node | `src/pages/<module>/index.tsx` + 1 表单 | 同上 Node | 同上 |
| React + Laravel | `src/pages/<module>/index.tsx` + 1 表单 | 同 Vue2 Laravel | 同 Vue2 Laravel |

### 3.2 选取原则

- **优先简单业务模块**：选标准 CRUD 资源（如 project / order），**避开**带特殊业务（带工作流、带状态机、带报表）
- **优先目录命名短的模块**：如 `user` / `role` 优于 `business-collaboration-flow`
- 每个文件读**不超过 200 行**；用 Read 工具的 `limit` 参数截断
- **不要扫描**：`.git/`、`node_modules/`、`vendor/`、`dist/`、`build/`、`.agents/`、`.cursor/`
- **不要单文件超过 500 行**；如必要选该目录下较小的文件

### 3.3 每次扫描的输出

```json
{
  "scanned": [
    { "path": "src/views/project/index.vue", "role": "frontend-list-page", "lines": 187 },
    { "path": "src/views/project/create.vue", "role": "frontend-form-page", "lines": 162 },
    { "path": "app/Models/Project.php", "role": "backend-model", "lines": 98 },
    { "path": "app/Http/Controllers/Api/ProjectController.php", "role": "backend-controller", "lines": 54 },
    { "path": "app/Repositories/Implement/ProjectRepository.php", "role": "backend-repository", "lines": 110 },
    { "path": "api/routes/api.php", "role": "backend-routes", "lines": 30, "offset": 0 },
    { "path": "src/utils/money.js", "role": "shared-utils", "lines": 45 },
    { "path": "src/styles/variables.scss", "role": "frontend-styles", "lines": 60 }
  ]
}
```

写入 `.agents/rules/<stack-name>/SOURCES.md` 作为审计痕迹。

## 4. 输出 rule 文件（Step 7.3）

### 4.1 目录结构

```
.agents/rules/<stack-name>/
├── frontend-stack.md      # 若 primaryFrontend !== 'none'
├── backend-stack.md       # 若 primaryBackend !== 'none'
└── SOURCES.md             # 扫描源清单（审计）
```

`<stack-name>` 命名规则：

- 主前端决定：vue2 / vue3 / react / svelte
- 主后端为辅：laravel / node / php / none
- 仅前端：`vue2` / `vue3` / `react`
- 仅后端：`laravel` / `node`
- 前后端皆有：`vue2-laravel` / `vue3-laravel` / `react-laravel` / `react-node`

### 4.2 模板骨架

**frontend-stack.md**：

```markdown
# Frontend Stack Conventions — <STACK_NAME>

> 由 ai-agents-installer 在 <DATE> 自动生成，基于 <N> 个代表性文件。  
> 后续修改请同步 AGENTS.md 的 Installed toolset 段落。

## Tech stack

- 框架 / 版本：<e.g. Vue 2.7 + Vue Router 3 + Vuex 3>
- 构建工具：<vite / webpack 5>
- 包管理：<pnpm@8>
- Node：<engines.node>

## Directory layout

- <主前端代码目录>：...
- <组件 / 页面 / 路由 目录>：...
- <样式 / 工具 目录>：...

## Naming

- 组件文件：PascalCase / kebab-case
- 路由文件：kebab-case
- mixin：<listMixin / routeMixin / dictMixin / excelMixin>
- 视图目录：<module>（小写）

## Key patterns

- 列表页用 listMixin + routeMixin + dictMixin 组合
- 表单规则写在 data().rules 里，日期字段统一 value-format
- 金额字段统一走 utils/money.js 的 formatMoney
- 区域字段用 RegionSelector，禁止手输 el-input

## Anti-patterns

- 业务逻辑塞进全局 helper
- 不注册就写代码（漏 mainResources / ServiceFactory 类比项）
- 金额字段手写 toFixed(2)
```

**backend-stack.md** 模板结构同上，章节一致，技术栈相关填后端内容。

### 4.3 输出原则

- 每节用 bullet 而非长段叙述
- Key patterns 与 Anti-patterns 各 3~5 条
- 不超过 200 行

## 5. 回填 AGENTS.md（Step 7.4）

### 5.1 锚点定位

读取 AGENTS.md 后，按下列锚点定位 `<fill>` 占位（锚点格式：`<!-- ai-agents-installer:<section>:<key>-->` 与 `<!-- /ai-agents-installer:<section>:<key>-->`）：

| section | key | 替换内容 |
|---------|-----|----------|
| working-dir | frontend | 前端主要目录 |
| working-dir | backend | 后端主要目录 |
| working-dir | toolchain | 工具链目录 |
| language | primary | 主要语言 |
| language | framework | 主要框架 |
| language | pkgmanager | 包管理 |
| conventions | naming | 命名约定 |
| conventions | filestructure | 文件结构约定 |
| conventions | gitcommit | Git commit 规范 |
| conventions | codestyle | 代码风格 |

### 5.2 替换算法

伪代码：

```text
for each (section, key) in anchors:
    open = `<!-- ai-agents-installer:${section}:${key} -->`
    close = `<!-- /ai-agents-installer:${section}:${key} -->`
    read value from scan result
    replace the FIRST list item line between open and close
    pattern: `^- <label>：<fill>$` → `^- <label>：<value>$`
    PRESERVE: open/close 注释、行首 `-`、标签文本、末尾括号注释（如「(npm / pnpm / yarn / composer)」）
```

### 5.3 严格约束

- **不修改**锚点注释本身
- **不修改**任何非 `<fill>` 内容（含用户已填的真实内容）
- **不修改**列表项的标签文本（`- 前端：` 中的 `前端` 必须保留）
- **不删除**括号注释（如「(npm / pnpm / yarn / composer)」），只替换 `<fill>` 部分
- 替换失败（找不到锚点）时**跳过该项**并在控制台输出 warning，不报错

## 6. 更新 Installed toolset（Step 7.5）

在 AGENTS.md 的 `### Rules` 段落下追加一行（找到 `### Rules` 标题后的第一个 bullet 行作为插入位置）：

```markdown
- `<stack-name>` — <一句话主题>，自动生成于 <DATE>
```

**插入位置**：在已有 bullet 之后、下一段非 bullet 内容之前。**不覆盖**已有 bullet。

## 7. SOURCES.md（Step 7.6）

固定路径：`.agents/rules/<stack-name>/SOURCES.md`

格式：

```markdown
# Scan Sources

> 本目录的 frontend-stack.md / backend-stack.md 由 ai-agents-installer 在 <DATE> 基于以下文件生成。

## Frontend

| 文件 | 角色 | 行数 |
|------|------|------|
| src/views/project/index.vue | list-page | 187 |
| src/views/project/create.vue | form-page | 162 |

## Backend

| 文件 | 角色 | 行数 |
|------|------|------|
| app/Models/Project.php | model | 98 |
| app/Http/Controllers/Api/ProjectController.php | controller | 54 |
| app/Repositories/Implement/ProjectRepository.php | repository | 110 |
| api/routes/api.php | routes-fragment | 30 |

## Shared

| 文件 | 角色 | 行数 |
|------|------|------|
| src/utils/money.js | utils | 45 |
| src/styles/variables.scss | styles | 60 |
```

## 8. 反模式

- 扫描 `node_modules/` / `vendor/` / `.git/` / `dist/` → 浪费 token + 干扰模式识别
- 选单文件超过 500 行的脏样本 → 模式被特例淹没
- 选带特殊业务的模块（带状态机 / 工作流 / 复杂报表）→ 模式被特例淹没
- 写大段叙述而非 bullet checklist → 不便于 AI 助手直接消费
- 覆盖 AGENTS.md 中用户已有的非 `<fill>` 内容 → 破坏用户既有约定
- 修改锚点注释本身 → 后续替换算法失效
- 删除「(npm / pnpm / yarn / composer)」等括号注释 → 丢失用户提示
- 跳过 SOURCES.md 审计清单 → 用户无法复核扫描范围
- 生成空文件（既无 frontend 也无 backend）→ 当且仅当项目确实是空仓库时才允许；否则必须至少生成一端

## 9. 幂等性保证

- 二次执行 detect.mjs → 仍为 ready
- 二次执行 scaffold.mjs → 全部 skipped（AGENTS.md 已存在）
- 二次执行 Step 7 → 已存在的 rule 文件覆盖；AGENTS.md 中 `<fill>` 已被替换的项二次替换会再次覆盖（建议执行前用面板确认）
- 用户可手动回退：在 `.agents/rules/<stack-name>/` 删除目录 + AGENTS.md 还原 `<fill>` 即可