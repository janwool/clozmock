import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

;(function () {
  const modelData = window.__MODEL_DATA__
  if (!modelData) return

  const design = modelData.designs && modelData.designs[0]
  let scene, camera, renderer, controls, loadedModel
  let fabricCanvas
  let designMesh = null
  let canvasTexture = null
  let needsTextureSync = false

  // ===== Three.js Scene =====
  function initThreeScene() {
    const container = document.getElementById('three-canvas')
    if (!container) return

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    const cam = modelData.camera
    camera = new THREE.PerspectiveCamera(
      cam.perspective.fov,
      cam.perspective.aspect,
      cam.perspective.near,
      cam.perspective.far
    )
    camera.position.set(cam.position.x, cam.position.y, cam.position.z)

    renderer = new THREE.WebGLRenderer({
      canvas: container,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    if (modelData.controls && modelData.controls.distance) {
      controls.minDistance = modelData.controls.distance.min
      controls.maxDistance = modelData.controls.distance.max
    }

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 7)
    scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    // Render loop
    function animate() {
      requestAnimationFrame(animate)
      controls.update()
      if (needsTextureSync && canvasTexture) {
        canvasTexture.needsUpdate = true
        needsTextureSync = false
      }
      renderer.render(scene, camera)
    }
    animate()

    window.addEventListener('resize', handleResize)
  }

  function handleResize() {
    const container = document.getElementById('three-canvas')
    if (!container || !camera || !renderer) return
    const parent = container.parentElement
    const width = parent.clientWidth
    const height = parent.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  // ===== GLB Loading =====
  function loadGLBModel(url) {
    const loader = new GLTFLoader()
    const loadingEl = document.getElementById('viewer-loading')

    loader.load(
      url,
      function (gltf) {
        loadedModel = gltf.scene
        scene.add(loadedModel)
        if (loadingEl) loadingEl.style.display = 'none'

        // Find design mesh
        if (design) {
          loadedModel.traverse(function (child) {
            if (child.isMesh && child.name === design.meshId) {
              designMesh = child
            }
          })
        }

        // Once model is loaded, sync fabric canvas to it
        if (designMesh && fabricCanvas) {
          syncFabricToThree()
        }
      },
      function (progress) {
        if (progress.total > 0 && loadingEl) {
          var pct = Math.round((progress.loaded / progress.total) * 100)
          var bar = loadingEl.querySelector('.loading-bar-fill')
          if (bar) bar.style.width = pct + '%'
        }
      },
      function (error) {
        console.error('Failed to load GLB:', error)
        if (loadingEl) {
          loadingEl.innerHTML = '<p style="color:#ef4444;">Failed to load 3D model</p>'
        }
      }
    )
  }

  // ===== Fabric.js Editor =====
  function initFabricEditor() {
    if (!design) return

    var canvasEl = document.getElementById('fabric-canvas')
    if (!canvasEl) return

    fabricCanvas = new fabric.Canvas('fabric-canvas', {
      width: design.width,
      height: design.height,
      backgroundColor: '#ffffff',
    })

    // Load guide image as background
    if (design.guide) {
      fabric.Image.fromURL(design.guide, function (img) {
        img.scaleToWidth(design.width)
        img.scaleToHeight(design.height)
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
          originX: 'left',
          originY: 'top',
        })
      }, { crossOrigin: 'anonymous' })
    }

    // Signal sync on every render
    fabricCanvas.on('after:render', function () {
      needsTextureSync = true
    })
  }

  // ===== Texture Sync =====
  function syncFabricToThree() {
    if (!fabricCanvas || !designMesh) return

    canvasTexture = new THREE.CanvasTexture(fabricCanvas.getElement())
    canvasTexture.flipY = false
    canvasTexture.colorSpace = THREE.SRGBColorSpace

    if (designMesh.material instanceof THREE.MeshStandardMaterial) {
      designMesh.material.map = canvasTexture
      designMesh.material.needsUpdate = true
    } else if (Array.isArray(designMesh.material)) {
      designMesh.material.forEach(function (mat) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.map = canvasTexture
          mat.needsUpdate = true
        }
      })
    }

    needsTextureSync = true
  }

  // ===== Toolbar Actions =====
  function setupToolbar() {
    // Upload image
    var uploadBtn = document.getElementById('toolbar-upload')
    var uploadInput = document.getElementById('toolbar-upload-input')
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', function () {
        uploadInput.click()
      })
      uploadInput.addEventListener('change', function (e) {
        var file = e.target.files[0]
        if (!file) return
        var reader = new FileReader()
        reader.onload = function (ev) {
          fabric.Image.fromURL(ev.target.result, function (img) {
            // Scale to fit canvas
            var scale = Math.min(
              (design.width * 0.8) / img.width,
              (design.height * 0.8) / img.height,
              1
            )
            img.scale(scale)
            img.set({
              left: design.width / 2,
              top: design.height / 2,
              originX: 'center',
              originY: 'center',
            })
            fabricCanvas.add(img)
            fabricCanvas.setActiveObject(img)
            fabricCanvas.renderAll()
          })
        }
        reader.readAsDataURL(file)
        uploadInput.value = ''
      })
    }

    // Add text
    var textBtn = document.getElementById('toolbar-text')
    if (textBtn) {
      textBtn.addEventListener('click', function () {
        var text = new fabric.IText('Your Text', {
          left: design.width / 2,
          top: design.height / 2,
          originX: 'center',
          originY: 'center',
          fontSize: Math.round(design.height / 8),
          fontFamily: 'Arial',
          fill: '#000000',
        })
        fabricCanvas.add(text)
        fabricCanvas.setActiveObject(text)
        fabricCanvas.renderAll()
      })
    }

    // Color picker
    var colorPicker = document.getElementById('toolbar-color')
    if (colorPicker) {
      colorPicker.addEventListener('input', function (e) {
        var active = fabricCanvas.getActiveObject()
        if (!active) return
        if (active.type === 'i-text' || active.type === 'text') {
          active.set('fill', e.target.value)
        } else {
          // For images, apply tint filter or skip
        }
        fabricCanvas.renderAll()
      })
    }

    // Delete selected
    var deleteBtn = document.getElementById('toolbar-delete')
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        var active = fabricCanvas.getActiveObject()
        if (active) {
          fabricCanvas.remove(active)
          fabricCanvas.discardActiveObject()
          fabricCanvas.renderAll()
        }
      })
    }

    // Keyboard delete
    document.addEventListener('keydown', function (e) {
      if (!fabricCanvas) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete when editing text
        var active = fabricCanvas.getActiveObject()
        if (active && active.isEditing) return
        if (active) {
          fabricCanvas.remove(active)
          fabricCanvas.discardActiveObject()
          fabricCanvas.renderAll()
        }
      }
    })
  }

  // ===== Feature Buttons =====
  function setupFeatureButtons() {
    // Download MD
    var mdBtn = document.getElementById('btn-download-md')
    if (mdBtn) {
      mdBtn.addEventListener('click', function () {
        var lines = [
          '# ' + (modelData.id || 'Mockup'),
          '',
          '## Designs',
          '',
        ]
        if (modelData.designs) {
          modelData.designs.forEach(function (d) {
            lines.push('### ' + d.name)
            lines.push('- Size: ' + d.width + ' x ' + d.height + 'px')
            lines.push('- Mesh: ' + d.meshId)
            lines.push('')
          })
        }
        var blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
        var link = document.createElement('a')
        link.download = (modelData.id || 'mockup') + '.md'
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
      })
    }

    // Download Design
    var designBtn = document.getElementById('btn-download-design')
    if (designBtn) {
      designBtn.addEventListener('click', function () {
        var data = {
          id: modelData.id,
          designs: modelData.designs,
          elements: modelData.elements,
        }
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        var link = document.createElement('a')
        link.download = (modelData.id || 'design') + '-design.json'
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
      })
    }

    // AI Try-on
    var tryonBtn = document.getElementById('btn-ai-tryon')
    if (tryonBtn) {
      tryonBtn.addEventListener('click', function () {
        openTryOnModal()
      })
    }
  }

  // ===== AI Try-on Modal =====
  var tryonState = {
    clothingImage: null,
    selectedModel: null,
    generating: false,
  }

  function openTryOnModal() {
    var overlay = document.getElementById('tryon-overlay')
    if (overlay) overlay.style.display = 'flex'
  }

  function closeTryOnModal() {
    var overlay = document.getElementById('tryon-overlay')
    if (overlay) overlay.style.display = 'none'
  }

  function updateGenerateButton() {
    var btn = document.getElementById('tryon-generate')
    if (!btn) return
    btn.disabled = !(tryonState.clothingImage && tryonState.selectedModel) || tryonState.generating
    btn.textContent = tryonState.generating ? 'Generating...' : 'Generate'
  }

  function setClothingPreview(dataUrl) {
    var preview = document.getElementById('tryon-clothing-preview')
    if (!preview) return
    tryonState.clothingImage = dataUrl
    preview.innerHTML = '<img src="' + dataUrl + '" alt="Clothing" />'
    updateGenerateButton()
  }

  function setupTryOnModal() {
    // Close
    var closeBtn = document.getElementById('tryon-close')
    if (closeBtn) closeBtn.addEventListener('click', closeTryOnModal)

    var overlay = document.getElementById('tryon-overlay')
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeTryOnModal()
      })
    }

    // Capture 3D View
    var captureBtn = document.getElementById('tryon-capture')
    if (captureBtn) {
      captureBtn.addEventListener('click', function () {
        if (!renderer) return
        renderer.render(scene, camera)
        var dataUrl = renderer.domElement.toDataURL('image/png')
        setClothingPreview(dataUrl)
      })
    }

    // Upload clothing image
    var uploadBtn = document.getElementById('tryon-upload-btn')
    var uploadInput = document.getElementById('tryon-upload-input')
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', function () { uploadInput.click() })
      uploadInput.addEventListener('change', function (e) {
        var file = e.target.files[0]
        if (!file) return
        var reader = new FileReader()
        reader.onload = function (ev) {
          setClothingPreview(ev.target.result)
        }
        reader.readAsDataURL(file)
        uploadInput.value = ''
      })
    }

    // Model selection
    var modelCards = document.querySelectorAll('.tryon-model-card')
    modelCards.forEach(function (card) {
      card.addEventListener('click', function () {
        modelCards.forEach(function (c) { c.classList.remove('selected') })
        card.classList.add('selected')
        tryonState.selectedModel = card.getAttribute('data-model-id')
        updateGenerateButton()
      })
    })

    // Generate
    var generateBtn = document.getElementById('tryon-generate')
    if (generateBtn) {
      generateBtn.addEventListener('click', function () {
        if (!tryonState.clothingImage || !tryonState.selectedModel || tryonState.generating) return

        tryonState.generating = true
        updateGenerateButton()

        var resultArea = document.getElementById('tryon-result-area')
        if (resultArea) {
          resultArea.innerHTML =
            '<div class="tryon-result-loading">' +
              '<div class="tryon-spinner"></div>' +
              '<p>AI is dressing the model...</p>' +
            '</div>'
        }

        // Simulate AI generation (replace with actual API call)
        setTimeout(function () {
          tryonState.generating = false
          updateGenerateButton()

          if (resultArea) {
            // Placeholder: show clothing image as result
            resultArea.innerHTML = '<img src="' + tryonState.clothingImage + '" alt="AI Try-on Result" />'
          }
        }, 3000)
      })
    }
  }

  // ===== Init =====
  function init() {
    initThreeScene()
    initFabricEditor()
    setupToolbar()
    setupFeatureButtons()
    setupTryOnModal()

    if (modelData.glbUrl) {
      loadGLBModel(modelData.glbUrl)
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
