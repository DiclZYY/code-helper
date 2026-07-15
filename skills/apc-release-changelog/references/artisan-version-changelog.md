# `php artisan admin:version-changelog` 命令详解

apc-release-changelog 的入库动作由 Laravel Artisan 命令 `admin:version-changelog` 完成。本文件描述**参数、环境、失败排查**。

> **以代码为准**：命令签名 / 默认值以 `api/app/Console/Commands/Admin/VersionChangelog.php` 实现为准；本文件描述「**已知行为 + 调用约定**」。

## 1. 命令签名

```bash
php artisan admin:version-changelog [options]
```

### 必填语义

至少需要提供**描述来源**之一（二选一）：

| 选项 | 说明 |
|------|------|
| `--description="..."` | 内联字符串，适合较短描述（< 1KB） |
| `--file=<path>` | UTF-8 文件路径，适合较长描述或含特殊字符 |

如果两个都传，**`--file` 优先**。

### 可选覆盖项

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `--version=<vX.Y.Z>` | 从 `changelog/version.json` 读 `version` | 覆盖本次入库版本号 |
| `--version-code=<int>` | 从 `changelog/version.json` 读 `versionCode` | 覆盖 versionCode |
| `--title="<yyyy-MM-dd>"` | 执行当天日期 | changelog 标题 |
| `--type=<feature\|fix\|all>` | `all` | 过滤入库类型（实现方需支持） |

> **注意**：`--version` / `--version-code` 是**本子命令的参数**，不是 `php artisan --version`（后者是 Artisan 全局版本）。Shell 解析时两者互不冲突。

## 2. 入库行为

### 写入目标

数据库表 `version`（具体字段以 migration 为准）：

| 字段 | 来源 | 示例 |
|------|------|------|
| `version` | `--version=` 或 `changelog/version.json.version` | `v0.45.6` |
| `version_code` | `--version-code=` 或 `changelog/version.json.versionCode` | `266` |
| `title` | `--title=` 或当天 `YYYY-MM-DD` | `2026-07-14` |
| `description` | `--description=` 或 `--file=` 内容 | 【功能】\n• 新增档案批量导入\n... |
| `created_at` / `updated_at` | 自动 | 命令执行时间 |

### 主键冲突

如果 `version` 字段有唯一索引，重复入库会失败：

```
SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry ...
```

**处理方式**：

1. **优先**：使用 `--version=` / `--version-code=` 显式指定一个新值
2. **其次**：手动修改 `changelog/version.json` 后重新执行
3. **最后**：直接 SQL 更新（仅开发环境）

### 软删除 / 覆盖语义

取决于实现方是否带 `deleted_at`。建议：

- **保留历史**：不覆盖，每次发布新增一行
- **修正**：用 `--version-code=` 新建一条，不要 UPDATE

## 3. PHP 环境要求

### 版本

业务仓库 `composer.json` 要求 `PHP ^7.3|^8.0`，**实际运行推荐 PHP 8.2+**（Artisan 命令可能用到 PHP 8 类型语法）。

### 切换 PHP（Windows）

切换 PHP 版本是项目级开发环境设置，**不在本 skill 范围**。具体做法因机器而异：
- macOS：常用 `brew link php@8.x`
- Windows：常用 `phpstorm` 内置 PHP 解释器
- Linux：常用 `update-alternatives --set php /usr/bin/php8.x`

无论用哪种方式，**让 `php` 命令指向 PHP 8.2+ 即可**。验证：

```bash
php -v
```

> **注意**：本 skill 示例命令**不带任何项目级前缀**。如果项目仓库有自己的 CLI 包装约定（如 `pnpm exec` / `npx` / 自定义包装脚本），AI 助手执行时需按当前项目的 CLAUDE.md / README 约定添加。

### Linux / macOS

```bash
# 切换默认 PHP（以 Ubuntu 为例）
sudo update-alternatives --set php /usr/bin/php8.3
php -v
```

## 4. 完整调用示例

### 示例 1：内联短描述

```bash
cd api && php artisan admin:version-changelog \
  --description="【功能】
• 新增档案批量导入

【修复】
• 修复密集架位置冲突

【优化】
• 优化列表分页性能"
```

### 示例 2：文件方式（长描述）

```bash
# 先把整理后的正文存成 UTF-8 文件
# changelog/release-notes.txt
# （可由助手生成，或人工粘贴）

cd api && php artisan admin:version-changelog \
  --file=../changelog/release-notes.txt
```

### 示例 3：覆盖 version / versionCode

```bash
cd api && php artisan admin:version-changelog \
  --file=../changelog/release-notes.txt \
  --version=v0.45.7 \
  --version-code=267
```

### 示例 4：指定 title

```bash
cd api && php artisan admin:version-changelog \
  --file=../changelog/release-notes.txt \
  --title="2026-07-15"
```

## 5. 失败排查

### 错误 1：命令不存在

```
Command "admin:version-changelog" is not defined.
```

**原因**：

- `api/app/Console/Commands/Admin/VersionChangelog.php` 未部署
- composer autoload 未刷新

**处理**：

```bash
cd api && composer dump-autoload
php artisan list | grep version-changelog
```

### 错误 2：PHP 版本不符

```
Parse error: syntax error, unexpected 'mixed' ...
```

**原因**：当前 `php` 命令指向 PHP 7.x，新代码用了 PHP 8 类型。

**处理**：切换到 PHP 8.2+。

### 错误 3：数据库连接失败

```
SQLSTATE[HY000] [2002] Connection refused
```

**原因**：

- `api/.env` 中 DB 配置缺失 / 错误
- MySQL 服务未启动
- 端口不通

**处理**：

```bash
cd api && php artisan tinker
# 在 tinker 里执行
\DB::connection()->getPdo();
```

### 错误 4：changelog/version.json 缺失

```
file not found: changelog/version.json
```

**处理**：手动创建或从上一次发布产物中复制。

### 错误 5：主键冲突

```
Duplicate entry 'v0.45.6' for key 'version.version_unique'
```

**处理**：见上文「主键冲突」。

### 错误 6：description 含非法字符

`--description="..."` 在 shell 中会被各种字符干扰（`!`、`$`、`"`、`\` 等）。

**处理**：改用 `--file=` 方式，把内容写到 UTF-8 文件。

## 6. 失败时的对话输出约定

命令失败时，**助手必须直接输出失败原因 + 下一步**，不要假装成功。示例：

> **入库失败**
>
> 命令：`cd api && php artisan admin:version-changelog --description="..."`
>
> 报错：`SQLSTATE[HY000] [2002] Connection refused`
>
> 原因：MySQL 服务未启动，或 `api/.env` 中 DB 配置不正确。
>
> 下一步：
>
> 1. 检查 MySQL 服务状态：`net start mysql`
> 2. 检查 `api/.env` 中的 `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD`
> 3. 修复后重新执行同一命令

## 7. 反模式

- **入库成功却不在对话中确认** → 必须回显入库后的关键字段（version / versionCode / title）
- **失败后静默重试** → 必须先输出错误再决定是否重试
- **修改 `version` 表结构绕过校验** → 升级命令实现方是正确做法
- **入库时同时改 `changelog/version.json`** → 应该在 release commit 之前就改好
- **多人同时入库** → 会主键冲突，必须串行执行

---

**相关**：

- [git-log-parsing.md](./git-log-parsing.md) — 入库前的 commit 解析
- [format-and-output.md](./format-and-output.md) — description 字符串的整理与对话约定
- 同步源：业务仓库 `api/app/Console/Commands/Admin/VersionChangelog.php`