<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import { weatherList as mockWeatherList, HOT_TEMP, BLAZE_TEMP } from '@/data/weatherMock'
import { fetchWeatherForCities, hasApiKey } from '@/api/weather'
import { useFavoriteStore } from '@/stores/favoriteStore'

/**
 * 즐겨찾기 화면 (/favorites)
 *
 * 목록 화면과 같은 카드를 쓰되, 스토어에 담긴 도시만 골라서 보여 준다.
 * 여기서 별을 다시 누르면 그 자리에서 목록이 줄어든다 (스토어를 같이 보고 있으므로).
 */
const router = useRouter()
const favoriteStore = useFavoriteStore()

// 전체 도시 목록(날씨는 아래에서 덮어쓴다)
const weatherList = ref(mockWeatherList)
const isLoading = ref(false)
const apiErrorMessage = ref('')

/**
 * 스토어에 담긴 id 순서대로 도시를 꺼낸다.
 * weatherList 를 filter 하지 않고 favoriteIds 를 map 하는 이유는,
 * 사용자가 담은 순서를 그대로 보여 주기 위해서다.
 */
const favoriteCities = computed(() =>
  favoriteStore.favoriteIds
    .map((id) => weatherList.value.find((city) => city.id === id))
    .filter(Boolean),
)

/**
 * 즐겨찾기 도시들의 평균 기온.
 * 담아 둔 지역이 전반적으로 더운지 선선한지 한눈에 보라고 넣었다.
 */
const averageTemp = computed(() => {
  if (favoriteCities.value.length === 0) return null
  const sum = favoriteCities.value.reduce((acc, city) => acc + city.temp, 0)
  return Math.round(sum / favoriteCities.value.length)
})

// 즐겨찾기가 늘고 줄 때마다 기록
watch(
  () => favoriteStore.favoriteCount,
  (count, prev) => {
    console.log(`[watch] 즐겨찾기 화면: ${prev}개 → ${count}개`)
  },
)

/**
 * 즐겨찾기한 도시의 날씨만 불러온다.
 * 전체를 부르지 않아 목록 화면보다 호출 수가 적다.
 */
const loadWeather = async () => {
  if (!hasApiKey || favoriteStore.favoriteCount === 0) {
    if (!hasApiKey) apiErrorMessage.value = 'API 키가 없어 저장된 값을 보여 주고 있습니다.'
    return
  }

  isLoading.value = true
  apiErrorMessage.value = ''

  try {
    const targets = weatherList.value.filter((city) => favoriteStore.isFavorite(city.id))
    const { cities, failedNames } = await fetchWeatherForCities(targets)

    // 받아온 도시만 원래 목록에 덮어쓴다
    const byId = new Map(cities.map((city) => [city.id, city]))
    weatherList.value = weatherList.value.map((city) => byId.get(city.id) ?? city)

    if (failedNames.length > 0) {
      apiErrorMessage.value = `${failedNames.join(', ')} 는 불러오지 못해 저장된 값을 보여 줍니다.`
    }
  } catch (error) {
    apiErrorMessage.value = '실시간 날씨를 불러오지 못해 저장된 값을 보여 주고 있습니다.'
    console.error('[FavoriteView] 날씨 조회 실패', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadWeather)

// ── 카드 이벤트 ────────────────────────────────────────────
// 상태바를 없애서 화면에 남길 문구는 없고, 무슨 일이 일어났는지는 콘솔로만 남긴다
const handleSelectCard = (city) => {
  console.log(`[FavoriteView] ${city.name} 카드 선택`)
}

const handleClickDetail = (city) => {
  router.push(`/weather/${city.id}`)
}

const handleToggleFavorite = (city) => {
  const added = favoriteStore.toggle(city.id)
  console.log(`[FavoriteView] ${city.name} ${added ? '담기' : '빼기'}`)
}
</script>

<template>
  <div class="dashboard">
    <BaseDashboardCard title="즐겨찾기한 지역">
      <template #head-meta>
        <span class="count">{{ favoriteStore.favoriteCount }}개 지역</span>
      </template>

      <p class="list-meta">
        <!-- 평균 기온은 담은 지역이 있을 때만 의미가 있다 -->
        <span v-show="averageTemp !== null" class="avg">평균 {{ averageTemp }}°C</span>
        <!-- 로딩은 잠깐 켜졌다 꺼지는 표시라 v-show -->
        <span v-show="isLoading" class="loading">실시간 날씨 불러오는 중…</span>
      </p>

      <p v-if="apiErrorMessage" class="api-notice">{{ apiErrorMessage }}</p>

      <!-- 담은 지역이 없을 때 -->
      <div v-if="favoriteCities.length === 0" class="empty">
        <p class="empty-star" aria-hidden="true">☆</p>
        <p class="empty-title">아직 담아 둔 지역이 없습니다</p>
        <p class="empty-desc">날씨 목록에서 도시 이름 옆의 별을 누르면 여기에 모입니다.</p>
        <RouterLink to="/" class="empty-link">날씨 목록으로 가기</RouterLink>
      </div>

      <ul v-else class="card-list">
        <WeatherCard
          v-for="city in favoriteCities"
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

.list-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 2px 12px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.avg {
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

.api-notice {
  margin: 0 0 12px;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--hot-ink);
  background: var(--hot-bg);
  border: 1px solid var(--hot-line);
  border-radius: 12px;
}

/* ── 빈 상태 ───────────────────────────────────────────── */
.empty {
  padding: 34px 20px;
  text-align: center;
  background: var(--card);
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
}

.empty-star {
  margin: 0;
  font-size: 2.4rem;
  line-height: 1;
  color: var(--star);
}

.empty-title {
  margin: 12px 0 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink);
}

.empty-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ink-dim);
}

.empty-link {
  display: inline-block;
  margin-top: 18px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: var(--accent-ink);
  background: var(--accent-bg);
  border: 1px solid var(--accent-line);
  border-radius: 12px;
  transition: border-color 0.2s ease;
}

.empty-link:hover {
  border-color: var(--accent);
}

/* 목록 화면과 같은 카드를 쓰므로 가로 스크롤도 똑같이 맞춘다 */
.card-list {
  display: flex;
  gap: 12px;
  margin: 0;
  padding: 4px 2px 12px;
  list-style: none;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
}
</style>
