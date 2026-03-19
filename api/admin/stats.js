import { getCollection } from '../_lib/db.js'
import { requireAdmin } from '../_lib/admin-auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = await requireAdmin(req, res)
  if (!payload) return

  try {
    const [models, users] = await Promise.all([
      getCollection('models'),
      getCollection('users'),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const [
      totalModels,
      totalUsers,
      proUsers,
      todayNewUsers,
      categoryAgg,
    ] = await Promise.all([
      models.countDocuments(),
      users.countDocuments(),
      users.countDocuments({ 'subscription.plan': 'pro', 'subscription.status': 'active' }),
      users.countDocuments({ createdAt: { $gte: todayStr } }),
      models.aggregate([
        { $group: { _id: '$meta.category', count: { $sum: 1 } } },
      ]).toArray(),
    ])

    const categoryDistribution = {}
    categoryAgg.forEach(item => {
      categoryDistribution[item._id] = item.count
    })

    return res.status(200).json({
      totalModels,
      totalUsers,
      proUsers,
      freeUsers: totalUsers - proUsers,
      todayNewUsers,
      categoryDistribution,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return res.status(500).json({ error: 'Failed to get stats' })
  }
}
