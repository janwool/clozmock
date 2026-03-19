# Coding Plan: REQ-003 3D 编辑器

## 概述
构建基于 Vue 3 + Three.js 的 3D Mockup 编辑器应用。用户可加载 GLB 模型、上传设计图贴图、自定义颜色和背景、预览动画效果、导出成品图片。前端实时预览 + 后端高质量渲染导出。

## 前置条件
- PLAN-REQ-001 完成（Vue + Vite 环境就绪）
- PLAN-REQ-002 完成（模型详情页可跳转到编辑器）
- Three.js 依赖已安装
- Firebase Storage 可用（用于上传设计图）

## 实现步骤

### Step 1: TypeScript 类型定义

**目标**: 定义模型数据、编辑器状态的 TypeScript 类型

**涉及文件**:
- `src/shared/types/model.ts` - 新建
- `src/shared/types/editor.ts` - 新建

**代码变更**:

`src/shared/types/model.ts`：
```typescript
export interface ModelMesh {
  id: string
  type: 'color'
}

export interface ModelElement {
  id: string
  name: string
  mesh: ModelMesh[]
}

export interface ModelDesign {
  id: string
  name: string
  meshId: string
  guide: string
  width: number
  height: number
}

export interface ModelCamera {
  position: { x: number; y: number; z: number }
  perspective: { fov: number; aspect: number; near: number; far: number }
}

export interface ModelScene {
  dimensions: { width: number; height: number }
  position: { x: number; y: number }
  rotation: { y: number }
}

export interface ModelControls {
  distance: { max: number; min: number }
}

export interface ModelMeta {
  title: string
  category: string
  subcategories: string[]
  tags: string[]
}

export interface MockupModel {
  id: string
  name: string
  pro: boolean
  object: {
    url: string
    thumbnail: string
    'preview-thumbnail': string
    videoThumbnail: string
    elements: ModelElement[]
    [key: string]: any  // 动画资源 URL
  }
  scene: ModelScene
  controls: ModelControls
  camera: ModelCamera
  designs: ModelDesign[]
  background: boolean
  meta: ModelMeta
}
```

`src/shared/types/editor.ts`：
```typescript
export interface DesignUpload {
  designId: string       // 对应 model.designs[].id
  imageUrl: string       // 上传后的 URL 或 base64
  file?: File
  scale: number
  rotation: number       // 度数
  offsetX: number
  offsetY: number
}

export interface ColorSetting {
  meshId: string
  color: string          // hex 值
}

export interface BackgroundSetting {
  type: 'solid' | 'gradient' | 'transparent' | 'image'
  color?: string
  gradientFrom?: string
  gradientTo?: string
  imageUrl?: string
}

export interface AnimationSetting {
  name: string | null    // 动画名称，null 表示无动画
  playing: boolean
}

export interface EditorState {
  modelId: string
  designs: DesignUpload[]
  colors: ColorSetting[]
  background: BackgroundSetting
  animation: AnimationSetting
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp'
  width: number
  height: number
  quality: number        // 0-1
  transparent: boolean
}
```

---

### Step 2: 模型数据加载 Composable

**目标**: 创建用于加载和管理模型配置数据的 composable

**涉及文件**:
- `src/shared/composables/useModelData.ts` - 新建

**代码变更**:

`src/shared/composables/useModelData.ts`：
```typescript
import { ref, computed } from 'vue'
import type { MockupModel } from '@shared/types/model'

// 模型数据可以从内联 JSON 或 API 加载
const modelsCache = ref<MockupModel[] | null>(null)

async function fetchModels(): Promise<MockupModel[]> {
  if (modelsCache.value) return modelsCache.value

  // 构建时将 model.json 复制到 public 目录，或通过 API 加载
  const response = await fetch('/model.json')
  let text = await response.text()
  // 处理可能的单引号包裹
  if (text.startsWith("'")) text = text.slice(1)
  if (text.endsWith("'")) text = text.slice(0, -1)

  modelsCache.value = JSON.parse(text)
  return modelsCache.value!
}

export function useModelData() {
  const models = ref<MockupModel[]>([])
  const currentModel = ref<MockupModel | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadModels() {
    loading.value = true
    error.value = null
    try {
      models.value = await fetchModels()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load models'
    } finally {
      loading.value = false
    }
  }

  async function loadModel(modelId: string) {
    loading.value = true
    error.value = null
    try {
      const allModels = await fetchModels()
      currentModel.value = allModels.find(m => m.id === modelId) || null
      if (!currentModel.value) {
        error.value = `Model "${modelId}" not found`
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load model'
    } finally {
      loading.value = false
    }
  }

  const animations = computed(() => {
    if (!currentModel.value) return []
    const animationKeys = [
      'BounceDown', 'AdvancedLeftEntry', 'BeatSpin', 'BoingPop',
      'Details', 'EdgeEnter', 'Elevate', 'Shockwave',
      'SpinCycle', 'StageEntrance', 'StageMaster',
    ]
    return animationKeys
      .filter(key => currentModel.value!.object[key])
      .map(key => ({ name: key, url: currentModel.value!.object[key] }))
  })

  return { models, currentModel, loading, error, loadModels, loadModel, animations }
}
```

---

### Step 3: Three.js 场景管理 Composable

**目标**: 创建 Three.js 场景初始化、模型加载、渲染循环的核心 composable

**涉及文件**:
- `src/editor/composables/useThreeScene.ts` - 新建

**代码变更**:

`src/editor/composables/useThreeScene.ts`：
```typescript
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { MockupModel } from '@shared/types/model'

export function useThreeScene(canvasRef: Ref<HTMLCanvasElement | null>) {
  const scene = ref<THREE.Scene | null>(null)
  const camera = ref<THREE.PerspectiveCamera | null>(null)
  const renderer = ref<THREE.WebGLRenderer | null>(null)
  const controls = ref<OrbitControls | null>(null)
  const loadedModel = ref<THREE.Group | null>(null)
  const loadingProgress = ref(0)
  const isLoading = ref(false)

  let animationFrameId: number | null = null

  function init(modelConfig: MockupModel) {
    if (!canvasRef.value) return

    // Scene
    const s = new THREE.Scene()
    s.background = new THREE.Color(0xf0f0f0)
    scene.value = s

    // Camera
    const cam = modelConfig.camera
    const c = new THREE.PerspectiveCamera(
      cam.perspective.fov,
      cam.perspective.aspect,
      cam.perspective.near,
      cam.perspective.far
    )
    c.position.set(cam.position.x, cam.position.y, cam.position.z)
    camera.value = c

    // Renderer
    const r = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      preserveDrawingBuffer: true,  // 用于截图导出
    })
    r.setPixelRatio(window.devicePixelRatio)
    r.setSize(
      canvasRef.value.clientWidth,
      canvasRef.value.clientHeight
    )
    r.toneMapping = THREE.ACESFilmicToneMapping
    r.toneMappingExposure = 1.0
    renderer.value = r

    // Controls
    const ctrl = new OrbitControls(c, r.domElement)
    ctrl.enableDamping = true
    ctrl.dampingFactor = 0.05
    ctrl.minDistance = modelConfig.controls.distance.min
    ctrl.maxDistance = modelConfig.controls.distance.max
    controls.value = ctrl

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    s.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    s.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 5, -5)
    s.add(fillLight)

    // Render loop
    function animate() {
      animationFrameId = requestAnimationFrame(animate)
      ctrl.update()
      r.render(s, c)
    }
    animate()

    // Resize
    window.addEventListener('resize', handleResize)
  }

  function handleResize() {
    if (!canvasRef.value || !camera.value || !renderer.value) return
    const width = canvasRef.value.clientWidth
    const height = canvasRef.value.clientHeight
    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(width, height)
  }

  async function loadGLBModel(url: string) {
    if (!scene.value) return

    isLoading.value = true
    loadingProgress.value = 0

    const loader = new GLTFLoader()

    return new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          if (loadedModel.value) {
            scene.value!.remove(loadedModel.value)
          }
          loadedModel.value = gltf.scene
          scene.value!.add(gltf.scene)
          isLoading.value = false
          loadingProgress.value = 100
          resolve(gltf.scene)
        },
        (progress) => {
          if (progress.total > 0) {
            loadingProgress.value = Math.round((progress.loaded / progress.total) * 100)
          }
        },
        (error) => {
          isLoading.value = false
          reject(error)
        }
      )
    })
  }

  function setMeshColor(meshId: string, color: string) {
    if (!loadedModel.value) return
    loadedModel.value.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === meshId) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.set(color)
        }
      }
    })
  }

  function setBackground(color: string | null) {
    if (!scene.value) return
    if (color === null) {
      scene.value.background = null
    } else {
      scene.value.background = new THREE.Color(color)
    }
  }

  function captureScreenshot(width: number, height: number): string | null {
    if (!renderer.value || !scene.value || !camera.value) return null

    // 临时调整渲染尺寸
    const originalSize = renderer.value.getSize(new THREE.Vector2())
    renderer.value.setSize(width, height)
    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()

    renderer.value.render(scene.value, camera.value)
    const dataUrl = renderer.value.domElement.toDataURL('image/png')

    // 恢复原始尺寸
    renderer.value.setSize(originalSize.x, originalSize.y)
    camera.value.aspect = originalSize.x / originalSize.y
    camera.value.updateProjectionMatrix()

    return dataUrl
  }

  function dispose() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    window.removeEventListener('resize', handleResize)
    controls.value?.dispose()
    renderer.value?.dispose()
    scene.value?.clear()
  }

  onUnmounted(dispose)

  return {
    scene,
    camera,
    renderer,
    loadedModel,
    loadingProgress,
    isLoading,
    init,
    loadGLBModel,
    setMeshColor,
    setBackground,
    captureScreenshot,
    dispose,
  }
}
```

---

### Step 4: 贴图管理 Composable

**目标**: 实现将用户上传的设计图贴到 3D 模型指定区域的功能

**涉及文件**:
- `src/editor/composables/useDesignTexture.ts` - 新建

**代码变更**:

`src/editor/composables/useDesignTexture.ts`：
```typescript
import { ref } from 'vue'
import * as THREE from 'three'
import type { MockupModel, ModelDesign } from '@shared/types/model'
import type { DesignUpload } from '@shared/types/editor'

export function useDesignTexture(getModel: () => THREE.Group | null) {
  const designs = ref<Map<string, DesignUpload>>(new Map())
  const textures = ref<Map<string, THREE.Texture>>(new Map())

  function applyDesign(designConfig: ModelDesign, imageSource: string) {
    const model = getModel()
    if (!model) return

    // 创建纹理
    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load(imageSource, () => {
      texture.flipY = false
      texture.colorSpace = THREE.SRGBColorSpace

      // 查找对应的 mesh 并应用纹理
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === designConfig.meshId) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.map = texture
            child.material.needsUpdate = true
          }
        }
      })
    })

    textures.value.set(designConfig.id, texture)

    // 记录设计上传信息
    designs.value.set(designConfig.id, {
      designId: designConfig.id,
      imageUrl: imageSource,
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    })
  }

  function removeDesign(designId: string, meshId: string) {
    const model = getModel()
    if (!model) return

    // 移除纹理
    const texture = textures.value.get(designId)
    if (texture) {
      texture.dispose()
      textures.value.delete(designId)
    }

    // 恢复 mesh 原始材质
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === meshId) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.map = null
          child.material.needsUpdate = true
        }
      }
    })

    designs.value.delete(designId)
  }

  function updateDesignTransform(designId: string, transform: Partial<DesignUpload>) {
    const existing = designs.value.get(designId)
    if (!existing) return

    const texture = textures.value.get(designId)
    if (!texture) return

    Object.assign(existing, transform)

    // 更新纹理变换
    if (transform.scale !== undefined) {
      texture.repeat.set(1 / transform.scale, 1 / transform.scale)
    }
    if (transform.offsetX !== undefined || transform.offsetY !== undefined) {
      texture.offset.set(
        existing.offsetX / 100,
        existing.offsetY / 100
      )
    }
    if (transform.rotation !== undefined) {
      texture.rotation = (transform.rotation * Math.PI) / 180
    }
  }

  function disposeAll() {
    textures.value.forEach(texture => texture.dispose())
    textures.value.clear()
    designs.value.clear()
  }

  return { designs, applyDesign, removeDesign, updateDesignTransform, disposeAll }
}
```

---

### Step 5: 编辑器状态管理 (Pinia Store)

**目标**: 创建编辑器的全局状态管理

**涉及文件**:
- `src/editor/stores/editorStore.ts` - 新建

**代码变更**:

`src/editor/stores/editorStore.ts`：
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MockupModel } from '@shared/types/model'
import type { EditorState, BackgroundSetting, ColorSetting, ExportOptions } from '@shared/types/editor'

export const useEditorStore = defineStore('editor', () => {
  // 模型
  const model = ref<MockupModel | null>(null)
  const modelLoaded = ref(false)

  // 编辑器状态
  const colors = ref<ColorSetting[]>([])
  const background = ref<BackgroundSetting>({ type: 'solid', color: '#f0f0f0' })
  const selectedTool = ref<'design' | 'color' | 'background' | 'animation' | 'export'>('design')

  // 导出选项
  const exportOptions = ref<ExportOptions>({
    format: 'png',
    width: 2000,
    height: 2000,
    quality: 0.95,
    transparent: false,
  })

  // 初始化
  function initFromModel(m: MockupModel) {
    model.value = m

    // 从模型配置初始化颜色
    colors.value = []
    if (m.object.elements) {
      m.object.elements.forEach(element => {
        element.mesh.forEach(mesh => {
          if (mesh.type === 'color') {
            colors.value.push({ meshId: mesh.id, color: '#ffffff' })
          }
        })
      })
    }
  }

  function setColor(meshId: string, color: string) {
    const item = colors.value.find(c => c.meshId === meshId)
    if (item) {
      item.color = color
    }
  }

  function setBackground(bg: BackgroundSetting) {
    background.value = bg
  }

  // 可编辑的 mesh 列表
  const editableMeshes = computed(() => {
    if (!model.value?.object.elements) return []
    return model.value.object.elements.flatMap(el =>
      el.mesh.filter(m => m.type === 'color').map(m => ({
        id: m.id,
        name: m.id,
        elementName: el.name,
      }))
    )
  })

  // 可用动画列表
  const availableAnimations = computed(() => {
    if (!model.value) return []
    const animationKeys = [
      'BounceDown', 'AdvancedLeftEntry', 'BeatSpin', 'BoingPop',
      'Details', 'EdgeEnter', 'Elevate', 'Shockwave',
      'SpinCycle', 'StageEntrance', 'StageMaster',
    ]
    return animationKeys.filter(key => model.value!.object[key])
  })

  return {
    model,
    modelLoaded,
    colors,
    background,
    selectedTool,
    exportOptions,
    editableMeshes,
    availableAnimations,
    initFromModel,
    setColor,
    setBackground,
  }
})
```

---

### Step 6: 编辑器 UI 组件 — Canvas 预览

**目标**: 创建 Three.js Canvas 预览组件

**涉及文件**:
- `src/editor/components/EditorCanvas.vue` - 新建

**代码变更**:

`src/editor/components/EditorCanvas.vue`：
```vue
<template>
  <div class="editor-canvas" ref="containerRef">
    <canvas ref="canvasRef"></canvas>

    <!-- 加载进度 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-bar">
        <div class="loading-fill" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <p>Loading model... {{ loadingProgress }}%</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useThreeScene } from '@editor/composables/useThreeScene'
import { useDesignTexture } from '@editor/composables/useDesignTexture'
import { useEditorStore } from '@editor/stores/editorStore'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const store = useEditorStore()
const { init, loadGLBModel, setMeshColor, setBackground, captureScreenshot, isLoading, loadingProgress, loadedModel } = useThreeScene(canvasRef)
const { applyDesign, removeDesign } = useDesignTexture(() => loadedModel.value)

// 监听模型变化
watch(() => store.model, async (model) => {
  if (!model) return
  init(model)
  await loadGLBModel(model.object.url)
  store.modelLoaded = true
})

// 监听颜色变化
watch(() => store.colors, (colors) => {
  colors.forEach(c => setMeshColor(c.meshId, c.color))
}, { deep: true })

// 监听背景变化
watch(() => store.background, (bg) => {
  if (bg.type === 'transparent') {
    setBackground(null)
  } else if (bg.type === 'solid' && bg.color) {
    setBackground(bg.color)
  }
}, { deep: true })

// 暴露截图方法
defineExpose({ captureScreenshot })
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
  background: rgba(0, 0, 0, 0.7);
  color: white;
}
.loading-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.loading-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.2s;
}
</style>
```

---

### Step 7: 编辑器 UI 组件 — 工具面板

**目标**: 创建设计上传、颜色选择、背景设置、导出功能的工具面板组件

**涉及文件**:
- `src/editor/components/ToolPanel.vue` - 新建
- `src/editor/components/panels/DesignPanel.vue` - 新建
- `src/editor/components/panels/ColorPanel.vue` - 新建
- `src/editor/components/panels/BackgroundPanel.vue` - 新建
- `src/editor/components/panels/ExportPanel.vue` - 新建

**代码变更**:

`src/editor/components/ToolPanel.vue`：
```vue
<template>
  <aside class="tool-panel">
    <!-- 工具切换标签 -->
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

    <!-- 工具内容 -->
    <div class="tool-content">
      <DesignPanel v-if="store.selectedTool === 'design'" />
      <ColorPanel v-else-if="store.selectedTool === 'color'" />
      <BackgroundPanel v-else-if="store.selectedTool === 'background'" />
      <ExportPanel v-else-if="store.selectedTool === 'export'" />
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

const tools = [
  { id: 'design' as const, label: 'Design' },
  { id: 'color' as const, label: 'Color' },
  { id: 'background' as const, label: 'Background' },
  { id: 'export' as const, label: 'Export' },
]
</script>

<style scoped>
.tool-panel {
  width: 320px;
  background: #1e293b;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tool-tabs {
  display: flex;
  border-bottom: 1px solid #334155;
}
.tool-tab {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.tool-tab.active {
  color: #fff;
  border-bottom: 2px solid #3b82f6;
}
.tool-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}
</style>
```

`src/editor/components/panels/DesignPanel.vue`：
```vue
<template>
  <div class="design-panel">
    <div v-for="design in store.model?.designs" :key="design.id" class="design-slot">
      <h4>{{ design.name }}</h4>
      <p class="design-size">{{ design.width }} x {{ design.height }}px</p>

      <!-- 指导图预览 -->
      <div v-if="design.guide" class="guide-preview">
        <img :src="design.guide" alt="Design guide" />
      </div>

      <!-- 上传区域 -->
      <div class="upload-area" @click="triggerUpload(design.id)" @drop.prevent="handleDrop($event, design)" @dragover.prevent>
        <input type="file" :ref="el => setFileRef(design.id, el)" accept="image/*" @change="handleUpload($event, design)" hidden />
        <p>Click or drag to upload design</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@editor/stores/editorStore'
import type { ModelDesign } from '@shared/types/model'

const store = useEditorStore()
const fileInputs = ref<Map<string, HTMLInputElement>>(new Map())

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
    // 发送事件给父组件执行贴图操作
    emit('apply-design', { design, imageUrl })
  }
  reader.readAsDataURL(file)
}

const emit = defineEmits<{
  'apply-design': [{ design: ModelDesign; imageUrl: string }]
}>()
</script>

<style scoped>
.design-slot {
  margin-bottom: 1.5rem;
}
.design-size {
  font-size: 0.8rem;
  color: #94a3b8;
}
.guide-preview img {
  width: 100%;
  border-radius: 4px;
  margin: 0.5rem 0;
  opacity: 0.7;
}
.upload-area {
  border: 2px dashed #475569;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}
.upload-area:hover {
  border-color: #3b82f6;
}
</style>
```

`src/editor/components/panels/ColorPanel.vue`：
```vue
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
  margin-bottom: 1rem;
}
.color-item label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  text-transform: capitalize;
}
.color-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.color-input-row input[type="color"] {
  width: 40px;
  height: 32px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
.color-hex {
  flex: 1;
  padding: 0.25rem 0.5rem;
  background: #334155;
  border: 1px solid #475569;
  color: #e2e8f0;
  border-radius: 4px;
  font-family: monospace;
}
</style>
```

`src/editor/components/panels/BackgroundPanel.vue`：
```vue
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
.bg-types { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.bg-type-btn {
  flex: 1; padding: 0.5rem; border: 1px solid #475569; background: transparent;
  color: #e2e8f0; cursor: pointer; border-radius: 4px;
}
.bg-type-btn.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.preset-colors { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.color-swatch {
  width: 32px; height: 32px; border-radius: 4px; border: 2px solid #475569;
  cursor: pointer; transition: transform 0.1s;
}
.color-swatch:hover { transform: scale(1.1); }
</style>
```

`src/editor/components/panels/ExportPanel.vue`：
```vue
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
.export-field { margin-bottom: 1rem; }
.export-field label { display: block; font-size: 0.85rem; margin-bottom: 0.25rem; }
.export-field select {
  width: 100%; padding: 0.5rem; background: #334155;
  border: 1px solid #475569; color: #e2e8f0; border-radius: 4px;
}
.size-presets { display: flex; gap: 0.5rem; }
.size-presets button {
  flex: 1; padding: 0.5rem; border: 1px solid #475569; background: transparent;
  color: #e2e8f0; cursor: pointer; border-radius: 4px; font-size: 0.75rem;
}
.size-presets button.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.btn-export {
  width: 100%; padding: 0.75rem; background: #3b82f6; color: white;
  border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;
}
.btn-export:hover { background: #2563eb; }
</style>
```

---

### Step 8: 编辑器主页面组装

**目标**: 将所有编辑器组件组装到 App.vue 中

**涉及文件**:
- `src/editor/App.vue` - 修改

**代码变更**:

替换 `src/editor/App.vue` 为：
```vue
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useModelData } from '@shared/composables/useModelData'
import { useEditorStore } from '@editor/stores/editorStore'
import EditorCanvas from './components/EditorCanvas.vue'
import ToolPanel from './components/ToolPanel.vue'
import type { ModelDesign } from '@shared/types/model'

const store = useEditorStore()
const { loadModel, currentModel, error } = useModelData()
const canvasRef = ref<InstanceType<typeof EditorCanvas> | null>(null)

onMounted(async () => {
  // 从 URL 参数获取模型 ID
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
  // 委托给 canvas 组件处理贴图
  // 实际实现需要通过事件总线或 provide/inject 传递
}

function handleExport() {
  const opts = store.exportOptions
  const dataUrl = canvasRef.value?.captureScreenshot(opts.width, opts.height)
  if (!dataUrl) return

  // 下载文件
  const link = document.createElement('a')
  link.download = `mockup-${store.model?.id || 'export'}.${opts.format}`
  link.href = dataUrl
  link.click()
}
</script>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f172a;
  color: white;
}
.editor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}
.editor-logo {
  font-weight: 700;
  color: white;
  text-decoration: none;
}
.editor-model-name {
  font-size: 0.9rem;
  color: #94a3b8;
}
.editor-header-actions {
  margin-left: auto;
}
.btn-header {
  padding: 0.4rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
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
  background: rgba(0, 0, 0, 0.9);
}
</style>
```

---

## 验证方式
1. 启动 `npm run dev`，访问 `/editor.html?model=3d-oversized-tshirt-mockup-001`
2. 模型应加载并在 Canvas 中显示（带加载进度条）
3. 颜色面板可修改模型各部件颜色并实时生效
4. 背景面板可切换背景色
5. 导出按钮可截取当前画面并下载 PNG

## 风险点
- Three.js 的 OrbitControls 和 GLTFLoader 的导入路径可能需要根据 Three.js 版本调整
- GLB 模型的 mesh 命名需与 model.json 中 `elements[].mesh[].id` 一致
- 跨域加载 CDN 上的 GLB 模型需确保 CORS 配置正确
- 贴图到模型上的具体实现取决于 GLB 模型内部的 UV 映射方式
- 移动端触摸交互需额外测试和适配
