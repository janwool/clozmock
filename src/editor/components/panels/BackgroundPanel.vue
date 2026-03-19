<template>
  <div class="bg-panel">
    <h4>Background Type</h4>
    <div class="bg-types">
      <button v-for="type in bgTypes" :key="type.id" :class="['bg-type-btn', { active: store.background.type === type.id }]" @click="selectType(type.id)">
        {{ type.label }}
      </button>
    </div>

    <div v-if="store.background.type === 'solid'" class="bg-color-picker">
      <h4>Color</h4>
      <div class="preset-colors">
        <button v-for="color in presetColors" :key="color" class="color-swatch" :style="{ background: color }" @click="store.setBackground({ type: 'solid', color })" />
      </div>
      <input type="color" :value="store.background.color" @input="(e) => store.setBackground({ type: 'solid', color: (e.target as HTMLInputElement).value })" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@editor/stores/editorStore'
import type { BackgroundSetting } from '@shared/types/editor'

const store = useEditorStore()

const bgTypes = [
  { id: 'solid' as const, label: 'Solid' },
  { id: 'gradient' as const, label: 'Gradient' },
  { id: 'transparent' as const, label: 'Transparent' },
]

const presetColors = ['#ffffff', '#f0f0f0', '#1e293b', '#0f172a', '#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5']

function selectType(type: BackgroundSetting['type']) {
  store.setBackground({ type, color: store.background.color || '#f0f0f0' })
}
</script>

<style scoped>
h4 { font-weight: 500; font-size: 0.85rem; color: #d5cfc8; margin-bottom: 0.5rem; }
.bg-types { display: flex; gap: 0.4rem; margin-bottom: 1.25rem; }
.bg-type-btn {
  flex: 1; padding: 0.45rem; border: 1px solid #4a4743; background: transparent;
  color: #a09a93; cursor: pointer; border-radius: 4px; font-size: 0.8rem;
  transition: all 0.3s;
}
.bg-type-btn:hover { border-color: #6b6560; color: #b5ada4; }
.bg-type-btn.active { border-color: #8a8580; color: #d5cfc8; background: rgba(255,255,255,0.04); }
.preset-colors { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.color-swatch {
  width: 28px; height: 28px; border-radius: 4px; border: 1px solid #4a4743;
  cursor: pointer; transition: all 0.3s;
}
.color-swatch:hover { transform: scale(1.08); border-color: #6b6560; }
</style>
