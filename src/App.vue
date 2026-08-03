<script setup>
// 1일차는 Router 없이 과제 컴포넌트만 붙여서 확인한다.
// (Navigation Bar / RouterView 배치는 3일차 Router 단계에서 추가할 예정)
import WeatherMockup from '@/components/exercise/WeatherMockup.vue'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <p class="eyebrow">SKALA · Full-Stack Engineering</p>
      <h1>날씨 관측 대시보드</h1>
      <p class="subtitle">
        <span class="tag">1일차</span>
        v-for · v-if · :value+@input · 이벤트 수식어
      </p>
    </header>

    <WeatherMockup />

    <footer class="app-footer">Vue 3 · Vite — 매일 이어서 키워 나가는 종합과제</footer>
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

.subtitle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--ink-on-sky);
}

.tag {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--accent-line);
  color: var(--accent-ink);
}

.app-footer {
  margin-top: 28px;
  padding-left: 4px;
  font-size: 12px;
  color: var(--ink-on-sky);
}
</style>
