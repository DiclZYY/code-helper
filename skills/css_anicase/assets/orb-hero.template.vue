<template>
  <!--
    css_anicase / assets/orb-hero.template.vue
    纯 SVG + CSS；通过 cssVars / :root 变量换肤
  -->
  <section class="orb-hero" :style="cssVars" aria-hidden="true">
    <svg class="orb-hero__bg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="orbGrad1" cx="50%" cy="50%" fx="40%" fy="50%" r="50%">
          <stop offset="0%" stop-color="var(--orb-color-1)" />
          <stop offset="100%" stop-color="var(--orb-bg)" />
        </radialGradient>
        <radialGradient id="orbGrad2" cx="50%" cy="50%" fx="60%" fy="40%" r="50%">
          <stop offset="0%" stop-color="var(--orb-color-2)" />
          <stop offset="100%" stop-color="var(--orb-bg)" />
        </radialGradient>
        <radialGradient id="orbGrad3" cx="50%" cy="50%" fx="50%" fy="60%" r="50%">
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
    <slot />
  </section>
</template>

<script>
export default {
  name: 'OrbHero',
  props: {
    themeColor: { type: String, default: 'rgba(133, 109, 255, 1)' },
    speed: { type: Number, default: 1 },
    opacity: { type: Number, default: 0.35 }
  },
  computed: {
    cssVars() {
      return {
        '--orb-speed': this.speed,
        '--orb-opacity': this.opacity,
        '--orb-color-2': this.themeColor
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.orb-hero {
  --orb-color-1: rgba(210, 203, 255, 1);
  --orb-color-2: rgba(133, 109, 255, 1);
  --orb-color-3: rgba(210, 203, 255, 1);
  --orb-bg: rgba(51, 63, 124, 0);
  --orb-speed: 1;
  --orb-opacity: 0.35;

  position: relative;
  overflow: hidden;
}

.orb-hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: var(--orb-opacity);
  pointer-events: none;
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

.orb-1-x {
  animation: orb1-x calc(10s / var(--orb-speed)) linear infinite alternate;
}
.orb-1-y {
  animation: orb1-y calc(10.5s / var(--orb-speed)) linear infinite alternate;
}
.orb-1-r {
  animation: orb-rotate-fwd calc(7s / var(--orb-speed)) linear infinite;
}

.orb-2-x {
  animation: orb2-x calc(11.5s / var(--orb-speed)) linear infinite alternate;
}
.orb-2-y {
  animation: orb2-y calc(12s / var(--orb-speed)) linear infinite alternate;
}
.orb-2-r {
  animation: orb-rotate-fwd calc(12s / var(--orb-speed)) linear infinite;
}

.orb-3-x {
  animation: orb3-x calc(12.5s / var(--orb-speed)) linear infinite alternate;
}
.orb-3-y {
  animation: orb3-y calc(6s / var(--orb-speed)) linear infinite alternate;
}
.orb-3-r {
  animation: orb-rotate-rev calc(9s / var(--orb-speed)) linear infinite;
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
    transform: translateX(-10%);
  }
  100% {
    transform: translateX(15%);
  }
}
@keyframes orb2-y {
  0% {
    transform: translateY(15%);
  }
  100% {
    transform: translateY(-10%);
  }
}
@keyframes orb3-x {
  0% {
    transform: translateX(10%);
  }
  100% {
    transform: translateX(-20%);
  }
}
@keyframes orb3-y {
  0% {
    transform: translateY(-5%);
  }
  100% {
    transform: translateY(20%);
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
