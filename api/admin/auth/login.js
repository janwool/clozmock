import bcrypt from 'bcryptjs'
import { getCollection } from '../../_lib/db.js'
import { issueAdminTokensAndSetCookies } from '../../_lib/admin-auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const admins = await getCollection('admins')
    const admin = await admins.findOne({ email })

    if (!admin || !admin.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    await issueAdminTokensAndSetCookies(res, admin)

    return res.status(200).json({
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return res.status(500).json({ error: 'Login failed' })
  }
}
