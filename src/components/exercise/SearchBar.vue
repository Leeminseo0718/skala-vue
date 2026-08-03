<script setup>
import { ref } from 'vue'

/**
 * SearchBar.vue — 도시 검색 입력 (3단계)
 *
 *  - props : 부모가 들고 있는 검색어를 내려받아 화면에 표시 (query)
 *  - emits : 입력이 생기면 update-query 로 검색어를 부모에게 올려보냄
 *
 * props 는 읽기 전용이라 자식이 직접 바꿀 수 없다.
 * 그래서 "부모가 내려준 값을 보여주기만 하고(props),
 * 바뀐 값은 이벤트로 알려서 부모가 고치게 한다(emits)"는
 * 단방향 데이터 흐름을 그대로 따른다.
 */
defineProps({
  query: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update-query', // 검색어가 바뀜 (과제 요구사항)
  'composing-change', // 한글 조합 상태가 바뀜 — 부모의 "결과 없음" 문구 분기에 쓰인다
  'search-submit', // Enter 로 검색을 확정함
])

/**
 * 한글 IME 조합 상태는 이 입력창만의 사정이라 컴포넌트 안에 두고,
 * 부모가 알아야 하는 결과만 이벤트로 올려 보낸다.
 *  - compositionstart : 한글 조합 시작 (자음 하나만 눌린 미완성 상태)
 *  - compositionend   : 조합 확정 (완성된 글자)
 */
const isComposing = ref(false)

const setComposing = (value) => {
  isComposing.value = value
  emit('composing-change', value)
}

const handleInput = (e) => {
  emit('update-query', e.target.value)
}

const handleCompositionStart = () => {
  setComposing(true)
}

const handleCompositionEnd = (e) => {
  setComposing(false)
  // 조합이 끝난 완성 글자로 한 번 더 확정해서 올려 보낸다
  emit('update-query', e.target.value)
}

const handleEnter = () => {
  emit('search-submit')
}
</script>

<template>
  <div class="search-bar">
    <!-- v-model 대신 :value + @input 으로 양방향 바인딩을 직접 구현 -->
    <label class="field">
      <span class="field-icon" aria-hidden="true">🔍</span>
      <input
        type="text"
        class="field-input"
        placeholder="도시 이름을 검색하세요"
        :value="query"
        @input="handleInput"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
        @keyup.enter="handleEnter"
      />
      <!-- 한글이 아직 조합 중일 때만 뱃지를 띄워, IME 가 정상 동작하는지 눈으로 확인한다. -->
      <span v-if="isComposing" class="composing">조합 중</span>
    </label>

    <p class="field-echo">
      검색 중인 도시 <strong>{{ query || '입력 없음' }}</strong>
    </p>
  </div>
</template>

<style scoped>
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
</style>
