# Skills 索引

面向 AI 编程助手的 **Agent Skills** 合集，遵循 [Agent Skills 规范](https://agentskills.io/specification) 与 [skills-npm 目录约定](https://github.com/antfu/skills-npm/blob/main/PROPOSAL.md)（`skills/<skill-name>/SKILL.md`）。

> 总入口：[README.md](../README.md) · Rules 索引：[rules/INDEX.md](../rules/INDEX.md)

## Skills 目录

| Skill | 说明 |
|-------|------|
| [spa-native-app-framework](spa-native-app-framework/) | Vue2/3 + React：Tab 主壳 + 子页叠层、slide 转场、鉴权路由、keep-alive |
| [apc-wechat-auth](apc-wechat-auth/) | admin-pro-core：device.authorize 客户端授权 + 可选微信小程序登录栈 |
| [svg-orb-hero-bg](svg-orb-hero-bg/) | Vue2/3：可配置 SVG 光球渐变 Hero 背景动画，支持主题色适配 |
| [apc-module-development](apc-module-development/) | apc 框架：新增一个标准业务模块的完整流程（后端三件套 + 前端四页 + mainResources + 权限 SQL + 模拟数据） |
| [apc-build-helper](apc-build-helper/) | apc 框架：构建工具链安装（version + release + deploy + release-config.json，支持 npm/pnpm） |
| [apc-release-changelog](apc-release-changelog/) | apc 框架：发布后生成 changelog（识别起点 commit + 抽取 message 集合 + AI 归类整理 + 可选 artisan 入库） |

## 安装

### Cursor / Claude（skills CLI）

```bash
npx skills add DiclZYY/code-helper-skills --skill spa-native-app-framework
npx skills add DiclZYY/code-helper-skills --skill apc-wechat-auth
npx skills add DiclZYY/code-helper-skills --skill svg-orb-hero-bg
npx skills add DiclZYY/code-helper-skills --skill apc-module-development
npx skills add DiclZYY/code-helper-skills --skill apc-build-helper
npx skills add DiclZYY/code-helper-skills --skill apc-release-changelog
```

### 手动（个人 skills 目录）

```bash
git clone git@github.com:DiclZYY/code-helper-skills.git
# 复制或 symlink 到 ~/.cursor/skills/
# 例：skills/spa-native-app-framework → ~/.cursor/skills/spa-native-app-framework
```

### 通过 npm 包布局（可选）

本仓库 `package.json` 的 `files` 含 `skills/`、`rules/`，日后若发布 npm，可配合 `skills-npm` 发现技能。

## 新增 Skill

1. 在 `skills/<skill-name>/` 下创建 `SKILL.md`
2. frontmatter 中 `name` **必须**与目录名一致
3. 详细文档放在 `references/`（可选 `scripts/`、`assets/`）
4. 更新本 INDEX.md 目录表 + 根 README.md 简介