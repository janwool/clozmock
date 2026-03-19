import { ObjectId } from 'mongodb'
import { getCollection } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  const payload = await requireAuth(req, res)
  if (!payload) return

  const users = await getCollection('users')
  const userId = new ObjectId(payload.sub)

  if (req.method === 'GET') {
    const user = await users.findOne({ _id: userId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    return res.status(200).json({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      subscription: user.subscription,
      purchases: user.purchases,
      downloads: user.downloads,
      createdAt: user.createdAt,
    })
  }

  if (req.method === 'PATCH') {
    const { displayName } = req.body || {}

    if (typeof displayName !== 'string') {
      return res.status(400).json({ error: 'displayName is required' })
    }

    await users.updateOne(
      { _id: userId },
      { $set: { displayName, updatedAt: new Date().toISOString() } }
    )

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
