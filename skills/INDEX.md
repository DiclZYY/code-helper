# Skills 索引

面向 AI 编程助手的 **Agent Skills** 合集，遵循 [Agent Skills 规范](https://agentskills.io/specification) 与 [skills-npm 目录约定](https://github.com/antfu/skills-npm/blob/main/PROPOSAL.md)（`skills/<skill-name>/SKILL.md`）。

> 总入口：[README.md](../README.md) · Rules 索引：[rules/INDEX.md](../rules/INDEX.md)

## Skills 目录

| Skill | 说明 |
|-------|------|
| [spa-naf](spa-naf/) | Vue2/3 + React：Tab 主壳 + 子页叠层、slide 转场、鉴权路由、keep-alive |
| [ai-agents-installer](ai-agents-installer/) | 初始化 AGENTS.md + .agents/ 骨架；CLAUDE.md 薄指针；长 CLAUDE 拆入 rules；npx skills add 装到 .agents/skills|rules |
| [apc-wechat-auth](apc-wechat-auth/) | admin-pro-core：device.authorize 客户端授权 + 可选微信小程序登录栈 |
| [css-anicase](css-anicase/) | 纯前端动画案例库：SVG + CSS，可选 GSAP；含光球 / 无缝波浪 / 透视事务卡片 |
| [apc-module-dev](apc-module-dev/) | apc 框架：新增一个标准业务模块的完整流程（后端三件套 + 前端四页 + mainResources + 权限 SQL + 模拟数据） |
| [apc-build-helper](apc-build-helper/) | apc 框架：构建工具链安装（version + release + deploy + release-config.json，支持 npm/pnpm） |
| [apc-release-changelog](apc-release-changelog/) | apc 框架：发布后生成 changelog（识别起点 commit + 抽取 message 集合 + AI 归类整理 + 可选 artisan 入库） |
| [apc-license-check](apc-license-check/) | apc 框架：系统许可检测（check_version + exp.bin 加密许可文件 + OutputException 拦截 + 续期签发） |
| [apc-shelf-position](apc-shelf-position/) | apc 框架：密集架配置（库/区/列 + 面/组/层）与档案箱/盒位置三字段；库区 pid 树 / 库房外键 + area_group 单字母两种模式；admin + H5 选位与网格占用 |

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
npx skills add DiclZYY/code-helper --skill apc-shelf-position
```

### 手动（个人 skills 目录）

```bash
git clone git@github.com:DiclZYY/code-helper.git
# 复制或 symlink 到 ~/.cursor/skills/
# 例：skills/spa-naf → ~/.cursor/skills/spa-naf
```

### 通过 npm 包布局（可选）

本仓库 `package.json` 的 `files` 含 `skills/`、`rules/`，日后若发布 npm，可配合 `skills-npm` 发现技能。

## 新增 Skill

1. 在 `skills/<skill-name>/` 下创建 `SKILL.md`
2. frontmatter 中 `name` **必须**与目录名一致
3. 详细文档放在 `references/`（可选 `scripts/`、`assets/`）
4. 更新本 INDEX.md 目录表 + 根 README.md 简介