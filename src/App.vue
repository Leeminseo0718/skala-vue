<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useFavoriteStore } from '@/stores/favoriteStore'

// 4단계부터 화면은 라우터가 갈아 끼운다.
// App.vue 는 어느 화면에서나 공통으로 보이는 머리말·내비게이션만 들고 있는다.

const route = useRoute()

// 즐겨찾기 개수를 배지로 띄우려고 스토어를 본다.
// 스토어라서 어느 화면에서 담든 내비게이션 숫자가 바로 따라 바뀐다.
const favoriteStore = useFavoriteStore()

/**
 * 내비게이션 활성 표시를 직접 계산한다.
 *
 * RouterLink 가 자동으로 붙여 주는 클래스를 그대로 쓰면 어긋난다.
 *  - router-link-active       : '/' 는 모든 경로의 접두사라 다른 경로에서도 같이 켜진다.
 *  - router-link-exact-active : 정확히 '/' 일 때만 켜져서, 상세(/weather/:cityId)에 들어가면 꺼진다.
 * 상세 페이지는 목록의 하위 화면이니 그때도 켜져 있는 게 맞다.
 */
const isHomeActive = computed(() => route.path === '/' || route.path.startsWith('/weather'))
const isFavoriteActive = computed(() => route.path === '/favorites')

/**
 * 상세 화면(/weather/:cityId)은 '몰입 모드'로 띄운다.
 *
 * 랜드마크 사진이 화면 전체를 덮고 그 지역 날씨만 보이게 하려는 것이라,
 * 여기서 공통 머리말·내비게이션·푸터를 아예 빼고 폭 제한도 풀어 준다.
 * (돌아가는 길은 상세 화면 안의 '목록으로' 버튼이 맡는다.)
 */
const isImmersive = computed(() => route.path.startsWith('/weather/'))
</script>

<template>
  <div class="app-shell" :class="{ immersive: isImmersive }">
    <!-- 몰입 모드(상세 화면)에서는 공통 껍데기를 통째로 걷어낸다 -->
    <template v-if="!isImmersive">
      <header class="app-header">
        <h1>지역별 날씨</h1>
      </header>

      <!-- RouterLink 는 <a> 로 바뀌지만 새로고침 없이 주소만 바꾼다.
           활성 표시는 위 computed 로 직접 제어한다. -->
      <nav class="nav-bar">
        <RouterLink to="/" class="nav-item" :class="{ 'is-active': isHomeActive }">
          🌦️ 날씨 목록
        </RouterLink>
        <RouterLink to="/favorites" class="nav-item" :class="{ 'is-active': isFavoriteActive }">
          <span class="star" aria-hidden="true">★</span> 즐겨찾기
          <!-- 담은 게 없으면 배지 자체를 숨긴다. 자주 켜고 꺼지므로 v-show -->
          <span v-show="favoriteStore.favoriteCount > 0" class="badge">
            {{ favoriteStore.favoriteCount }}
          </span>
        </RouterLink>
      </nav>
    </template>

    <!-- 주소에 맞는 화면이 이 자리에 갈아 끼워진다 -->
    <main>
      <RouterView />
    </main>

    <footer v-if="!isImmersive" class="app-footer">
      <p>SKALA Vue.js 종합과제</p>
      <p>© 2026 minseo</p>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  max-width: 680px;
  margin: 0 auto;
  padding: 56px 0 0;
}

/* 몰입 모드: 상세 화면이 스스로 폭과 여백을 정하도록 제한을 푼다 */
.app-shell.immersive {
  max-width: none;
  padding: 0;
}

/* 헤더는 카드 밖에 그대로 노출시켜, 배경 위에 떠 있는 느낌으로 둔다 */
.app-header {
  margin-bottom: 20px;
  padding-left: 4px;
}

.app-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}

/* ── 내비게이션 바 ─────────────────────────────────────── */
.nav-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  padding: 6px;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: var(--ink-dim);
  border-radius: 10px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

/* 별은 즐겨찾기 색으로 — 활성 여부와 상관없이 항상 같은 의미를 갖는다 */
.nav-item .star {
  color: var(--star);
  font-size: 14px;
}

.nav-item .badge {
  min-width: 18px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  border-radius: 999px;
  background: var(--star-bg);
  border: 1px solid var(--star-line);
  color: var(--star-ink);
  font-variant-numeric: tabular-nums;
}

.nav-item:hover {
  color: var(--accent-ink);
  background: rgba(255, 255, 255, 0.6);
}

/* 활성 상태는 RouterLink 자동 클래스 대신 위 computed 가 붙여 주는 .is-active 로 판단한다 */
.nav-item.is-active {
  color: var(--accent-ink);
  background: var(--accent-bg);
  box-shadow: inset 0 0 0 1px var(--accent-line);
}

.app-footer {
  margin-top: 28px;
  padding-left: 4px;
  font-size: 12px;
  color: var(--ink-on-sky);
}
</style>
