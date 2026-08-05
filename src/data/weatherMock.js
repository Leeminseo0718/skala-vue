/**
 * 도시 기본 정보 + 목(Mock) 날씨
 *
 * 목록 화면(WeatherHomeView)과 상세 화면(WeatherDetailView)이 같은 도시 데이터를 봐야 해서
 * 한 군데로 빼내고 두 화면이 같은 배열을 import 해서 쓴다.
 *
 * OpenWeatherMap 을 붙인 뒤로는 temp / status / detail 이 API 응답으로 덮어써진다.
 * 여기 적힌 값은 API 가 실패했을 때 화면이 비지 않도록 버티는 대체값(fallback)이다.
 * id / name / lat / lon 은 API 와 무관한 우리 쪽 고정 정보다.
 *
 * lat / lon 을 쓰는 이유: 도시 이름(q=서울)으로 조회하면 동명이지나 표기 차이로
 * 엉뚱한 곳이 잡힐 수 있어서, 좌표로 직접 찍는 쪽이 정확하다.
 */
export const weatherList = [
  {
    id: 'city_01',
    name: '서울',
    lat: 37.5665,
    lon: 126.978,
    temp: 28,
    status: '맑음',
    detail: {
      feelsLike: 30,
      humidity: 45,
      wind: 2.1,
      pressure: 1012,
      sunrise: '05:24',
      sunset: '19:48',
    },
  },
  {
    id: 'city_02',
    name: '수원',
    lat: 37.2636,
    lon: 127.0286,
    temp: 24,
    status: '비',
    detail: {
      feelsLike: 25,
      humidity: 82,
      wind: 3.4,
      pressure: 1008,
      sunrise: '05:26',
      sunset: '19:47',
    },
  },
  {
    id: 'city_03',
    name: '부산',
    lat: 35.1796,
    lon: 129.0756,
    temp: 26,
    status: '구름 많음',
    detail: {
      feelsLike: 28,
      humidity: 68,
      wind: 4.2,
      pressure: 1010,
      sunrise: '05:18',
      sunset: '19:39',
    },
  },
  // ↓ 여기부터는 직접 추가한 데이터
  // 대전(25도)은 "25도 이상" 경계값이 제대로 '더움'으로 걸리는지 확인하려고 넣었다.
  {
    id: 'city_04',
    name: '대전',
    lat: 36.3504,
    lon: 127.3845,
    temp: 25,
    status: '흐림',
    detail: {
      feelsLike: 26,
      humidity: 71,
      wind: 1.8,
      pressure: 1011,
      sunrise: '05:25',
      sunset: '19:44',
    },
  },
  // 대구/대전은 앞 글자가 같아서 검색 필터를 테스트하기 좋다.
  {
    id: 'city_05',
    name: '대구',
    lat: 35.8714,
    lon: 128.6014,
    temp: 31,
    status: '맑음',
    detail: {
      feelsLike: 34,
      humidity: 38,
      wind: 2.6,
      pressure: 1009,
      sunrise: '05:21',
      sunset: '19:41',
    },
  },
  {
    id: 'city_06',
    name: '강릉',
    lat: 37.7519,
    lon: 128.8761,
    temp: 22,
    status: '안개',
    detail: {
      feelsLike: 22,
      humidity: 90,
      wind: 1.2,
      pressure: 1013,
      sunrise: '05:17',
      sunset: '19:43',
    },
  },
]

/**
 * 라우터 동적 경로(/weather/:cityId)로 넘어온 id 로 도시 하나를 찾는다.
 * 없는 id 면 undefined 를 돌려주고, 그 처리는 화면 쪽에서 판단한다.
 */
export function findCityById(cityId) {
  return weatherList.find((city) => city.id === cityId)
}

// 더움/선선함을 가르는 기준 온도. 목록·상세가 같은 값을 봐야 해서 여기에 둔다.
export const HOT_TEMP = 25

// 이 온도를 넘으면 카드에 불길 효과를 준다. '더움'보다 한 단계 위라는 뜻.
export const BLAZE_TEMP = 30
