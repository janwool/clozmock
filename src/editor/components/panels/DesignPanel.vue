<template>
  <div class="design-panel">
    <div v-for="design in store.model?.designs" :key="design.id" class="design-slot">
      <h4>{{ design.name }}</h4>
      <p class="design-size">{{ design.width }} x {{ design.height }}px</p>

      <!-- Guide preview -->
      <div v-if="design.guide" class="guide-preview">
        <img :src="design.guide" alt="Design guide" />
      </div>

      <!-- Upload area -->
      <div class="upload-area" @click="triggerUpload(design.id)" @drop.prevent="handleDrop($event, design)" @dragover.prevent>
        <input type="file" :ref="el => setFileRef(design.id, el)" accept="image/*" @change="handleUpload($event, design)" hidden />
        <p>Click or drag to upload design</p>
      </div>
    </div>

    <!-- Feature buttons -->
    <div class="feature-actions">
      <button class="feature-btn" @click="downloadMD">Download MD</button>
      <button class="feature-btn" @click="downloadDesign">Download Design</button>
      <button class="feature-btn feature-btn-ai" @click="store.showAiTryOn = true">AI Try-on</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@editor/stores/editorStore'
import type { ModelDesign } from '@shared/types/model'

const store = useEditorStore()
const fileInputs = ref<Map<string, HTMLInputElement>>(new Map())

const emit = defineEmits<{
  'apply-design': [{ design: ModelDesign; imageUrl: string }]
}>()

function setFileRef(id: string, el: any) {
  if (el) fileInputs.value.set(id, el)
}

function triggerUpload(designId: string) {
  fileInputs.value.get(designId)?.click()
}

function handleUpload(event: Event, design: ModelDesign) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  processFile(file, design)
}

function handleDrop(event: DragEvent, design: ModelDesign) {
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  processFile(file, design)
}

function processFile(file: File, design: ModelDesign) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string
    emit('apply-design', { design, imageUrl })
  }
  reader.readAsDataURL(file)
}

function downloadMD() {
  const model = store.model
  if (!model) return

  const lines = [
    `# ${model.meta.title}`,
    '',
    `**Category:** ${model.meta.category}`,
    `**Tags:** ${model.meta.tags.join(', ')}`,
    '',
    '## Designs',
    '',
  ]

  model.designs.forEach(d => {
    lines.push(`### ${d.name}`)
    lines.push(`- Size: ${d.width} x ${d.height}px`)
    lines.push(`- Mesh: ${d.meshId}`)
    lines.push('')
  })

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const link = document.createElement('a')
  link.download = `${model.id || 'mockup'}.md`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

function downloadDesign() {
  const model = store.model
  if (!model) return

  const designData = {
    id: model.id,
    title: model.meta.title,
    designs: model.designs.map(d => ({
      id: d.id,
      name: d.name,
      meshId: d.meshId,
      width: d.width,
      height: d.height,
      guide: d.guide,
    })),
    colors: store.colors,
    background: store.background,
  }

  const blob = new Blob([JSON.stringify(designData, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = `${model.id || 'design'}-design.json`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<style scoped>
.design-slot {
  margin-bottom: 1.75rem;
}
.design-slot h4 { font-weight: 500; font-size: 0.85rem; color: #d5cfc8; }
.design-size {
  font-size: 0.75rem;
  color: #8a8580;
  margin-top: 0.15rem;
}
.guide-preview img {
  width: 100%;
  border-radius: 6px;
  margin: 0.75rem 0;
  opacity: 0.6;
}
.upload-area {
  border: 1px dashed #4a4743;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  color: #8a8580;
  font-size: 0.85rem;
}
.upload-area:hover {
  border-color: #6b6560;
  background: rgba(255,255,255,0.02);
}

/* Feature action buttons */
.feature-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #353330;
}
.feature-btn {
  width: 100%;
  padding: 0.6rem;
  background: rgba(255,255,255,0.04);
  color: #b5ada4;
  border: 1px solid #4a4743;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.3s;
  letter-spacing: 0.01em;
}
.feature-btn:hover {
  background: rgba(255,255,255,0.08);
  border-color: #6b6560;
  color: #d5cfc8;
}
.feature-btn-ai {
  background: rgba(255,255,255,0.08);
  color: #d5cfc8;
  border-color: #6b6560;
}
.feature-btn-ai:hover {
  background: rgba(255,255,255,0.14);
  border-color: #8a8580;
}
</style>
