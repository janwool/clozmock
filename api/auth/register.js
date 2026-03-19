import bcrypt from 'bcryptjs'
import { getCollection } from '../_lib/db.js'
import { issueTokensAndSetCookies } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, displayName } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    const users = await getCollection('users')

    const existing = await users.findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const now = new Date().toISOString()
    const result = await users.insertOne({
      email,
      passwordHash,
      displayName: displayName || '',
      authProvider: 'email',
      googleId: null,
      subscription: { plan: 'free', status: 'active' },
      purchases: [],
      downloads: { today: 0, lastResetDate: now.split('T')[0] },
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    })

    const user = await users.findOne({ _id: result.insertedId })
    await issueTokensAndSetCookies(res, user)

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Registration failed' })
  }
}
