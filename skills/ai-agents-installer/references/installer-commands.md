# Installer Commands

本 skill 在执行 init / install 时主要依赖两条命令：

1. `npx skills add <repo> [--skill <name>] [--to <dir>]` — 安装 skill
2. `npx degit <repo>/<subpath> <target>` — 直接拷贝子目录（rule / 模板片段）

## 默认参数

| 参数 | 默认值 | 备注 |
|------|--------|------|
| 源仓库 (`repo`) | `DiclZYY/code-helper` | 来自 `AGENTS.md` 的 `{{REPO_DEFAULT}}` 占位符 |
| skill 落点 | `.agents/skills/<skill-name>/` | 除非用户显式 `--to` |
| rule 落点 | `.agents/rules/<rule-name>/` | 用 `npx degit` 拷贝 |

## 常用命令

### 检测

```bash
node scripts/detect.mjs
# 输出：missing | partial | ready，并列出每个文件是否齐全
```

### 生成骨架

```bash
# 仅写缺失文件（默认）
node scripts/scaffold.mjs

# 指定源仓库
node scripts/scaffold.mjs --repo DiclZYY/code-helper
```

### 安装单个 skill

```bash
npx skills add DiclZYY/code-helper --skill <skill-name>
# 默认会按 skills CLI 自身的规则放到 ~/.cursor/skills/ 等个人目录
# 项目级安装：把内容复制到 .agents/skills/<skill-name>/
```

项目级安装的推荐写法：

```bash
TMP=$(mktemp -d)
npx skills add DiclZYY/code-helper --skill <skill-name> --to "$TMP"
cp -r "$TMP/<skill-name>/." ".agents/skills/<skill-name>/"
rm -rf "$TMP"
```

跨平台见下文。

### 安装 rule

```bash
npx degit DiclZYY/code-helper/rules/<rule-name> .agents/rules/<rule-name>
```

### 一次性安装多个 skill

```bash
for s in spa-naf css-svg-animate-bg; do
  npx skills add DiclZYY/code-helper --skill "$s"
done
```

## 跨平台注意

| 平台 | 临时目录 | 复制命令 | 反斜杠 / 引号 |
|------|----------|----------|----------------|
| macOS / Linux | `mktemp -d` | `cp -r` | POSIX 单引号即可 |
| Windows PowerShell | `[System.IO.Path]::GetTempPath()` | `Copy-Item -Recurse` | 路径含空格必须双引号 |
| Windows CMD | `%TEMP%` | `xcopy /E /I` | 用 `%VAR%` 引用变量 |

PowerShell 安装 skill 的完整片段：

```powershell
$tmp = Join-Path $env:TEMP ([System.Guid]::NewGuid().ToString())
npx skills add DiclZYY/code-helper --skill <skill-name> --to $tmp
Copy-Item -Recurse -Force `
  (Join-Path $tmp "<skill-name>") `
  (Join-Path ".agents/skills" "<skill-name>")
Remove-Item -Recurse -Force $tmp
```

## 故障排查

### `npx skills` 找不到仓库

- 确认仓库名正确：`DiclZYY/code-helper`（**不是** `code-helper`）
- 仓库必须可公开访问；若私有需配 GitHub token

### `npx skills add` 默认装到个人目录

`npx skills` 默认会装到 IDE 个人 skills 目录（`~/.cursor/skills/` 等）。**项目级安装必须显式 `--to` 再复制**，否则团队成员拉代码后看不到。

### `--to` 后目录是 skill 名还是 skill 内容

`npx skills add --to <dir>` 会把 `<skill-name>/` 整个目录放到 `<dir>/<skill-name>/`。复制时用 `cp -r "$TMP/<skill-name>/." "<dest>/"`（带 `.`）避免再嵌一层。

### Rule 装好后 `.agents/skills/` 也出现同名目录

`npx degit` 不会区分 skill / rule，路径写对即可。确认 `DiclZYY/code-helper/rules/<name>/` 存在再执行。

### frontmatter `name` 与目录名不一致

AI 助手按 `name` 匹配 description 触发词。若 `npx skills add` 安装后目录名被改名（例如 `--to` 导致大小写变化），手动改回原目录名或同步 frontmatter `name`。

### `AGENTS.md` 未更新「已安装工具集」

每次安装后**必须**在 `AGENTS.md` 的「已安装工具集」段落追加一行，否则接手者不知道项目挂了哪些 skill / rule。

## 安全与可重现

- `npx skills add` 会下载远端脚本，确认仓库可信后再执行
- `npx degit` 不执行远端脚本，仅下载文件，安全性更高
- 建议把 `.agents/` 提交到 git，团队成员通过 PR 评审 skill / rule 变更

## 参考

- `npx skills` 官方说明：[antfu/skills-npm](https://github.com/antfu/skills-npm/blob/main/PROPOSAL.md)
- `npx degit` 官方说明：[Rich-Harris/degit](https://github.com/Rich-Harris/degit)
