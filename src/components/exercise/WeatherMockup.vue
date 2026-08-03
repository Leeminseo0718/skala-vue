<script setup>
import { ref } from "vue";

/**
 * [1일차 과제] 날씨 Mockup
 *
 * 요구사항
 *  1) v-for 배열 렌더링 (:key 에 id 바인딩)
 *  2) v-if / v-else 조건부 렌더링 (25도 기준)
 *  3) :value + @input 양방향 바인딩 (한글 입력 처리)
 *  4) 이벤트 및 수식어 (.stop 으로 버블링 차단)
 */

// 3일차에 OpenWeatherMap 응답으로 갈아 끼울 예정이라, 그때와 같은 모양으로 목 데이터를 잡았다.
const weatherList = ref([
  { id: "city_01", name: "서울", temp: 28, status: "맑음" },
  { id: "city_02", name: "수원", temp: 24, status: "비" },
  { id: "city_03", name: "부산", temp: 26, status: "구름" },
  // ↓ 여기부터는 직접 추가한 데이터
  // 대전(25도)은 "25도 이상" 경계값이 제대로 '더움'으로 걸리는지 확인하려고 넣었다.
  { id: "city_04", name: "대전", temp: 25, status: "흐림" },
  // 대구/대전은 앞 글자가 같아서 2일차 검색 필터 테스트에 쓸 수 있다.
  { id: "city_05", name: "대구", temp: 31, status: "맑음" },
  { id: "city_06", name: "강릉", temp: 22, status: "안개" },
]);

// 25 라는 숫자가 script/template 양쪽에 흩어지지 않도록 상수로 뽑아 두었다.
const HOT_TEMP = 25;

const searchQuery = ref("");
const selectedCityInfo = ref("카드를 클릭하거나 도시를 검색해 보세요.");

// 한글 조합(ㅅ → 서 → 설) 진행 중인지 여부
const isComposing = ref(false);

/**
 * 과제 조건상 v-model 대신 :value + @input 으로 양방향 바인딩을 직접 만든다.
 * 이때 v-model 이 내부적으로 해주던 한글 IME 처리가 빠지므로 조합 이벤트를 직접 듣는다.
 *  - compositionstart : 한글 조합 시작 (자음 하나만 눌린 미완성 상태)
 *  - compositionend   : 조합 확정 (완성된 글자)
 * 조합 중에도 입력값을 그대로 비춰 주되, 끝나는 시점에 완성된 값으로 한 번 더 확정한다.
 */
const handleInput = (e) => {
  searchQuery.value = e.target.value;
};

const handleCompositionStart = () => {
  isComposing.value = true;
};

const handleCompositionEnd = (e) => {
  isComposing.value = false;
  searchQuery.value = e.target.value;
};

// 카드를 클릭하면 하단 상태바 문구를 바꾼다.
const selectCity = (city) => {
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`;
};

// [상세보기]는 카드 안에 있어서 .stop 이 없으면 카드의 @click 까지 같이 터진다(버블링).
const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`);
};

// 요구사항 밖 추가 실습: .enter 키 수식어로 검색 결과를 상태바에 남긴다.
const searchByEnter = () => {
  const keyword = searchQuery.value.trim();
  selectedCityInfo.value = keyword
    ? `'${keyword}' (으)로 검색했습니다.`
    : "검색어를 입력한 뒤 Enter 를 눌러 주세요.";
};
</script>

<template>
  <div class="dashboard">
    <!-- 요구사항 3) :value + @input 양방향 바인딩 + 한글 IME 처리 -->
    <section class="panel search-panel">
      <label class="field">
        <span class="field-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          class="field-input"
          placeholder="도시 이름을 검색하세요"
          :value="searchQuery"
          @input="handleInput"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
          @keyup.enter="searchByEnter"
        />
        <!-- 한글이 아직 조합 중일 때만 뱃지를 띄워, IME 가 정상 동작하는지 눈으로 확인한다. -->
        <span v-if="isComposing" class="composing">조합 중</span>
      </label>
      <p class="field-echo">
        검색 중인 도시 <strong>{{ searchQuery || "입력 없음" }}</strong>
      </p>
    </section>

    <!-- 요구사항 1) v-for 배열 렌더링 + :key 에 고유 id 바인딩 -->
    <section class="panel list-panel">
      <div class="panel-head">
        <h3>지역별 날씨 현황</h3>
        <span class="count">{{ weatherList.length }}개 지역</span>
      </div>

      <ul class="card-list">
        <li
          v-for="city in weatherList"
          :key="city.id"
          class="weather-card"
          :class="city.temp >= HOT_TEMP ? 'is-hot' : 'is-cool'"
          @click="selectCity(city)"
        >
          <!-- 윗줄: 도시명·날씨 상태 (왼쪽) / 기온을 크게 (오른쪽) -->
          <div class="card-top">
            <div class="card-title">
              <h4>{{ city.name }}</h4>
              <p>{{ city.status }}</p>
            </div>
            <p class="card-temp">{{ city.temp }}<span class="unit">°C</span></p>
          </div>

          <!-- 아랫줄: 조건부 뱃지 (왼쪽) / 상세보기 (오른쪽) -->
          <div class="card-bottom">
            <!-- 요구사항 2) v-if / v-else 조건부 렌더링 -->
            <span v-if="city.temp >= HOT_TEMP" class="badge hot"
              >🔥 더움 (25도 이상)</span
            >
            <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

            <!-- 요구사항 4) .stop 으로 부모 카드로의 이벤트 버블링 차단 -->
            <button
              class="btn-detail"
              @click.stop="showDetail(city.name, city.status)"
            >
              상세보기 <span aria-hidden="true">→</span>
            </button>
          </div>
        </li>
      </ul>
    </section>

    <p class="status-bar">
      <span class="status-dot" aria-hidden="true"></span>
      {{ selectedCityInfo }}
    </p>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 하늘빛 배경이 살짝 비치는 반투명 흰 판 — 교수님 예제의 회색 박스와 다르게 */
.panel {
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: 18px;
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-md);
}

/* ── 검색 영역 ───────────────────────────────────────── */
.field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-bg);
}

.field-icon {
  font-size: 14px;
  opacity: 0.75;
}

.field-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--ink);
  font-size: 15px;
  font-family: inherit;
}

.field-input::placeholder {
  color: var(--ink-placeholder);
}

.field-input:focus {
  outline: none;
}

/* 조합 중임을 알려주는 작은 힌트 */
.composing {
  flex-shrink: 0;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-line);
  color: var(--accent-ink);
}

.field-echo {
  margin: 12px 2px 0;
  font-size: 13px;
  color: var(--ink-dim);
}

.field-echo strong {
  margin-left: 8px;
  font-weight: 600;
  color: var(--ink);
}

/* ── 목록 영역 ───────────────────────────────────────── */
.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink-dim);
}

.count {
  font-size: 12px;
  color: var(--ink-dim);
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.weather-card {
  padding: 16px 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.weather-card:hover {
  border-color: var(--line-strong);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* 윗줄 — 도시 정보와 기온을 좌우로 갈라 놓는다 */
.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-title h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--ink);
}

.card-title p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--ink-dim);
}

/* 기온을 카드에서 가장 크게 — 한눈에 읽히는 게 대시보드의 핵심 */
.card-temp {
  margin: 0;
  font-size: 2rem;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.card-temp .unit {
  margin-left: 2px;
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--ink-dim);
}

/* 기온 숫자 색으로도 덥다/선선하다를 구분한다 */
.is-hot .card-temp {
  color: var(--hot);
}

.is-cool .card-temp {
  color: var(--cool);
}

/* 아랫줄 — 뱃지와 상세보기를 좌우 끝에 배치 */
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

/* 채우기 대신 은은한 배경 + 테두리로 — 교수님 예제의 단색 뱃지와 다르게 */
.badge {
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  white-space: nowrap;
}

.badge.hot {
  background: var(--hot-bg);
  border: 1px solid var(--hot-line);
  color: var(--hot-ink);
}

.badge.cool {
  background: var(--cool-bg);
  border: 1px solid var(--cool-line);
  color: var(--cool-ink);
}

/* 절대배치 버튼 대신, 아랫줄에 흐르는 텍스트 버튼으로 */
.btn-detail {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.btn-detail:hover {
  color: var(--accent-ink);
  background: var(--accent-bg);
  border-color: var(--accent-line);
}

/* ── 상태바 ─────────────────────────────────────────── */
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
