import { ObjectId } from 'mongodb'
import { getCollection } from '../../_lib/db.js'
import { requireAuth } from '../../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = await requireAuth(req, res)
  if (!payload) return

  try {
    const users = await getCollection('users')
    const userId = new ObjectId(payload.sub)
    const user = await users.findOne({ _id: userId })

    if (!user) return res.status(404).json({ error: 'User not found' })

    const today = new Date().toISOString().split('T')[0]
    const downloads = user.downloads || { today: 0, lastResetDate: today }

    // Reset count if it's a new day
    if (downloads.lastResetDate !== today) {
      downloads.today = 0
      downloads.lastResetDate = today
    }

    downloads.today += 1

    await users.updateOne(
      { _id: userId },
      { $set: { downloads, updatedAt: new Date().toISOString() } }
    )

    return res.status(200).json({ downloads })
  } catch (error) {
    console.error('Track download error:', error)
    return res.status(500).json({ error: 'Failed to track download' })
  }
}
