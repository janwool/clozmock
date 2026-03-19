import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

let cached = global.__mongo

if (!cached) {
  cached = global.__mongo = { client: null, db: null }
}

export async function getDb() {
  if (cached.db) return cached.db

  if (!uri) throw new Error('MONGODB_URI is not set')

  if (!cached.client) {
    cached.client = new MongoClient(uri)
    await cached.client.connect()
  }

  cached.db = cached.client.db()
  return cached.db
}

export async function getCollection(name) {
  const db = await getDb()
  return db.collection(name)
}
