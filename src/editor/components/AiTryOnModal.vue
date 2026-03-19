<template>
  <Teleport to="body">
    <div v-if="store.showAiTryOn" class="tryon-overlay" @click.self="store.showAiTryOn = false">
      <div class="tryon-modal">
        <!-- Close button -->
        <button class="tryon-close" @click="store.showAiTryOn = false">&times;</button>

        <div class="tryon-body">
          <!-- Left side: inputs -->
          <div class="tryon-left">
            <!-- Clothing preview + upload -->
            <div class="tryon-clothing-section">
              <h3>Clothing</h3>
              <div class="tryon-clothing-preview">
                <img v-if="store.aiTryOnClothingImage" :src="store.aiTryOnClothingImage" alt="Clothing" />
                <div v-else class="tryon-clothing-empty">
                  <p>3D screenshot will appear here</p>
                </div>
              </div>
              <div class="tryon-clothing-actions">
                <button class="tryon-btn-secondary" @click="captureClothing">Capture 3D View</button>
                <button class="tryon-btn-secondary" @click="triggerClothingUpload">Upload Image</button>
                <input ref="clothingFileInput" type="file" accept="image/*" hidden @change="handleClothingUpload" />
              </div>
            </div>

            <!-- Model selection -->
            <div class="tryon-model-section">
              <h3>Select Model</h3>
              <div class="tryon-model-grid">
                <button
                  v-for="m in modelOptions"
                  :key="m.id"
                  :class="['tryon-model-card', { selected: store.aiTryOnSelectedModel === m.id }]"
                  @click="store.aiTryOnSelectedModel = m.id"
                >
                  <div class="tryon-model-avatar" :style="{ background: m.color }">
                    <span>{{ m.label[0] }}</span>
                  </div>
                  <span class="tryon-model-label">{{ m.label }}</span>
                </button>
              </div>
            </div>

            <!-- Generate button -->
            <div class="tryon-generate-section">
              <button
                class="tryon-btn-generate"
                :disabled="!canGenerate || store.aiTryOnGenerating"
                @click="handleGenerate"
              >
                {{ store.aiTryOnGenerating ? 'Generating...' : 'Generate' }}
              </button>
            </div>
          </div>

          <!-- Right side: result -->
          <div class="tryon-right">
            <h3>Result</h3>
            <div class="tryon-result-area">
              <div v-if="store.aiTryOnGenerating" class="tryon-result-loading">
                <div class="tryon-spinner"></div>
                <p>AI is dressing the model...</p>
              </div>
              <img v-else-if="store.aiTryOnResult" :src="store.aiTryOnResult" alt="AI Try-on Result" class="tryon-result-image" />
              <div v-else class="tryon-result-empty">
                <p>Select a model and click Generate to see the AI try-on result</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@editor/stores/editorStore'

const store = useEditorStore()
const clothingFileInput = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{
  'capture-screenshot': []
}>()

const modelOptions = [
  { id: 'female-1', label: 'Female A', color: '#b5ada4' },
  { id: 'female-2', label: 'Female B', color: '#a09a93' },
  { id: 'male-1', label: 'Male A', color: '#8a8580' },
  { id: 'male-2', label: 'Male B', color: '#6b6560' },
  { id: 'child-1', label: 'Child', color: '#958c82' },
  { id: 'plus-1', label: 'Plus Size', color: '#7c7571' },
]

const canGenerate = computed(() => {
  return store.aiTryOnClothingImage && store.aiTryOnSelectedModel
})

function captureClothing() {
  emit('capture-screenshot')
}

function triggerClothingUpload() {
  clothingFileInput.value?.click()
}

function handleClothingUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    store.aiTryOnClothingImage = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

async function handleGenerate() {
  if (!canGenerate.value) return
  store.aiTryOnGenerating = true
  store.aiTryOnResult = null

  // Simulate AI generation (replace with actual API call)
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Placeholder: in production, this would call an AI API
  // with store.aiTryOnClothingImage and store.aiTryOnSelectedModel
  store.aiTryOnResult = store.aiTryOnClothingImage
  store.aiTryOnGenerating = false
}
</script>

<style scoped>
.tryon-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(26, 25, 24, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: tryon-fade-in 0.3s ease;
}
@keyframes tryon-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tryon-modal {
  position: relative;
  width: 92vw;
  height: 90vh;
  max-width: 1200px;
  background: #242220;
  border-radius: 12px;
  border: 1px solid #353330;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: tryon-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes tryon-slide-in {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.tryon-close {
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  background: none;
  border: none;
  color: #8a8580;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s;
}
.tryon-close:hover { color: #d5cfc8; background: rgba(255,255,255,0.06); }

.tryon-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Left side */
.tryon-left {
  width: 400px;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #353330;
  overflow-y: auto;
}

.tryon-clothing-section {
  padding: 1.5rem;
  border-bottom: 1px solid #353330;
}
.tryon-clothing-section h3,
.tryon-model-section h3,
.tryon-right h3 {
  font-weight: 500;
  font-size: 0.85rem;
  color: #d5cfc8;
  margin-bottom: 1rem;
  letter-spacing: 0.01em;
}

.tryon-clothing-preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1918;
  border: 1px solid #353330;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tryon-clothing-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.tryon-clothing-empty {
  color: #6b6560;
  font-size: 0.8rem;
  text-align: center;
  padding: 1rem;
}

.tryon-clothing-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.tryon-btn-secondary {
  flex: 1;
  padding: 0.5rem;
  background: rgba(255,255,255,0.04);
  color: #b5ada4;
  border: 1px solid #4a4743;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.3s;
}
.tryon-btn-secondary:hover {
  background: rgba(255,255,255,0.08);
  border-color: #6b6560;
  color: #d5cfc8;
}

/* Model selection */
.tryon-model-section {
  padding: 1.5rem;
  flex: 1;
}

.tryon-model-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.tryon-model-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 0.5rem;
  background: rgba(255,255,255,0.02);
  border: 1px solid #353330;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.tryon-model-card:hover {
  background: rgba(255,255,255,0.05);
  border-color: #4a4743;
}
.tryon-model-card.selected {
  border-color: #8a8580;
  background: rgba(255,255,255,0.06);
}

.tryon-model-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #242220;
  font-weight: 600;
  font-size: 1rem;
}

.tryon-model-label {
  font-size: 0.72rem;
  color: #8a8580;
}
.tryon-model-card.selected .tryon-model-label {
  color: #d5cfc8;
}

/* Generate */
.tryon-generate-section {
  padding: 1.5rem;
  border-top: 1px solid #353330;
}

.tryon-btn-generate {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255,255,255,0.1);
  color: #d5cfc8;
  border: 1px solid #6b6560;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
  letter-spacing: 0.01em;
}
.tryon-btn-generate:hover:not(:disabled) {
  background: rgba(255,255,255,0.16);
  border-color: #8a8580;
}
.tryon-btn-generate:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Right side */
.tryon-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  overflow: hidden;
}

.tryon-result-area {
  flex: 1;
  border-radius: 8px;
  background: #1a1918;
  border: 1px solid #353330;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tryon-result-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tryon-result-empty {
  color: #6b6560;
  font-size: 0.85rem;
  text-align: center;
  padding: 2rem;
  line-height: 1.6;
}

.tryon-result-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #8a8580;
  font-size: 0.85rem;
}

.tryon-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #353330;
  border-top-color: #8a8580;
  border-radius: 50%;
  animation: tryon-spin 0.8s linear infinite;
}
@keyframes tryon-spin {
  to { transform: rotate(360deg); }
}
</style>
