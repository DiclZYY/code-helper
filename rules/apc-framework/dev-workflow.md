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