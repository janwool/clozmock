<template>
  <div class="editor-canvas" ref="containerRef">
    <canvas ref="canvasRef"></canvas>

    <!-- Loading progress -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-bar">
        <div class="loading-fill" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <p>Loading model... {{ loadingProgress }}%</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useThreeScene } from '@editor/composables/useThreeScene'
import { useDesignTexture } from '@editor/composables/useDesignTexture'
import { useEditorStore } from '@editor/stores/editorStore'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const store = useEditorStore()
const { init, loadGLBModel, setMeshColor, setBackground, captureScreenshot, isLoading, loadingProgress, loadedModel } = useThreeScene(canvasRef)
const { applyDesign, removeDesign } = useDesignTexture(() => loadedModel.value)

// Watch model change
watch(() => store.model, async (model) => {
  if (!model) return
  init(model)
  await loadGLBModel(model.object.url)
  store.modelLoaded = true
})

// Watch color changes
watch(() => store.colors, (colors) => {
  colors.forEach(c => setMeshColor(c.meshId, c.color))
}, { deep: true })

// Watch background changes
watch(() => store.background, (bg) => {
  if (bg.type === 'transparent') {
    setBackground(null)
  } else if (bg.type === 'solid' && bg.color) {
    setBackground(bg.color)
  }
}, { deep: true })

defineExpose({ captureScreenshot, applyDesign, removeDesign })
</script>

<style scoped>
.editor-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.editor-canvas canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(26, 25, 24, 0.85);
  color: #a09a93;
  font-size: 0.85rem;
}
.loading-bar {
  width: 180px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.loading-fill {
  height: 100%;
  background: #8a8580;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
