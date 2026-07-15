# Rules 索引

面向 AI 编程助手的**常驻 Rule 合集**（始终生效），用于约束类内容。

> 总入口：[README.md](../README.md) · Skills 索引：[skills/INDEX.md](../skills/INDEX.md)

## 什么是 Rule

| 类型 | 加载时机 | 适用内容 |
|------|----------|----------|
| **Skill** | 按 description 触发词匹配，按需加载 | 操作流程、模板生成、机制详解 |
| **Rule**（本目录） | 始终生效，常驻上下文 | 硬约束、风格规范、安全底线、目录边界 |

### 判定原则

- 含「必须 / 禁止 / 总是 / 硬约束 / 安全底线」→ **Rule**
- 含「怎么做 / 按什么步骤 / 用什么模板」→ **Skill**

## Rules 目录

| Rule | 说明 |
|------|------|
| [apc-framework](apc-framework/) | apc 框架（Vue2 + Laravel）：技术栈、目录边界、编码规范、安全、Vue2 / Laravel 工程规范、模块开发与发布概要 |

## 安装

> Rules 不通过 `skills CLI` 安装，需手动软链或复制。

### Cursor / Claude

```bash
git clone git@github.com:DiclZYY/code-helper-skills.git
# 用户级：~/.cursor/rules/
# 仓库级：<your-project>/.cursor/rules/

# 例：把整个 apc-framework 软链为用户级 rule
ln -s "$(pwd)/rules/apc-framework" ~/.cursor/rules/apc-framework
```

### Claude Code（仓库级）

在业务仓库根 `CLAUDE.md` 顶部追加：

```markdown
@../code-helper/rules/apc-framework/README.md
```

或使用 Claude Code 的 `additionalDirectories` / `.claude/rules/` 机制。

## 新增 Rule

1. 在 `rules/<rule-name>/` 下创建分类子文件（如 `tech-stack.md`、`security.md`）
2. 在 `rules/<rule-name>/README.md` 的「规则清单」追加一行
3. 更新本 INDEX.md 的 Rules 表格
4. 内容必须为**硬约束类**（"必须 / 禁止 / 总是"）；流程类请走 [skills/INDEX.md](../skills/INDEX.md) 的 Skill