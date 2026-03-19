import { ObjectId } from 'mongodb'
import { getCollection } from '../../_lib/db.js'
import { requireAdmin } from '../../_lib/admin-auth.js'

export default async function handler(req, res) {
  const payload = await requireAdmin(req, res)
  if (!payload) return

  const { id } = req.query || {}
  if (!id) {
    return res.status(400).json({ error: 'User id is required' })
  }

  let objectId
  try {
    objectId = new ObjectId(id)
  } catch {
    return res.status(400).json({ error: 'Invalid user id' })
  }

  const users = await getCollection('users')

  if (req.method === 'GET') {
    try {
      const user = await users.findOne(
        { _id: objectId },
        { projection: { passwordHash: 0, refreshTokenHash: 0 } }
      )
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      return res.status(200).json({
        ...user,
        _id: undefined,
        id: user._id.toString(),
      })
    } catch (error) {
      console.error('Admin get user error:', error)
      return res.status(500).json({ error: 'Failed to get user' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' })
      }

      // Only allow specific fields to be updated
      const allowed = {}
      if (updates.displayName !== undefined) allowed.displayName = updates.displayName
      if (updates.subscription !== undefined) allowed.subscription = updates.subscription
      allowed.updatedAt = new Date().toISOString()

      const result = await users.updateOne({ _id: objectId }, { $set: allowed })
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      return res.status(200).json({ ok: true })
    } catch (error) {
      console.error('Admin update user error:', error)
      return res.status(500).json({ error: 'Failed to update user' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
