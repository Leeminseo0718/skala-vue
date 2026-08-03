# skala-vue

SKALA Full-Stack Engineering — **Frontend framework: Vue.js** 종합과제 저장소입니다.
1일차 Mockup부터 4일차 배포까지, 같은 "날씨 대시보드"를 매일 이어서 키워 나갑니다.

## 실행 방법

```sh
npm install
npm run dev
```

기본 주소: http://localhost:5173

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 로컬 개발 서버 (HMR) |
| `npm run build` | `dist/` 에 배포용 정적 파일 생성 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint` | oxlint + ESLint 검사 및 자동 수정 |
| `npm run format` | Prettier 코드 정렬 |

## 진행 상황

- [x] **1단계 — 날씨 Mockup** (Vue 문법)
- [x] **2단계 — 컴포지션** (Composition API)
- [ ] 3단계 — 컴포넌트 분리
- [ ] 4단계 — Router · Pinia · Axios
- [ ] 마무리 — Element Plus · Modern JS · 빌드/배포

단계별로 파일을 따로 만들지 않고, **화면 하나를 계속 키워 나가는 방식**으로 작업한다.
새로 배운 내용은 기존 대시보드에 얹고, 거기서 다시 내 아이디어를 붙여 변형해 간다.

```
src/
├── App.vue                              # 대시보드를 얹는 껍데기
├── assets/main.css                      # 전역 색 팔레트 (:root 변수)
└── components/exercise/
    └── WeatherDashboard.vue             # 종합과제 본체
```

## 구현 내용

### 1단계 — Vue 문법

| 요구사항 | 구현 |
| --- | --- |
| 배열 렌더링 | `v-for="city in filteredWeatherList"` + `:key="city.id"` |
| 조건부 렌더링 | `v-if` / `v-else` 로 25도 기준 `🔥 더움` · `❄️ 선선함` 뱃지 분기 |
| 양방향 바인딩 | `v-model` 없이 `:value` + `@input` 으로 직접 구현 |
| 이벤트 · 수식어 | 카드 클릭 → 상태바 갱신 / `@click.stop` 으로 [상세보기] 버블링 차단 |

### 2단계 — Composition API

| 요구사항 | 구현 |
| --- | --- |
| 반응형 상태 3종 | `searchQuery` · `selectedCityInfo` · `weatherList` |
| computed | `filteredWeatherList` — 검색어가 도시 이름에 포함된 것만 |
| watch | `selectedCityInfo` 감시 → 이전/이후 값을 콘솔 로그 |
| watchEffect | `searchQuery` 자동 추적 → 검색어와 결과 건수를 콘솔 로그 |
| 검색 결과 표시 | 비었으면 원본 / 일치하면 결과 / 없으면 안내 문구 |

### 추가로 해본 것

- **한글 IME 조합 처리** — `v-model` 을 쓰지 않으면 `v-model` 이 내부적으로 해주던 IME 처리도
  같이 빠진다. `@compositionstart` / `@compositionend` 를 직접 붙여 조합 중인 글자
  (`ㅅ → 서 → 설 → 서울`)가 튀거나 뒤집히지 않도록 했고, 조합 중에는 `조합 중`
  뱃지를 띄워 동작을 눈으로 확인할 수 있게 했다.
  검색 결과가 없을 때도 조합 중이면 `한글을 입력하는 중입니다…` 로 문구를 바꿔,
  아직 완성되지 않은 자음(`ㄷ`)에 "일치하는 도시가 없습니다" 경고가 튀지 않게 했다.
- **`watch` vs `watchEffect` 차이를 로그로 드러냄** — `watch` 는 이전/이후 값을 같이 찍고,
  `watchEffect` 는 마운트 직후 한 번 자동 실행되는 게 콘솔에서 그대로 보인다.
- **`.enter` 키 수식어** — 검색창에서 Enter 를 누르면 상태바에 검색 문구를 남긴다.
- **검색 건수 표시** — `2 / 6개 지역` 처럼 원본 대비 건수를 같이 띄워
  computed 가 실제로 도는 걸 눈으로 확인할 수 있게 했다.
- **경계값 데이터 추가** — "25도 이상"이 제대로 걸리는지 보려고 정확히 25도인 대전을 넣었고,
  검색 필터를 테스트하려고 앞 글자가 겹치는 대전/대구를 함께 넣었다.
- **기준 온도 상수화** — `HOT_TEMP` 로 뽑아 `25` 가 script/template 양쪽에 흩어지지 않게 했다.
- **`backdrop-filter` 제거** — 패널에 유리 블러를 넣었더니 긴 페이지에서 크롬 합성 단계가 깨져
  패널 내용이 통째로 안 그려지는 현상이 있었다.
  배경이 매끈한 그라데이션이라 블러 효과도 사실상 안 보여서 반투명 흰색만 남겼다.
- **명암비 점검** — 밝은 배경으로 바꾸면서 보조 텍스트 4곳이 WCAG AA(4.5:1) 미달이었다.
  "흰 카드 위"와 "하늘색 배경 위"는 필요한 진하기가 달라서 색 변수를 나눴다.

## 개발 환경

- VS Code + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 확장 (Vetur 는 비활성화)
- Chrome [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Vite 설정: [Vite Configuration Reference](https://vite.dev/config/)
