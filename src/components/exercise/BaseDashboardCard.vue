<script setup>
/**
 * BaseDashboardCard.vue — 공통 패널 (3단계)
 *
 * 검색박스와 리스트박스가 똑같은 '반투명 흰 판' 디자인을 쓰고 있어서,
 * 그 껍데기만 떼어내 공통 컴포넌트로 만들었다.
 * 알맹이는 <slot> 으로 비워 두고 부모(WeatherParent)가 채워 넣는다.
 *
 * 슬롯 2개를 쓴다.
 *  - 이름 있는 슬롯(head-meta) : 제목 오른쪽에 붙는 부가 정보 (예: "2 / 6개 지역")
 *  - 기본 슬롯                 : 본문 (검색바 / 날씨 카드 목록)
 */
defineProps({
  // 판 왼쪽 위에 붙는 제목. 안 넘기면 머리말 줄 자체를 그리지 않는다.
  title: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="panel">
    <div v-if="title" class="panel-head">
      <h3>{{ title }}</h3>
      <!-- 부모가 안 채우면 아무것도 안 그려진다 -->
      <slot name="head-meta"></slot>
    </div>

    <!-- 부모가 아무것도 안 넘겼을 때 보여줄 기본 문구 -->
    <slot>
      <p class="slot-empty">표시할 내용이 없습니다.</p>
    </slot>
  </section>
</template>

<style scoped>
/* 하늘빛 배경이 살짝 비치는 반투명 흰 판.
   backdrop-filter(유리 블러)는 쓰지 않는다 — 패널이 여러 개 쌓인 긴 페이지에서
   크롬 합성 단계가 깨져 패널 내용이 통째로 안 그려지는 현상이 있었다. */
.panel {
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: 18px;
  box-shadow: var(--shadow-md);
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-head h3 {
  margin: 0;
  /* 오른쪽 슬롯(정렬 상자 등)이 넓어져도 제목이 줄바꿈되지 않게 한다 */
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink-dim);
}

.slot-empty {
  margin: 0;
  font-size: 13px;
  color: var(--ink-dim);
}
</style>
