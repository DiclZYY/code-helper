---
name: "changelog"
description: "apc 管理后台生成更新日志并写入 version 表"
---

按 `apc-release-changelog` skill 的 SOP 执行。**不携带脚本**——所有动作在对话里完成。

## 强制流程

### 1. 询问起点 commit 识别方式（**必做**）

用 `AskUserQuestion` 弹出三选一面板：

```yaml
question: 上次发布 commit 怎么识别？
options:
  - label: commit message 正则 (推荐)
    description: 通过 git log --grep "release v" 匹配，apc 项目默认方式。
  - label: git tag
    description: 通过 git tag --list "v*" 匹配。
  - label: 显式指定
    description: 你直接给我 commit id 或 tag 名。
```

**用户选择后立即固化**，后续按此方式执行，不再二次询问。

### 2. 抽取 commit message 集合

按用户选择的方式定位起点后：

```bash
# commit message 模式
START=$(git log -1 --grep="^release v" --pretty=format:"%h")

# tag 模式
START=$(git rev-list -1 $(git tag --sort=-creatordate --list "v*" | head -1))

# 抽区间
git log $START..HEAD --no-merges --pretty=format:"%h %s" --reverse
```

### 3. AI 整理 + 输出（**必做**）

按 [references/format-and-output.md](../references/format-and-output.md) 的规则归类【功能】/【修复】/【优化】，在对话里按固定结构输出：

```
当前更新版本为：v{version}（来自 changelog/version.json）
版本Code：{versionCode}（来自 changelog/version.json）
拟更新内容：
{description}
```

### 4. 询问入库（必做）

弹出单选框，**不要**把正文塞进问题 prompt：

```yaml
question: 是否入库？
options:
  - label: 入库
    description: 由助手在终端执行 `cd api && php artisan admin:version-changelog ...`，将本次拟定内容写入数据库。
  - label: 不入库
    description: 仅输出可复制的拟定更新内容，不执行任何入库动作。
```

### 5. 用户选「入库」后

执行（命令细节见 [artisan-version-changelog.md](../references/artisan-version-changelog.md)）：

```bash
cd api && php artisan admin:version-changelog --file=../changelog/release-notes.txt
```

> 如果项目有 CLI 包装约定（如 `pnpm exec` / `npx` / 自定义脚本），按项目仓库的 CLAUDE.md / README 约定添加。

执行后**必须**在对话中确认入库结果（成功 / 失败都需明示）。

### 6. 失败处理

命令报错时**直接输出失败原因 + 下一步**，不要假装成功。常见原因：PHP 版本不符、数据库未连接、artisan 命令未注册、version.json 不存在、主键冲突。

详细排查：[references/artisan-version-changelog.md](../references/artisan-version-changelog.md) 第 5-6 节。

### 7. 草稿模式

如果用户只是想看最近改了什么，跳过入库询问步骤，只输出固定结构即可。不弹「是否入库？」。

## 反模式

- **不询问起点识别方式就硬猜** → 必须在第 1 步弹出三选一面板
- **未展示内容就直接询问是否入库** → 必须在第 3 步完整输出固定结构
- **把正文塞进问题 prompt** → 弹窗体验差
- **用户选「不入库」后还尝试执行命令** → 尊重用户选择
- **入库失败却报告成功** → 必须如实输出错误

## 相关文档

- [references/git-baseline.md](../references/git-baseline.md) — 起点识别策略
- [references/format-and-output.md](../references/format-and-output.md) — 输出格式与对话约定
- [references/artisan-version-changelog.md](../references/artisan-version-changelog.md) — 入库命令细节