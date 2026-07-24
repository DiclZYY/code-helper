# Case：Hero 光球渐变（纯 SVG + CSS）

首屏 / Hero 氛围层：多个径向渐变光球通过**嵌套 `<g>` + 独立 CSS keyframes** 异步平移与旋转，形成有机流动感；可选网格图案叠加。

**技术栈**：纯 SVG + CSS（不引入 GSAP）。  
**可复制模板**：[assets/orb-hero.template.vue](../assets/orb-hero.template.vue)

## 何时选用

| 选用 | 不选用 |
|------|--------|
| 落地页 / 发布页首屏氛围 | 需要多元素分段叙事（用透视卡片案例） |
| 要跟主题色走的轻量背景 | 用户已指定固定背景图/视频 |
| 不想引入动画库 | 需要鼠标跟随 / 粒子物理 |

## 核心模式：三层嵌套驱动

每个光球用三层 `<g>` 解耦 X / Y / 旋转：

```text
<g class="orb-x">      <!-- X 轴平移动画 -->
  <g class="orb-y">    <!-- Y 轴平移动画 -->
    <rect class="orb-r"> <!-- 旋转 + 径向渐变填充 -->
```

不同 `animation-duration`（建议互质或错开）避免轨迹周期性呆板。详见 [animation-timing](animation-timing.md)。

### 推荐时长

| 光球 | X | Y | 旋转 | 方向 |
|------|---|---|------|------|
| orb-1 | 10s | 10.5s | 7s | 正向 |
| orb-2 | 11.5s | 12s | 12s | 正向 |
| orb-3 | 12.5s | 6s | 9s | 反向 |

```css
.orb-x { animation: orb1-x 10s linear infinite alternate; }
.orb-y { animation: orb1-y 10.5s linear infinite alternate; }
.orb-r { animation: orb-rotate-fwd 7s linear infinite normal; }
```

`transform-box: view-box; transform-origin: 50% 50%;`

## 视觉层叠

```text
section.hero (relative)
  svg.hero-bg          ← 光球，opacity ~0.35
    svg.hero-pattern   ← 可选网格
  .hero-content        ← 业务内容，更高 z-index
```

## 选配（实现前确认）

| 项 | 选项 | 默认 |
|----|------|------|
| 光球数量 | 1~5 | 3 |
| 主色 / 辅助色 | hex 或主题变量 | 见模板 CSS 变量 |
| 背景图案 | 无 / 网格 | 无 |
| 速度倍率 | 慢 / 正常 / 快 | 正常（`--orb-speed: 1`） |
| 不透明度 | 0.1~0.6 | 0.35 |
| 暗色适配 | 是 / 否 | 是 |

主题色推导：[gradient-derivation](gradient-derivation.md)。

## 反模式

- 内外层共用相同时长 → 轨迹周期性重复
- 写死 hex、无 CSS 变量 → 难换肤
- 省略 `transform-box: view-box` → 旋转原点错位
- 超过 5 个光球 → 脏、GPU 压力大
- 循环时长 < 3s → 喧宾夺主
- 用 JS 驱动这类氛围循环 → 优先 CSS
