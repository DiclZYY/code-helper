# 本地开发流程

本规则聚焦「本地如何跑起来 + 如何联调 + 如何快速定位常见问题」。更细的前后端规范见对应专题文档。

## 前端（backend/）

常用命令（以 `backend/package.json` 为准）：

- 安装依赖：在 `backend/` 下执行 `npm install`
- 本地开发：`npm run dev`
- 构建：`npm run build`（或 `npm run build:stage`）
- 代码检查：`npm run lint`
- 单测：`npm run test:unit`

## 后端（api/）

常用命令（Laravel 常规约定）：

- 安装依赖：在 `api/` 下执行 `composer install`
- 环境文件：复制 `.env.example` 为 `.env` 并配置（**禁止提交**）
- 生成 key：`php artisan key:generate`
- 迁移：`php artisan migrate`

## 前后端联调（约定）

- 前端通过环境变量配置 API Base URL（具体变量名以 `backend/` 的实际配置为准）。
- 后端接口改动需同步维护接口文档 / 说明（若暂无统一接口文档系统，则至少在相关模块 README 或 `rules/apc-framework/` 记录）。

## 常见问题定位（优先级）

1. **环境变量**：先检查 `backend/.env*` 与 `api/.env` 的值是否符合当前运行环境。
2. **依赖版本**：Node / PHP / Composer 版本是否落在 `tech-stack.md` 约束范围内。
3. **跨工程路径**：不要依赖本机绝对路径；发布脚本相关路径以 `deploy-release.md` 为准。

## AI Agent 调试（浏览器验证）

> Agent（Trae / Claude 等）在本仓库内做页面验证时，按本节固定启动，避免污染用户日常开发配置。

### 后端入口（api/）

Laravel 入口在**仓库根** `public/index.php`（`$dir = __DIR__.'/../api'`），`api/public/` 不存在，故 **`php artisan serve` 不可用**。

在仓库根执行：

```powershell
php -S 127.0.0.1:8001 -t public dev-server.php
```

- **必须带 `-t public`**：PHP 内置服务器默认把仓库根当文档根，否则 `/uploads/*.pdf`、`/favicon.ico` 等静态文件 404。
- `dev-server.php` 是路由脚本：同名静态文件存在时 `return false` 交还 PHP 原生返回，其余请求转发 `public/index.php`。模板见 [assets/dev-server.php](./assets/dev-server.php)，复制到仓库根即可。
- **不要** 用 `php -S 127.0.0.1:8001 public/index.php` 代替：接口可通，但 `index.php` 不会 `return false`，静态文件全部 404。

### 前端入口（backend/）

**禁止** 改 `backend/package.json` 的 `dev` script 加 `--mode` 参数（那会影响用户日常开发），用参数透传：

```powershell
cd backend
npm run dev -- --mode ai
```

- `--` 之后的参数透传给 `vue-cli-service serve`。
- `--mode ai` 时 Vue CLI 自动加载 `backend/.env.ai` + `backend/.env.ai.local`（`.local` 已在 `.gitignore`）。
- `backend/.env.ai` 是 Agent 调试专用配置（独立端口 + `/dev` 代理到后端），**不提交仓库**；模板见 [assets/env.ai.template](./assets/env.ai.template)。
- 用户日常开发仍用 `npm run dev`（默认 `development` mode），不加载 `.env.ai`。

启动后访问：`http://127.0.0.1:6500/admin/`。

### 登录凭据

- 凭据存放仓库根 `.trae/secrets.local.md`，**`.gitignore` 忽略、禁止入库**；规则 / 文档中不得抄录真实账号密码。
- 前端登录密码需 md5：`md5('lz-landzs-service-' + 明文)`（实现见 `backend/src/utils/auth.js` 的 `password()`）。
- 开发者账号（`admin.id = 0`）：免权限 + 走 `safety.*` API；密码取 `api/.env` 的 `ADMIN_ROOTPWD`。
- 本地联调建议 `api/.env` 设 `ADMIN_CAPTCHA=false`，验证码任意 4 位字符串即可通过（**仅本机，禁止提交**）。

### 常用代理端点

| 前端路径 | 后端目标 | 说明 |
|---|---|---|
| `/dev/auth/*` | `http://127.0.0.1:8001/api/auth/*` | 登录 / 登出 / 个人信息 |
| `/dev/index/*` | `http://127.0.0.1:8001/api/index/*` | 配置 / 版本 / 首页地图 |
| `/dev/<module>/*` | `http://127.0.0.1:8001/api/<module>/*` | 各业务模块 |

代理规则由 `backend/.env.ai` 的 `VUE_APP_PROXY_API`（前端前缀）与 `VUE_APP_BASE_API`（后端目标）决定，读取逻辑在 `backend/vue.config.js`；`request.js` 自动注入 `NODE-ENV` / `Auth-Token` / `Form-Hash` 头。

### 排查顺序

1. 接口 404 / 页面白屏 → 确认后端是否用 `-t public` + `dev-server.php` 启动。
2. 静态文件 404 → 检查是否误把 `public/index.php` 当路由脚本。
3. 代理失效 / 跨域 → 检查 `.env.ai` 中 `VUE_APP_PROXY_API` 与 `VUE_APP_BASE_API` 是否配对。
4. 登录失败 → 检查 `.trae/secrets.local.md` 凭据、md5 前缀、`ADMIN_CAPTCHA`。