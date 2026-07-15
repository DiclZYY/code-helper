# release-config.json 字段详解

`backend/build/release-config.json`（或仓库根 `release-config.json`）是本 skill 体系的核心配置文件，决定了 deploy 脚本的忽略文件清单、目录映射与 baseline 模式。

## 完整字段

```json
{
  "projectType": "apc-vue2-laravel",
  "directories": {
    "frontend": "backend",
    "backend": "api",
    "adminBuiltDir": "public/admin",
    "publicPath": "public"
  },
  "build": {
    "command": "vue-cli-service build",
    "mode": "production"
  },
  "del": [
    ".git/",
    ".vscode",
    ".gitignore",
    "api/.env",
    "..."
  ],
  "copy": {},
  "baseline": {
    "mode": "commit",
    "grep": "release[:：]\\s*v\\|update[:：]\\s*version\\s*v",
    "tagPattern": "v*"
  }
}
```

## 字段说明

### `projectType`

- 类型：string
- 必填：否
- 默认：脚本内嵌的 apc 配置生效
- 说明：仅作记录用，便于人类阅读；不影响脚本逻辑。

### `directories`

目录边界映射。**必须根据实际项目结构调整**。

| 子字段 | 含义 | apc 默认 |
|--------|------|----------|
| `frontend` | 前端工程目录名 | `backend` |
| `backend` | 后端工程目录名 | `api` |
| `adminBuiltDir` | 增量模式下，检测到 frontend 变更后复制的构建产物目录 | `public/admin` |
| `publicPath` | 后端 public 目录名（adminBuiltDir 的父目录） | `public` |

**示例**：Vue3 + Express 项目可能改为：

```json
"directories": {
  "frontend": "web",
  "backend": "server",
  "adminBuiltDir": "dist",
  "publicPath": "public"
}
```

### `build`

构建命令配置。

| 子字段 | 含义 | 默认 |
|--------|------|------|
| `command` | release.js 调用前端构建的命令 | `vue-cli-service build` |
| `mode` | `--mode=` 参数 | `production` |

**示例**：Vite 项目改为 `vite build`；Next.js 改为 `next build`。

### `del`

全量打包（`full` / `full_nv`）时忽略的文件 / 目录列表。

- 类型：string[]
- glob 风格：支持 `*` / `?` / `**`
- 以 `/` 结尾表示目录（含子目录）
- **vendor 特殊**：apc 配置中 `api/vendor/` 通常在 `del` 列表（不带 vendor 时）；带 vendor 时 deploy.js 会自动从 `del` 中剔除

**调整建议**：
- 新增忽略项：如 `*.log`、`*.tmp`、`coverage/`
- 删除忽略项：如某些项目需要保留 `.git/`
- 路径前缀必须与 directories.frontend / directories.backend 对齐

### `copy`

自定义拷贝映射。保留原 apc 兼容字段。一般无需修改。

```json
"copy": {
  "dist/admin": "Public/admin/",
  "dist/admin/index.html": "app/Spa/View/Index/index.html"
}
```

### `baseline`

上次发布 commit 的识别方式。

| 子字段 | 含义 | 默认 |
|--------|------|------|
| `mode` | `commit` \| `tag` \| `hybrid` | `commit` |
| `grep` | commit 模式下的 git log grep 正则 | `release[:：]\s*v\|update[:：]\s*version\s*v` |
| `tagPattern` | tag 模式下的 git tag glob | `v*` |

#### mode 选择

- **`commit`**（apc 默认）：通过 commit message 匹配 `grep` 正则，找最近一个匹配项作为基准
- **`tag`**：通过 git tag 匹配 `tagPattern`，找最近一个 tag 作为基准
- **`hybrid`**：优先 tag，未找到时回退 commit message

#### 显式覆盖

环境变量 `PREVIOUS_RELEASE_COMMIT=<id|tag>` 可显式指定，优先级最高。

## 环境变量覆盖

以下环境变量优先级高于 release-config.json：

| 变量 | 作用 | 默认 |
|------|------|------|
| `VUE_APP_RELEASE_DIR` | 产物根目录 | Windows: `C:\Work\release` / 其他: `/tmp/work/release` |
| `PREVIOUS_RELEASE_COMMIT` | 显式指定上次发布 commit 或 tag | （空） |
| `BASELINE_MODE` | 覆盖 baseline.mode | （空） |
| `BASELINE_GREP` | 覆盖 baseline.grep | （空） |
| `BASELINE_TAG_PATTERN` | 覆盖 baseline.tagPattern | （空） |
| `RELEASE_CONFIG` | 指定 release-config.json 路径 | `backend/build/release-config.json` |

## 修改建议

- **新项目**：从 `release-config.apc.template.json` 复制，按项目实际目录改名
- **vendor 策略变化**：调整 `del` 数组中是否含 `api/vendor/`，或通过 `--vendor=with|without` 参数切换
- **目录改名**：同步修改 `directories` 各字段
- **baseline 模式**：根据团队 commit 规范选 mode；如 commit 不规范，改用 tag 模式

## 反模式

- **保留脚本内嵌的 releaseConfig 而忽略外部 JSON** → 团队改不了忽略文件清单
- **baseline.mode 选 hybrid 但未配置 tagPattern** → 回退到 commit 模式可能找不到基线
- **del 列表过于激进** → 把必要文件也排掉，发布后目标机器启动失败
- **del 列表遗漏 .git/** → 产物里包含 git 历史，体积膨胀且可能泄露敏感信息