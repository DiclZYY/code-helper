---
name: apc-build-helper
description: >-
  apc 框架构建工具链：安装 version.js / release.js / deploy.js 到 backend/build/，配置 release-config.json（含忽略文件清单与 baseline 模式），注入 npm scripts，支持 npm/pnpm/yarn。
  Use for 安装构建脚本 / 配置 release-config / npm run version / npm run release / 打包发布 / baseline 模式。
---

# apc-build-helper

为 apc 框架（Vue2 + Laravel，可适配 Vue3 + Node）一键安装**版本号 + 构建 + 打包发布**全流程脚本。安装后通过 `npm run version` / `npm run release` 等命令执行。

> **能力边界**：本 skill 解决「**构建工具链缺失**」的问题。如果目标项目已有等价的 `build/version.js` / `build/release.js` / `build/deploy.js`，无需安装本 skill。

## When to use

**适用**：
- 目标项目没有 `backend/build/{version,release,deploy}.js` 或行为不符合需求
- 需要为 `backend/package.json` 注入 `version` / `release:full` / `release:inc` 等 npm scripts
- 需要支持 npm / pnpm / yarn 等不同包管理器
- 需要根据项目类型（vue2+laravel / vue3+node / 自定义）灵活调整 `releaseConfig`

**不适用**：
- 仅需查看当前版本号（直接读 `changelog/version.json` 即可）
- CI/CD 集成（CI 中直接调用脚本，不依赖 npm scripts）
- 修改脚本本身（直接编辑 `backend/build/*.js`，无需走安装流程）

## Core pattern

```
安装（一次性）
  ├─ 1. 检测包管理器：npm / pnpm / yarn / bun（lock 文件）
  ├─ 2. 选择项目类型（决定 releaseConfig 模板）
  │     - Vue2 + Laravel（apc 默认）
  │     - Vue3 + Node/Express
  │     - 纯前端 / 纯后端 / 自定义
  ├─ 3. 选择 baseline 模式（决定上次发布 commit 怎么找）
  │     - commit message 正则（apc 默认）
  │     - git tag（如 v*）
  │     - 混合（tag 优先 + commit 回退）
  ├─ 4. 复制 scripts/ → backend/build/
  ├─ 5. 复制 release-config.template.json → release-config.json（按需调整）
  ├─ 6. 注入 npm scripts 到 backend/package.json
  └─ 7. 验证：node build/version.js --show

使用（重复）
  ├─ npm run version         → 更新 changelog/version.json + package.json
  ├─ npm run release         → version + build + deploy（增量默认）
  ├─ npm run release:full    → 全量打包
  └─ npm run release:inc     → 增量打包
```

## Installation checklist

### 1. 检测项目状态（先决条件）

- [ ] 目标项目根下存在 `backend/`（或等价的前端目录）
- [ ] 目标项目根下存在 `api/`（或等价的后端目录）
- [ ] `changelog/version.json` 已存在或允许创建
- [ ] git 仓库已初始化

### 2. 复制脚本

```bash
# 整目录复制
cp -r skills/apc-build-helper/assets/scripts/* backend/build/

# 或单独复制
cp skills/apc-build-helper/assets/scripts/version.js backend/build/
cp skills/apc-build-helper/assets/scripts/release.js backend/build/
cp skills/apc-build-helper/assets/scripts/deploy.js  backend/build/
cp -r skills/apc-build-helper/assets/scripts/utils backend/build/
```

### 3. 放置 release-config.json

```bash
# 默认 apc 模板
cp skills/apc-build-helper/assets/config/release-config.apc.template.json \
   backend/build/release-config.json

# 或放到仓库根
cp skills/apc-build-helper/assets/config/release-config.apc.template.json \
   release-config.json
```

按需修改 `directories` / `del` / `baseline` 字段。详见 [references/release-config.md](./references/release-config.md)。

### 4. 注入 npm scripts

在 `backend/package.json` 中追加：

```json
{
  "scripts": {
    "version":          "node build/version.js",
    "version:show":     "node build/version.js --show",
    "release":          "node build/release.js",
    "release:full":     "node build/release.js --mode=full --vendor=without",
    "release:full:vendor":"node build/release.js --mode=full --vendor=with",
    "release:inc":      "node build/release.js --mode=incremental --vendor=without",
    "release:inc:vendor":"node build/release.js --mode=incremental --vendor=with",
    "release:vlogs":    "node build/release.js --vlogs",
    "release:push":     "node build/release.js --push",
    "deploy":           "node build/deploy.js",
    "deploy:full":      "node build/deploy.js --mode=full --vendor=without"
  }
}
```

> **pnpm 用户**：命令相同，pnpm 会自动运行 `package.json` 中的 scripts。
> **yarn 用户**：命令相同，yarn 通过 `yarn version` / `yarn release` 调用。

### 5. 安装依赖（如使用 minimatch 等可选依赖）

`scripts/utils/index.js` 中部分功能（如 minimatch）需要 `minimatch` 包。如果目标项目 package.json 已有则无需安装：

```bash
npm install --save-dev minimatch fs-extra chalk
```

> 实际只在 deploy.js 的全量复制里使用 minimatch 做 glob 匹配；如果只跑增量模式可不装（用 `git diff --name-only` 输出即可）。

### 6. 验证

```bash
# 查看当前版本（不写文件）
npm run version:show

# 试跑一次 version 写入
node build/version.js --show

# 试跑 deploy 的 dry-run（如需）
node build/deploy.js --help
```

## npm 命令速查

| 命令 | 行为 |
|------|------|
| `npm run version` | 扫描 git log 计算版本，写入 changelog/version.json + package.json |
| `npm run version:show` | 仅显示当前版本，不写文件 |
| `npm run release` | version + build + deploy（增量，不带 vendor） |
| `npm run release:full` | 全量打包，不带 vendor |
| `npm run release:full:vendor` | 全量打包，带 vendor |
| `npm run release:inc` | 增量打包，不带 vendor |
| `npm run release:inc:vendor` | 增量打包，带 vendor |
| `npm run release:vlogs` | 仅跑 version，跳过 build/deploy |
| `npm run release:push` | 发布完成后 git commit + push + tag |
| `npm run deploy` | 直接调用 deploy.js |

## 配置 release-config.json

| 字段 | 类型 | 说明 |
|------|------|------|
| `projectType` | string | 项目标识（仅作记录用，不影响逻辑） |
| `directories.frontend` | string | 前端目录名，默认 `backend` |
| `directories.backend` | string | 后端目录名，默认 `api` |
| `directories.adminBuiltDir` | string | 增量时检测到 frontend 变更后复制的目录 |
| `directories.publicPath` | string | public 目录名 |
| `build.command` | string | 构建命令，默认 `vue-cli-service build` |
| `build.mode` | string | 构建 mode，默认 `production` |
| `del` | string[] | 全量打包时忽略的文件 / 目录 |
| `copy` | object | 自定义拷贝映射（保留原 apc 兼容） |
| `baseline.mode` | `commit` \| `tag` \| `hybrid` | 上次发布 commit 的识别方式 |
| `baseline.grep` | string | commit 模式下的 grep 正则 |
| `baseline.tagPattern` | string | tag 模式下的 glob |

## Anti-patterns

- **不安装 scripts 就执行 npm run release** → 报 `Cannot find module './build/release.js'`
- **baseline.mode 选错导致找不到上次发布** → 增量打包计算 diff 时会失败；用 `--commit_id=<id>` 显式指定
- **release-config.json 的 del 项写错路径** → 可能把关键文件排掉（如 `api/.env`）或不排无用文件（如 `.git/`）
- **直接修改 scripts/version.js 的常量** → 应通过 release-config.json 或环境变量定制；脚本本身保持通用
- **在没装 chalk / fs-extra / minimatch 的项目跑 deploy full 模式** → 部分过滤逻辑失败；增量模式不依赖
- **不带 vendor 又不在目标服务器装依赖** → 目标机器启动失败
- **`.env` / 密钥打包进产物** → 违反 [rules/apc-framework/security.md](../../rules/apc-framework/security.md)

## Additional resources

- 脚本：
  - [assets/scripts/version.js](./assets/scripts/version.js) — 版本号计算
  - [assets/scripts/release.js](./assets/scripts/release.js) — 发布编排
  - [assets/scripts/deploy.js](./assets/scripts/deploy.js) — 实际打包
  - [assets/scripts/utils/index.js](./assets/scripts/utils/index.js) — 工具集（loadenv / diffDetect / 包管理器检测）
- 配置模板：
  - [assets/config/release-config.apc.template.json](./assets/config/release-config.apc.template.json) — apc 默认 release-config
  - [assets/templates/version.template.json](./assets/templates/version.template.json) — changelog/version.json 模板
- 详细文档：
  - [references/release-config.md](./references/release-config.md) — release-config.json 字段详解
  - [references/build-pipeline.md](./references/build-pipeline.md) — version → release → deploy 三步流程详解
- 相关 Skill：
  - [apc-release-changelog](../apc-release-changelog/) — 发布后日志入库（与本 skill 协作）
- 相关 Rule：[rules/apc-framework/](../../rules/apc-framework/)（仓库级硬约束始终生效）