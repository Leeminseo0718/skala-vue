<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'

/**
 * 날씨 대시보드 (부모)
 *
 * 종합과제 본체. 매일 배운 내용을 이 화면에 계속 얹어 가며 키운다.
 *
 * [1단계] Vue 문법
 *   - v-for 배열 렌더링 (:key 에 id 바인딩)
 *   - v-if / v-else 조건부 렌더링 (25도 기준)   → WeatherCard 로 이동
 *   - :value + @input 양방향 바인딩 (한글 IME)  → SearchBar 로 이동
 *   - 이벤트 수식어 (.stop, .enter)
 *
 * [2단계] Composition API
 *   - 반응형 상태 3종 (searchQuery / selectedCityInfo / weatherList)
 *   - computed 로 검색 필터 (filteredWeatherList)
 *   - watch(selectedCityInfo) / watchEffect(searchQuery) 콘솔 로그
 *
 * [3단계] 컴포넌트 분리 — 기능은 그대로 두고 화면만 4개 파일로 쪼갬
 *   - 반응형 데이터와 로직은 전부 여기(부모)에 남는다.
 *   - 자식들은 props 로 받아 그리고, emits 로 사건만 알려 준다.
 *
 * [참고] SearchBar / WeatherCard 는 눈으로 보기엔 BaseDashboardCard 안에 들어가 있지만,
 * 슬롯 콘텐츠는 '넘겨준 쪽(부모)의 스코프'에서 컴파일된다.
 * 그래서 여기 있는 searchQuery · filteredWeatherList 를 그대로 바인딩할 수 있다.
 */

// ── 반응형 상태 3종 ────────────────────────────────────────
// 3일차에 OpenWeatherMap 응답으로 갈아 끼울 예정이라, 그때와 같은 모양으로 목 데이터를 잡았다.
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
  // ↓ 여기부터는 직접 추가한 데이터
  // 대전(25도)은 "25도 이상" 경계값이 제대로 '더움'으로 걸리는지 확인하려고 넣었다.
  { id: 'city_04', name: '대전', temp: 25, status: '흐림' },
  // 대구/대전은 앞 글자가 같아서 검색 필터를 테스트하기 좋다.
  { id: 'city_05', name: '대구', temp: 31, status: '맑음' },
  { id: 'city_06', name: '강릉', temp: 22, status: '안개' },
])

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 도시를 검색해 보세요.')

// 25 라는 숫자가 여기저기 흩어지지 않도록 상수로 뽑아 두고, 자식에게 props 로 내려준다.
const HOT_TEMP = 25

// SearchBar 가 composing-change 로 올려 주는 한글 조합 상태
const isComposing = ref(false)

// ── computed ───────────────────────────────────────────────
// 일반 함수로 만들면 화면이 리렌더링될 때마다 매번 다시 도는데,
// computed 는 searchQuery / weatherList 가 바뀔 때만 재계산하고 나머지는 캐시를 쓴다.
const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()
  // 검색어가 비면 원본 전체를 그대로 돌려준다.
  if (!keyword) return weatherList.value
  return weatherList.value.filter((city) => city.name.includes(keyword))
})

// 검색은 했는데 결과가 없는 상태인지 (템플릿 분기를 읽기 쉽게 하려고 따로 뺐다)
const isEmptyResult = computed(
  () => searchQuery.value.trim() !== '' && filteredWeatherList.value.length === 0,
)

// ── watch / watchEffect ────────────────────────────────────
// watch: 감시 대상을 명시적으로 지정하고, 이전 값과 새 값을 둘 다 받는다.
watch(selectedCityInfo, (newInfo, oldInfo) => {
  console.log(`[watch] 상태바 변경\n  이전: ${oldInfo}\n  이후: ${newInfo}`)
})

// watchEffect: 콜백 안에서 읽은 반응형 값을 알아서 추적한다.
// 그래서 감시 대상을 안 적어도 되고, 대신 컴포넌트가 뜨는 즉시 한 번 실행된다.
watchEffect(() => {
  console.log(
    `[watchEffect] 검색어 "${searchQuery.value}" → ${filteredWeatherList.value.length}건` +
      (isComposing.value ? ' (한글 조합 중)' : ''),
  )
})

// ── 자식 컴포넌트가 올려 보내는 이벤트 처리 ─────────────────
// SearchBar → update-query
const handleUpdateQuery = (newQuery) => {
  searchQuery.value = newQuery
}

// SearchBar → composing-change
const handleComposingChange = (composing) => {
  isComposing.value = composing
}

// SearchBar → search-submit (.enter 키 수식어)
const handleSearchSubmit = () => {
  const keyword = searchQuery.value.trim()
  selectedCityInfo.value = keyword
    ? `'${keyword}' (으)로 검색했습니다.`
    : '검색어를 입력한 뒤 Enter 를 눌러 주세요.'
}

// WeatherCard → select-card
const handleSelectCard = (city) => {
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
}

// WeatherCard → click-detail (.stop 으로 select-card 와 겹치지 않게 처리됨)
const handleClickDetail = (city) => {
  window.alert(`${city.name}의 현재 날씨는 [${city.status}] 상태입니다.`)
}
</script>

<template>
  <div class="dashboard">
    <!-- 기본 슬롯에 SearchBar 를 주입 -->
    <BaseDashboardCard>
      <SearchBar
        :query="searchQuery"
        @update-query="handleUpdateQuery"
        @composing-change="handleComposingChange"
        @search-submit="handleSearchSubmit"
      />
    </BaseDashboardCard>

    <!-- 이름 있는 슬롯(head-meta)에는 건수를, 기본 슬롯에는 카드 목록을 주입 -->
    <BaseDashboardCard title="지역별 날씨 현황">
      <template #head-meta>
        <!-- 원본 대비 몇 건이 걸렸는지 같이 보여 주면 computed 가 도는 게 눈에 보인다 -->
        <span class="count"
          >{{ filteredWeatherList.length }} / {{ weatherList.length }}개 지역</span
        >
      </template>

      <!-- 검색 결과가 없을 때 안내 -->
      <p v-if="isEmptyResult" class="empty">
        <template v-if="isComposing">한글을 입력하는 중입니다…</template>
        <template v-else>'{{ searchQuery.trim() }}' 와 일치하는 도시가 없습니다.</template>
      </p>

      <!-- 검색어가 비면 원본, 일치하면 결과가 그대로 흘러 들어온다 -->
      <ul v-else class="card-list">
        <WeatherCard
          v-for="city in filteredWeatherList"
          :key="city.id"
          :city-item="city"
          :hot-temp="HOT_TEMP"
          @select-card="handleSelectCard"
          @click-detail="handleClickDetail"
        />
      </ul>
    </BaseDashboardCard>

    <p class="status-bar">
      <span class="status-dot" aria-hidden="true"></span>
      {{ selectedCityInfo }}
    </p>
  </div>
</template>

<style scoped>
/* 패널·검색바·카드 디자인은 각 자식 컴포넌트의 <style scoped> 로 옮겨 갔고,
   여기에는 '배치'와 부모가 직접 그리는 요소만 남는다. */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.count {
  font-size: 12px;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}

/* 검색 결과가 없을 때 자리를 지켜 주는 안내 박스 */
.empty {
  margin: 0;
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-dim);
  background: var(--card);
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 14px 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-ink);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--surface-line);
  border-radius: 14px;
  box-shadow: var(--shadow-md);
}

.status-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(59, 111, 212, 0.16);
}
</style>
