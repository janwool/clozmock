import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MockupModel } from '@shared/types/model'
import type { BackgroundSetting, ColorSetting, ExportOptions } from '@shared/types/editor'

export const useEditorStore = defineStore('editor', () => {
  const model = ref<MockupModel | null>(null)
  const modelLoaded = ref(false)

  const colors = ref<ColorSetting[]>([])
  const background = ref<BackgroundSetting>({ type: 'solid', color: '#f0f0f0' })
  const selectedTool = ref<'design' | 'color' | 'background' | 'animation' | 'export'>('design')

  const showAiTryOn = ref(false)
  const aiTryOnResult = ref<string | null>(null)
  const aiTryOnGenerating = ref(false)
  const aiTryOnSelectedModel = ref<string | null>(null)
  const aiTryOnClothingImage = ref<string | null>(null)

  const exportOptions = ref<ExportOptions>({
    format: 'png',
    width: 2000,
    height: 2000,
    quality: 0.95,
    transparent: false,
  })

  function initFromModel(m: MockupModel) {
    model.value = m

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
    showAiTryOn,
    aiTryOnResult,
    aiTryOnGenerating,
    aiTryOnSelectedModel,
    aiTryOnClothingImage,
    editableMeshes,
    availableAnimations,
    initFromModel,
    setColor,
    setBackground,
  }
})
