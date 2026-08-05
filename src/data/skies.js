/**
 * 시간대별 하늘 사진
 *
 * src/assets/skies/ 에 `(시간대이름).jpg` 로 넣어 두면 여기서 자동으로 읽어 간다.
 * 랜드마크 사진과 같은 방식이라, 파일만 갈아 끼우면 코드는 손댈 필요가 없다.
 */
const modules = import.meta.glob('../assets/skies/*', {
  eager: true,
  import: 'default',
})

/**
 * macOS 는 파일 이름의 한글을 NFD(자모 분리)로 저장하는데 소스에 적은 '아침' 은 NFC 라,
 * 눈으로는 같아 보여도 문자열 비교가 어긋난다. 양쪽 다 NFC 로 맞춘다.
 */
const toKey = (text) => text.normalize('NFC')

const urlByName = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const fileName = path.split('/').pop() // 아침.jpg
    return [toKey(fileName.replace(/\.[^.]+$/, '')), url] // 확장자 떼고 '아침'
  }),
)

/**
 * 시간대 구간 정의.
 *
 * from 은 포함, to 는 제외다. (6~12 는 06:00:00 ~ 11:59:59)
 * '밤' 은 20시에 시작해 다음 날 05:59 에 끝나므로 자정을 넘어간다.
 * 그래서 from > to 인 경우를 따로 처리한다.
 */
export const SKY_SLOTS = [
  { key: '아침', label: '아침', from: 6, to: 12 },
  { key: '낮', label: '낮', from: 12, to: 18 },
  { key: '해질녘', label: '해질녘', from: 18, to: 20 },
  { key: '밤', label: '밤', from: 20, to: 6 },
]

/** 시(0~23)를 받아 어느 시간대인지 돌려준다 */
export function getSkySlot(hour) {
  return (
    SKY_SLOTS.find(({ from, to }) =>
      // 자정을 넘어가는 구간(20~6)은 '20시 이상 이거나 6시 미만'으로 판단해야 한다
      from < to ? hour >= from && hour < to : hour >= from || hour < to,
    ) ?? SKY_SLOTS[0]
  )
}

/** 시간대 이름으로 사진 URL 을 꺼낸다. 파일이 없으면 null */
export function getSkyUrl(key) {
  return urlByName[toKey(key)] ?? null
}

/** 화면에서 미리 다 깔아 두고 투명도만 바꿔 전환하려고, 전체 목록을 함께 내보낸다 */
export const SKY_LAYERS = SKY_SLOTS.map((slot) => ({
  ...slot,
  url: getSkyUrl(slot.key),
})).filter((slot) => slot.url)
