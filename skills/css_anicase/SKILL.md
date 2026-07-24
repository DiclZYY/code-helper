---
name: css_anicase
description: >-
  Pure-frontend animation skill: build UI motion with SVG, CSS keyframes, and
  optional GSAP. Case library covers hero orb blobs, seamless looping waves,
  and perspective transaction-card flows. Use for login decor, landing heroes,
  brand showcases, ambient backgrounds, SVG animation, GSAP timeline.
---

# css_anicase（纯前端 SVG / CSS / GSAP 动画）

用**纯前端**手段构建可复用动画：不依赖视频、WebGL 或服务端渲染。技术栈按复杂度选型——

| 层级 | 技术 | 典型场景 |
|------|------|----------|
| 轻量 | **纯 SVG + CSS `@keyframes`** | 氛围循环、无缝滚动、光球漂移 |
| 编排 | **SVG 内容 + GSAP timeline** | 多元素错峰、3D 纵深、分段入离场 |
| 可选 | CSS 变量 / SCSS 主题色推导 | 对接设计系统主色 |

本 skill 以**案例库**为主：先匹配场景，再复制对应 `references/` + `assets/` 模板落地；新增动画优先沉淀为新 case，而不是把细节堆进本文件。

## When to use

**适用：**

- 登录页、落地页、产品发布页的装饰性 / 叙事性动效
- 需要可复制、可换肤的前端动画片段（Vue2/3 或纯 HTML）
- 在「纯 CSS」与「引入 GSAP」之间做明确选型

**不适用：**

- 复杂粒子、物理碰撞、鼠标跟随轨迹（Canvas / WebGL）
- 必须以视频 / Lottie 交付的定稿动画
- 强 SEO 且首屏 DOM 预算极紧（可改为 CSS-only 静态装饰）

## 技术选型（实现前确认）

1. **是否只需无限循环氛围？** → 纯 SVG + CSS（光球 / 波浪）
2. **是否多元素分段编排 / 3D z 轴？** → SVG 造型 + GSAP
3. **主题色从哪来？** → CSS 变量透传；推导算法见 [gradient-derivation](references/gradient-derivation.md)
4. **减弱动效？** → 一律尊重 `prefers-reduced-motion`

## 案例库（复用入口）

| # | 案例 | 技术栈 | 一句话 | 文档 | 模板 |
|---|------|--------|--------|------|------|
| 1 | **Hero 光球渐变** | 纯 SVG + CSS | 多层径向光球异步平移/旋转，首屏氛围 | [case-orb-hero](references/case-orb-hero.md) | [orb-hero.template.vue](assets/orb-hero.template.vue) |
| 2 | **底部无缝波浪** | 纯 SVG + CSS | 双周期 path + `translateX(-50%)` 无跳动；可 mask 融合底图 | [case-seamless-wave](references/case-seamless-wave.md) | [seamless-wave.template.vue](assets/seamless-wave.template.vue) |
| 3 | **透视事务卡片流** | SVG + CSS 舞台 + **GSAP** | 向内 ~45° 透视，多形态卡片入场→纵深→消失 | [case-perspective-tx-cards](references/case-perspective-tx-cards.md) | [perspective-tx-cards.template.vue](assets/perspective-tx-cards.template.vue) |

**组合示例（登录页）**：左侧案例 3 + 底部案例 2；或全屏案例 1 作底。

### 落地步骤（AI / 开发者）

1. 对照上表选 1 个或多个 case  
2. 复制 `assets/*.template.vue` 到业务目录，按主题色改 CSS 变量 / `color`  
3. 细节与反模式以对应 `references/case-*.md` 为准  
4. 若场景新且可复用 → 新增 `case-*.md` + `*.template.*`，并在本表追加一行  

## 共享原则

- **氛围循环优先 CSS**（合成器线程）；GSAP 留给时间轴编排
- **颜色走变量**，避免写死无法换肤的 hex
- **无缝类动画**必须对称周期 + `linear`（见波浪案例）
- 使用 GSAP 时：`mounted` 启动、`beforeDestroy`/`onUnmounted` 里 `timeline.kill()`
- 始终处理 `prefers-reduced-motion: reduce`

## Anti-patterns

- 把本 skill 当成「只能做光球背景」→ 定位是纯前端动画案例库，按表选型
- 简单循环却上 GSAP → 多余依赖；反之复杂编排硬用 CSS delay 海 → 难维护
- 新增动效只改业务页、不回写 case → 失去复用价值
- 其余 case 专属反模式见各 `references/case-*.md`

## 共享参考（非独立案例）

- [references/gradient-derivation.md](references/gradient-derivation.md) — 主题色 → 径向渐变 stop
- [references/animation-timing.md](references/animation-timing.md) — 时长互质、轨迹不重复

## Additional resources

案例与模板见上方**案例库**表；共享参考见上一节。
