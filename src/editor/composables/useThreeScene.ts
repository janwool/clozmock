import { ref, onUnmounted, type Ref } from 'vue'
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
      preserveDrawingBuffer: true,
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

    const originalSize = renderer.value.getSize(new THREE.Vector2())
    renderer.value.setSize(width, height)
    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()

    renderer.value.render(scene.value, camera.value)
    const dataUrl = renderer.value.domElement.toDataURL('image/png')

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
