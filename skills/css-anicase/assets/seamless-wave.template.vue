<template>
  <!--
    css-anicase / assets/seamless-wave.template.vue
    用法：放入 relative 容器底部；改 .wave--* 的 color / duration 即可换肤
  -->
  <div class="seamless-waves" aria-hidden="true">
    <svg class="wave wave--back" viewBox="0 0 2400 120" preserveAspectRatio="none">
      <path
        d="M0,60 C150,100 350,20 600,60 C850,100 1050,20 1200,60 C1350,100 1550,20 1800,60 C2050,100 2250,20 2400,60 L2400,120 L0,120 Z"
      />
    </svg>
    <svg class="wave wave--mid" viewBox="0 0 2400 120" preserveAspectRatio="none">
      <path
        d="M0,70 C200,30 400,110 600,70 C800,30 1000,110 1200,70 C1400,30 1600,110 1800,70 C2000,30 2200,110 2400,70 L2400,120 L0,120 Z"
      />
    </svg>
    <svg class="wave wave--front" viewBox="0 0 2400 120" preserveAspectRatio="none">
      <path
        d="M0,80 C180,50 420,110 600,80 C780,50 1020,110 1200,80 C1380,50 1620,110 1800,80 C1980,50 2220,110 2400,80 L2400,120 L0,120 Z"
      />
    </svg>
  </div>
</template>

<script>
export default {
  name: 'SeamlessWaves'
}
</script>

<style lang="scss" scoped>
.seamless-waves {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120px;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
  // 右侧渐隐，与底图融合（可删）
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

  .wave {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 200%;
    height: 100%;
    will-change: transform;
    animation: seamless-wave-scroll linear infinite;

    path {
      fill: currentColor;
    }
  }

  .wave--back {
    color: rgba(198, 221, 255, 0.8);
    animation-duration: 18s;
  }

  .wave--mid {
    color: rgba(64, 158, 255, 0.2);
    height: 85%;
    animation-duration: 12s;
    animation-direction: reverse;
  }

  .wave--front {
    color: rgba(197, 224, 250, 0.4);
    height: 70%;
    animation-duration: 8s;
  }
}

@keyframes seamless-wave-scroll {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .seamless-waves .wave {
    animation: none;
  }
}
</style>
