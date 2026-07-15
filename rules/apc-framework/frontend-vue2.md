# 前端规范（Vue2 / backend）

本规则约束 `backend/` 内的 Vue2 管理后台开发方式，确保长期可维护与一致性。

## 目录与模块

- 只在 `backend/` 内开发前端代码；不要跨目录依赖 `api/` 的源码。
- 新增业务模块时，遵循项目现有的页面 / 组件 / 接口组织方式；若需调整结构，先在 `rules/apc-framework/` 记录原因与迁移策略。

## 组件与复用

- 优先拆分「可复用组件」与「页面级组件」，避免巨型页面文件。
- 组件 props / events 命名与行为保持一致；避免在同类组件中出现多套交互约定。

## 样式引用机制（全局与覆盖）

工程入口为 `backend/src/main.js`，样式加载顺序（后者可覆盖前者）为：

1. `normalize.css`：基础 reset。
2. `element-ui/lib/theme-chalk/index.css`：Element UI 默认主题样式。
3. `@/styles/index.scss`：项目全局 SCSS（在 `@import` 链里继续引入变量、混入、过渡、**Element 覆盖**、侧栏 / 地图等，以及第三方如 `@wangeditor/editor` 的 CSS）。

`index.scss` 通过顶部 `@import` 聚合子文件，其中 **`styles/element-ui.scss`** 专门用于「在全局层」覆盖 Element 的类名（与 `main.js` 里先引入的 `theme-chalk` 配合，形成约定：**先第三方基础主题，再项目全局覆盖**）。

### 引入新的样式库时怎么接、怎么覆盖

- **入口集中**：第三方 CSS 优先在 `main.js` 或 `styles/index.scss` 顶部 / 底部**一处**引入，避免同一库在多个业务 `.vue` 里重复 `import`。
- **顺序可控**：需要被项目覆盖的库，其样式应出现在 **`index.scss` 中覆盖规则之前**；若库必须在最后加载，则把本项目的覆盖规则放到更后的 `@import` 或单独文件并在链末尾引入。
- **覆盖单独成文件**：针对某一第三方（如地图、富文本、新 UI 库），在 `src/styles/` 下新增 `vendor-xxx.scss`（或 `xxx-overrides.scss`），只在 `index.scss` 里 `@import` 一次，**不要把大段第三方覆盖散落在各业务页面**。
- **优先提高选择器权重**：用更具体的选择器、或挂在布局 / 页面根类名下写覆盖；**慎用 `!important`**，与现有 `element-ui.scss` 风格保持一致，避免全局难以调试。
- **组件内样式**：业务页面 / 组件默认使用 `<style scoped>`；需要穿透修改子组件或第三方 DOM 时，使用 Vue2 约定的深度选择器（`::v-deep` / `/deep/` / `>>>`，以团队统一的一种为准），**作用域限定在本组件根节点下**，禁止在 scoped 块里写无前缀的全局标签选择器。

### 避免「通用样式」散落在各模块

- **全局只放真·全局**：重置、字体、`#app` / `body`、侧栏、面包屑、`.app-container` 等跨多页复用的布局类，留在 `styles/index.scss` 及其拆分的 partial（如 `sidebar.scss`、`element-ui.scss`）中；**不要**在 `views/` 各模块里复制粘贴同一套工具类。
- **模块内用根类名收口**：若某业务域需要一组共用布局 / 间距，在该域公共父组件上挂**有业务含义的前缀类名**（如 `.module-xxx-layout`），子页面只扩展该前缀下的规则，避免裸写 `.el-button`、`.el-form` 等到处污染。
- **新增全局类前先判断**：是否已有等价工具类 / 布局类（`index.scss` 体量较大，新增前先检索）；能组件化或 scoped 解决的，不升为全局。
- **与 `variables.scss` 对齐**：颜色、侧栏宽度等设计 token 优先走 `styles/variables.scss`（含 `:export` 供 JS 读取），避免魔法数字分散在多文件。

## 请求与错误处理

- 所有 HTTP 请求必须集中在统一封装层（以项目现状为准），禁止在组件内散落手写 axios 配置。
- 对异常统一处理：鉴权失效、权限不足、业务错误、网络错误需要有一致的提示与跳转策略。

## 权限与路由

- 路由与权限控制必须可追踪：明确「谁能访问什么页面 / 按钮」来自何处（后端权限点 / 前端配置）。
- 动态路由、菜单生成等逻辑要避免「硬编码散落」，集中管理。

## 构建与发布相关

- 发布相关逻辑以 `backend/build/*` 与 `backend/README.md` 为准；变更发布流程需同步更新 `deploy-release.md`。