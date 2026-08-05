/**
 * 애플리케이션 진입점
 *
 * index.html 이 이 파일을 불러오고, 여기서 Vue 인스턴스를 만들어
 * 플러그인(Pinia · Router · Element Plus)을 등록한 뒤 #app 에 붙인다.
 *
 * CSS 를 코드보다 먼저 import 하는 이유:
 * Element Plus 기본 스타일이 우리 팔레트를 덮지 않도록,
 * element-plus 스타일을 먼저 깔고 main.css 를 나중에 얹어 우선순위를 확보한다.
 */
import 'element-plus/dist/index.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia()) // 전역 상태 (즐겨찾기)
app.use(router) // 화면 라우팅
app.use(ElementPlus) // UI 컴포넌트

app.mount('#app')
