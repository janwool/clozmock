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
    [key: string]: any
  }
  scene: ModelScene
  controls: ModelControls
  camera: ModelCamera
  designs: ModelDesign[]
  background: boolean
  meta: ModelMeta
}
