<template>
  <!--
    css-anicase / assets/orb-hero.template.vue
    对齐 https://www.php.net/releases/8.5/zh.php section.hero
    纯 SVG + CSS；themeColor / opacity / speed / showPattern 可配
  -->
  <div class="orb-hero" :style="cssVars" aria-hidden="true">
    <svg
      class="orb-hero__bg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="orbGrad1" cx="50%" cy="50%" fx="0.441602%" fy="50%" r=".5">
          <stop offset="0%" stop-color="var(--orb-color-1)" />
          <stop offset="100%" stop-color="var(--orb-bg)" />
        </radialGradient>
        <radialGradient id="orbGrad2" cx="50%" cy="50%" fx="2.68147%" fy="50%" r=".5">
          <stop offset="0%" stop-color="var(--orb-color-2)" />
          <stop offset="100%" stop-color="var(--orb-bg)" />
        </radialGradient>
        <radialGradient id="orbGrad3" cx="50%" cy="50%" fx="0.836536%" fy="50%" r=".5">
          <stop offset="0%" stop-color="var(--orb-color-3)" />
          <stop offset="100%" stop-color="var(--orb-bg)" />
        </radialGradient>
      </defs>

      <g class="orb-1-x">
        <g class="orb-1-y">
          <rect width="100%" height="100%" fill="url(#orbGrad1)" class="orb-1-r" />
        </g>
      </g>
      <g class="orb-2-x">
        <g class="orb-2-y">
          <rect width="100%" height="100%" fill="url(#orbGrad2)" class="orb-2-r" />
        </g>
      </g>
      <g class="orb-3-x">
        <g class="orb-3-y">
          <rect width="100%" height="100%" fill="url(#orbGrad3)" class="orb-3-r" />
        </g>
      </g>
    </svg>

    <svg v-if="showPattern" class="orb-hero__pattern" aria-hidden="true">
      <defs>
        <pattern id="orb-hero-pattern" width="32" height="64" patternUnits="userSpaceOnUse" x="-1" y="-1">
          <path
            d="M0,28 L20,28 L20,16 L16,16 L16,24 L4,24 L4,4 L32,4 L32,32 L28,32 L28,8 L8,8 L8,20 L12,20 L12,12 L24,12 L24,32 L0,32 L0,28 Z M12,36 L32,36 L32,40 L16,40 L16,64 L0,64 L0,60 L12,60 L12,36 Z M28,48 L24,48 L24,60 L32,60 L32,64 L20,64 L20,44 L32,44 L32,56 L28,56 L28,48 Z M0,36 L8,36 L8,56 L0,56 L0,52 L4,52 L4,40 L0,40 L0,36 Z"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#orb-hero-pattern)" />
    </svg>

    <div class="orb-hero__content">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrbHero',
  props: {
    themeColor: { type: String, default: 'rgba(133, 109, 255, 1)' },
    colorLight: { type: String, default: 'rgba(210, 203, 255, 1)' },
    colorFade: { type: String, default: 'rgba(51, 63, 124, 0)' },
    speed: { type: Number, default: 1 },
    opacity: { type: Number, default: 0.35 },
    showPattern: { type: Boolean, default: true }
  },
  computed: {
    cssVars() {
      return {
        '--orb-speed': this.speed,
        '--orb-opacity': this.opacity,
        '--orb-color-1': this.colorLight,
        '--orb-color-2': this.themeColor,
        '--orb-color-3': this.colorLight,
        '--orb-bg': this.colorFade
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.orb-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.orb-hero__bg {
  position: absolute;
  inset: 0;
  z-index: -10;
  width: 100%;
  height: 100%;
  opacity: var(--orb-opacity, 0.35);
  pointer-events: none;
  user-select: none;
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.orb-hero__pattern {
  position: absolute;
  inset: 0;
  z-index: -10;
  width: 100%;
  height: 100%;
  pointer-events: none;
  stroke: rgba(24, 24, 27, 0.1);
  mask-image: linear-gradient(#fff 0%, transparent 100%);
}

.orb-hero__content {
  position: relative;
  z-index: 1;
}

.orb-1-x,
.orb-1-y,
.orb-1-r,
.orb-2-x,
.orb-2-y,
.orb-2-r,
.orb-3-x,
.orb-3-y,
.orb-3-r {
  transform-box: view-box;
  transform-origin: 50% 50%;
}

/* 时长 / 关键帧对齐 PHP 8.5 hero */
.orb-1-x {
  animation: orb1-x calc(10s / var(--orb-speed, 1)) linear infinite alternate;
}
.orb-1-y {
  animation: orb1-y calc(10.5s / var(--orb-speed, 1)) linear infinite alternate;
}
.orb-1-r {
  animation: orb-rotate-fwd calc(7s / var(--orb-speed, 1)) linear infinite;
}

.orb-2-x {
  animation: orb2-x calc(11.5s / var(--orb-speed, 1)) linear infinite alternate;
}
.orb-2-y {
  animation: orb2-y calc(12s / var(--orb-speed, 1)) linear infinite alternate;
}
.orb-2-r {
  animation: orb-rotate-fwd calc(12s / var(--orb-speed, 1)) linear infinite;
}

.orb-3-x {
  animation: orb3-x calc(12.5s / var(--orb-speed, 1)) linear infinite alternate;
}
.orb-3-y {
  animation: orb3-y calc(6s / var(--orb-speed, 1)) linear infinite alternate;
}
.orb-3-r {
  animation: orb-rotate-rev calc(9s / var(--orb-speed, 1)) linear infinite;
}

@keyframes orb1-x {
  0% {
    transform: translateX(25%);
  }
  100% {
    transform: translateX(0%);
  }
}
@keyframes orb1-y {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(25%);
  }
}
@keyframes orb2-x {
  0% {
    transform: translateX(-25%);
  }
  100% {
    transform: translateX(0%);
  }
}
@keyframes orb2-y {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(50%);
  }
}
@keyframes orb3-x {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(25%);
  }
}
@keyframes orb3-y {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(25%);
  }
}
@keyframes orb-rotate-fwd {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes orb-rotate-rev {
  0% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .orb-1-x,
  .orb-1-y,
  .orb-1-r,
  .orb-2-x,
  .orb-2-y,
  .orb-2-r,
  .orb-3-x,
  .orb-3-y,
  .orb-3-r {
    animation: none;
  }
}
</style>
