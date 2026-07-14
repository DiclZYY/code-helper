# 从主题色推导径向渐变

## 目标

给定单一主题色（如品牌主色 `#856dff`），自动生成 3 组径向渐变 stop，用于 SVG orb 背景。要求：

- 光球中心亮、边缘透明
- 多球之间有色相区分，避免糊成一片
- 支持亮/暗两种模式

## 算法

### 1. 输入

| 变量 | 类型 | 示例 |
|------|------|------|
| `$primary` | hex/rgb | `#856dff` |
| `$mode` | string | `light` / `dark` |

### 2. 输出

3 组 `stop-color`：

- `orb-center`：光球中心高亮
- `orb-mid`：过渡区（可选）
- `orb-edge`：完全透明，与背景融合

### 3. SCSS 实现

```scss
@use "sass:color";
@use "sass:math";

@function orb-gradient-stops($primary, $mode: light) {
  $base: color.scale($primary, $lightness: if($mode == light, 40%, -20%));
  $center: color.scale($base, $lightness: if($mode == light, 20%, -10%), $alpha: -10%);
  $mid: color.scale($base, $alpha: -40%);
  $edge: color.scale($primary, $lightness: if($mode == light, -50%, -70%), $alpha: -100%);

  @return (
    center: $center,
    mid: $mid,
    edge: $edge
  );
}

// 使用
$stops: orb-gradient-stops(#856dff, light);
```

### 4. 多球差异化

3 个光球使用同一推导逻辑，但引入轻微色相偏移：

| 光球 | 偏移策略 |
|------|----------|
| orb-1 | 主色 + 色调偏冷（+10° hue） |
| orb-2 | 纯主色 |
| orb-3 | 主色 + 色调偏暖（-10° hue） |

SCSS 中可用 `color.adjust($primary, $hue: 10)` 实现。

### 5. 透明边缘统一公式

无论亮/暗模式，边缘 `stop-color` 的 alpha 必须为 `0`，且 RGB 接近页面背景色，防止不同浏览器对「透明 + 颜色」的渲染差异：

```scss
$bg-page: if($mode == light, #ffffff, #0f0f23);
$edge: color.change($bg-page, $alpha: 0);
```

### 6. 在线预览调试

将推导后的颜色生成临时 CSS 变量，在浏览器 DevTools 中实时修改 `--orb-color-*` 即可看到效果，无需重新编译。
