# .agents/skills

项目级 skills 落点。每个 skill 是一个子目录，根文件 `SKILL.md` 含 YAML frontmatter（`name` + `description`）。

## 当前 skills

| Skill | 用途 |
|-------|------|
| _空_ | _初始化后由 `ai-agents-installer` 追加_ |

## 新增 skill

```bash
npx skills add DiclZYY/code-helper-skills --skill <skill-name>
# 然后把内容同步到 .agents/skills/<skill-name>/
```

或直接从其它仓库拷贝 `<skill-name>/SKILL.md` 到本目录。

详见 [`ai-agents-installer` skill](../ai-agents-installer/SKILL.md) 与 [`references/installer-commands.md`](../ai-agents-installer/references/installer-commands.md)。

## 删除 skill

1. 删除 `.agents/skills/<skill-name>/` 整个目录
2. 从根 `AGENTS.md` 的「Installed toolset」移除对应行
