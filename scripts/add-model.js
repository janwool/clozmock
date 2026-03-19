import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MODEL_FILE = path.join(ROOT, 'model.json')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(resolve => rl.question(q, resolve))

const CATEGORIES = ['apparel', 'mugs', 'boxes', 'devices', 'cans', 'print', 'bottles', 'pouchs', 'tubes']

async function main() {
  console.log('=== Add New Model ===\n')

  const id = await ask('Model ID (e.g., 3d-animated-mug-mockup-006): ')
  const name = await ask('Model name: ')
  const category = await ask(`Category (${CATEGORIES.join(', ')}): `)
  const subcategory = await ask('Subcategory (e.g., mug, t-shirt): ')
  const isPro = (await ask('Is Pro? (y/n): ')).toLowerCase() === 'y'
  const glbUrl = await ask('GLB file URL: ')
  const thumbnailUrl = await ask('Thumbnail URL: ')
  const title = await ask('SEO title: ')

  if (!CATEGORIES.includes(category)) {
    console.log(`Note: "${category}" is a new category. It will be created automatically.`)
  }

  const newModel = {
    id,
    name,
    pro: isPro,
    object: {
      url: glbUrl,
      thumbnail: thumbnailUrl,
      'preview-thumbnail': thumbnailUrl,
      videoThumbnail: '',
      elements: [],
    },
    scene: {
      dimensions: { width: 560, height: 700 },
      position: { y: 0, x: 0 },
      rotation: { y: 1 },
    },
    guide: {},
    controls: {
      distance: { max: 10, min: 5 },
    },
    camera: {
      position: { x: 4, y: 2, z: 0 },
      perspective: { fov: 35, aspect: 1.4, near: 0.1, far: 1000 },
    },
    designs: [],
    background: true,
    meta: {
      title,
      category,
      subcategories: [subcategory],
      tags: [],
    },
  }

  // Read existing data
  let raw = fs.readFileSync(MODEL_FILE, 'utf-8')
  if (raw.startsWith("'")) raw = raw.slice(1)
  if (raw.endsWith("'")) raw = raw.slice(0, -1)
  const models = JSON.parse(raw)

  // Check ID uniqueness
  if (models.find(m => m.id === id)) {
    console.error(`Error: Model with ID "${id}" already exists.`)
    rl.close()
    process.exit(1)
  }

  models.push(newModel)
  fs.writeFileSync(MODEL_FILE, JSON.stringify(models, null, 4), 'utf-8')

  console.log(`\nModel "${id}" added successfully!`)
  console.log('Next steps:')
  console.log('  1. Update elements, designs, camera settings in model.json')
  console.log('  2. Add translations to locales/en/models.json and locales/zh/models.json')
  console.log('  3. Run: npm run validate')
  console.log('  4. Run: npm run generate')

  rl.close()
}

main().catch(console.error)
