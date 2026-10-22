# code-helper

面向 AI 编程助手的 **Agent Skills + Rules** 合集。

- **Skills**（按 description 触发词匹配，按需加载）：[skills/INDEX.md](./skills/INDEX.md)
- **Rules**（始终生效，常驻上下文）：[rules/INDEX.md](./rules/INDEX.md)

## Skills 目录

| Skill | 说明 |
|-------|------|
| [spa-naf](skills/spa-naf/) | Vue2/3 + React：Tab 主壳 + 子页叠层、slide 转场、鉴权路由、keep-alive |
| [ai-agents-installer](skills/ai-agents-installer/) | 初始化 AGENTS.md + .agents/ 骨架；CLAUDE.md 薄指针；长 CLAUDE 拆入 rules；npx skills add 装到 .agents/skills\|rules |
| [apc-wechat-auth](skills/apc-wechat-auth/) | admin-pro-core：device.authorize 客户端授权 + 可选微信小程序登录栈 |
| [css-anicase](skills/css-anicase/) | 纯前端动画案例库：SVG + CSS，可选 GSAP；含光球 / 无缝波浪 / 透视事务卡片 |
| [apc-module-dev](skills/apc-module-dev/) | apc 框架：新增一个标准业务模块的完整流程（后端三件套 + 前端四页 + mainResources + 权限 SQL + 模拟数据） |
| [apc-build-helper](skills/apc-build-helper/) | apc 框架：构建工具链安装（version + release + deploy + release-config.json，支持 npm/pnpm） |
| [apc-release-changelog](skills/apc-release-changelog/) | apc 框架：发布后生成 changelog（识别起点 commit + 抽取 message 集合 + AI 归类整理 + 可选 artisan 入库） |
| [apc-license-check](skills/apc-license-check/) | apc 框架：系统许可检测（check_version + exp.bin 加密许可文件 + OutputException 拦截 + 续期签发） |

## 安装

### Cursor / Claude（skills CLI）

```bash
npx skills add DiclZYY/code-helper --skill spa-naf
npx skills add DiclZYY/code-helper --skill ai-agents-installer
npx skills add DiclZYY/code-helper --skill apc-wechat-auth
npx skills add DiclZYY/code-helper --skill css-anicase
npx skills add DiclZYY/code-helper --skill apc-module-dev
npx skills add DiclZYY/code-helper --skill apc-build-helper
npx skills add DiclZYY/code-helper --skill apc-release-changelog
npx skills add DiclZYY/code-helper --skill apc-license-check
```

### 手动（个人 skills 目录）

```bash
git clone git@github.com:DiclZYY/code-helper.git
# 复制或 symlink 到 ~/.cursor/skills/
# 例：skills/spa-naf → ~/.cursor/skills/spa-naf
```

## 快速开始：在项目里初始化 AI 工具集

```bash
npx skills add DiclZYY/code-helper --skill ai-agents-installer
```

安装 `ai-agents-installer` 后，在目标项目里执行 `node scripts/detect.mjs` → `node scripts/scaffold.mjs`，即可生成符合 AGENTS.md + `.agents/` 行业标准的骨架（含可选薄指针 `CLAUDE.md`），并把后续 skill / rule 默认安装到 `.agents/skills/`、`.agents/rules/`。架构正文只写在 rules，避免与 CLAUDE 双份维护。

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