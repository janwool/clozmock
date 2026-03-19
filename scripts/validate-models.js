import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadModels() {
  let raw = fs.readFileSync(path.join(ROOT, 'model.json'), 'utf-8')
  if (raw.startsWith("'")) raw = raw.slice(1)
  if (raw.endsWith("'")) raw = raw.slice(0, -1)
  return JSON.parse(raw)
}

const REQUIRED_FIELDS = ['id', 'name', 'object', 'scene', 'camera', 'designs', 'meta']
const REQUIRED_OBJECT_FIELDS = ['url', 'thumbnail']
const REQUIRED_META_FIELDS = ['title', 'category']

function validate() {
  const models = loadModels()
  let errors = 0
  let warnings = 0

  console.log(`Validating ${models.length} models...\n`)

  const ids = new Set()

  models.forEach((model, index) => {
    const prefix = `Model #${index + 1} (${model.id || 'NO ID'})`

    REQUIRED_FIELDS.forEach(field => {
      if (model[field] === undefined || model[field] === null) {
        console.error(`  ERROR: ${prefix} — missing required field "${field}"`)
        errors++
      }
    })

    if (model.id) {
      if (ids.has(model.id)) {
        console.error(`  ERROR: ${prefix} — duplicate ID`)
        errors++
      }
      ids.add(model.id)
    }

    if (model.object) {
      REQUIRED_OBJECT_FIELDS.forEach(field => {
        if (!model.object[field]) {
          console.error(`  ERROR: ${prefix} — missing object.${field}`)
          errors++
        }
      })
    }

    if (model.meta) {
      REQUIRED_META_FIELDS.forEach(field => {
        if (!model.meta[field]) {
          console.error(`  ERROR: ${prefix} — missing meta.${field}`)
          errors++
        }
      })

      if (!model.meta.tags || model.meta.tags.length === 0) {
        console.warn(`  WARN: ${prefix} — no tags defined`)
        warnings++
      }
    }

    if (model.designs && model.designs.length > 0) {
      model.designs.forEach((design, di) => {
        if (!design.id || !design.meshId) {
          console.error(`  ERROR: ${prefix} — designs[${di}] missing id or meshId`)
          errors++
        }
        if (!design.width || !design.height) {
          console.warn(`  WARN: ${prefix} — designs[${di}] missing dimensions`)
          warnings++
        }
      })
    }

    if (model.object && model.object.url) {
      if (!model.object.url.startsWith('http')) {
        console.error(`  ERROR: ${prefix} — invalid object.url format`)
        errors++
      }
    }
  })

  console.log(`\n===== Validation Summary =====`)
  console.log(`Total models: ${models.length}`)
  console.log(`Errors: ${errors}`)
  console.log(`Warnings: ${warnings}`)

  if (errors > 0) {
    console.log('\nValidation FAILED. Please fix errors before generating pages.')
    process.exit(1)
  } else {
    console.log('\nValidation PASSED.')
  }
}

validate()
