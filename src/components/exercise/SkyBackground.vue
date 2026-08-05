<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { SKY_LAYERS, getSkySlot } from '@/data/skies'

/**
 * 시간대별 하늘 배경
 *
 * 지금 시각에 맞는 사진을 화면 전체에 깔고, 시간대가 넘어가면 서서히 바뀐다.
 *
 * [왜 사진을 하나만 그리지 않고 네 장을 다 깔아 두는가]
 * 하나만 그려 두고 src 를 바꾸면, 새 사진을 내려받는 동안 화면이 비었다가 튀어나온다.
 * 네 장을 미리 겹쳐 두고 투명도만 서로 바꾸면 CSS transition 이 알아서
 * 페이드인/아웃을 만들어 주고, 이미 받아 둔 사진이라 끊기지 않는다.
 */

// 지금이 어느 시간대인지. 1분마다 다시 확인한다.
const currentKey = ref(getSkySlot(new Date().getHours()).key)

let timerId = null

const updateSlot = () => {
  const next = getSkySlot(new Date().getHours()).key
  // 값이 실제로 바뀔 때만 대입해서 불필요한 재렌더를 막는다
  if (next !== currentKey.value) currentKey.value = next
}

onMounted(() => {
  // 1분 간격이면 시간대 경계를 최대 1분 안에 따라잡는다.
  // 더 촘촘히 볼 이유가 없고, 배경 하나 때문에 초 단위로 깨울 필요도 없다.
  timerId = setInterval(updateSlot, 60_000)
})

onUnmounted(() => {
  clearInterval(timerId)
})

// 지금 시간대의 라벨 (화면 오른쪽 아래에 작게 표시)
const currentLabel = computed(
  () => SKY_LAYERS.find((layer) => layer.key === currentKey.value)?.label ?? '',
)
</script>

<template>
  <div class="sky" aria-hidden="true">
    <!-- 네 장을 겹쳐 두고 현재 시간대만 불투명하게 만든다 -->
    <div
      v-for="layer in SKY_LAYERS"
      :key="layer.key"
      class="sky-layer"
      :class="{ 'is-active': layer.key === currentKey }"
      :style="{ backgroundImage: `url(${layer.url})` }"
    ></div>

    <!-- 사진 위에 밝은 막을 씌워야 흰 카드와 진한 글자가 그대로 읽힌다 -->
    <div class="sky-veil"></div>
  </div>

  <p class="sky-badge">{{ currentLabel }}</p>
</template>

<style scoped>
.sky {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.sky-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  /* 시간대가 바뀌면 이 투명도 변화가 그대로 페이드인/아웃이 된다 */
  transition: opacity 1.4s ease-in-out;
}

.sky-layer.is-active {
  opacity: 1;
}

/*
 * 화면 전체가 밝은 테마(흰 카드 + 진한 글자)라 사진을 그대로 두면 글이 안 읽힌다.
 * 흰 막을 덮어 사진은 분위기만 남기고 명암비를 확보한다.
 */
.sky-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.62) 0%,
    rgba(238, 244, 255, 0.76) 55%,
    rgba(226, 236, 255, 0.86) 100%
  );
}

/* 지금 어떤 하늘을 보고 있는지 알려 주는 작은 표시 */
.sky-badge {
  position: fixed;
  right: 16px;
  bottom: 14px;
  z-index: 0;
  margin: 0;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-dim);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--surface-line);
  border-radius: 999px;
  pointer-events: none;
}

/* 동작 줄이기를 켠 사용자에게는 서서히 바뀌는 효과를 끄고 즉시 교체한다 */
@media (prefers-reduced-motion: reduce) {
  .sky-layer {
    transition: none;
  }
}
</style>
