import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  /**
   * base 경로
   *
   * GitHub Pages 는 https://<사용자>.github.io/<저장소>/ 처럼 하위 경로로 서비스된다.
   * base 를 '/' 로 두면 빌드된 JS·CSS 를 /assets/... 에서 찾다가 404 가 나고
   * 화면이 하얗게 뜬다. 그래서 배포 빌드에서만 저장소 이름을 붙인다.
   *
   * 개발 서버(npm run dev)는 localhost 루트에서 돌아가므로 '/' 그대로 둔다.
   * 라우터도 createWebHistory(import.meta.env.BASE_URL) 로 이 값을 함께 쓴다.
   */
  base: command === 'build' ? '/skala-vue/' : '/',

  plugins: [vue(), vueDevTools()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
