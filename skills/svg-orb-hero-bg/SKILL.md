---
name: svg-orb-hero-bg
description: >-
  Build configurable SVG orb/gradient hero-background animations with CSS
  keyframes: multi-layer nested <g> translation + rotation, radial-gradient
  blobs, optional grid pattern. Supports theme-color adaptation and user
  customization. Use for landing-page hero sections, product launch pages,
  brand showcases.
---

# SVG Orb Hero Background

基于纯 CSS + SVG 的 Hero 区背景动画系统：多个径向渐变光球通过异步平移与旋转形成流动感，可选网格图案叠加。支持通过 CSS 变量或 SCSS 配置颜色、不透明度、动画时长，亦可对接项目主题色自动推导渐变。

## When to use

**适用：**

- 产品发布页、版本更新公告页、落地页的首屏背景
- 需要「科技感/呼吸感」但又不依赖视频/WebGL 的轻量方案
- 已有设计系统主题色，希望背景自动跟随主色变化
- Vue2/Vue3 或纯 HTML/CSS 项目，要求动画性能优异（合成器线程）

**不适用：**

- 需要复杂粒子交互或鼠标跟随（应选 Canvas/WebGL）
- 多页 SSR 场景且首屏要求极简 DOM（SVG 节点数虽少但仍增 payload）
- 用户明确指定了固定背景图/视频（不要强行替换）

## Core pattern

### 三层嵌套驱动模型

每个光球使用 **三层嵌套 `<g>`** 解耦 X 轴移动、Y 轴移动、旋转：

```text
<g class="orb-x">      <!-- X 轴平移动画 -->
  <g class="orb-y">    <!-- Y 轴平移动画 -->
    <rect class="orb-r"> <!-- 旋转动画 + 径向渐变填充 -->
```

三层独立绑定不同 `@keyframes`，通过不同的 `animation-duration` 制造非周期性的「有机流动」。

### 动画参数表

| 光球 | X 轴时长 | Y 轴时长 | 旋转时长 | 旋转方向 |
|------|----------|----------|----------|----------|
| orb-1 | 10s | 10.5s | 7s | 正向 0→360° |
| orb-2 | 11.5s | 12s | 12s | 正向 0→360° |
| orb-3 | 12.5s | 6s | 9s | 反向 360→0° |

关键 CSS：

```css
.orb-x { animation: orb1-x 10s linear infinite alternate; }
.orb-y { animation: orb1-y 10.5s linear infinite alternate; }
.orb-r { animation: orb-rotate-fwd 7s linear infinite normal; }

@keyframes orb1-x { 0% { transform: translateX(25%); } 100% { transform: translateX(0%); } }
@keyframes orb1-y { 0% { transform: translateY(0%); } 100% { transform: translateY(25%); } }
@keyframes orb-rotate-fwd { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
```

`transform-box: view-box; transform-origin: 50% 50%;` 确保旋转基于 SVG 视口。

### 视觉层叠

```text
┌─────────────────────────────┐
│  section.hero (relative)    │
│  ┌───────────────────────┐  │
│  │ svg.hero-bg           │  │  ← 光球层，opacity: 0.35
│  │  ┌─────────────────┐  │  │
│  │  │ svg.hero-pattern│  │  │  ← 可选网格图案层
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ .hero-content         │  │  ← 文字内容，z-index 高于背景
│  └───────────────────────┘  │
└─────────────────────────────┘
```

## Implementation checklist

### 1. 询问用户选配（必须由 AI 主动确认）

在生成代码前，通过面板或对话确认以下配置项：

| 配置项 | 选项/类型 | 默认 |
|--------|-----------|------|
| **光球数量** | 1~5 个 | 3 个 |
| **主色调** | 用户输入 hex / 项目主题色变量 | `#856dff`（紫） |
| **辅助色** | 用户输入 hex / 自动计算 | 主色 20% 透明度混合白 |
| **背景图案** | 无 / 网格 / 自定义 SVG path | 无 |
| **动画速度** | 慢(1.5x) / 正常(1x) / 快(0.6x) | 正常 |
| **不透明度** | 0.1 ~ 0.6 | 0.35 |
| **暗色模式适配** | 是 / 否 | 是 |

> **注意**：若用户提供了项目主题色（如 `var(--primary-color)`、`$theme-primary`），优先使用 CSS 变量透传，不要写死 hex。

### 2. SVG 结构模板

```html
<section class="hero">
  <svg class="hero-bg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <!-- 光球 1 渐变 -->
      <radialGradient id="orbGrad1" cx="50%" cy="50%" fx="0.4%" fy="50%" r=".5">
        <stop offset="0%" stop-color="var(--orb-color-1, rgba(210, 203, 255, 1))" />
        <stop offset="100%" stop-color="var(--orb-bg, rgba(51, 63, 124, 0))" />
      </radialGradient>
      <!-- 光球 2、3 同理... -->
    </defs>

    <!-- 光球 1 -->
    <g class="orb-1-x">
      <g class="orb-1-y">
        <rect width="100%" height="100%" fill="url(#orbGrad1)" class="orb-1-r" />
      </g>
    </g>
    <!-- 光球 2、3... -->
  </svg>

  <!-- 可选：网格图案 -->
  <svg class="hero-pattern" aria-hidden="true" v-if="showPattern">
    <defs>
      <pattern id="hero-pattern" width="32" height="64" patternUnits="userSpaceOnUse">
        <path d="M0,28 L20,28 L20,16..." fill="none" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hero-pattern)" />
  </svg>

  <div class="hero-content">
    <!-- 业务内容 -->
  </div>
</section>
```

### 3. CSS 变量化配置（推荐）

```css
:root {
  /* 光球颜色：支持外部主题色透入 */
  --orb-color-1: rgba(210, 203, 255, 1);
  --orb-color-2: rgba(133, 109, 255, 1);
  --orb-color-3: rgba(210, 203, 255, 1);
  --orb-bg: rgba(51, 63, 124, 0);

  /* 动画速度倍率 */
  --orb-speed: 1;
  --orb-opacity: 0.35;
}

.hero-bg {
  opacity: var(--orb-opacity);
  transition: opacity 0.5s ease;
}

/* 速度变量绑定 */
.orb-1-x { animation-duration: calc(10s / var(--orb-speed)); }
.orb-1-y { animation-duration: calc(10.5s / var(--orb-speed)); }
.orb-1-r { animation-duration: calc(7s / var(--orb-speed)); }
```

### 4. 主题色自动推导（SCSS 示例）

若项目使用 SCSS 且已有 `$primary`：

```scss
@use "sass:color";

$orb-primary: $primary !default;
$orb-light: color.scale($orb-primary, $lightness: 60%, $alpha: -20%) !default;
$orb-dark: color.scale($orb-primary, $lightness: -30%, $alpha: -100%) !default;

:root {
  --orb-color-1: #{$orb-light};
  --orb-color-2: #{$orb-primary};
  --orb-color-3: #{$orb-light};
  --orb-bg: #{$orb-dark};
}
```

### 5. Vue 组件封装建议

```vue
<template>
  <section class="hero" :style="cssVars">
    <OrbBackground
      :count="config.orbCount"
      :colors="config.colors"
      :speed="config.speed"
      :opacity="config.opacity"
    />
    <slot />
  </section>
</template>

<script>
export default {
  props: {
    themeColor: String,      // 如 '#856dff'
    orbCount: { type: Number, default: 3 },
    speed: { type: Number, default: 1 },
    opacity: { type: Number, default: 0.35 },
  },
  computed: {
    cssVars() {
      return {
        '--orb-speed': this.speed,
        '--orb-opacity': this.opacity,
        '--orb-color-2': this.themeColor || 'rgba(133, 109, 255, 1)',
      }
    }
  }
}
</script>
```

### 6. 暗色模式适配

```css
@media (prefers-color-scheme: dark) {
  :root {
    --orb-color-1: rgba(180, 170, 255, 0.8);
    --orb-color-2: rgba(120, 100, 255, 0.9);
    --orb-bg: rgba(20, 20, 40, 0);
  }
}

/* 或配合 class 切换 */
.dark .hero-bg {
  opacity: calc(var(--orb-opacity) * 0.8);
}
```

## Anti-patterns

- **用 JavaScript 驱动 transform** → 浪费合成器线程优势，CSS `animation` 性能更优
- **内外层动画共用相同时长** → 光球轨迹呈周期重复，视觉呆板；时长应互质或故意错开
- **写死 hex 值不提供 CSS 变量入口** → 无法对接设计系统主题色
- **省略 `transform-box: view-box`** → 旋转原点可能随 SVG 缩放错位
- **使用 `v-if` 控制 `<OrbBackground>`** → 首次渲染无过渡；用 `opacity` 或 `v-show`
- **超过 5 个光球** → 渐变叠加过厚，显脏且增加 GPU 层压力
- **动画时长 < 3s** →  hero 区背景喧宾夺主，分散用户阅读注意力

## Optional extensions

- **响应式裁剪**：`preserveAspectRatio="xMidYMid slice"` 保证全屏填充，但小屏可减为 2 个光球
- **减弱动效**：`prefers-reduced-motion: reduce` 时暂停所有 `animation`
- **网格图案动态化**：对 `<pattern>` 内 `path` 加 `stroke-dashoffset` 动画实现「绘制感」
- **与 Canvas 粒子叠加**：底层 SVG orb 负责氛围，上层 Canvas 负责鼠标交互

## Additional resources

- [references/gradient-derivation.md](references/gradient-derivation.md) — 从主题色推导径向渐变 stop 的算法与 SCSS 工具
- [references/animation-timing.md](references/animation-timing.md) — 时长互质原则、多球轨迹不重复的计算方法
