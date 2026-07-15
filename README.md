# code-helper

面向 AI 编程助手的 **Agent Skills + Rules** 合集。

- **Skills**（按 description 触发词匹配，按需加载）：[skills/INDEX.md](./skills/INDEX.md)
- **Rules**（始终生效，常驻上下文）：[rules/INDEX.md](./rules/INDEX.md)

## 目录结构

```
code-helper/
├── README.md                       # 本文件（总入口）
├── skills/
│   ├── INDEX.md                    # Skills 索引与安装
│   └── <skill-name>/SKILL.md       # Agent Skill 定义
└── rules/
    ├── INDEX.md                    # Rules 索引与安装
    └── <rule-name>/*.md            # 框架硬约束（分类子文件 + README.md）
```

## 规范链接

- [Agent Skills 规范](https://agentskills.io/specification)
- [skills-npm 目录约定](https://github.com/antfu/skills-npm/blob/main/PROPOSAL.md)

## License

MIT