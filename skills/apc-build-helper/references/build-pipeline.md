# 构建流水线（version → release → deploy）

本 skill 体系包含三个 Node.js 脚本，按以下顺序协作完成完整发布流程。

## 三个脚本的职责

| 脚本 | 职责 | 调用方式 |
|------|------|----------|
| `version.js` | 扫描 git log 计算版本号，写入文件 | `node build/version.js` |
| `release.js` | 编排：version → build → deploy | `node build/release.js` |
| `deploy.js` | 实际打包（按 mode + vendor 策略） | `node build/deploy.js` |

## 完整流程图

```
git log --no-merges --pretty=format:"%s"
        │
        ▼
┌──────────────────┐
│  version.js      │  计算 major.minor.patch
│  ── scan ──→     │  - feat:*    → minor++
│                  │  - fix/perf/update/add/style:* → patch++
│                  │
│  ── write ──→    │  → changelog/version.json
│                  │  → backend/package.json
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  release.js      │  编排三步
│                  │
│  step1: version  │  → 调用 version.js
│  step2: build    │  → npm run build / pnpm build（按包管理器）
│  step3: deploy   │  → 调用 deploy.js
│  step4: push     │  (可选) git push + tag
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  deploy.js       │  实际打包
│                  │
│  ── mode ──→     │  full / full_nv / incremental
│  ── vendor ──→   │  with / without
│  ── baseline ──→ │  commit / tag / hybrid
│                  │
│  ── output ──→   │  → $VUE_APP_RELEASE_DIR/<name>-<mode>_v<version>/code/
└──────────────────┘
```

## mode 详解

### `incremental`（默认）

按 git diff 计算变更文件，仅打包变化部分。

**适用**：
- 日常 bug 修复 / 小功能迭代
- 紧急热修

**需要**：baseline（上次发布 commit）

### `full`

打包整个项目，按 `releaseConfig.del` 过滤。

**适用**：
- 首次部署
- 大版本变更
- 含数据库迁移

### `full_nv`

等同于 `full`，但额外排除 `api/vendor/`。

**适用**：
- 首次部署到目标服务器（目标机器会单独 composer install）
- 跨环境统一（不打包 vendor）

## vendor 详解

| 取值 | 行为 | 适用 |
|------|------|------|
| `without`（默认） | 不打包 `api/vendor/` | 目标机器已 composer install |
| `with` | 打包 `api/vendor/` | 目标机器无 Composer / 私有依赖 / 紧急热修 |

**注意**：增量模式下，`--vendor=with` 等同于「除了 git diff 变更外，再额外带 vendor/」。

## baseline 详解

baseline 是「上次发布 commit」，增量打包时 diff 的起点。

### commit 模式（apc 默认）

通过 `git log --grep="<pattern>"` 查找最近匹配项。

默认 pattern：`release[:：]\s*v\|update[:：]\s*version\s*v`

匹配示例：
- `release: v1.2.3` ✓
- `update: version v1.2.3` ✓
- `feat: 新增XX` ✗

### tag 模式

通过 `git tag --list="<glob>"` 查找最近 tag。

默认 glob：`v*`

匹配示例：
- `v1.2.3` ✓
- `release-1.2.3` ✗（除非改 tagPattern）

### hybrid 模式

优先 tag，未找到时回退 commit。

**适用**：团队既有 commit 规范，又有 tag 规范的过渡期。

## 包管理器检测

`utils/index.js` 的 `detectPackageManager` 按以下顺序检测：

```
pnpm-lock.yaml → pnpm
yarn.lock      → yarn
package-lock.json → npm
bun.lockb      → bun
(无)            → npm（默认）
```

`release.js` 自动使用检测到的包管理器调用 build 步骤。

## 产物结构

发布完成后，$VUE_APP_RELEASE_DIR 下：

```
$VUE_APP_RELEASE_DIR/
└── <packageName>-<mode>_v<version>/
    ├── code/
    │   ├── api/                  # 后端源码（按 del 过滤）
    │   ├── public/admin/         # 前端构建产物（增量模式下含此目录）
    │   ├── transfer/             # 传输中间产物（如有）
    │   └── db_update.sql         # 占位文件
    ├── README.md                 # 发布元数据（commit/branch/mode/vendor）
    └── changed-files.txt         # 增量模式特有：变更文件清单
```

## 与原 apc 脚本的对应关系

| 原脚本 | 新脚本 | 差异 |
|--------|--------|------|
| `backend/build/version.js` | `assets/scripts/version.js` | CLI 化（支持 `--show` / `--no-write`） |
| `backend/build/release.js` | `assets/scripts/release.js` | CLI 化 + 支持 baseline 模式 + 包管理器检测 |
| `backend/build/deploy.js` | `assets/scripts/deploy.js` | 外部 release-config + 支持所有 mode/vendor 组合 |
| `backend/build/utils/index.js` | `assets/scripts/utils/index.js` | diffDetect 接受 grep/tagPattern 参数 |

## 升级路径

如已有原 apc 脚本：

1. 备份原 `backend/build/`
2. 复制新脚本到 `backend/build/`
3. 复制 `release-config.apc.template.json` → `backend/build/release-config.json`
4. 检查 `directories` / `del` / `baseline` 字段是否符合实际
5. 在 `backend/package.json` 中追加 npm scripts
6. 测试 `npm run version:show` / `npm run release:inc`（小变更试一次）