# Case：透视事务卡片流（SVG + CSS 舞台 + GSAP）

登录页左侧示意区：多形态 SVG 业务卡片沿 **向内 ~45° 透视舞台** 出现 → 滑入纵深 → 淡出，表达「事务正在处理」。

**技术栈**：SVG 卡面 + CSS `perspective` / `rotateY` 舞台 + **GSAP timeline** 编排。  
**来源场景**：项目管理后台登录页左侧插画区。

## 何时选用

| 选用 | 不选用 |
|------|--------|
| 需要展示「业务在流转」的叙事感 | 仅需静态装饰（用光球 / 波浪即可） |
| 多卡片错峰、入场/离场分段清晰 | 单元素无限循环（优先纯 CSS） |
| 需要 `rotateY` 透视舞台 + translateZ | 无动画库预算且不愿引入 GSAP |

## 驱动分工

| 层 | 技术 | 职责 |
|----|------|------|
| `.tx-scene__perspective` | CSS `perspective` | 建立视锥 |
| `.tx-scene__stage` | CSS `rotateY(-45deg~-50deg)` | 整体向内透视 |
| `.tx-card` | GSAP `x/y/z/scale/opacity` | 单卡生命周期 |
| 卡片内容 | 内联 SVG | 多种业务形态 |

**原则**：氛围循环优先 CSS；**多元素时间轴编排**再用 GSAP，并在 `beforeDestroy`/`onUnmounted` 里 `timeline.kill()`。

## 透视舞台

```css
.tx-scene__perspective {
  perspective: 900px;
  perspective-origin: 70% 45%;
}
.tx-scene__stage {
  transform-style: preserve-3d;
  transform: rotateY(-45deg) translateZ(-40px);
  transform-origin: 55% 50%;
}
.tx-card {
  transform-style: preserve-3d;
  will-change: transform, opacity;
}
```

## GSAP 单卡三段式

```js
// 入场
fromTo(el, { opacity: 0, x: -50, y, z: 160, scale: 0.78 },
           { opacity: 1, x: 16,  y, z: 40,  scale: 0.92, duration: 0.65, ease: 'power2.out' }, delay)
// 滑入纵深
.to(el, { x: 110, y: endY, z: -180, scale: 0.62, opacity: 0.85, duration: 2.1, ease: 'none' }, delay + 0.65)
// 消失
.to(el, { x: 160, z: -320, scale: 0.45, opacity: 0, duration: 0.85, ease: 'power1.in' }, delay + 2.75)
```

- 多卡：`delay = i * 0.95`，`lane = (i % 3) - 1` 分三条轨道
- 时间轴：`gsap.timeline({ repeat: -1 })`，末尾补一段空 tween 保证最后一张播完再循环

## 卡片种类（建议 ≥ 5）

避免全部同一布局。推荐类型：

| type | 形态 |
|------|------|
| `progress` | 进度条 + 百分比 |
| `approval` | 待审/通过徽章 |
| `notify` | 消息条 + 未读点 |
| `metric` | 大数字 + 趋势折线 |
| `timeline` | 阶段圆点轴 |
| `alert` | 告警三角 |
| `doc` | 文档折角 + 格式标签 |
| `assign` | 头像字 + 角色标签 |

各类型独立 `viewBox` / 宽高（如 progress 220×88、metric 160×100）。

## 生命周期

```js
mounted() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  this.$nextTick(() => this.startLoop())
}
beforeDestroy() {
  this.timeline && this.timeline.kill()
}
```

依赖：`npm i gsap`（Vue2/3 均可，`import { gsap } from 'gsap'`）。

## 反模式

- 全部卡片同一 SVG 骨架 → 叙事单调
- 只用 CSS `animation` 硬编码 12 张卡的 delay → 难维护分段缓动
- 忘记 `preserve-3d` / 父级 `overflow` 裁切过度 → 透视失效或卡片被切
- 不 `kill` timeline → 路由离开后仍跑、泄漏
- 在 GSAP 里每帧改 SVG `d` → 过重；位移用 transform 即可

## 可复制模板

见 [assets/perspective-tx-cards.template.vue](../assets/perspective-tx-cards.template.vue)（精简 3 种卡 + 完整时间轴）
