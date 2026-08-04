<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import { weatherList as mockWeatherList, HOT_TEMP } from '@/data/weatherMock'
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

    <!-- 이름 있는 슬롯(head-meta)에는 정렬 UI 를, 기본 슬롯에는 카드 목록을 주입 -->
    <BaseDashboardCard title="지역별 날씨 현황">
      <template #head-meta>
        <!-- v-model 로 sortKey 와 묶는다. 값이 바뀌면 computed 가 알아서 다시 정렬한다. -->
        <select v-model="sortKey" class="sort-select" aria-label="정렬 기준">
          <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </template>

      <p class="list-meta">
        <!-- 원본 대비 몇 건이 걸렸는지 같이 보여 주면 computed 가 도는 게 눈에 보인다 -->
        <span>{{ filteredWeatherList.length }} / {{ weatherList.length }}개 지역</span>
        <!-- 즐겨찾기 개수는 자주 켜고 꺼서, DOM 을 부수고 짓는 v-if 보다 감추는 v-show 가 맞다 -->
        <span v-show="favoriteStore.favoriteCount > 0" class="fav-count">
          ★ 즐겨찾기 {{ favoriteStore.favoriteCount }}개
        </span>
        <!-- 로딩도 잠깐 켜졌다 꺼지는 표시라 v-show -->
        <span v-show="isLoading" class="loading">실시간 날씨 불러오는 중…</span>
      </p>

      <p v-if="apiErrorMessage" class="api-notice">{{ apiErrorMessage }}</p>

      <!-- 검색 결과가 없을 때 안내 -->
      <p v-if="isEmptyResult" class="empty">
        <template v-if="isComposing">한글을 입력하는 중입니다…</template>
        <template v-else>'{{ searchQuery.trim() }}' 와 일치하는 도시가 없습니다.</template>
      </p>

      <!-- 검색 → 정렬을 거친 최종 목록 -->
      <ul v-else class="card-list">
        <WeatherCard
          v-for="city in sortedWeatherList"
          :key="city.id"
          :city-item="city"
          :hot-temp="HOT_TEMP"
          :is-favorite="favoriteStore.isFavorite(city.id)"
          @select-card="handleSelectCard"
          @click-detail="handleClickDetail"
          @toggle-favorite="handleToggleFavorite"
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
   여기에는 '배치'와 이 화면이 직접 그리는 요소만 남는다. */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 정렬 select — 패널 머리말 오른쪽에 앉는다 */
.sort-select {
  padding: 5px 9px;
  font-size: 12px;
  font-family: inherit;
  color: var(--ink);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
}

.sort-select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

/* 목록 위 요약 줄 (건수 · 즐겨찾기 개수) */
.list-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 2px 12px;
  font-size: 12px;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}

.fav-count {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--star-bg);
  border: 1px solid var(--star-line);
  color: var(--star-ink);
  font-weight: 600;
}

.loading {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-line);
  color: var(--accent-ink);
  font-weight: 600;
}

/* API 실패 안내 — 화면을 막지 않고 줄 하나로만 알린다 */
.api-notice {
  margin: 0 0 12px;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--hot-ink);
  background: var(--hot-bg);
  border: 1px solid var(--hot-line);
  border-radius: 12px;
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
