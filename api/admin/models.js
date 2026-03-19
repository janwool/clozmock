import { getCollection } from '../_lib/db.js'
import { requireAdmin } from '../_lib/admin-auth.js'

export default async function handler(req, res) {
  const payload = await requireAdmin(req, res)
  if (!payload) return

  const models = await getCollection('models')

  if (req.method === 'GET') {
    try {
      const { page = '1', pageSize = '20', search, category } = req.query || {}
      const pageNum = Math.max(1, parseInt(page))
      const size = Math.min(100, Math.max(1, parseInt(pageSize)))
      const skip = (pageNum - 1) * size

      const filter = {}
      if (search) {
        filter.$or = [
          { id: { $regex: search, $options: 'i' } },
          { 'meta.title': { $regex: search, $options: 'i' } },
          { 'meta.tags': { $regex: search, $options: 'i' } },
        ]
      }
      if (category) {
        filter['meta.category'] = category
      }

      const [data, total] = await Promise.all([
        models.find(filter).sort({ createdAt: -1 }).skip(skip).limit(size).toArray(),
        models.countDocuments(filter),
      ])

      return res.status(200).json({
        data: data.map(m => ({ ...m, _id: m._id.toString() })),
        total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      })
    } catch (error) {
      console.error('Admin list models error:', error)
      return res.status(500).json({ error: 'Failed to list models' })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body
      if (!body || !body.id || !body.name || !body.meta) {
        return res.status(400).json({ error: 'Missing required fields: id, name, meta' })
      }

      const existing = await models.findOne({ id: body.id })
      if (existing) {
        return res.status(409).json({ error: 'Model with this id already exists' })
      }

      const now = new Date().toISOString()
      const doc = {
        ...body,
        createdAt: now,
        updatedAt: now,
      }

      await models.insertOne(doc)
      return res.status(201).json({ ok: true, id: body.id })
    } catch (error) {
      console.error('Admin create model error:', error)
      return res.status(500).json({ error: 'Failed to create model' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
