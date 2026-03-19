<template>
  <div class="locale-switcher">
    <button
      v-for="lang in locales"
      :key="lang.code"
      :class="['locale-btn', { active: currentLocale === lang.code }]"
      @click="switchTo(lang.code)"
    >
      {{ lang.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { switchLocale } from '@shared/i18n'

const { locale } = useI18n()
const currentLocale = computed(() => locale.value)

const locales = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
]

function switchTo(code: string) {
  switchLocale(code)
}
</script>

<style scoped>
.locale-switcher { display: flex; gap: 0.25rem; }
.locale-btn {
  padding: 0.25rem 0.5rem; border: 1px solid #475569; background: transparent;
  color: #94a3b8; border-radius: 4px; cursor: pointer; font-size: 0.8rem;
}
.locale-btn.active { background: #334155; color: white; border-color: #3b82f6; }
</style>
