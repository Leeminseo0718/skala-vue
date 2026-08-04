import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

/**
 * 즐겨찾기 스토어 (Pinia)
 *
 * 원래는 목록 화면 안에 ref 로 들고 있었는데, 즐겨찾기 화면이 따로 생기면서
 * 두 화면이 같은 목록을 봐야 해졌다. 부모-자식 관계가 아니라 props 로는 못 넘기고,
 * 화면마다 localStorage 를 각자 읽으면 한쪽에서 바꾼 게 다른 쪽에 안 비친다.
 * 그래서 컴포넌트 밖의 한 곳(스토어)에 두고 양쪽이 같은 걸 보게 했다.
 *
 * setup 문법으로 쓴 스토어라 Options 문법과 이렇게 대응된다.
 *   ref      → state    (favoriteIds)
 *   computed → getters  (favoriteCount)
 *   function → actions  (toggle)
 */

const STORAGE_KEY = 'skala-vue:favorite-cities'

/**
 * 새로고침해도 즐겨찾기가 남아 있어야 해서 localStorage 에서 읽어 시작한다.
 * 사용자가 값을 손댔거나 형식이 깨졌을 수도 있어 방어적으로 파싱한다.
 */
function loadFavoriteIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export const useFavoriteStore = defineStore('favorite', () => {
  // ── state ────────────────────────────────────────────────
  const favoriteIds = ref(loadFavoriteIds())

  // ── getters ──────────────────────────────────────────────
  const favoriteCount = computed(() => favoriteIds.value.length)

  /**
   * 특정 도시가 즐겨찾기인지. computed 로 함수를 돌려주면
   * 템플릿에서 isFavorite(city.id) 처럼 인자를 받아 쓰면서도 반응성이 유지된다.
   */
  const isFavorite = computed(() => (cityId) => favoriteIds.value.includes(cityId))

  // ── actions ──────────────────────────────────────────────
  /**
   * 이미 있으면 빼고 없으면 넣는다.
   *
   * push/splice 로 제자리 수정하지 않고 새 배열로 갈아 끼우는 이유:
   * 그래야 아래 watch 가 deep 옵션 없이도 걸리고, 콜백에서 이전/새 값이
   * 서로 다른 배열로 들어와 비교가 된다. (deep 으로 감시하면 둘이 같은 객체다.)
   *
   * @returns {boolean} 이번 호출로 즐겨찾기에 '담겼는지' 여부
   */
  function toggle(cityId) {
    const wasFavorite = favoriteIds.value.includes(cityId)
    favoriteIds.value = wasFavorite
      ? favoriteIds.value.filter((id) => id !== cityId)
      : [...favoriteIds.value, cityId]
    return !wasFavorite
  }

  /**
   * 목록이 바뀔 때마다 localStorage 에 저장한다.
   * 이건 '화면에 보여 줄 값 계산'이 아니라 '값이 바뀐 뒤에 해야 할 바깥일'이라
   * computed 가 아니라 watch 가 맞다.
   */
  watch(favoriteIds, (newIds, oldIds) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds))
    console.log(`[watch] 즐겨찾기 ${oldIds.length}개 → ${newIds.length}개 저장`, newIds)
  })

  return { favoriteIds, favoriteCount, isFavorite, toggle }
})
