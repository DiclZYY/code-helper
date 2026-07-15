# changelog 输出格式 + 对话约定

本文件定义 changelog **正文格式** 与 **AI 对话输出约定**。重点是：**先输出内容，再询问是否入库**——这两步必须**分开**，不要把正文塞进询问弹窗。

## 1. changelog 正文格式

### 标准结构

```txt
【功能】
• 新增功能 1
• 新增功能 2

【修复】
• 修复 XXX

【优化】
• 优化 XXX
```

### 规则

| 规则 | 说明 |
|------|------|
| **三大分类** | 必填项固定为【功能】/【修复】/【优化】，顺序固定 |
| **某类无内容** | **整个小节省略**，不要写「【修复】\n• 无」 |
| **bullet 字符** | 使用中文全角「•」（U+2022 也可，但建议统一） |
| **bullet 内容** | 开头动词建议为「新增/修复/优化」，与分类保持一致 |
| **长度** | 每条 bullet 不超过 30 字，关键信息前置 |
| **编码** | 整个文件 / 字符串使用 UTF-8 |
| **换行** | 类与类之间空一行，类内 bullet 之间不空行 |

完整模板见 [../assets/changelog-template.txt](../assets/changelog-template.txt)。

### 示例（完整）

```txt
【功能】
• 新增档案批量导入（支持 csv/xlsx）
• 新增移动端扫码登录
• 新增部门数据权限

【修复】
• 修复密集架位置冲突
• 修复列表页筛选失效

【优化】
• 优化列表分页性能（首屏 -300ms）
• 优化档案详情页加载策略
```

## 2. commit 归类规则

把 commit 按 message 前缀归入三类：

| message 前缀（含 `:` 或 `：`） | 归类 |
|--------------------------------|------|
| `feat:` / `feat：` / `add:` / `add：` / `新增` | 【功能】 |
| `fix:` / `fix：` / `修复` / `bug:` | 【修复】 |
| `refactor:` / `perf:` / `优化：` / `style:` | 【优化】 |
| 其他（`docs:` / `chore:` / `test:` / 无前缀） | 丢弃或合并到【优化】 |
| `release v*` / `Merge ...` / `chore: bump` | **丢弃**（不是功能变更） |

### 归类优先级冲突时

- 如果 commit message 同时含多个语义词（例如 `feat: 重构并修复 XXX`），按**第一个出现的语义词**归类
- 难以判断时**丢到【优化】**而不是乱猜

### 提取「一句话描述」

只取 commit message 的**主题部分**（第一行），去掉前缀：

```
feat: 新增档案批量导入
  ↓
新增档案批量导入
```

如果主题部分带括号补充（如 `feat: 新增导入（支持 csv/xlsx）`），**保留括号**——括号里往往是关键约束信息。

## 3. 对话输出固定结构（必读）

**整理完成后，询问入库前，必须在对话里按下面三行结构输出关键信息**。不允许在未展示任何内容时就直接询问是否入库。

```
当前更新版本为：v{version}（来自 changelog/version.json）
版本Code：{versionCode}（来自 changelog/version.json）
拟更新内容：
{description}
```

### 真实示例

> 当前更新版本为：`v0.45.6`（来自 `changelog/version.json`）
>
> 版本Code：`266`（来自 `changelog/version.json`）
>
> 拟更新内容：
>
> ```
> 【功能】
> • 新增档案批量导入（支持 csv/xlsx）
> • 新增移动端扫码登录
>
> 【修复】
> • 修复密集架位置冲突
>
> 【优化】
> • 优化列表分页性能（首屏 -300ms）
> ```

### 注意事项

- **`version` / `versionCode` 必须从 `changelog/version.json` 提取**，不要让用户手动填写（避免出错）
- **对话中不必贴整段 JSON**，只需要展示最终值
- **建议先用命令的预览输出做校验**：例如先 `cat changelog/version.json` 或用 `node -e "console.log(JSON.parse(require('fs').readFileSync('changelog/version.json','utf8')))"` 确认值无误后再展示
- **如果 `changelog/version.json` 与 release commit 中的 `release v*` 版本不一致**，必须立刻指出并让用户决定

## 4. 询问入库：拆成两段（关键！）

### 错误示范

❌ 把正文塞进问题 prompt：

```
【错误】❌

问题：「以下 changelog 是否入库？
【功能】
• 新增档案批量导入
...
（很长一段）
A. 入库 B. 不入库」
```

用户在弹窗里要**滚动很久**才能看完，体验差。

### 正确示范

✅ 先在对话输出完整正文，再**单独弹窗**简短询问：

**第一步：对话输出**（上面第 3 节的固定结构）

**第二步：弹出单选弹窗**（用 `AskUserQuestion`）

```yaml
question: 是否入库？
options:
  - label: 入库
    description: 由助手执行 `cd api && php artisan admin:version-changelog --file=...` 将本次拟定内容写入数据库。
  - label: 不入库
    description: 仅输出可复制的拟定更新内容，不执行任何入库动作。
```

## 5. 用户选「入库」后

执行命令后，**必须在对话中确认入库结果**：

### 成功

> **入库成功**
>
> - 版本：`v0.45.6`
> - versionCode：`266`
> - title：`2026-07-14`
> - 数据库表：`version`

### 失败

完整输出失败原因 + 下一步（详见 [artisan-version-changelog.md](./artisan-version-changelog.md) 第 6 节）：

> **入库失败**
>
> 命令：`...`
>
> 报错：`...`
>
> 原因：...
>
> 下一步：
>
> 1. ...
> 2. ...

**不允许假装成功。**

## 6. 用户选「不入库」后

仅保留上述「对话输出固定结构」，**不执行任何命令**。用户可以自行复制正文到任何位置。

可以在对话中追加一句：

> 已为你保留以上内容，可一键复制。如需修改某条 bullet，请直接指出。

## 7. 草稿模式（不入库）

如果用户只是「想看下最近改了什么」，跳过入库询问步骤，只输出固定结构即可。不弹「是否入库？」。

## 8. 反模式

- **未展示内容就直接弹「是否入库？」** → 用户不知道要入库什么
- **弹窗里塞长正文** → 弹窗体验割裂
- **用户选「不入库」后还尝试执行命令** → 尊重用户选择
- **入库失败却报告成功** → 必须如实输出错误
- **修改 `changelog/version.json` 后不告知用户** → version 变更需要用户知情
- **bullet 中混用「•」「-」「*」** → 全文统一用「•」

## 9. 完整对话流程示意

```
用户：/changelog

助手：
  [询问起点 commit 识别方式：commit / tag / 显式]
  [按用户选择定位起点 commit]
  [执行 git log 拿 commit message 集合]
  [按规则归类【功能】/【修复】/【优化】]
  [生成 description]

  当前更新版本为：v0.45.6
  版本Code：266
  拟更新内容：
  ```
  【功能】
  • 新增档案批量导入
  ...
  ```

  [弹出 AskUserQuestion]
  问题：是否入库？
  选项：
    - 入库：执行 cd api && php artisan admin:version-changelog ...
    - 不入库：仅保留以上内容

用户：选「入库」

助手：
  [执行命令]

  入库成功
  - 版本：v0.45.6
  - ...
```

---

**相关**：
- [git-baseline.md](./git-baseline.md) — 起点 commit 识别策略
- [artisan-version-changelog.md](./artisan-version-changelog.md) — 入库命令细节
- [../assets/changelog-template.txt](../assets/changelog-template.txt) — 空白模板