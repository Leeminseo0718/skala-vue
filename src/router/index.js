import { createRouter, createWebHistory } from 'vue-router'
import WeatherHomeView from '@/views/WeatherHomeView.vue'

/**
 * 라우트 규칙
 *
 * - 첫 화면(/)은 접속하자마자 무조건 필요하므로 정적 import 로 미리 묶는다.
 * - 나머지는 지연 로딩(Lazy Loading): () => import(...) 로 적어 두면 Vite 가 별도
 *   청크로 쪼개고, 해당 주소로 이동하는 순간에만 내려받는다. 첫 로딩이 가벼워진다.
 * - 마지막 Catch-all Route 는 위에서 아무 규칙도 안 걸렸을 때만 걸리므로
 *   반드시 배열 맨 끝에 둬야 한다.
 */
const routes = [
  {
    path: '/',
    name: 'WeatherHome',
    component: WeatherHomeView,
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/FavoriteView.vue'),
  },
  {
    // 동적 경로 매칭 — :cityId 자리에 들어온 값이 route.params.cityId 로 넘어온다
    path: '/weather/:cityId',
    name: 'WeatherDetail',
    component: () => import('@/views/WeatherDetailView.vue'),
  },
  {
    // Catch-all Route — 정의되지 않은 모든 주소를 여기서 받는다
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  // BASE_URL 을 넘겨야 GitHub Pages 처럼 하위 경로(/skala-vue/)에 배포해도 라우팅이 맞는다
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
