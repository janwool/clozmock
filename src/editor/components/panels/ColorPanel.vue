<template>
  <div class="color-panel">
    <div v-for="mesh in store.editableMeshes" :key="mesh.id" class="color-item">
      <label>{{ mesh.name }}</label>
      <div class="color-input-row">
        <input type="color" :value="getColor(mesh.id)" @input="(e) => store.setColor(mesh.id, (e.target as HTMLInputElement).value)" />
        <input type="text" :value="getColor(mesh.id)" @change="(e) => store.setColor(mesh.id, (e.target as HTMLInputElement).value)" class="color-hex" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@editor/stores/editorStore'

const store = useEditorStore()

function getColor(meshId: string): string {
  return store.colors.find(c => c.meshId === meshId)?.color || '#ffffff'
}
</script>

<style scoped>
.color-item {
  margin-bottom: 1.25rem;
}
.color-item label {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
  text-transform: capitalize;
  color: #a09a93;
}
.color-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.color-input-row input[type="color"] {
  width: 36px;
  height: 30px;
  border: 1px solid #4a4743;
  cursor: pointer;
  border-radius: 4px;
  background: transparent;
}
.color-hex {
  flex: 1;
  padding: 0.3rem 0.5rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid #4a4743;
  color: #b5ada4;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  transition: border-color 0.3s;
}
.color-hex:focus { outline: none; border-color: #6b6560; }
</style>
