export interface DesignUpload {
  designId: string
  imageUrl: string
  file?: File
  scale: number
  rotation: number
  offsetX: number
  offsetY: number
}

export interface ColorSetting {
  meshId: string
  color: string
}

export interface BackgroundSetting {
  type: 'solid' | 'gradient' | 'transparent' | 'image'
  color?: string
  gradientFrom?: string
  gradientTo?: string
  imageUrl?: string
}

export interface AnimationSetting {
  name: string | null
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
  quality: number
  transparent: boolean
}
