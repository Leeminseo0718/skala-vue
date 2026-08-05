<script setup>
import { computed } from 'vue'

/**
 * WeatherCard.vue — 도시 하나를 그리는 카드 (3단계)
 *
 *  - props : 도시 객체를 통째로 받아서 표시 (cityItem)
 *            즐겨찾기 여부 (isFavorite)
 *  - emits : select-card     (카드 본체 클릭)
 *            click-detail    (상세보기 버튼 클릭)
 *            toggle-favorite (별 버튼 클릭)
 *
 * 카드는 "받은 걸 그리고, 눌린 걸 알리는" 역할만 한다.
 * 즐겨찾기 목록을 누가 들고 있는지도 카드는 모른다. 부모가 판단해서 결과만 내려 준다.
 *
 * 목록이 가로로 넘어가는 형태라 카드는 정사각형에 가깝게 잡았다.
 */
const props = defineProps({
  cityItem: {
    type: Object,
    required: true,
  },
  // 더움/선선함을 가르는 기준 온도. 부모가 안 주면 25도로 본다.
  hotTemp: {
    type: Number,
    default: 25,
  },
  // 이 온도를 넘으면 불길 효과를 준다
  blazeTemp: {
    type: Number,
    default: 30,
  },
  // 이 도시가 즐겨찾기에 들어 있는지 — 판단은 부모가 하고 결과만 받는다
  isFavorite: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-card', 'click-detail', 'toggle-favorite'])

// 기준 비교를 template 에서 여러 번 쓰게 되어 computed 로 한 번만 계산한다.
const isHot = computed(() => props.cityItem.temp >= props.hotTemp)
const isBlazing = computed(() => props.cityItem.temp >= props.blazeTemp)

// 부모가 도시 객체를 통째로 받아 처리할 수 있게 payload 로 실어 보낸다.
const handleSelect = () => {
  emit('select-card', props.cityItem)
}

const handleDetail = () => {
  emit('click-detail', props.cityItem)
}

const handleToggleFavorite = () => {
  emit('toggle-favorite', props.cityItem)
}
</script>

<template>
  <li
    class="weather-card"
    :class="[isHot ? 'is-hot' : 'is-cool', { 'is-blazing': isBlazing }]"
    @click="handleSelect"
  >
    <!-- 불길 레이어는 ::before/::after 로 카드 뒤에 깔리고, 내용은 이 안에서 위로 뜬다 -->
    <div class="card-inner">
      <div class="card-head">
        <!-- .stop 으로 카드 선택(select-card)과 겹치지 않게 막는다.
             :class 로 켜짐/꺼짐 상태를 색과 채운 별/빈 별로 동시에 표현한다. -->
        <button
          class="btn-favorite"
          :class="{ 'is-on': isFavorite }"
          :aria-pressed="isFavorite"
          :title="isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'"
          @click.stop="handleToggleFavorite"
        >
          {{ isFavorite ? '★' : '☆' }}
        </button>
        <div class="card-title">
          <h4>{{ cityItem.name }}</h4>
          <p>{{ cityItem.status }}</p>
        </div>
      </div>

      <p class="card-temp">{{ cityItem.temp }}<span class="unit">°C</span></p>

      <div class="card-foot">
        <span v-if="isHot" class="badge hot">🔥 더움</span>
        <span v-else class="badge cool">❄️ 선선함</span>

        <!-- .stop 이 없으면 카드의 @click(select-card)까지 같이 터진다 -->
        <button class="btn-detail" @click.stop="handleDetail">
          상세보기 <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </li>
</template>

<style scoped>
.weather-card {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  width: 232px;
  min-height: 226px;
  padding: 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  list-style: none;
  scroll-snap-align: start;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.weather-card:hover {
  border-color: var(--line-strong);
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
}

/* 내용은 불길 레이어 위로 올린다 */
.card-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 190px;
}

/* ── 윗줄: 별 + 도시명 ─────────────────────────────────── */
.card-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.card-title h4 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--ink);
}

.card-title p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--ink-dim);
}

.btn-favorite {
  flex-shrink: 0;
  width: 20px;
  padding: 0;
  font-size: 18px;
  line-height: 1.2;
  font-family: inherit;
  color: var(--ink-placeholder);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.btn-favorite:hover,
.btn-favorite.is-on {
  color: var(--star);
}

.btn-favorite:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ── 가운데: 기온 ──────────────────────────────────────── */
/* margin-top:auto 로 아래쪽 묶음을 바닥에 붙이고 기온이 가운데 공간을 차지하게 한다 */
.card-temp {
  margin: 18px 0 auto;
  font-size: 2.5rem;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.card-temp .unit {
  margin-left: 2px;
  font-size: 0.95rem;
  font-weight: 400;
  color: var(--ink-dim);
}

.is-hot .card-temp {
  color: var(--hot);
}

.is-cool .card-temp {
  color: var(--cool);
}

/* ── 아랫줄: 뱃지 + 상세보기 ───────────────────────────── */
.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.badge {
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  white-space: nowrap;
}

.badge.hot {
  background: var(--hot-bg);
  border: 1px solid var(--hot-line);
  color: var(--hot-ink);
}

.badge.cool {
  background: var(--cool-bg);
  border: 1px solid var(--cool-line);
  color: var(--cool-ink);
}

.btn-detail {
  flex-shrink: 0;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.btn-detail:hover {
  color: var(--accent-ink);
  background: var(--accent-bg);
  border-color: var(--accent-line);
}

/* ── 30도 이상: 불길 효과 ──────────────────────────────── */
/*
 * 커서와 무관하게 스스로 움직여야 해서 CSS 애니메이션으로만 만들었다.
 * 불길 레이어 두 겹을 서로 다른 주기(2.6s / 1.9s)로 돌려, 주기가 어긋나면서
 * 같은 모양이 반복되지 않고 계속 다르게 일렁이는 것처럼 보이게 했다.
 */
.weather-card.is-blazing {
  border-color: rgba(232, 78, 62, 0.55);
  background: linear-gradient(180deg, #fff9f8 0%, #ffe9e5 100%);
  box-shadow: 0 3px 16px rgba(220, 55, 40, 0.18);
}

.weather-card.is-blazing:hover {
  box-shadow: 0 8px 26px rgba(220, 55, 40, 0.32);
}

.weather-card.is-blazing::before,
.weather-card.is-blazing::after {
  content: '';
  position: absolute;
  left: -12%;
  right: -12%;
  bottom: -26%;
  height: 78%;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

/* 아래쪽에서 피어오르는 붉은 불길 */
.weather-card.is-blazing::before {
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(248, 70, 44, 0.46) 0%,
    rgba(214, 34, 34, 0.24) 45%,
    transparent 72%
  );
  animation: blaze-back 2.6s ease-in-out infinite alternate;
}

/* 그 안쪽에서 더 빠르게 흔들리는 밝은 심지 */
.weather-card.is-blazing::after {
  background: radial-gradient(
    ellipse at 38% 100%,
    rgba(255, 158, 66, 0.42) 0%,
    rgba(240, 78, 40, 0.16) 40%,
    transparent 66%
  );
  animation: blaze-front 1.9s ease-in-out infinite alternate;
}

@keyframes blaze-back {
  from {
    transform: translateY(9%) scale(0.94, 0.9);
    opacity: 0.7;
  }
  to {
    transform: translateY(-2%) scale(1.04, 1.14);
    opacity: 1;
  }
}

@keyframes blaze-front {
  from {
    transform: translateY(7%) scale(0.88, 0.94);
    opacity: 0.5;
  }
  to {
    transform: translateY(-6%) scale(1.1, 1.06);
    opacity: 0.95;
  }
}

/* 불타는 카드는 기온 숫자도 같이 달아오르게 */
.weather-card.is-blazing .card-temp {
  color: #d61f1f;
  text-shadow: 0 0 18px rgba(235, 45, 35, 0.35);
}

.weather-card.is-blazing .card-foot {
  border-top-color: rgba(232, 78, 62, 0.3);
}

/* 동작 줄이기를 켠 사용자에게는 불길을 멈추고 색만 남긴다 */
@media (prefers-reduced-motion: reduce) {
  .weather-card.is-blazing::before,
  .weather-card.is-blazing::after {
    animation: none;
  }
}
</style>
