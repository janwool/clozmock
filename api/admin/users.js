import { getCollection } from '../_lib/db.js'
import { requireAdmin } from '../_lib/admin-auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = await requireAdmin(req, res)
  if (!payload) return

  try {
    const users = await getCollection('users')
    const { page = '1', pageSize = '20', search, plan } = req.query || {}
    const pageNum = Math.max(1, parseInt(page))
    const size = Math.min(100, Math.max(1, parseInt(pageSize)))
    const skip = (pageNum - 1) * size

    const filter = {}
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ]
    }
    if (plan) {
      filter['subscription.plan'] = plan
    }

    const [data, total] = await Promise.all([
      users.find(filter, { projection: { passwordHash: 0, refreshTokenHash: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .toArray(),
      users.countDocuments(filter),
    ])

    return res.status(200).json({
      data: data.map(u => ({ ...u, _id: undefined, id: u._id.toString() })),
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size),
    })
  } catch (error) {
    console.error('Admin list users error:', error)
    return res.status(500).json({ error: 'Failed to list users' })
  }
}
