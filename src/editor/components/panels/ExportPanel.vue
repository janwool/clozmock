<template>
  <div class="export-panel">
    <h4>Export Settings</h4>

    <div class="export-field">
      <label>Format</label>
      <select v-model="store.exportOptions.format">
        <option value="png">PNG</option>
        <option value="jpg">JPG</option>
        <option value="webp">WebP</option>
      </select>
    </div>

    <div class="export-field">
      <label>Size</label>
      <div class="size-presets">
        <button v-for="size in sizePresets" :key="size.label" :class="{ active: store.exportOptions.width === size.w }" @click="setSize(size.w, size.h)">
          {{ size.label }}
        </button>
      </div>
    </div>

    <div class="export-field">
      <label>
        <input type="checkbox" v-model="store.exportOptions.transparent" />
        Transparent background
      </label>
    </div>

    <button class="btn-export" @click="$emit('export')">
      Download Mockup
    </button>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@editor/stores/editorStore'

const store = useEditorStore()
defineEmits(['export'])

const sizePresets = [
  { label: '1x (1000px)', w: 1000, h: 1000 },
  { label: '2x (2000px)', w: 2000, h: 2000 },
  { label: '4x (4000px)', w: 4000, h: 4000 },
]

function setSize(w: number, h: number) {
  store.exportOptions.width = w
  store.exportOptions.height = h
}
</script>

<style scoped>
h4 { font-weight: 500; font-size: 0.85rem; color: #d5cfc8; margin-bottom: 0.75rem; }
.export-field { margin-bottom: 1.25rem; }
.export-field label { display: block; font-size: 0.8rem; margin-bottom: 0.3rem; color: #a09a93; }
.export-field select {
  width: 100%; padding: 0.45rem 0.6rem; background: rgba(255,255,255,0.04);
  border: 1px solid #4a4743; color: #b5ada4; border-radius: 4px;
  font-size: 0.85rem; transition: border-color 0.3s;
}
.export-field select:focus { outline: none; border-color: #6b6560; }
.size-presets { display: flex; gap: 0.4rem; }
.size-presets button {
  flex: 1; padding: 0.45rem; border: 1px solid #4a4743; background: transparent;
  color: #a09a93; cursor: pointer; border-radius: 4px; font-size: 0.72rem;
  transition: all 0.3s;
}
.size-presets button:hover { border-color: #6b6560; color: #b5ada4; }
.size-presets button.active { border-color: #8a8580; color: #d5cfc8; background: rgba(255,255,255,0.04); }
.btn-export {
  width: 100%; padding: 0.7rem; background: rgba(255,255,255,0.08); color: #d5cfc8;
  border: 1px solid #4a4743; border-radius: 6px; cursor: pointer;
  font-weight: 500; font-size: 0.9rem; transition: all 0.3s;
}
.btn-export:hover { background: rgba(255,255,255,0.12); border-color: #6b6560; }
</style>
