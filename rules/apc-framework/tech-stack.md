# 技术栈与版本约束

本规则约束本仓库（apc 框架）所使用技术栈的版本与依赖范围。版本基线以 `backend/package.json` 与 `api/composer.json` 为准。

## 前端（backend/）

- **Vue**：`2.6.14`
- **Vue Router**：`3.5.4`
- **Vuex**：`3.6.2`
- **构建工具**：Vue CLI `4.5.19`（Webpack 4）
- **UI**：Element UI `2.15.14`
- **HTTP**：Axios `^1.4.0`
- **Node 约束**：`>= 12`（见 `engines.node`）

### 约束与建议

- 不升级到 Vue3 / Webpack5 级别的重大变更，除非明确立项并在文档中完成迁移方案。
- 新增依赖前先复用既有依赖能力；确需新增时，记录原因与替代方案到本文件。

## 后端（api/）

- **Laravel Framework**：`^8.75`
- **PHP**：`^7.3 | ^8.0`
- **Auth**：Sanctum `^2.11`
- **CORS**：fruitcake/laravel-cors `^2.0`
- **内部依赖**：`lis/admin-service`：`v2.x-dev`（私有 git 仓库）
- **autoload files**：`functions/helpers.php`（全局函数请谨慎添加）

### 约束与建议

- 重大框架升级（Laravel 9/10、PHP 8.2+）需先在本文件补充升级风险、兼容清单与回滚方案。

## 运行时（建议）

- **Node**：16 LTS（满足 `>=12`，并兼顾生态）
- **PHP**：7.4 / 8.0（需满足 `^7.3 | ^8.0`）
- **Composer**：2.x