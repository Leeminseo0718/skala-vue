import axios from 'axios'
import { getWeatherLabel } from '@/data/weatherCondition'

/**
 * OpenWeatherMap 통신 모듈
 *
 * 화면(컴포넌트)은 axios 를 직접 부르지 않고 이 파일의 함수만 쓴다.
 * 그래야 엔드포인트나 응답 모양이 바뀌어도 고칠 곳이 여기 한 군데로 끝난다.
 *
 * 응답을 그대로 화면에 넘기지 않고 우리 앱이 쓰는 모양
 * ({ temp, status, detail })으로 바꿔서 돌려주는 것도 같은 이유다.
 */

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

// 공통 설정을 담은 axios 인스턴스. 타임아웃을 걸어 두지 않으면
// 네트워크가 죽었을 때 '불러오는 중'에서 영영 안 빠져나온다.
const client = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 8000,
})

// 키를 안 넣었을 때 화면에서 안내하려고 밖에서 확인할 수 있게 열어 둔다
export const hasApiKey = Boolean(API_KEY)

/** UNIX 초 단위 시각 → 'HH:MM' (해당 도시의 시간대 기준) */
function toLocalTime(unixSeconds, timezoneOffsetSeconds) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000)
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/** OpenWeatherMap 응답을 앱이 쓰는 모양으로 변환 */
function toWeather(data) {
  return {
    // 소수점까지 보여 줄 이유가 없어서 반올림한다
    temp: Math.round(data.main.temp),
    // API 가 주는 한글 번역('실 비', '온흐림')이 어색해서, 코드를 우리 표현으로 옮긴다
    status: getWeatherLabel(data.weather?.[0]?.id),
    detail: {
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      wind: data.wind?.speed ?? 0,
      pressure: data.main.pressure,
      sunrise: toLocalTime(data.sys.sunrise, data.timezone),
      sunset: toLocalTime(data.sys.sunset, data.timezone),
    },
  }
}

/**
 * 좌표 하나로 현재 날씨를 가져온다.
 * 실패하면 예외를 그대로 던지고, 어떻게 보여 줄지는 호출한 쪽이 정한다.
 */
export async function fetchWeatherByCoords({ lat, lon }) {
  const { data } = await client.get('/weather', {
    params: { lat, lon, appid: API_KEY, units: 'metric' },
  })
  return toWeather(data)
}

/**
 * 5일 / 3시간 간격 예보.
 *
 * 무료 플랜에서는 '1시간 단위'가 없고 3시간 간격만 제공된다.
 * (1시간 단위와 기상특보는 One Call 3.0 유료 구독이 필요하다.)
 *
 * 여기서는 시점 목록만 다듬어 돌려주고, 최고/최저 같은 요약은
 * 화면이 실제로 보여 주는 구간에 맞춰 화면 쪽에서 계산한다.
 *
 * @returns {{ hourly: Array }}
 */
export async function fetchForecastByCoords({ lat, lon }) {
  const { data } = await client.get('/forecast', {
    params: { lat, lon, appid: API_KEY, units: 'metric' },
  })

  const offset = data.city?.timezone ?? 0

  const hourly = data.list.map((item) => {
    // UTC 초 + 도시의 시간대 오프셋 → 그 도시의 현지 시각.
    // 오프셋을 더한 뒤 getUTC* 로 읽어야 브라우저가 있는 지역의 시간대가 섞이지 않는다.
    const local = new Date((item.dt + offset) * 1000)
    const hour = local.getUTCHours()
    return {
      dt: item.dt,
      hour,
      // 자정은 '오전 12시', 정오는 '오후 12시' 로 읽는 한국식 표기
      label: `${hour < 12 ? '오전' : '오후'} ${hour % 12 === 0 ? 12 : hour % 12}시`,
      temp: Math.round(item.main.temp),
      icon: item.weather?.[0]?.icon ?? '01d',
      description: getWeatherLabel(item.weather?.[0]?.id),
      // pop 은 0~1 확률이라 백분율로 바꿔 둔다
      pop: Math.round((item.pop ?? 0) * 100),
    }
  })

  return { hourly }
}

/**
 * 도시 목록을 받아 전부 조회한 뒤, 원래 도시 정보에 날씨를 덮어써서 돌려준다.
 *
 * Promise.all 이 아니라 allSettled 를 쓰는 이유:
 * all 은 하나만 실패해도 전부 버려진다. 여기서는 다섯 도시가 성공했으면
 * 그 다섯은 최신값으로 보여 주고, 실패한 하나만 기존 값으로 두는 편이 낫다.
 *
 * @returns {{ cities: Array, failedNames: string[] }}
 */
export async function fetchWeatherForCities(cities) {
  const results = await Promise.allSettled(
    cities.map((city) => fetchWeatherByCoords({ lat: city.lat, lon: city.lon })),
  )

  const failedNames = []
  const merged = cities.map((city, index) => {
    const result = results[index]
    if (result.status === 'fulfilled') {
      return { ...city, ...result.value }
    }
    // 실패한 도시는 기존(목) 값을 그대로 두고 이름만 모아 둔다
    failedNames.push(city.name)
    return city
  })

  return { cities: merged, failedNames }
}
