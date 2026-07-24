<template>
  <!--
    css_anicase / assets/perspective-tx-cards.template.vue
    依赖：npm i gsap
    精简版：3 种卡 + 完整 GSAP 时间轴；完整 8 类型见 references/case-perspective-tx-cards.md
  -->
  <div class="tx-scene" aria-hidden="true">
    <div class="tx-scene__perspective">
      <div class="tx-scene__stage">
        <div
          v-for="card in cards"
          :key="card.id"
          :ref="'card-' + card.id"
          class="tx-card"
        >
          <svg v-if="card.type === 'progress'" class="tx-card__svg" viewBox="0 0 220 88">
            <rect x="2" y="2" width="216" height="84" rx="10" fill="rgba(255,255,255,0.95)" stroke="rgba(64,158,255,0.22)" />
            <rect x="2" y="2" width="5" height="84" rx="2" :fill="card.color" />
            <text x="46" y="28" class="t-title">{{ card.title }}</text>
            <text x="46" y="48" class="t-sub">{{ card.sub }}</text>
            <rect x="46" y="58" width="120" height="6" rx="3" fill="rgba(64,158,255,0.12)" />
            <rect x="46" y="58" :width="card.progress" height="6" rx="3" :fill="card.color" />
          </svg>

          <svg v-else-if="card.type === 'approval'" class="tx-card__svg" viewBox="0 0 200 96">
            <rect x="2" y="2" width="196" height="92" rx="12" fill="rgba(255,255,255,0.95)" stroke="rgba(64,158,255,0.2)" />
            <rect x="14" y="14" width="52" height="22" rx="11" :fill="card.color" fill-opacity="0.15" />
            <text x="40" y="29" text-anchor="middle" class="t-badge" :fill="card.color">{{ card.badge }}</text>
            <text x="14" y="56" class="t-title">{{ card.title }}</text>
            <text x="14" y="76" class="t-sub">{{ card.sub }}</text>
          </svg>

          <svg v-else class="tx-card__svg" viewBox="0 0 160 100">
            <rect x="2" y="2" width="156" height="96" rx="12" fill="rgba(255,255,255,0.95)" stroke="rgba(64,158,255,0.2)" />
            <text x="16" y="28" class="t-sub">{{ card.title }}</text>
            <text x="16" y="62" class="t-metric" :fill="card.color">{{ card.value }}</text>
            <text x="16" y="82" class="t-sub">{{ card.sub }}</text>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gsap } from 'gsap'

const PRESETS = [
  { type: 'progress', title: '进度更新', sub: '项目 · ST-118', progress: 54, color: '#67c23a' },
  { type: 'approval', title: '立项审批', sub: 'PR-2401', badge: '待审', color: '#e6a23c' },
  { type: 'metric', title: '在建项目', value: '128', sub: '+12%', color: '#409eff' },
  { type: 'progress', title: '阶段验收', sub: 'AC-057', progress: 110, color: '#409eff' },
  { type: 'approval', title: '变更通过', sub: 'CG-214', badge: '通过', color: '#67c23a' },
  { type: 'metric', title: '待开票', value: '¥86万', sub: '-3%', color: '#e6a23c' }
]

const SIZE = {
  progress: { w: 220, h: 88 },
  approval: { w: 200, h: 96 },
  metric: { w: 160, h: 100 }
}

export default {
  name: 'PerspectiveTxCards',
  data() {
    return {
      cards: PRESETS.map((c, i) => ({ ...c, id: i })),
      timeline: null
    }
  },
  mounted() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    this.$nextTick(() => this.startLoop())
  },
  beforeDestroy() {
    if (this.timeline) this.timeline.kill()
  },
  methods: {
    el(id) {
      const r = this.$refs['card-' + id]
      return Array.isArray(r) ? r[0] : r
    },
    startLoop() {
      const els = this.cards.map((c) => this.el(c.id)).filter(Boolean)
      if (!els.length) return

      this.cards.forEach((c) => {
        const node = this.el(c.id)
        const s = SIZE[c.type] || SIZE.progress
        if (node) {
          node.style.width = s.w + 'px'
          node.style.height = s.h + 'px'
        }
      })

      gsap.set(els, { opacity: 0, x: -40, y: 80, z: 120, scale: 0.85 })
      const tl = gsap.timeline({ repeat: -1 })
      this.timeline = tl

      els.forEach((el, i) => {
        const lane = (i % 3) - 1
        const startY = 30 + lane * 58
        const endY = startY - 40
        const delay = i * 0.95

        tl.fromTo(
          el,
          { opacity: 0, x: -50, y: startY + 30, z: 160, scale: 0.78 },
          { opacity: 1, x: 16, y: startY, z: 40, scale: 0.92, duration: 0.65, ease: 'power2.out' },
          delay
        )
          .to(el, { x: 110, y: endY, z: -180, scale: 0.62, opacity: 0.85, duration: 2.1, ease: 'none' }, delay + 0.65)
          .to(el, { x: 160, y: endY - 20, z: -320, scale: 0.45, opacity: 0, duration: 0.85, ease: 'power1.in' }, delay + 2.75)
      })

      tl.to({}, { duration: 0.35 }, els.length * 0.95 + 2.4)
    }
  }
}
</script>

<style lang="scss" scoped>
.tx-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.tx-scene__perspective {
  width: 100%;
  height: 100%;
  perspective: 900px;
  perspective-origin: 70% 45%;
}
.tx-scene__stage {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform: rotateY(-45deg) translateZ(-40px);
  transform-origin: 55% 50%;
}
.tx-card {
  position: absolute;
  left: 12%;
  top: 28%;
  transform-style: preserve-3d;
  will-change: transform, opacity;
  filter: drop-shadow(0 10px 18px rgba(26, 58, 107, 0.12));
}
.tx-card__svg {
  display: block;
  width: 100%;
  height: 100%;
}
.t-title {
  font-size: 13px;
  font-weight: 700;
  fill: #1f2d3d;
}
.t-sub {
  font-size: 10px;
  fill: #8a97a8;
}
.t-badge {
  font-size: 10px;
  font-weight: 600;
}
.t-metric {
  font-size: 28px;
  font-weight: 700;
}
</style>
