# Case：底部无缝波浪（纯 SVG + CSS）

登录页 / 落地页底部氛围层：多层 SVG 波浪横向滚动，**循环接缝无跳动**，可选右侧 `mask` 与底图融合。

**技术栈**：纯 SVG + CSS（不引入 GSAP）。  
**来源场景**：项目管理后台登录页底部装饰。

## 何时选用

| 选用 | 不选用 |
|------|--------|
| 页面底部需要持续流动感 | 需要点击交互 / 路径跟随 |
| 希望纯 CSS、不引入动画库 | 波浪形状需随数据实时变形 |
| 与背景图融合的半透明装饰 | 全屏 WebGL 海浪 |

## 核心原理（无跳动）

1. SVG `path` 在 `viewBox` 宽度内画 **两段完全对称** 的周期（如 0→1200 与 1200→2400 控制点相对一致）
2. 元素 `width: 200%`，可见区域只露出一半
3. `@keyframes`：`translate3d(0)` → `translate3d(-50%, 0, 0)`，**`linear` + `infinite`**
4. 位移刚好一个周期时，第二段与第一段视觉重合 → 无缝

```text
[======周期A======][======周期A'======]   ← SVG 200% 宽
[====可见视口====]
        ↓ translateX(-50%)
              [====可见视口====]          ← 看到的仍是「周期A」形状
```

## 结构要点

```html
<div class="login-waves" aria-hidden="true">
  <svg class="wave wave--back" viewBox="0 0 2400 120" preserveAspectRatio="none">
    <path d="M0,60 C… 1200,60 C… 2400,60 L2400,120 L0,120 Z" />
  </svg>
  <!-- mid / front：不同 path 起伏 + 反向滚动 -->
</div>
```

- 容器：`position: absolute; bottom: 0; overflow: hidden; pointer-events: none`
- 三层不同 `animation-duration`（如 18s / 12s / 8s），中间层可 `animation-direction: reverse`
- 填色用 `currentColor`，便于按层改 `color: rgba(...)`

## 右侧与底图融合

对波浪容器加水平遮罩（左实右透）：

```css
.login-waves {
  -webkit-mask-image: linear-gradient(
    to right,
    #000 0%,
    #000 45%,
    rgba(0, 0, 0, 0.45) 70%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    #000 0%,
    #000 45%,
    rgba(0, 0, 0, 0.45) 70%,
    transparent 100%
  );
}
```

## 无障碍

```css
@media (prefers-reduced-motion: reduce) {
  .login-waves .wave {
    animation: none;
  }
}
```

## 反模式

- path **左右两半形状不一致** → 循环时必跳
- 用 `ease-in-out` 代替 `linear` → 两端速度变化暴露接缝
- 只 translate 不足半宽 / 超过半宽 → 错位跳动
- 动画写在 path 的 `d` 属性上逐帧插值 → 难无缝且成本高

## 可复制模板

见 [assets/seamless-wave.template.vue](../assets/seamless-wave.template.vue)

## 何时选用

| 选用 | 不选用 |
|------|--------|
| 页面底部需要持续流动感 | 需要点击交互 / 路径跟随 |
| 希望纯 CSS、不引入动画库 | 波浪形状需随数据实时变形 |
| 与背景图融合的半透明装饰 | 全屏 WebGL 海浪 |

## 核心原理（无跳动）

1. SVG `path` 在 `viewBox` 宽度内画 **两段完全对称** 的周期（如 0→1200 与 1200→2400 控制点相对一致）
2. 元素 `width: 200%`，可见区域只露出一半
3. `@keyframes`：`translate3d(0)` → `translate3d(-50%, 0, 0)`，**`linear` + `infinite`**
4. 位移刚好一个周期时，第二段与第一段视觉重合 → 无缝

```text
[======周期A======][======周期A'======]   ← SVG 200% 宽
[====可见视口====]
        ↓ translateX(-50%)
              [====可见视口====]          ← 看到的仍是「周期A」形状
```

## 结构要点

```html
<div class="login-waves" aria-hidden="true">
  <svg class="wave wave--back" viewBox="0 0 2400 120" preserveAspectRatio="none">
    <path d="M0,60 C… 1200,60 C… 2400,60 L2400,120 L0,120 Z" />
  </svg>
  <!-- mid / front：不同 path 起伏 + 反向滚动 -->
</div>
```

- 容器：`position: absolute; bottom: 0; overflow: hidden; pointer-events: none`
- 三层不同 `animation-duration`（如 18s / 12s / 8s），中间层可 `animation-direction: reverse`
- 填色用 `currentColor`，便于按层改 `color: rgba(...)`

## 右侧与底图融合

对波浪容器加水平遮罩（左实右透）：

```css
.login-waves {
  -webkit-mask-image: linear-gradient(
    to right,
    #000 0%,
    #000 45%,
    rgba(0, 0, 0, 0.45) 70%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    #000 0%,
    #000 45%,
    rgba(0, 0, 0, 0.45) 70%,
    transparent 100%
  );
}
```

## 无障碍

```css
@media (prefers-reduced-motion: reduce) {
  .login-waves .wave {
    animation: none;
  }
}
```

## 反模式

- path **左右两半形状不一致** → 循环时必跳
- 用 `ease-in-out` 代替 `linear` → 两端速度变化暴露接缝
- 只 translate 不足半宽 / 超过半宽 → 错位跳动
- 动画写在 path 的 `d` 属性上逐帧插值 → 难无缝且成本高

## 可复制模板

见 [assets/seamless-wave.template.vue](../assets/seamless-wave.template.vue)
