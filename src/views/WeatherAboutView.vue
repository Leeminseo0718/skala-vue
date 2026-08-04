<script setup>
import { weatherList } from '@/data/weatherMock'

/**
 * 서비스 소개 화면 (/about)
 *
 * 정적인 페이지라 반응형 상태가 필요 없다.
 * 관측 지점 수만 목 데이터에서 그대로 읽어 쓴다.
 */
const stageList = [
  { stage: '1단계', topic: 'Vue 문법', detail: 'v-for · v-if · :value+@input · 이벤트 수식어' },
  { stage: '2단계', topic: 'Composition API', detail: 'computed 검색 필터 · watch · watchEffect' },
  { stage: '3단계', topic: '컴포넌트 분리', detail: 'props · emits · slot 으로 4개 파일 분리' },
  { stage: '4단계', topic: 'Vue Router', detail: '지연 로딩 · 동적 경로 · Catch-all Route' },
]
</script>

<template>
  <div class="about">
    <section class="panel">
      <p class="eyebrow">서비스 소개</p>
      <h2>날씨 관측 대시보드</h2>
      <p class="lead">
        SKALA Full-Stack Engineering 과정의 Vue.js 종합과제입니다. 화면 하나를 매일 이어서 키워
        나가는 방식으로, 배운 문법을 실제 동작하는 기능에 하나씩 얹어 왔습니다. 현재
        {{ weatherList.length }}개 지역의 관측 정보를 목 데이터로 보여 주고 있으며, 이후 실제
        OpenWeatherMap API 로 교체할 예정입니다.
      </p>
    </section>

    <section class="panel">
      <h3>쌓아 온 단계</h3>
      <ol class="stages">
        <li v-for="item in stageList" :key="item.stage" class="stage">
          <span class="stage-no">{{ item.stage }}</span>
          <div>
            <p class="stage-topic">{{ item.topic }}</p>
            <p class="stage-detail">{{ item.detail }}</p>
          </div>
        </li>
      </ol>
    </section>

    <!-- 화면 이동은 <RouterLink> 로 — <a> 와 달리 새로고침 없이 주소만 바꾼다 -->
    <RouterLink to="/" class="btn-back">← 메인 대시보드로 돌아가기</RouterLink>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel {
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: 18px;
  box-shadow: var(--shadow-md);
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-ink);
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.lead {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--ink-dim);
}

.panel h3 {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink-dim);
}

.stages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* 단계는 실제로 순서가 의미를 갖는 내용이라 번호를 그대로 노출한다 */
.stage {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.stage-no {
  flex-shrink: 0;
  padding: 4px 11px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-line);
  color: var(--accent-ink);
}

.stage-topic {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.stage-detail {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--ink-dim);
}

.btn-back {
  align-self: flex-start;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: var(--accent-ink);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--accent-line);
  border-radius: 12px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.btn-back:hover {
  background: var(--accent-bg);
  border-color: var(--accent);
}
</style>
