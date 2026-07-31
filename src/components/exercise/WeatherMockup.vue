<script setup>
import { ref } from 'vue'

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
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
  // ↓ 여기부터는 직접 추가한 데이터
  // 대전(25도)은 "25도 이상" 경계값이 제대로 '더움'으로 걸리는지 확인하려고 넣었다.
  { id: 'city_04', name: '대전', temp: 25, status: '흐림' },
  // 대구/대전은 앞 글자가 같아서 2일차 검색 필터 테스트에 쓸 수 있다.
  { id: 'city_05', name: '대구', temp: 31, status: '맑음' },
  { id: 'city_06', name: '강릉', temp: 22, status: '안개' },
])

// 25 라는 숫자가 script/template 양쪽에 흩어지지 않도록 상수로 뽑아 두었다.
const HOT_TEMP = 25

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 도시를 검색해 보세요.')

// 한글 조합(ㅅ → 서 → 설) 진행 중인지 여부
const isComposing = ref(false)

/**
 * 과제 조건상 v-model 대신 :value + @input 으로 양방향 바인딩을 직접 만든다.
 * 이때 v-model 이 내부적으로 해주던 한글 IME 처리가 빠지므로 조합 이벤트를 직접 듣는다.
 *  - compositionstart : 한글 조합 시작 (자음 하나만 눌린 미완성 상태)
 *  - compositionend   : 조합 확정 (완성된 글자)
 * 조합 중에도 입력값을 그대로 비춰 주되, 끝나는 시점에 완성된 값으로 한 번 더 확정한다.
 */
const handleInput = (e) => {
  searchQuery.value = e.target.value
}

const handleCompositionStart = () => {
  isComposing.value = true
}

const handleCompositionEnd = (e) => {
  isComposing.value = false
  searchQuery.value = e.target.value
}

// 카드를 클릭하면 하단 상태바 문구를 바꾼다.
const selectCity = (city) => {
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
}

// [상세보기]는 카드 안에 있어서 .stop 이 없으면 카드의 @click 까지 같이 터진다(버블링).
const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}

// 요구사항 밖 추가 실습: .enter 키 수식어로 검색 결과를 상태바에 남긴다.
const searchByEnter = () => {
  const keyword = searchQuery.value.trim()
  selectedCityInfo.value = keyword
    ? `'${keyword}' (으)로 검색했습니다.`
    : '검색어를 입력한 뒤 Enter 를 눌러 주세요.'
}
</script>

<template>
  <div class="dashboard">
    <!-- 요구사항 3) :value + @input 양방향 바인딩 + 한글 IME 처리 -->
    <section class="panel">
      <h3>🔍 도시 검색</h3>
      <input
        type="text"
        class="search-input"
        placeholder="검색할 도시 이름을 입력하세요"
        :value="searchQuery"
        @input="handleInput"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
        @keyup.enter="searchByEnter"
      />
      <p class="search-echo">
        검색 중인 도시: <strong>{{ searchQuery || '—' }}</strong>
        <!-- 한글이 아직 조합 중일 때만 뱃지를 띄워, IME 가 정상 동작하는지 눈으로 확인한다. -->
        <span v-if="isComposing" class="composing">한글 조합 중…</span>
      </p>
    </section>

    <!-- 요구사항 1) v-for 배열 렌더링 + :key 에 고유 id 바인딩 -->
    <section class="panel">
      <h3>🏙️ 지역별 날씨 현황</h3>

      <div
        v-for="city in weatherList"
        :key="city.id"
        class="weather-card"
        :class="{ 'is-hot': city.temp >= HOT_TEMP }"
        @click="selectCity(city)"
      >
        <h4>
          {{ city.name }} <small>({{ city.status }})</small>
        </h4>
        <p class="temp">현재 기온: {{ city.temp }}°C</p>

        <!-- 요구사항 2) v-if / v-else 조건부 렌더링 -->
        <span v-if="city.temp >= HOT_TEMP" class="badge hot">🔥 더움 (25도 이상)</span>
        <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

        <!-- 요구사항 4) .stop 으로 부모 카드로의 이벤트 버블링 차단 -->
        <button class="btn-detail" @click.stop="showDetail(city.name, city.status)">
          상세보기
        </button>
      </div>
    </section>

    <p class="status-bar">{{ selectedCityInfo }}</p>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
}

.panel {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 16px;
}

.panel h3 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #343a40;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  font-size: 14px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: #fff;
  color: #212529;
}

.search-input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.18);
}

.search-echo {
  margin: 10px 0 0;
  font-size: 14px;
  color: #495057;
}

/* 조합 중임을 알려주는 작은 힌트 뱃지 */
.composing {
  margin-left: 8px;
  padding: 2px 7px;
  font-size: 11px;
  border-radius: 10px;
  background: #fff3cd;
  color: #856404;
}

.weather-card {
  position: relative;
  background: #fff;
  border: 1px solid #dee2e6;
  /* 왼쪽 띠 색으로 덥다/선선하다를 한눈에 구분 (:class 객체 바인딩) */
  border-left: 4px solid #74b9ff;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.weather-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.weather-card.is-hot {
  border-left-color: #ff7675;
}

.weather-card h4 {
  margin: 0 0 6px;
  font-size: 1rem;
  color: #212529;
}

.weather-card h4 small {
  font-weight: 400;
  color: #868e96;
}

.temp {
  margin: 0 0 10px;
  font-size: 14px;
  color: #495057;
}

.badge {
  display: inline-block;
  padding: 4px 9px;
  font-size: 12px;
  border-radius: 4px;
  color: #fff;
}

.badge.hot {
  background-color: #ff7675;
}

.badge.cool {
  background-color: #74b9ff;
}

.btn-detail {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: #fff;
  color: #495057;
  cursor: pointer;
}

.btn-detail:hover {
  background: #f1f3f5;
}

.status-bar {
  margin: 0;
  padding: 12px;
  text-align: center;
  font-weight: 700;
  color: #2e7d32;
  background: #e8f5e9;
  border-radius: 8px;
}
</style>
