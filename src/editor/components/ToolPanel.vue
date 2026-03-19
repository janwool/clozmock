<template>
  <aside class="tool-panel">
    <!-- Tool tabs -->
    <div class="tool-tabs">
      <button
        v-for="tool in tools"
        :key="tool.id"
        :class="['tool-tab', { active: store.selectedTool === tool.id }]"
        @click="store.selectedTool = tool.id"
      >
        {{ tool.label }}
      </button>
    </div>

    <!-- Tool content -->
    <div class="tool-content">
      <DesignPanel v-if="store.selectedTool === 'design'" @apply-design="$emit('apply-design', $event)" />
      <ColorPanel v-else-if="store.selectedTool === 'color'" />
      <BackgroundPanel v-else-if="store.selectedTool === 'background'" />
      <ExportPanel v-else-if="store.selectedTool === 'export'" @export="$emit('export')" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useEditorStore } from '@editor/stores/editorStore'
import DesignPanel from './panels/DesignPanel.vue'
import ColorPanel from './panels/ColorPanel.vue'
import BackgroundPanel from './panels/BackgroundPanel.vue'
import ExportPanel from './panels/ExportPanel.vue'

const store = useEditorStore()

defineEmits(['apply-design', 'export'])

const tools = [
  { id: 'design' as const, label: 'Design' },
  { id: 'color' as const, label: 'Color' },
  { id: 'background' as const, label: 'Background' },
  { id: 'export' as const, label: 'Export' },
]
</script>

<style scoped>
.tool-panel {
  width: 300px;
  background: #242220;
  color: #b5ada4;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid #353330;
}
.tool-tabs {
  display: flex;
  border-bottom: 1px solid #353330;
}
.tool-tab {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #8a8580;
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.3s;
  letter-spacing: 0.02em;
}
.tool-tab:hover { color: #b5ada4; }
.tool-tab.active {
  color: #d5cfc8;
  border-bottom-color: #8a8580;
}
.tool-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}
</style>
