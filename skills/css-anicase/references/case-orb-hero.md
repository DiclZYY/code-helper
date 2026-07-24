# Case：Hero 光球渐变（纯 SVG + CSS）

首屏 / Hero 氛围层：多个径向渐变光球通过**嵌套 `<g>` + 独立 CSS keyframes** 异步平移与旋转，形成有机流动感；可选网格图案叠加。

**技术栈**：纯 SVG + CSS（不引入 GSAP）。  
**权威参考**：[PHP 8.5 发布页 `section.hero`](https://www.php.net/releases/8.5/zh.php)（2025-11 上线，Chrome 实测结构与下方参数一致）。  
**可复制模板**：[assets/orb-hero.template.vue](../assets/orb-hero.template.vue)

## 何时选用

| 选用 | 不选用 |
|------|--------|
| 落地页 / 发布页 / 登录页首屏氛围 | 需要多元素分段叙事（用透视卡片案例） |
| 要跟主题色走的轻量背景 | 用户已指定全幅固定插画且不要叠加动效 |
| 不想引入动画库 | 需要鼠标跟随 / 粒子物理 |

## PHP.net 实现解剖（丝滑要点）

Chrome 对 `section.hero` 抽样结果：

### DOM 结构

```html
<section class="hero">
  <!-- 1. 光球层：viewBox 0 0 100 100，三层嵌套 g -->
  <svg class="hero-bg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id="Gradient1" cx="50%" cy="50%" fx="0.44%" fy="50%" r=".5">
        <stop offset="0%" stop-color="rgba(210,203,255,1)" />
        <stop offset="100%" stop-color="rgba(51,63,124,0)" />
      </radialGradient>
      <!-- Gradient2 / Gradient3 同理，中心色可不同 -->
    </defs>
    <g class="hero-orb-1-x"><g class="hero-orb-1-y">
      <rect width="100%" height="100%" fill="url(#Gradient1)" class="hero-orb-1-r" />
    </g></g>
    <!-- orb-2 / orb-3 -->
  </svg>

  <!-- 2. 可选网格图案 + 纵向 mask 淡出 -->
  <svg class="hero-pattern" aria-hidden="true">…</svg>

  <!-- 3. 业务文案，z-index 高于背景 -->
  <div class="hero-content">…</div>
</section>
```

### 丝滑三要素（缺一易「顿」或「糊」）

| 要素 | PHP.net 做法 | 原因 |
|------|--------------|------|
| **轴解耦** | 每个光球 `orb-N-x` / `orb-N-y` / `orb-N-r` 三层 `<g>` | X/Y/旋转互不抢同一 `transform`，轨迹自然 |
| **时长错相** | 10 / 10.5 / 7、11.5 / 12 / 12、12.5 / 6 / 9（秒） | 周期几乎不重合，避免「来回晃」感 |
| **渐变偏心 + 低透明度** | `fx` 偏离中心、`r=".5"`、`.hero-bg { opacity: 0.35 }` | 旋转时亮度中心漂移，像流体而非硬圆盘 |

附加：

- 全部 `animation-timing-function: **linear**`，平移用 `infinite alternate`，旋转用 `infinite`（正向或反向）
- **必须** `transform-box: view-box; transform-origin: 50% 50%;`（否则缩放后旋转原点乱跳）
- 容器：`position: relative; isolation: isolate; overflow: hidden;`
- 光球层：`position: absolute; inset: 0; z-index: -10; pointer-events: none;`
- 图案层可用 `mask-image: linear-gradient(...)` 向下淡出，避免底部生硬裁切

## 核心模式：三层嵌套驱动

```text
<g class="orb-x">      <!-- translateX，alternate -->
  <g class="orb-y">    <!-- translateY，alternate -->
    <rect class="orb-r"> <!-- rotate 0↔360，normal / reverse -->
```

时长互质细节见 [animation-timing](animation-timing.md)。

### 与 PHP.net 对齐的时长 / 关键帧（推荐默认）

| 光球 | X 时长 | Y 时长 | 旋转时长 | X 关键帧 | Y 关键帧 | 旋转 |
|------|--------|--------|----------|---------|---------|------|
| 1 | 10s | 10.5s | 7s | 25%→0% | 0%→25% | 0→360° |
| 2 | 11.5s | 12s | 12s | -25%→0% | 0%→50% | 0→360° |
| 3 | 12.5s | 6s | 9s | 0%→25% | 0%→25% | 360°→0° |

```css
.hero-orb-1-x { animation: hero-orb1-x 10s linear infinite alternate; }
.hero-orb-1-y { animation: hero-orb1-y 10.5s linear infinite alternate; }
.hero-orb-1-r { animation: hero-orb-rotate-fwd 7s linear infinite; }
/* …orb-2 / orb-3 见模板 */
```

## 视觉层叠

```text
section.hero (relative, isolation: isolate, overflow: hidden)
  svg.hero-bg          ← 光球，opacity 0.35，z-index -10
  svg.hero-pattern     ← 可选网格 + mask 淡出，z-index -10
  .hero-content        ← 文案 / CTA，正常文档流或更高 z-index
```

登录页改造时：把 `hero-bg` 铺满 `.login-container`，保留原底图时可把光球 `opacity` 调到 `0.25~0.4`、主色换成业务蓝。

## 选配（实现前确认）

| 项 | 选项 | 默认（PHP.net） |
|----|------|-----------------|
| 光球数量 | 1~5 | 3 |
| 中心色 | hex / 主题变量 | `#d2cbff` / `#856dff` |
| 透明终点色 | rgba | `rgba(51,63,124,0)` |
| 背景图案 | 无 / 网格 | 有（stroke 路径 + mask） |
| 速度倍率 | 慢 / 正常 / 快 | 正常（`--orb-speed: 1`） |
| 不透明度 | 0.1~0.6 | **0.35** |
| 暗色适配 | 是 / 否 | 是（图案 stroke 反色） |

主题色推导：[gradient-derivation](gradient-derivation.md)。

## 落地检查清单

1. [ ] 三层 `<g>` 齐全，旋转只绑在最内层 `rect`
2. [ ] `transform-box: view-box` + `transform-origin: 50% 50%`
3. [ ] 九段时长与上表一致（或成比例缩放 `--orb-speed`）
4. [ ] `linear` + 平移 `alternate`；勿用 `ease`（两端会「顿」）
5. [ ] `.hero-bg` opacity ≈ 0.35，不盖住文案对比度
6. [ ] `prefers-reduced-motion: reduce` 时 `animation: none`
7. [ ] Chrome：Computed 中确认 `animation-name` 在跑，且无 JS 改 transform

## 反模式

- 把 X/Y/旋转写在同一层 → 轨迹僵硬、难调
- 三球共用同一套时长 → 周期性「同步晃」
- 省略 `transform-box: view-box` → 宽屏/窄屏旋转原点跳动
- 写死 hex、无 CSS 变量 → 难换肤到登录主题蓝
- opacity 过高（>0.6）或时长 < 3s → 喧宾夺主
- 用 JS/GSAP 驱动这类氛围循环 → 多余；GSAP 留给事务卡片案例
- 渐变 `fx/fy` 居中且不旋转 → 缺少「流体」感

## 参考链接

- [PHP 8.5 Release Announcement（中文）](https://www.php.net/releases/8.5/zh.php)
