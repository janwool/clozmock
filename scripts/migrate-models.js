import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MongoClient } from 'mongodb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

async function migrate() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI is not set')
    process.exit(1)
  }

  // Load model.json
  let raw = fs.readFileSync(path.join(ROOT, 'model.json'), 'utf-8')
  if (raw.startsWith("'")) raw = raw.slice(1)
  if (raw.endsWith("'")) raw = raw.slice(0, -1)

  const models = JSON.parse(raw)
  console.log(`Loaded ${models.length} models from model.json`)

  // Add timestamps
  const now = new Date().toISOString()
  const docs = models.map(model => ({
    ...model,
    createdAt: now,
    updatedAt: now,
  }))

  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db()
    const collection = db.collection('models')

    // Drop existing data
    const exists = await db.listCollections({ name: 'models' }).hasNext()
    if (exists) {
      await collection.drop()
      console.log('Dropped existing models collection')
    }

    // Insert all models
    const result = await collection.insertMany(docs)
    console.log(`Inserted ${result.insertedCount} models`)

    // Create indexes
    await collection.createIndex({ id: 1 }, { unique: true })
    await collection.createIndex({ 'meta.category': 1 })
    await collection.createIndex({ pro: 1 })
    console.log('Created indexes: id (unique), meta.category, pro')

    console.log('Migration complete!')
  } finally {
    await client.close()
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
