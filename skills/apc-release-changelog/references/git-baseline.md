# 起点 commit 识别策略

生成 changelog 的第一步：从仓库历史中**定位起点 commit**。「起点」是「上次发布 commit」，是本次增量的起点。

> **首要原则**：起点识别方式**必须在对话开始时由用户指定**，AI 不能硬猜。三种方式各有适用场景。

## 1. 三种识别方式

### 方式 A：commit message 正则（apc 默认）

**业务约定**：所有正式发布都会打一个 commit，其 message 含 `release v*` 字样（例如 `release v0.45.6`）。这是「上次发布」的语义锚点。

**查找命令**：

```bash
git log -1 --grep="^release v" --pretty=format:"%h"
```

匹配示例：
- `release v1.2.3` ✓
- `release: v1.2.3` ✓
- `Release: v1.2.3` ✓（大小写不敏感）
- `feat: 新增XX` ✗

**适用**：团队 commit 规范含 `release v*` 提交。

### 方式 B：git tag

**业务约定**：每次发版打一个 tag，tag 名形如 `v1.2.3`。

**查找命令**：

```bash
git tag --sort=-creatordate --list "v*" | head -1
```

匹配示例：
- `v1.2.3` ✓
- `v1.2.3-rc1` ✓
- `release-1.2.3` ✗（除非改 glob 为 `release-*`）

**适用**：团队用 `git tag v*` 发版，或希望与 commit message 解耦。

### 方式 C：显式指定

用户直接给 commit id 或 tag 名。

**解析命令**：

```bash
# 给的是 commit id（hex 字符串）
git log -1 --pretty=format:"%h" <commit>

# 给的是 tag
git rev-list -1 <tag>
```

**适用**：任何特殊场景（首次入库、跳过某次发布、合并发布等）。

## 2. 询问方式

**必须在对话开始时用 `AskUserQuestion` 弹出三选一面板**：

```yaml
question: 上次发布 commit 怎么识别？
options:
  - label: commit message 正则 (推荐)
    description: 通过 commit message 匹配 `release v*`，apc 项目默认方式。
  - label: git tag
    description: 通过 git tag 匹配 `v*` 形式。
  - label: 显式指定
    description: 你直接给我 commit id 或 tag 名。
```

**用户选择后立即固化**——后续步骤按此方式执行，不再二次询问。

## 3. 拿到 commit 列表

起点确定后，拿到「起点 → HEAD」所有 commit（**默认排除 merge**）：

```bash
git log <start>..HEAD --no-merges --pretty=format:"%h %s" --reverse
```

参数说明：
- `--no-merges` 排除 merge commit（避免 merge 信息污染 changelog）
- `--reverse` 按时间正序（旧 → 新），便于 AI 整理
- `--pretty=format:"%h %s"` 输出短 hash + 主题

如果需要包含 merge（如某些团队用 merge commit 表示完整发布周期），去掉 `--no-merges`。

## 4. 备用方案：reflog 解析

如果起点 commit 之后被 `git reset` / `amend` 改写过，`git log <start>..HEAD` 可能看不到所有 commit。

**备选**：解析 `.git/logs/HEAD`：

```text
<old_sha> <new_sha> <author> <timestamp> <tz> <action>: <message>
```

每行一条 HEAD 移动记录。AI 解析时按行拆分，找到 start commit 之后的所有新 commit。

**适用场景**（极少见）：
- release commit 之后被 fixup 改写过
- 起点 commit 所在分支被 reset
- 起点 commit 所在分支被 rebase 改写过

## 5. 找不到起点 commit 时的处理

| 场景 | 处理方式 | 备注 |
|------|----------|------|
| 仓库首次入库 | 以第一个 commit 为起点 | 整段历史会进 changelog，必要时手动精简 |
| tag 命名不规范 | 提示用户手动指定起点 commit | 不要硬猜 |
| 用户明确说「只整理本次」 | 直接以用户提供的 commit 列表为准 | 跳过自动解析 |
| grep 匹配不到 `release v*` | 让用户改用 tag 模式或显式指定 | 不要随机猜 commit |

## 6. 反模式

- **不询问用户就默认 `release v*` grep** → 某些项目用 tag 发版，commit message 没有 `release v*`，识别不到
- **git log 不加 `--no-merges`** → merge commit 会污染 changelog
- **随机猜「最近 7 天的 commit」** → 不同发布周期长度不同，会漏掉或重复
- **用 `git diff --name-only` 反推变更** → diff 看不到 commit message 语义，归类不准
- **起点 commit 找不到时硬猜** → 必须询问用户显式指定

## 7. 完整示例

```bash
# 1. 询问用户确认识别方式（commit / tag / 显式）
# 2. 假设用户选 commit message：

START=$(git log -1 --grep="^release v" --pretty=format:"%h")

# 3. 拿 commit 列表
git log $START..HEAD --no-merges --pretty=format:"%h %s" --reverse

# 4. AI 在对话里按规则归类、整理、输出
# 5. 询问用户后入库
cd api && php artisan admin:version-changelog --description="..."
```