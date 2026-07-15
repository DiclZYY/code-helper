# apc-framework — 框架级硬约束 Rule

本目录汇集 **apc 框架**（Vue2 管理后台 + Laravel API）的通用工程约束。  
在 apc 系仓库内进行任何需求开发 / 修复 / 重构时，默认遵循本目录下的全部规则。

> 与 **Skill** 的关系：本目录是 **Rule**（始终生效），用于约束类内容；  
> 流程类内容（如「新增一个业务模块」「安装构建脚本并发布」「生成 changelog 并入库」）已拆为独立 Skill（[apc-module-development](../../skills/apc-module-development/) / [apc-build-helper](../../skills/apc-build-helper/) / [apc-release-changelog](../../skills/apc-release-changelog/)），按需触发。

## 适用仓库

- `backend/`：Vue2 管理后台
- `api/`：Laravel API
- `docs/`：仓库文档根
- 发布 / 迁移中间产物目录 `transfer/`（如存在）

## 规则清单（按职责分类）

### 跨层通用

- [tech-stack.md](./tech-stack.md) — 技术栈与版本 / 依赖约束（Vue2 / Laravel 8 / PHP / Node）
- [repo-structure.md](./repo-structure.md) — 仓库目录结构与边界（backend / api 严格分离）
- [code-style.md](./code-style.md) — 编码规范（Git 分支 / 提交 / 接口约定 / 命名）
- [security.md](./security.md) — 安全与敏感信息（`.env` 禁入库 / 日志脱敏 / 依赖供应链）
- [dev-workflow.md](./dev-workflow.md) — 本地开发流程（启动 / 联调 / 常见问题定位）

### 前端专项

- [frontend-vue2.md](./frontend-vue2.md) — Vue2 工程规范（目录 / 组件 / 样式引用机制 / 权限路由）

### 后端专项

- [backend-laravel.md](./backend-laravel.md) — Laravel 工程规范（分层 / 校验 / 事务 / 日志 / helpers）

### 流程概要（仅保留概要，完整 SOP 见 Skill）

- [module-development.md](./module-development.md) — **概要**：新增一个标准业务模块的最小骨架与硬约束。完整 SOP：[skills/apc-module-development](../../skills/apc-module-development/)
- [deploy-release.md](./deploy-release.md) — **概要**：发布模式 / vendor 策略 / 回滚原则。配套构建脚本见 [skills/apc-build-helper](../../skills/apc-build-helper/)

## 按场景快速跳转

| 场景 | 必读 |
|------|------|
| 第一次接触本仓库 | tech-stack → repo-structure → dev-workflow |
| 写前端代码 | frontend-vue2 → code-style → security |
| 写后端代码 | backend-laravel → code-style → security |
| 新增业务模块 | [skills/apc-module-development](../../skills/apc-module-development/)（端到端 SOP）→ frontend-vue2 / backend-laravel（按端） |
| 准备发布 | [skills/apc-build-helper](../../skills/apc-build-helper/)（构建脚本安装 + npm 命令）→ security |
| 发布后 changelog | [skills/apc-release-changelog](../../skills/apc-release-changelog/)（extract + classify + format + 入库） |
| 排查通用问题 | dev-workflow（常见问题定位） |

## Rule vs Skill 设计说明

| 类型 | 内容形态 | 加载时机 |
|------|----------|----------|
| **Rule（本目录）** | 硬约束、风格、目录边界、安全底线 | 始终生效 |
| **Skill**（后续拆分） | 操作流程、模板生成、机制详解 | 按需触发 |

**判定原则**：

- 含「必须 / 禁止 / 总是 / 硬约束 / 安全底线」→ Rule
- 含「怎么做 / 按什么步骤 / 用什么模板」→ Skill

## 维护说明

- 本目录的内容**与业务仓库 `docs/framework/` 保持一致**；业务仓库优先（业务仓库有更新时同步回这里）
- 涉及接口、发布、环境变量、目录结构的变更，**必须**同步更新本目录与业务仓库 `docs/framework/` 对应文件
- 新增 Rule 子文件：在本 README 的「规则清单」追加一行；保持现有分类（跨层通用 / 前端 / 后端 / 流程概要）