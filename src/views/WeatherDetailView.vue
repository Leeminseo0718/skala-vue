<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findCityById } from '@/data/weatherMock'
import { getLandmark } from '@/data/landmarks'
import { getWeatherIcon } from '@/data/weatherCondition'
import { fetchWeatherByCoords, fetchForecastByCoords, hasApiKey } from '@/api/weather'

/**
 * 지역별 상세 날씨 화면 (/weather/:cityId)
 *
 * 화면 구성은 삼성 날씨 앱을 참고했다.
 *  - 랜드마크 사진이 화면 전체 배경으로 깔리고 아래로 갈수록 어두워진다
 *  - 그 위에 큰 기온 → 주의사항 → 시간별 예보 → 관측 항목 순으로 얹는다
 *  - 사진은 커서를 따라 살짝 움직인다 (글자는 고정)
 */
const route = useRoute()
const router = useRouter()

const city = ref(null)
const isLoaded = ref(false)
const isRefreshing = ref(false)
const apiErrorMessage = ref('')

// 예보 (시간별 스트립용)
const hourly = ref([])

const landmarkUrl = computed(() => (city.value ? getLandmark(city.value.name) : null))

// 스트립에 보여 줄 구간 — 3시간 간격 8개면 앞으로 24시간이 된다
const SLOT_COUNT = 8
const slots = computed(() => hourly.value.slice(0, SLOT_COUNT))

/**
 * ↑최고 / ↓최저 는 '오늘'이 아니라 '화면에 보이는 24시간'을 기준으로 낸다.
 *
 * 현재 날씨(/weather)의 temp_min·temp_max 는 그 시점 값이라 셋 다 같은 숫자로 오고,
 * 예보에서 '오늘'만 자르면 저녁에 접속했을 때 남은 두어 시간만 잡혀서
 * 바로 아래 그래프에 27°가 찍혀 있는데 최저가 33°로 나오는 모순이 생긴다.
 * 사용자가 실제로 보고 있는 구간과 같은 범위를 쓰는 편이 어긋나지 않는다.
 */
const rangeHigh = computed(() =>
  slots.value.length ? Math.max(...slots.value.map((s) => s.temp)) : null,
)
const rangeLow = computed(() =>
  slots.value.length ? Math.min(...slots.value.map((s) => s.temp)) : null,
)

// ── 커서 반응 배경 ─────────────────────────────────────────
/**
 * 마우스 위치를 -1 ~ 1 로 바꿔 CSS 변수로만 넘긴다.
 * 움직임의 세기·방향은 CSS 가 정하게 두면 효과를 바꿀 때 JS 를 안 건드려도 된다.
 */
const pointer = ref({ x: 0, y: 0 })

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let rafId = null
let pendingPointer = { x: 0, y: 0 }

const handlePointerMove = (event) => {
  // 마우스가 아닌 입력(터치 등)은 무시 — 손가락으로는 '따라오는' 느낌이 안 난다
  if (event.pointerType && event.pointerType !== 'mouse') return

  // 좌표는 이벤트가 올 때마다 바로 저장해 둔다.
  // (rAF 콜백 안에서 계산하면 프레임이 밀리는 동안 들어온 이벤트가 버려지고
  //  나중에 낡은 위치가 적용된다. 최신 값이 항상 이기도록 밖에서 갱신한다.)
  pendingPointer = {
    x: (event.clientX / window.innerWidth) * 2 - 1,
    y: (event.clientY / window.innerHeight) * 2 - 1,
  }

  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    pointer.value = pendingPointer
  })
}

const parallaxStyle = computed(() => ({
  '--pointer-x': prefersReducedMotion ? 0 : pointer.value.x,
  '--pointer-y': prefersReducedMotion ? 0 : pointer.value.y,
}))

// ── 시간별 기온 꺾은선 ─────────────────────────────────────
const SLOT_WIDTH = 74 // 스트립 한 칸의 가로 폭(px). SVG 좌표계와 같은 값을 써서 눈금을 맞춘다
const CHART_HEIGHT = 44

/**
 * 기온을 그래프 y 좌표로 바꾼다.
 * 온도 폭이 좁을수록 선이 평평해지면 밋밋하니, 최소·최대 사이를 항상 꽉 채워 그린다.
 * 전부 같은 온도면 나눗셈이 0 이 되므로 가운데 높이로 고정한다.
 */
const chart = computed(() => {
  const list = slots.value
  if (list.length === 0) return { width: 0, points: '', dots: [] }

  const temps = list.map((s) => s.temp)
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  const pad = 8

  const toY = (t) =>
    max === min ? CHART_HEIGHT / 2 : pad + (1 - (t - min) / (max - min)) * (CHART_HEIGHT - pad * 2)

  const dots = list.map((slot, i) => ({
    x: i * SLOT_WIDTH + SLOT_WIDTH / 2,
    y: toY(slot.temp),
    key: slot.dt,
  }))

  return {
    width: list.length * SLOT_WIDTH,
    points: dots.map((d) => `${d.x},${d.y}`).join(' '),
    dots,
  }
})

// ── 요약 문장 & 주의사항 (직접 만든 로직) ──────────────────
const maxPop = computed(() => (slots.value.length ? Math.max(...slots.value.map((s) => s.pop)) : 0))

/** 앞으로 하루를 한 문장으로 요약한다 */
const summarySentence = computed(() => {
  if (slots.value.length === 0) return ''
  const high = Math.max(...slots.value.map((s) => s.temp))
  const rain = maxPop.value >= 50 ? '비 소식이 있습니다. ' : ''
  return `${rain}최고 기온은 ${high}°C 입니다. 강수 확률은 ${maxPop.value}% 입니다.`
})

/**
 * 주의사항 — 기상청 공식 특보가 아니라, 받아온 숫자로 앱이 직접 판단한 안내다.
 * (공식 특보는 One Call 3.0 유료 구독에서만 내려온다.)
 * 여러 조건이 겹치면 더 급한 것 하나만 보여 준다.
 */
const advisory = computed(() => {
  if (!city.value) return null
  const feels = city.value.detail?.feelsLike ?? city.value.temp
  const wind = city.value.detail?.wind ?? 0

  if (feels >= 35)
    return { level: 'danger', text: `체감온도가 ${feels}°C 입니다. 한낮 외출을 피하세요.` }
  if (feels >= 33)
    return { level: 'warn', text: `체감온도가 ${feels}°C 입니다. 수분을 자주 섭취하세요.` }
  if (feels <= -12)
    return { level: 'danger', text: `체감온도가 ${feels}°C 입니다. 한파에 유의하세요.` }
  if (maxPop.value >= 70)
    return { level: 'warn', text: `강수 확률이 ${maxPop.value}% 입니다. 우산을 챙기세요.` }
  if (wind >= 9) return { level: 'warn', text: `풍속이 ${wind}m/s 입니다. 강풍에 유의하세요.` }
  return null
})

// ── 데이터 로딩 ────────────────────────────────────────────
onMounted(async () => {
  city.value = findCityById(route.params.cityId)
  isLoaded.value = true

  if (!prefersReducedMotion) {
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
  }

  if (!city.value) return

  if (!hasApiKey) {
    apiErrorMessage.value = 'API 키가 없어 저장된 값을 보여 주고 있습니다.'
    return
  }

  isRefreshing.value = true
  const coords = { lat: city.value.lat, lon: city.value.lon }

  // 현재 날씨와 예보는 서로 기다릴 이유가 없어서 동시에 부른다.
  // 하나가 실패해도 나머지는 살리려고 allSettled 를 쓴다.
  const [nowResult, forecastResult] = await Promise.allSettled([
    fetchWeatherByCoords(coords),
    fetchForecastByCoords(coords),
  ])

  if (nowResult.status === 'fulfilled') {
    city.value = { ...city.value, ...nowResult.value }
  } else {
    apiErrorMessage.value = '실시간 날씨를 불러오지 못해 저장된 값을 보여 주고 있습니다.'
    console.error('[WeatherDetailView] 현재 날씨 실패', nowResult.reason)
  }

  if (forecastResult.status === 'fulfilled') {
    hourly.value = forecastResult.value.hourly
  } else {
    console.error('[WeatherDetailView] 예보 실패', forecastResult.reason)
  }

  isRefreshing.value = false
})

onUnmounted(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  if (rafId !== null) cancelAnimationFrame(rafId)
})

const goBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="detail">
    <p v-if="!isLoaded" class="plain-notice">불러오는 중…</p>

    <!-- 없는 도시 id 로 들어온 경우 -->
    <section v-else-if="!city" class="plain-panel">
      <h2>도시를 찾을 수 없습니다</h2>
      <p>
        <code>{{ route.params.cityId }}</code> 에 해당하는 관측 지점이 없습니다.
      </p>
      <button class="btn-back" @click="goBack">← 목록으로 돌아가기</button>
    </section>

    <template v-else>
      <div class="stage" :class="{ 'no-photo': !landmarkUrl }" :style="parallaxStyle">
        <!--
          배경은 position:fixed 라 부모의 폭·여백을 벗어나 화면 전체를 덮는다.
          사진은 별도 레이어라 스크롤해도 그대로 있고, 글자는 안 흔들린다.
        -->
        <div
          v-if="landmarkUrl"
          class="stage-photo"
          :style="{ backgroundImage: `url(${landmarkUrl})` }"
          aria-hidden="true"
        ></div>
        <div class="stage-fade" aria-hidden="true"></div>

        <div class="stage-body">
          <!-- 내비게이션이 없는 화면이라 돌아가는 길을 맨 위에 둔다 -->
          <button class="btn-top-back" @click="goBack">
            <span aria-hidden="true">←</span> 목록
          </button>

          <!-- ── 상단 요약 ── -->
          <header class="hero">
            <p class="place"><span aria-hidden="true">📍</span> {{ city.name }}</p>

            <p class="big-temp">{{ city.temp }}<span class="deg">°</span></p>
            <p class="condition">{{ city.status }}</p>

            <p v-if="rangeHigh !== null" class="range">
              <span aria-hidden="true">↑</span> {{ rangeHigh }}° / <span aria-hidden="true">↓</span>
              {{ rangeLow }}°
            </p>
            <p class="feels">체감온도 {{ city.detail.feelsLike }}°</p>

            <!-- 새로고침은 잠깐 켜졌다 꺼지는 표시라 v-show -->
            <p v-show="isRefreshing" class="refreshing">실시간 날씨 불러오는 중…</p>
          </header>

          <!-- ── 주의사항 (앱이 직접 판단) ── -->
          <section v-if="advisory" class="glass advisory" :class="advisory.level">
            <p class="glass-head"><span aria-hidden="true">⚠️</span> 오늘의 주의사항</p>
            <p class="advisory-text">{{ advisory.text }}</p>
          </section>

          <!-- ── 시간별 예보 ── -->
          <section v-if="slots.length" class="glass">
            <p class="summary">{{ summarySentence }}</p>

            <!-- 가로로 길어지는 내용은 이 안에서만 스크롤시켜 본문이 옆으로 밀리지 않게 한다 -->
            <div class="strip">
              <div class="strip-inner" :style="{ width: `${chart.width}px` }">
                <ul class="slot-row">
                  <li v-for="slot in slots" :key="slot.dt" class="slot">
                    <p class="slot-time">{{ slot.label }}</p>
                    <p class="slot-icon" :title="slot.description">
                      {{ getWeatherIcon(slot.icon) }}
                    </p>
                    <p class="slot-temp">{{ slot.temp }}°</p>
                  </li>
                </ul>

                <!-- 기온 꺾은선: 칸 너비와 같은 좌표계를 써서 점이 정확히 칸 가운데 온다 -->
                <svg
                  class="chart"
                  :width="chart.width"
                  :height="CHART_HEIGHT"
                  :viewBox="`0 0 ${chart.width} ${CHART_HEIGHT}`"
                  aria-hidden="true"
                >
                  <polyline :points="chart.points" fill="none" stroke="#ffd76e" stroke-width="2" />
                  <circle
                    v-for="d in chart.dots"
                    :key="d.key"
                    :cx="d.x"
                    :cy="d.y"
                    r="3.5"
                    fill="#ffd76e"
                  />
                </svg>

                <ul class="slot-row">
                  <li v-for="slot in slots" :key="slot.dt" class="slot">
                    <p class="slot-pop"><span aria-hidden="true">💧</span> {{ slot.pop }}%</p>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- ── 관측 항목 ── -->
          <section class="glass">
            <p class="glass-head">관측 항목</p>
            <dl class="metrics">
              <div class="metric">
                <dt>습도</dt>
                <dd>{{ city.detail.humidity }}%</dd>
              </div>
              <div class="metric">
                <dt>풍속</dt>
                <dd>{{ city.detail.wind }} m/s</dd>
              </div>
              <div class="metric">
                <dt>기압</dt>
                <dd>{{ city.detail.pressure }} hPa</dd>
              </div>
              <div class="metric">
                <dt>일출</dt>
                <dd>{{ city.detail.sunrise }}</dd>
              </div>
              <div class="metric">
                <dt>일몰</dt>
                <dd>{{ city.detail.sunset }}</dd>
              </div>
            </dl>
          </section>

          <p v-if="apiErrorMessage" class="api-notice">{{ apiErrorMessage }}</p>

          <button class="btn-back on-photo" @click="goBack">← 목록으로 돌아가기</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── 사진이 깔린 무대 (화면 전체) ────────────────────────── */
.stage {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
}

/**
 * 사진과 그라데이션은 position:fixed 라 조상의 폭·여백을 무시하고 화면 전체를 덮는다.
 * (부모에 transform·filter 가 걸리면 fixed 기준이 그쪽으로 바뀌므로,
 *  움직이는 transform 은 이 사진 레이어에만 두고 조상에는 두지 않는다.)
 * inset 을 음수로 줘 여유분을 확보해야 커서를 따라 밀렸을 때 가장자리가 안 비고,
 * translate3d 는 GPU 합성 레이어로 올라가 움직임이 부드럽다.
 */
.stage-photo {
  position: fixed;
  inset: -4%;
  background-size: cover;
  background-position: center;
  transform: translate3d(calc(var(--pointer-x, 0) * -16px), calc(var(--pointer-y, 0) * -16px), 0)
    scale(1.05);
  transition: transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);
  z-index: -2;
}

/* 위는 사진을 살리고, 아래로 갈수록 짙은 청록으로 덮어 글자가 읽히게 한다 */
/*
 * 사진 위에 흰 글자를 얹으므로 전체를 고르게 덮어야 한다.
 * 배경이 고정이라 스크롤해도 밝은 구간으로 글자가 넘어가는 일이 없어야 해서,
 * 위아래 편차를 크게 두지 않고 전 구간을 어둡게 깔았다.
 */
.stage-fade {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(8, 32, 50, 0.3) 0%,
    rgba(10, 48, 64, 0.55) 40%,
    rgba(14, 66, 76, 0.8) 100%
  );
  z-index: -1;
}

/* 사진이 없는 도시는 청록 단색으로 */
.stage.no-photo {
  background: linear-gradient(180deg, #2b6d84 0%, #14707a 100%);
}

.stage.no-photo .stage-fade {
  display: none;
}

/* 배경은 화면 전체를 쓰되, 글은 읽기 좋은 폭으로 가운데 모은다 */
.stage-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 620px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 22px 4px 48px;
}

/* ── 목록으로 (상단) ───────────────────────────────────── */
.btn-top-back {
  align-self: flex-start;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-top-back:hover {
  background: rgba(255, 255, 255, 0.28);
}

/* ── 상단 요약 ─────────────────────────────────────────── */
.hero {
  /* 사진이 충분히 보이도록 요약 위쪽에 여백을 크게 준다 */
  padding: 40px 4px 26px;
  color: #fff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.34);
}

.place {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 28px;
  font-size: 1.1rem;
  font-weight: 700;
}

.big-temp {
  margin: 0;
  font-size: 4.6rem;
  font-weight: 200;
  line-height: 0.95;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.big-temp .deg {
  font-weight: 200;
}

.condition {
  margin: 6px 0 0;
  font-size: 1.35rem;
  font-weight: 500;
}

.range {
  margin: 26px 0 0;
  font-size: 1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.range-note {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.feels {
  margin: 4px 0 0;
  font-size: 1rem;
  font-weight: 600;
}

.refreshing {
  margin: 12px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

/* ── 반투명 카드 ───────────────────────────────────────── */
.glass {
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  color: #fff;
}

.glass-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.86);
}

/* 주의사항 — 급한 정도에 따라 테두리 색만 바꾼다 */
.advisory.warn {
  border-color: rgba(255, 214, 110, 0.55);
}

.advisory.danger {
  border-color: rgba(255, 146, 120, 0.65);
  background: rgba(255, 120, 90, 0.16);
}

.advisory-text {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.5;
}

.advisory-note {
  margin: 8px 0 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
}

/* ── 시간별 예보 ───────────────────────────────────────── */
.summary {
  margin: 0 0 16px;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.6;
}

.strip {
  overflow-x: auto;
  padding-bottom: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  padding-top: 14px;
}

.strip-inner {
  display: flex;
  flex-direction: column;
}

.slot-row {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.slot {
  width: 74px;
  flex-shrink: 0;
  text-align: center;
}

.slot-time {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
}

.slot-icon {
  margin: 8px 0 0;
  font-size: 1.4rem;
  line-height: 1;
}

.slot-temp {
  margin: 8px 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.chart {
  display: block;
  margin: 2px 0;
}

.slot-pop {
  margin: 2px 0 0;
  font-size: 11px;
  color: rgba(190, 230, 255, 0.95);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.strip-note {
  margin: 12px 0 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
}

/* ── 관측 항목 ─────────────────────────────────────────── */
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin: 0;
}

.metric {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

.metric dt {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
}

.metric dd {
  margin: 4px 0 0;
  font-size: 1.1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.api-notice {
  margin: 0;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 120, 90, 0.3);
  border: 1px solid rgba(255, 146, 120, 0.5);
  border-radius: 12px;
}

/* ── 돌아가기 ──────────────────────────────────────────── */
.btn-back {
  align-self: flex-start;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  border-radius: 12px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.btn-back.on-photo {
  margin-top: 4px;
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.btn-back.on-photo:hover {
  background: rgba(255, 255, 255, 0.26);
}

/* ── 도시를 못 찾았을 때 (사진 없는 평범한 화면) ────────── */
.plain-notice {
  margin: 0;
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-dim);
}

.plain-panel {
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: 18px;
  box-shadow: var(--shadow-md);
}

.plain-panel h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  color: var(--ink);
}

.plain-panel p {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--ink-dim);
}

.plain-panel code {
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--card);
  border: 1px solid var(--line);
  font-size: 12px;
}

.plain-panel .btn-back {
  color: var(--accent-ink);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--accent-line);
}

.plain-panel .btn-back:hover {
  background: var(--accent-bg);
  border-color: var(--accent);
}

/* 동작 줄이기를 켠 사용자에게는 배경을 고정한다 */
@media (prefers-reduced-motion: reduce) {
  .stage-photo {
    transition: none;
    transform: scale(1.05);
  }
}
</style>
