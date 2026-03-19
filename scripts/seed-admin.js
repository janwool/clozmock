import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

async function seed() {
  const uri = process.env.MONGODB_URI
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!uri) {
    console.error('MONGODB_URI is not set')
    process.exit(1)
  }
  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required')
    process.exit(1)
  }

  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db()
    const admins = db.collection('admins')

    // Create unique index on email
    await admins.createIndex({ email: 1 }, { unique: true })

    const existing = await admins.findOne({ email })
    if (existing) {
      console.log(`Admin "${email}" already exists, skipping`)
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()

    await admins.insertOne({
      email,
      passwordHash,
      role: 'admin',
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    })

    console.log(`Admin "${email}" created successfully`)
  } finally {
    await client.close()
  }
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
