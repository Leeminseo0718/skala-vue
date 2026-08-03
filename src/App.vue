<script setup>
// 아직 Router 없이 대시보드 하나만 붙여서 확인한다.
// (Navigation Bar / RouterView 배치는 3일차 Router 단계에서 추가할 예정)
import WeatherDashboard from '@/components/exercise/WeatherDashboard.vue'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <p class="eyebrow">SKALA · Full-Stack Engineering</p>
      <h1>날씨 관측 대시보드</h1>
      <p class="lead">배운 내용을 매일 이 화면 하나에 이어 붙여 가며 키우는 종합과제입니다.</p>
    </header>

    <WeatherDashboard />

    <footer class="app-footer">Vue 3 · Vite</footer>
  </div>
</template>

<style scoped>
.app-shell {
  max-width: 680px;
  margin: 0 auto;
  padding: 56px 0 0;
}

/* 헤더는 카드 밖에 그대로 노출시켜, 배경 위에 떠 있는 느낌으로 둔다 */
.app-header {
  margin-bottom: 28px;
  padding-left: 4px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-ink);
}

.app-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.lead {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-on-sky);
}

.app-footer {
  margin-top: 28px;
  padding-left: 4px;
  font-size: 12px;
  color: var(--ink-on-sky);
}
</style>
