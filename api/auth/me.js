import { ObjectId } from 'mongodb'
import { getCollection } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = await requireAuth(req, res)
  if (!payload) return

  try {
    const users = await getCollection('users')
    const user = await users.findOne({ _id: new ObjectId(payload.sub) })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        subscription: user.subscription,
        purchases: user.purchases,
        downloads: user.downloads,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return res.status(500).json({ error: 'Failed to get user' })
  }
}
