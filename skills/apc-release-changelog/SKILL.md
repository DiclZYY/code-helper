---
name: apc-release-changelog
description: >-
  apc 框架发布后生成更新日志（基于 git log / git tag 识别 release 起点、抽取 commit message 集合、AI 在对话中按【功能】/【修复】/【优化】分类整理）并写入 Laravel version 表（php artisan admin:version-changelog）。
  Use for 生成更新日志 / changelog / release notes / 入库 / git log 解析 / version 表 / /changelog 命令。
---

# apc-release-changelog

apc 框架发布后的「**变更日志生成 + 入库**」SOP。AI 在对话中按本 skill 执行：

1. 识别「上次发布」起点（commit message / git tag，由用户指定）
2. 抽取起点 → HEAD 的 commit message 集合
3. AI 按规则归类整理为标准格式
4. 询问用户后执行 `php artisan admin:version-changelog` 入库

> **能力边界**：本 skill 是**流程型 skill**，不携带可在项目里直接安装的脚本（避免对项目目录结构强假设）。**起点识别 + commit 抽取** 由 AI 在对话里通过 `git` 命令完成。
>
> **与 apc-build-helper 关系**：build-helper 关注**产物上线**，本 skill 关注**变更内容入库**。两者可单独触发。

## When to use

**适用**：
- 用户说「生成更新日志 / 整理更新说明 / 出个 changelog / 入库版本说明 / 写一下这次更新了什么」
- 发布已完成（产物已上线），需要给客户端展示最新版本说明
- 需要把 `changelog/version.json` 中的 `version` / `versionCode` 与本次内容绑定写入数据库
- 只想看「最近改了什么」并不打算入库

**不适用**：
- 实际打包 / 部署 / 上线动作 → 走 [apc-build-helper](../apc-build-helper/)
- H5 移动端的更新说明 → H5 项目对应的规则（与本 skill 同源但独立流程）
- 修改 `version` 表结构或 `admin:version-changelog` 命令本身 → 直接编辑 Laravel 代码

## Core pattern

```
准备阶段
  ├─ 询问用户：起点 commit 怎么识别？
  │     - commit message 正则（apc 默认：grep="release[:：]\\s*v"）
  │     - git tag（如 v*）
  │     - 显式指定 commit id / tag
  └─ 定位起点 commit（git log / git tag）

抽取阶段
  ├─ git log <start>..HEAD --pretty=format:"%h %s" --no-merges --reverse
  └─ 拿到 commit message 集合

整理阶段（AI 主导）
  ├─ 按 commit message prefix 归类：
  │     feat / add / 新增        → 【功能】
  │     fix / 修复                → 【修复】
  │     refactor / perf / 优化    → 【优化】
  │     release / merge / chore  → 丢弃
  ├─ 按【功能】/【修复】/【优化】格式整理为可复制正文
  └─ 拼接固定输出结构：
        - 当前更新版本为：v{version}
        - 版本Code：{versionCode}
        - 拟更新内容：{整理后正文}

询问阶段（关键！）
  ├─ 先在对话输出完整贴出「版本信息 + 拟定更新内容」
  └─ 再弹出单选框询问「是否入库？」

入库阶段（仅在用户选「入库」后执行）
  ├─ cd api && php artisan admin:version-changelog --description="..." 
  │   或 --file=../changelog/release-notes.txt
  └─ 失败时直接输出失败原因 + 下一步
```

## Implementation checklist

### 生成前

- [ ] **询问用户：起点 commit 怎么识别？** 三选一（commit message 正则 / git tag / 显式指定）
- [ ] 确认工作目录在 git 仓库根
- [ ] 确认 `changelog/version.json` 存在且 `version`、`versionCode` 字段齐全
- [ ] 确认 PHP 8.2+ 可用（执行 `php -v` 检查）

### 生成中

- [ ] 定位起点 commit（按用户选择的方式）
- [ ] 执行 `git log <start>..HEAD --pretty=format:"%h %s" --no-merges --reverse` 拿 commit 列表
- [ ] 按 commit prefix 归类为【功能】/【修复】/【优化】
- [ ] 整理为可一键复制的纯文本格式（见 [assets/changelog-template.txt](./assets/changelog-template.txt)）
- [ ] **在对话中先输出**完整「版本信息 + 拟定更新内容」（见 [references/format-and-output.md](./references/format-and-output.md) 第 2 节）
- [ ] **再弹出**单选确认框（选项：「入库」/「不入库」），不要把正文塞进问题 prompt

### 入库（仅在用户确认后）

- [ ] 执行：`cd api && php artisan admin:version-changelog --description="..."`（或 `--file=`）
- [ ] 默认 `title` = 当天日期 `YYYY-MM-DD`
- [ ] 默认从 `changelog/version.json` 读 `version` / `versionCode`
- [ ] 需要覆盖时使用 `--version=` / `--version-code=`
- [ ] 命令失败时直接输出失败原因（PHP 版本 / DB 连接 / 权限等），不假装成功

### 完成后

- [ ] 在对话中确认本次入库的 `version` / `versionCode` / `title` / `description`
- [ ] 如失败，引导用户在可用环境手动执行同一命令

## 起点 commit 识别方式

详细策略见 [references/git-baseline.md](./references/git-baseline.md)。

| 方式 | 命令 | 适用 |
|------|------|------|
| commit message | `git log -1 --grep="^release v" --pretty=format:"%h"` | 团队 commit 规范含 `release v*`（apc 默认） |
| git tag | `git tag --sort=-creatordate --list "v*" \| head -1` | 团队用 `git tag v*` 发版 |
| 显式指定 | 用户给 commit id 或 tag 名 | 任何特殊场景 |

## 关键决策表

### 起点 commit 找不到时

| 场景 | 处理方式 | 备注 |
|------|----------|------|
| 仓库首次入库 | 以第一个 commit 为起点 | 整段历史会进 changelog，必要时手动精简 |
| tag 命名不规范 | 提示用户手动指定起点 commit | 不要硬猜 |
| 用户明确说「只整理本次」 | 直接以用户提供的 commit 列表为准 | 跳过自动解析 |

### 入库参数选择

| 场景 | 推荐参数 | 理由 |
|------|----------|------|
| 描述较短（< 1KB） | `--description="..."` | 一行命令搞定 |
| 描述较长 / 含特殊字符 | 先保存为 UTF-8 文件 `--file=` | 避免 shell 转义 |
| 需要覆盖 version | `--version=v0.45.6` | 注意与 `php artisan --version` 区分 |
| 需要覆盖 versionCode | `--version-code=266` | 同上 |

## Anti-patterns

- **未询问起点识别方式就硬猜** → 必须先问用户，三选一
- **未展示内容就直接询问是否入库** → 必须先在对话里贴出「版本信息 + 拟定更新内容」
- **把正文塞进问题 prompt** → 弹窗内滚动体验差，正文留在对话里
- **用户未选「入库」就执行 `php artisan`** → 等待用户明确选择
- **入库失败却报告成功** → 必须把失败原因（PHP 版本 / DB 连接 / 命令不存在）原文输出
- **使用 `php artisan --version=...`** → 这是 Artisan 全局版本，与子命令无关，应是 `php artisan admin:version-changelog --version=...`
- **commit 类型不归类，一股脑堆到【功能】** → 必须按 feat/fix/refactor/perf 等语义分类
- **release tag 不规范导致找不到起点** → 不要硬猜「上一次 v 开头」，应提示用户手动指定
- **把本 skill 用在 H5 移动端** → H5 的更新说明走另一套流程

## Additional resources

- 起点识别：
  - [references/git-baseline.md](./references/git-baseline.md) — 起点 commit / tag 识别策略
- 对话与输出：
  - [references/format-and-output.md](./references/format-and-output.md) — changelog 输出格式 + 对话约定
  - [references/artisan-version-changelog.md](./references/artisan-version-changelog.md) — `php artisan admin:version-changelog` 完整参数、PHP 环境、失败排查
- 模板：
  - [assets/changelog-template.txt](./assets/changelog-template.txt) — 【功能】/【修复】/【优化】空白模板
- Commands 接入：
  - [commands/changelog.md](./commands/changelog.md) — 复制到业务仓库 `.trae/commands/` 或 `.cursor/commands/` 后即可用 `/changelog` 调用
- 相关 Skill：[apc-build-helper](../apc-build-helper/)（生成 version.json）
- 相关 Rule：[rules/apc-framework/](../../rules/apc-framework/)（仓库级硬约束）