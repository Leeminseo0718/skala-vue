<script setup>
import { computed } from 'vue'

/**
 * WeatherCard.vue — 도시 하나를 그리는 카드 (3단계)
 *
 *  - props : 도시 객체를 통째로 받아서 표시 (cityItem)
 *  - emits : select-card  (카드 본체 클릭)
 *            click-detail (상세보기 버튼 클릭)
 *
 * 카드는 "받은 걸 그리고, 눌린 걸 알리는" 역할만 한다.
 * 무슨 문구를 띄울지 · 어떤 도시가 선택됐는지 기억하는 건 전부 부모 몫이다.
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
})

const emit = defineEmits(['select-card', 'click-detail'])

// 기준 비교를 template 에서 두 번 쓰게 되어 computed 로 한 번만 계산한다.
const isHot = computed(() => props.cityItem.temp >= props.hotTemp)

// 부모가 도시 객체를 통째로 받아 처리할 수 있게 payload 로 실어 보낸다.
const handleSelect = () => {
  emit('select-card', props.cityItem)
}

const handleDetail = () => {
  emit('click-detail', props.cityItem)
}
</script>

<template>
  <li class="weather-card" :class="isHot ? 'is-hot' : 'is-cool'" @click="handleSelect">
    <!-- 윗줄: 도시명·날씨 상태 (왼쪽) / 기온을 크게 (오른쪽) -->
    <div class="card-top">
      <div class="card-title">
        <h4>{{ cityItem.name }}</h4>
        <p>{{ cityItem.status }}</p>
      </div>
      <p class="card-temp">{{ cityItem.temp }}<span class="unit">°C</span></p>
    </div>

    <!-- 아랫줄: 조건부 뱃지 (왼쪽) / 상세보기 (오른쪽) -->
    <div class="card-bottom">
      <span v-if="isHot" class="badge hot">🔥 더움 (25도 이상)</span>
      <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

      <!-- .stop 이 없으면 카드의 @click(select-card)까지 같이 터진다 -->
      <button class="btn-detail" @click.stop="handleDetail">
        상세보기 <span aria-hidden="true">→</span>
      </button>
    </div>
  </li>
</template>

<style scoped>
.weather-card {
  padding: 16px 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  list-style: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.weather-card:hover {
  border-color: var(--line-strong);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* 윗줄 — 도시 정보와 기온을 좌우로 갈라 놓는다 */
.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-title h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--ink);
}

.card-title p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--ink-dim);
}

/* 기온을 카드에서 가장 크게 — 한눈에 읽히는 게 대시보드의 핵심 */
.card-temp {
  margin: 0;
  font-size: 2rem;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.card-temp .unit {
  margin-left: 2px;
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--ink-dim);
}

/* 기온 숫자 색으로도 덥다/선선하다를 구분한다 */
.is-hot .card-temp {
  color: var(--hot);
}

.is-cool .card-temp {
  color: var(--cool);
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

/* 채우기 대신 은은한 배경 + 테두리로 */
.badge {
  padding: 5px 11px;
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

/* 절대배치 버튼 대신, 아랫줄에 흐르는 텍스트 버튼으로 */
.btn-detail {
  flex-shrink: 0;
  padding: 6px 12px;
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
</style>
