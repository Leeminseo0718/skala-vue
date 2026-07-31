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

- [x] **1일차 — 1단계 날씨 Mockup** (`src/components/exercise/WeatherMockup.vue`)
- [ ] 2일차 — 2단계 컴포지션 + 3단계 컴포넌트 분리
- [ ] 3일차 — 4단계 Router · Pinia · Axios
- [ ] 4일차 — Element Plus · Modern JS · 빌드/배포

## 1일차 구현 내용

| 요구사항 | 구현 |
| --- | --- |
| 배열 렌더링 | `v-for="city in weatherList"` + `:key="city.id"` |
| 조건부 렌더링 | `v-if` / `v-else` 로 25도 기준 `🔥 더움` · `❄️ 선선함` 뱃지 분기 |
| 양방향 바인딩 | `v-model` 없이 `:value` + `@input` 으로 직접 구현 |
| 이벤트 · 수식어 | 카드 클릭 → 상태바 갱신 / `@click.stop` 으로 [상세보기] 버블링 차단 |

### 추가로 해본 것

- **한글 IME 조합 처리** — `v-model` 을 쓰지 않으면 `v-model` 이 내부적으로 해주던 IME 처리도
  같이 빠진다. `@compositionstart` / `@compositionend` 를 직접 붙여 조합 중인 글자
  (`ㅅ → 서 → 설 → 서울`)가 튀거나 뒤집히지 않도록 했고, 조합 중에는 `한글 조합 중…`
  뱃지를 띄워 동작을 눈으로 확인할 수 있게 했다.
- **`.enter` 키 수식어** — 검색창에서 Enter 를 누르면 상태바에 검색 문구를 남긴다.
- **`:class` 객체 바인딩** — 카드 왼쪽 띠 색으로 덥다/선선하다를 한눈에 구분.
- **경계값 데이터 추가** — "25도 이상"이 제대로 걸리는지 보려고 정확히 25도인 대전을 넣었고,
  2일차 검색 필터를 테스트하려고 앞 글자가 겹치는 대전/대구를 함께 넣었다.
- **기준 온도 상수화** — `HOT_TEMP` 로 뽑아 `25` 가 script/template 양쪽에 흩어지지 않게 했다.

## 개발 환경

- VS Code + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 확장 (Vetur 는 비활성화)
- Chrome [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Vite 설정: [Vite Configuration Reference](https://vite.dev/config/)

## 참고

- 강의 PDF 등 SK AX 저작물은 `.gitignore` 로 제외되어 있습니다.
- 3일차 OpenWeatherMap API Key 는 `.env` 로 분리하며, 저장소에 올라가지 않습니다.
