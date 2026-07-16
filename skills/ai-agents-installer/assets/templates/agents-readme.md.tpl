# .agents

本目录是项目的 AI 编程助手工具集落点，遵循 AGENTS.md + `.agents/` 行业标准。

## 目录结构

```
.agents/
├── README.md           # 本文件
├── skills/             # 按 description 触发的 skill
│   ├── README.md
│   └── <skill-name>/SKILL.md
└── rules/              # 始终生效的硬约束 rule
    ├── README.md
    └── <rule-name>/*.md
```

## 维护约定

- **Skills** 按 description 中的触发词匹配，按需加载；新增 / 删除 skill 后必须同步更新根 `AGENTS.md` 的「Installed toolset」
- **Rules** 始终生效，常驻 AI 助手上下文；修改 rule 等同于修改项目硬约束，必须走 PR 评审
- skill 与 rule 目录名应与源仓库（默认 `DiclZYY/code-helper`）保持逐字符一致
- 不在 `.agents/` 下放业务代码、依赖、机密文件

## 安装 / 卸载

参见 [`ai-agents-installer` skill](../ai-agents-installer/SKILL.md) 或仓库根 `AGENTS.md`。
