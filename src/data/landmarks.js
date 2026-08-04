/**
 * 도시 이름 → 랜드마크 사진 URL
 *
 * src/assets/landmarks/ 에 `(도시이름)_랜드마크.(확장자)` 형식으로 넣어 두면
 * 여기서 자동으로 읽어 간다. 도시가 늘어도 이 파일은 손댈 필요가 없다.
 *
 * import.meta.glob 은 Vite 기능이다. eager: true 로 두면 빌드 시점에 전부 묶이고,
 * import: 'default' 라 각 값이 해시가 붙은 최종 URL 문자열로 들어온다.
 * (public/ 에 두지 않고 assets/ 에 두는 이유 — Vite 가 해시를 붙여 캐시를 관리해 준다.)
 */
const modules = import.meta.glob('../assets/landmarks/*', {
  eager: true,
  import: 'default',
})

/**
 * macOS 는 파일 이름의 한글을 NFD(자모 분리, ㅅ+ㅓ+ㅇ...)로 저장하는데,
 * 소스 코드에 적은 '서울' 은 NFC(완성형)라서 눈으로는 같아 보여도 문자열 비교가 어긋난다.
 * 양쪽 다 NFC 로 정규화해서 맞춘다.
 */
const toKey = (text) => text.normalize('NFC')

export const landmarkByCity = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const fileName = path.split('/').pop() // 서울_랜드마크.jpeg
    const cityName = fileName.split('_')[0] // 서울
    return [toKey(cityName), url]
  }),
)

/** 사진이 없는 도시면 null 을 돌려주고, 배경을 뺄지 말지는 화면이 정한다. */
export function getLandmark(cityName) {
  return landmarkByCity[toKey(cityName)] ?? null
}
