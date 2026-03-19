<template>
  <div class="editor-layout">
    <!-- Header -->
    <header class="editor-header">
      <a href="/" class="editor-logo">3D Mockup</a>
      <span v-if="store.model" class="editor-model-name">{{ store.model.meta.title }}</span>
      <div class="editor-header-actions">
        <button class="btn-header" @click="handleExport">Export</button>
      </div>
    </header>

    <!-- Main Area -->
    <div class="editor-main">
      <!-- 3D Canvas -->
      <div class="editor-canvas-area">
        <EditorCanvas ref="canvasRef" />
      </div>

      <!-- Tool Panel -->
      <ToolPanel @apply-design="handleApplyDesign" @export="handleExport" />
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-overlay">
      <p>{{ error }}</p>
      <a href="/mockups/" class="btn">Browse Mockups</a>
    </div>

    <!-- AI Try-on Modal -->
    <AiTryOnModal @capture-screenshot="handleCaptureForTryOn" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useModelData } from '@shared/composables/useModelData'
import { useEditorStore } from '@editor/stores/editorStore'
import EditorCanvas from './components/EditorCanvas.vue'
import ToolPanel from './components/ToolPanel.vue'
import AiTryOnModal from './components/AiTryOnModal.vue'
import type { ModelDesign } from '@shared/types/model'

const store = useEditorStore()
const { loadModel, currentModel, error } = useModelData()
const canvasRef = ref<InstanceType<typeof EditorCanvas> | null>(null)

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const modelId = params.get('model')
  if (!modelId) {
    window.location.href = '/mockups/'
    return
  }
  await loadModel(modelId)
  if (currentModel.value) {
    store.initFromModel(currentModel.value)
  }
})

function handleApplyDesign(payload: { design: ModelDesign; imageUrl: string }) {
  canvasRef.value?.applyDesign(payload.design, payload.imageUrl)
}

function handleExport() {
  const opts = store.exportOptions
  const dataUrl = canvasRef.value?.captureScreenshot(opts.width, opts.height)
  if (!dataUrl) return

  const link = document.createElement('a')
  link.download = `mockup-${store.model?.id || 'export'}.${opts.format}`
  link.href = dataUrl
  link.click()
}

function handleCaptureForTryOn() {
  const dataUrl = canvasRef.value?.captureScreenshot(1000, 1000)
  if (dataUrl) {
    store.aiTryOnClothingImage = dataUrl
  }
}
</script>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1918;
  color: #d5cfc8;
}
.editor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1.25rem;
  background: #242220;
  border-bottom: 1px solid #353330;
}
.editor-logo {
  font-weight: 500;
  color: #d5cfc8;
  text-decoration: none;
  letter-spacing: 0.02em;
}
.editor-model-name {
  font-size: 0.85rem;
  color: #8a8580;
}
.editor-header-actions {
  margin-left: auto;
}
.btn-header {
  padding: 0.4rem 1.1rem;
  background: rgba(255,255,255,0.08);
  color: #d5cfc8;
  border: 1px solid #4a4743;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}
.btn-header:hover { background: rgba(255,255,255,0.12); border-color: #6b6560; }
.editor-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.editor-canvas-area {
  flex: 1;
}
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(26, 25, 24, 0.95);
  color: #a09a93;
}
</style>
