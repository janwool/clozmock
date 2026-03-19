import { getCollection } from '../../_lib/db.js'
import { requireAdmin } from '../../_lib/admin-auth.js'

export default async function handler(req, res) {
  const payload = await requireAdmin(req, res)
  if (!payload) return

  const { id } = req.query || {}
  if (!id) {
    return res.status(400).json({ error: 'Model id is required' })
  }

  const models = await getCollection('models')

  if (req.method === 'GET') {
    try {
      const model = await models.findOne({ id })
      if (!model) {
        return res.status(404).json({ error: 'Model not found' })
      }
      return res.status(200).json({ ...model, _id: model._id.toString() })
    } catch (error) {
      console.error('Admin get model error:', error)
      return res.status(500).json({ error: 'Failed to get model' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' })
      }

      // Prevent changing _id or id
      delete updates._id
      delete updates.id
      delete updates.createdAt
      updates.updatedAt = new Date().toISOString()

      const result = await models.updateOne({ id }, { $set: updates })
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Model not found' })
      }

      return res.status(200).json({ ok: true })
    } catch (error) {
      console.error('Admin update model error:', error)
      return res.status(500).json({ error: 'Failed to update model' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await models.deleteOne({ id })
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Model not found' })
      }
      return res.status(200).json({ ok: true })
    } catch (error) {
      console.error('Admin delete model error:', error)
      return res.status(500).json({ error: 'Failed to delete model' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
