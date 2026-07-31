<script setup>
// 1일차는 Router 없이 과제 컴포넌트만 붙여서 확인한다.
// (Navigation Bar / RouterView 배치는 3일차 Router 단계에서 추가할 예정)
import WeatherMockup from '@/components/exercise/WeatherMockup.vue'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>⛅ SKALA 날씨 대시보드</h1>
      <p class="subtitle">1일차 · 날씨 Mockup (v-for / v-if / :value+@input / 이벤트 수식어)</p>
    </header>

    <WeatherMockup />
  </div>
</template>

<style scoped>
.app-container {
  max-width: 720px;
  margin: 40px auto;
  padding: 28px 32px 32px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.app-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e9ecef;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #868e96;
}
</style>
