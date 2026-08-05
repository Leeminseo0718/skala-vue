import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  /**
   * base 경로
   *
   * Vercel 은 https://<프로젝트>.vercel.app/ 처럼 도메인 루트로 서비스하므로 '/' 가 맞다.
   * (GitHub Pages 처럼 하위 경로 /저장소이름/ 으로 올릴 때는 여기를 '/skala-vue/' 로 바꿔야
   *  빌드된 JS·CSS 를 제대로 찾는다. 안 맞추면 화면이 하얗게 뜬다.)
   *
   * 라우터도 createWebHistory(import.meta.env.BASE_URL) 로 이 값을 함께 쓴다.
   */
  base: '/',

  plugins: [vue(), vueDevTools()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
