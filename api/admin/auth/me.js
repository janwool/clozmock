import { ObjectId } from 'mongodb'
import { getCollection } from '../../_lib/db.js'
import { requireAdmin } from '../../_lib/admin-auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = await requireAdmin(req, res)
  if (!payload) return

  try {
    const admins = await getCollection('admins')
    const admin = await admins.findOne({ _id: new ObjectId(payload.sub) })

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    return res.status(200).json({
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    })
  } catch (error) {
    console.error('Get admin error:', error)
    return res.status(500).json({ error: 'Failed to get admin' })
  }
}
