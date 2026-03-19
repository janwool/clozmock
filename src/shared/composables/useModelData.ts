import { ref, computed } from 'vue'
import type { MockupModel } from '@shared/types/model'

const modelsCache = ref<MockupModel[] | null>(null)

async function fetchModels(): Promise<MockupModel[]> {
  if (modelsCache.value) return modelsCache.value

  // Try API first, fallback to static model.json
  try {
    const apiRes = await fetch('/api/models')
    if (apiRes.ok) {
      modelsCache.value = await apiRes.json()
      return modelsCache.value!
    }
  } catch {
    // API unavailable, fall through to static file
  }

  const response = await fetch('/model.json')
  let text = await response.text()
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
