# .agents/rules

项目级 rules 落点。每个 rule 是一个子目录，含 `README.md` + 一组围绕同一框架 / 主题的硬约束 `.md`。

## 当前 rules

| Rule | 硬约束主题 |
|------|-----------|
| _空_ | _初始化后由 `ai-agents-installer` 追加_ |

## 新增 rule

```bash
npx degit DiclZYY/code-helper/rules/<rule-name> .agents/rules/<rule-name>
```

或从其它仓库拷贝 `<rule-name>/` 整个目录。

详见 [`ai-agents-installer` skill](../ai-agents-installer/SKILL.md) 与 [`references/installer-commands.md`](../ai-agents-installer/references/installer-commands.md)。

## 删除 rule

1. 删除 `.agents/rules/<rule-name>/` 整个目录
2. 从根 `AGENTS.md` 的「Installed toolset」移除对应行

## 与 skill 的区别

| 维度 | skill | rule |
|------|-------|------|
| 触发方式 | 按 description 触发词按需加载 | 始终生效，常驻上下文 |
| 适用 | 方法论 + checklist + 模板 | 硬约束 / 强制工作流 |
| 修改门槛 | 单人 review 即可 | 必须团队 PR review |
