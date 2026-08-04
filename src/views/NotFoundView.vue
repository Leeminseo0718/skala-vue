<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Catch-all Route 화면 (/:pathMatch(.*)*)
 *
 * 정의되지 않은 주소로 들어왔을 때 표시된다.
 * 어떤 주소에서 걸렸는지 보여 줘야 사용자가 오타를 알아챌 수 있다.
 */
const route = useRoute()

/**
 * route.fullPath 는 퍼센트 인코딩된 상태라 한글 주소가
 * /%EC%9D%B4%EB%9F%B0... 처럼 읽을 수 없게 나온다. 디코딩해서 보여 준다.
 * 잘못된 인코딩이 섞여 있으면 decodeURIComponent 가 예외를 던지므로 원본을 그대로 쓴다.
 */
const displayPath = computed(() => {
  try {
    return decodeURIComponent(route.fullPath)
  } catch {
    return route.fullPath
  }
})
</script>

<template>
  <div class="notfound">
    <section class="panel">
      <p class="code">404</p>
      <h2>페이지를 찾을 수 없습니다</h2>
      <p class="lead">
        요청하신 <code>{{ displayPath }}</code> 주소에 해당하는 화면이 없습니다.
      </p>

      <nav class="links">
        <RouterLink to="/" class="btn primary">날씨 목록으로</RouterLink>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.notfound {
  display: flex;
  flex-direction: column;
}

.panel {
  padding: 40px 22px;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: 18px;
  box-shadow: var(--shadow-md);
}

.code {
  margin: 0;
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.panel h2 {
  margin: 12px 0 8px;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--ink);
}

.lead {
  margin: 0 0 22px;
  font-size: 13px;
  color: var(--ink-dim);
}

.lead code {
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--card);
  border: 1px solid var(--line);
  font-size: 12px;
  word-break: break-all;
}

.links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: var(--ink-dim);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.btn:hover {
  color: var(--accent-ink);
  border-color: var(--accent-line);
}

.btn.primary {
  color: var(--accent-ink);
  background: var(--accent-bg);
  border-color: var(--accent-line);
}

.btn.primary:hover {
  border-color: var(--accent);
}
</style>
