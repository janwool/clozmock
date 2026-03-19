import { ref } from 'vue'
import * as THREE from 'three'
import type { ModelDesign } from '@shared/types/model'
import type { DesignUpload } from '@shared/types/editor'

export function useDesignTexture(getModel: () => THREE.Group | null) {
  const designs = ref<Map<string, DesignUpload>>(new Map())
  const textures = ref<Map<string, THREE.Texture>>(new Map())

  function applyDesign(designConfig: ModelDesign, imageSource: string) {
    const model = getModel()
    if (!model) return

    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load(imageSource, () => {
      texture.flipY = false
      texture.colorSpace = THREE.SRGBColorSpace

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

    const texture = textures.value.get(designId)
    if (texture) {
      texture.dispose()
      textures.value.delete(designId)
    }

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
