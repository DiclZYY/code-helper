# 构建与发布（概要）

> **本文件为 Rule 概要**：定义发布能力的概念、vendor 策略与回滚硬约束。  
> **完整发布脚本**：见 [skills/apc-deploy-release](../../skills/apc-deploy-release/)（`npm run release:full` / `release:inc`）。

## 发布模式

- **全量**：首次部署、大版本、含 DB 迁移、回滚
- **增量**：日常 bug 修复、单 feature 连续发布

## vendor 策略（硬约束）

`api/vendor/` 是否包含在发布包必须显式选择：

- **不带 vendor**（推荐默认）：目标服务器已 `composer install`；包体积小、上传快
- **带 vendor**：目标机器无 Composer、私有依赖变更、紧急热修

## 产物目录（约束）

- 由环境变量 `VUE_APP_RELEASE_DIR` 控制，**禁止**写死本机绝对路径
- 产物命名：`<日期>_<commit>/`，便于追溯与回滚

## 回滚原则（最低要求）

- 发布包必须可追溯到 commit（记录在产物 README 中）
- 回滚必须用**全量**产物（不能用增量）
- 保留上一版本产物或可重复构建

## 与其他规则的关系

- 涉及环境变量新增必须同步更新 `.env.example`（脱敏示例）