<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import { weatherList as mockWeatherList, HOT_TEMP, BLAZE_TEMP } from '@/data/weatherMock'
import { fetchWeatherForCities, hasApiKey } from '@/api/weather'
import { useFavoriteStore } from '@/stores/favoriteStore'

/**
 * 메인 날씨 대시보드 화면 (/)
 *
 * 3단계까지의 WeatherParent 를 라우터의 '페이지 단위 화면'으로 옮긴 것.
 * 반응형 데이터와 로직은 여전히 전부 여기(부모)에 있고,
 * 자식들은 props 로 받아 그리고 emits 로 사건만 알려 준다.
 *
 * [4단계에서 바뀐 점]
 *  - 목 데이터를 @/data/weatherMock 으로 빼서 상세 화면과 공유한다.
 *  - [상세보기] 가 window.alert 대신 router.push 로 상세 페이지로 이동한다.
 *
 * [직접 추가한 기능]
 *  - 즐겨찾기 토글 : Pinia 스토어에 담고, 즐겨찾기 화면과 같은 목록을 본다
 *  - 정렬 기준     : v-model 로 고른 값에 따라 computed 가 목록을 다시 정렬
 */

const router = useRouter()

// 즐겨찾기는 즐겨찾기 화면·내비게이션 배지와 함께 봐야 해서 스토어에 둔다
const favoriteStore = useFavoriteStore()

// ── 반응형 상태 3종 ────────────────────────────────────────
const weatherList = ref(mockWeatherList)
const searchQuery = ref('')
/**
 * 어떤 도시를 골랐는지 · 무엇으로 검색했는지 기록하는 값.
 * 화면 아래 상태바로 보여 주다가 지웠고, 지금은 watch 로 콘솔에만 남긴다.
 * (카드를 눌렀을 때 무슨 일이 일어났는지 개발자 도구에서 추적하는 용도)
 */
const selectedCityInfo = ref('카드를 클릭하거나 도시를 검색해 보세요.')

// SearchBar 가 composing-change 로 올려 주는 한글 조합 상태
const isComposing = ref(false)

// ── 실시간 날씨 로딩 상태 ──────────────────────────────────
const isLoading = ref(false)
const apiErrorMessage = ref('')

/**
 * OpenWeatherMap 에서 여섯 도시의 현재 날씨를 받아 온다.
 *
 * 실패해도 화면을 비우지 않는다. weatherList 는 목 데이터로 이미 채워져 있고,
 * 성공한 도시만 그 위에 덮어쓰는 구조라 일부만 실패해도 나머지는 최신값이 된다.
 */
const loadWeather = async () => {
  if (!hasApiKey) {
    apiErrorMessage.value = 'API 키가 없어 저장된 값을 보여 주고 있습니다.'
    return
  }

  isLoading.value = true
  apiErrorMessage.value = ''

  try {
    const { cities, failedNames } = await fetchWeatherForCities(weatherList.value)
    weatherList.value = cities
    if (failedNames.length > 0) {
      apiErrorMessage.value = `${failedNames.join(', ')} 는 불러오지 못해 저장된 값을 보여 줍니다.`
    }
  } catch (error) {
    apiErrorMessage.value = '실시간 날씨를 불러오지 못해 저장된 값을 보여 주고 있습니다.'
    console.error('[WeatherHomeView] 날씨 조회 실패', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadWeather)

// ── 정렬 기준 (직접 추가) ──────────────────────────────────
// v-model 로 <select> 와 묶을 값들. 라벨까지 같이 들고 있으면 template 이 단순해진다.
const SORT_OPTIONS = [
  { value: 'default', label: '등록순' },
  { value: 'name', label: '이름순' },
  { value: 'tempDesc', label: '기온 높은순' },
  { value: 'tempAsc', label: '기온 낮은순' },
]

const sortKey = ref('default')

// ── computed ───────────────────────────────────────────────
// 일반 함수로 만들면 화면이 리렌더링될 때마다 매번 다시 도는데,
// computed 는 searchQuery / weatherList 가 바뀔 때만 재계산하고 나머지는 캐시를 쓴다.
const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()
  // 검색어가 비면 원본 전체를 그대로 돌려준다.
  if (!keyword) return weatherList.value
  return weatherList.value.filter((city) => city.name.includes(keyword))
})

/**
 * 검색 결과를 정렬한 최종 목록. 화면은 이 배열만 본다.
 *
 * 주의: Array.prototype.sort 는 원본 배열을 그 자리에서 뒤집는다.
 * filteredWeatherList 를 그대로 정렬하면 원본 weatherList 까지 순서가 바뀌어
 * '등록순'으로 되돌릴 방법이 없어진다. 그래서 반드시 복사본을 만들어 정렬한다.
 *
 * computed 라서 sortKey 나 검색 결과가 바뀔 때만 다시 정렬하고,
 * 즐겨찾기를 눌러 화면이 다시 그려질 때는 캐시된 결과를 재사용한다.
 */
const sortedWeatherList = computed(() => {
  const list = [...filteredWeatherList.value]

  switch (sortKey.value) {
    case 'name':
      // 한글 가나다순은 localeCompare 에 'ko' 를 줘야 제대로 정렬된다
      return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    case 'tempDesc':
      return list.sort((a, b) => b.temp - a.temp)
    case 'tempAsc':
      return list.sort((a, b) => a.temp - b.temp)
    default:
      // '등록순' 은 목 데이터에 적힌 순서 그대로
      return list
  }
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

// 정렬 기준이 바뀔 때마다 기록 (직접 추가)
watch(sortKey, (newKey, oldKey) => {
  const labelOf = (key) => SORT_OPTIONS.find((opt) => opt.value === key)?.label ?? key
  console.log(`[watch] 정렬 기준 변경: ${labelOf(oldKey)} → ${labelOf(newKey)}`)
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

/**
 * WeatherCard → click-detail
 * 4단계 전에는 window.alert 로 띄웠지만, 이제는 Programmatic Navigation 으로
 * 상세 페이지 주소를 직접 밀어 넣는다. <RouterLink> 와 달리 함수 안에서
 * 조건을 따져 이동시킬 수 있다.
 */
const handleClickDetail = (city) => {
  router.push(`/weather/${city.id}`)
}

/**
 * WeatherCard → toggle-favorite (직접 추가)
 *
 * 담고 빼는 일과 localStorage 저장은 스토어가 맡는다.
 * 이 화면은 결과를 받아 상태바 문구만 바꾼다.
 */
const handleToggleFavorite = (city) => {
  const added = favoriteStore.toggle(city.id)

  selectedCityInfo.value = added
    ? `${city.name}을(를) 즐겨찾기에 담았습니다.`
    : `${city.name}을(를) 즐겨찾기에서 뺐습니다.`
}
</script>

<template>
  <!-- 왼쪽에 검색, 오른쪽에 날씨 현황을 두는 2단 배치 -->
  <div class="dashboard">
    <!-- 기본 슬롯에 SearchBar 를 주입 -->
    <BaseDashboardCard class="col-search" title="도시 검색">
      <SearchBar
        :query="searchQuery"
        @update-query="handleUpdateQuery"
        @composing-change="handleComposingChange"
        @search-submit="handleSearchSubmit"
      />

      <!-- 검색 결과 요약은 검색 칸 바로 아래가 자연스럽다 -->
      <dl class="summary">
        <div class="summary-row">
          <dt>검색 결과</dt>
          <dd>{{ filteredWeatherList.length }} / {{ weatherList.length }}개 지역</dd>
        </div>
        <div class="summary-row">
          <dt>즐겨찾기</dt>
          <dd>{{ favoriteStore.favoriteCount }}개</dd>
        </div>
      </dl>
    </BaseDashboardCard>

    <!-- 이름 있는 슬롯(head-meta)에는 정렬 UI 를, 기본 슬롯에는 카드 목록을 주입 -->
    <BaseDashboardCard class="col-list" title="지역별 날씨 현황">
      <template #head-meta>
        <!-- Element Plus 선택 상자. v-model 로 sortKey 와 묶여 있어
             값이 바뀌면 computed 가 알아서 다시 정렬한다. -->
        <el-select v-model="sortKey" size="small" class="sort-select" aria-label="정렬 기준">
          <el-option
            v-for="option in SORT_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </template>

      <!-- 로딩은 잠깐 켜졌다 꺼지는 표시라 v-show -->
      <el-alert
        v-show="isLoading"
        title="실시간 날씨를 불러오는 중입니다"
        type="info"
        :closable="false"
        show-icon
        class="notice"
      />

      <!-- API 가 실패해도 저장된 값으로 화면은 유지되므로 경고 수준으로만 알린다 -->
      <el-alert
        v-if="apiErrorMessage"
        :title="apiErrorMessage"
        type="warning"
        :closable="false"
        show-icon
        class="notice"
      />

      <!-- 검색 결과가 없을 때 안내 -->
      <el-empty
        v-if="isEmptyResult"
        :description="
          isComposing
            ? '한글을 입력하는 중입니다…'
            : `'${searchQuery.trim()}' 와 일치하는 도시가 없습니다.`
        "
        :image-size="70"
      />

      <!-- 검색 → 정렬을 거친 최종 목록.
           카드가 가로로 넘어가므로 이 컨테이너 안에서만 옆으로 스크롤된다. -->
      <ul v-else class="card-list">
        <WeatherCard
          v-for="city in sortedWeatherList"
          :key="city.id"
          :city-item="city"
          :hot-temp="HOT_TEMP"
          :blaze-temp="BLAZE_TEMP"
          :is-favorite="favoriteStore.isFavorite(city.id)"
          @select-card="handleSelectCard"
          @click-detail="handleClickDetail"
          @toggle-favorite="handleToggleFavorite"
        />
      </ul>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
/* 패널·검색바·카드 디자인은 각 자식 컴포넌트의 <style scoped> 로 옮겨 갔고,
   여기에는 '배치'와 이 화면이 직접 그리는 요소만 남는다. */

/*
 * 왼쪽 검색(고정 폭) + 오른쪽 날씨 현황(남는 폭 전부).
 * align-items: start 를 줘야 두 칸의 높이가 서로를 따라가지 않는다.
 */
.dashboard {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

/* 오른쪽 칸이 카드 목록을 가로 스크롤시키려면 폭이 0까지 줄 수 있어야 한다.
   (grid 항목의 기본 min-width:auto 를 풀지 않으면 칸이 내용만큼 벌어진다) */
.col-list {
  min-width: 0;
}

/* 검색 아래 요약 (검색 결과 · 즐겨찾기 개수) */
.summary {
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.summary-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.summary-row + .summary-row {
  margin-top: 8px;
}

.summary dt {
  font-size: 12px;
  color: var(--ink-dim);
}

.summary dd {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* Element Plus 선택 상자는 기본값이 100% 라 머리말 제목을 밀어낸다. 폭을 고정한다. */
.sort-select {
  width: 130px;
  flex-shrink: 0;
}

/* Element Plus 안내 막대 — 목록 위에 한 줄로만 끼운다 */
.notice {
  margin-bottom: 12px;
}

/* 좁은 화면에서는 검색이 위, 목록이 아래로 한 줄씩 쌓인다 */
@media (max-width: 860px) {
  .dashboard {
    grid-template-columns: minmax(0, 1fr);
  }
}

/*
 * 카드를 세로로 쌓지 않고 가로로 늘어놓는다.
 * 옆으로 넘치는 건 이 컨테이너 안에서만 스크롤시켜야 페이지 본문이 같이 밀리지 않는다.
 * scroll-snap 을 걸어 두면 스크롤이 카드 경계에서 자연스럽게 멈춘다.
 */
.card-list {
  display: flex;
  gap: 12px;
  margin: 0;
  /* 아래 여백은 카드 hover 시 떠오르는 그림자가 잘리지 않게 준 것 */
  padding: 4px 2px 12px;
  list-style: none;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
}
</style>
