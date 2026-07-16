# code-helper

面向 AI 编程助手的 **Agent Skills + Rules** 合集。

- **Skills**（按 description 触发词匹配，按需加载）：[skills/INDEX.md](./skills/INDEX.md)
- **Rules**（始终生效，常驻上下文）：[rules/INDEX.md](./rules/INDEX.md)

## 快速开始：在项目里初始化 AI 工具集

```bash
npx skills add DiclZYY/code-helper --skill ai-agents-installer
```

安装 `ai-agents-installer` 后，在目标项目里执行 `node scripts/detect.mjs` → `node scripts/scaffold.mjs`，即可生成符合 AGENTS.md + `.agents/` 行业标准的骨架，并把后续 skill / rule 默认安装到 `.agents/skills/`、`.agents/rules/`。

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